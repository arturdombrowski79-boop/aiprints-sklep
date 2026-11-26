// Feedy produktów: Google Merchant Center (RSS 2.0) i katalog Meta/Instagram/TikTok (CSV).
// Adresy po wdrożeniu: https://aiprints.pl/feed/google.xml, https://aiprints.pl/feed/meta.csv
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { describe } from '../src/data/copy.js';
import { SEASON, PROMO } from '../src/data/config.js';
const B = new URL('..', import.meta.url).pathname; const OUT = process.argv[2] || B + 'prod/feed'; mkdirSync(OUT, { recursive: true });
const cat = JSON.parse(readFileSync(B + 'src/data/catalog.json', 'utf8'));
const CN = Object.fromEntries(cat.cats.map((c) => [c.slug, c.name]));
const S = 'https://aiprints.pl/';
const x = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const csv = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
const today = new Date().toISOString().slice(0, 10);
const rows = [];
for (const p of cat.products) {
  if (!p.price || p.quote || (!SEASON && p.cat === 'na-swieta')) continue;
  const base = p.tiers ? p.tiers[0].p : p.price; const m2 = /\/\s*m²/.test(p.priceText || '');
  const promo = p.promo && today <= p.promo.until ? p.promo : null;
  const d = describe(p, CN[p.cat]).join(' ').replace(/\s+/g, ' ').trim();
  rows.push({
    id: p.slug, title: (p.name + (m2 ? ' – cena za 1 m²' : '')).slice(0, 150), description: (d + ' Wykonanie w pracowni AiPrints.pl w Chorzowie, wysyłka w całej Polsce.').slice(0, 4900),
    link: S + p.slug, image: S + (p.img || ''), extra: (p.gallery || []).slice(1, 6).map((g) => S + g),
    price: base.toFixed(2) + ' PLN', sale: promo ? (Math.round(base * promo.k * 100) / 100).toFixed(2) + ' PLN' : '', saleDates: promo ? `${PROMO.from}T00:00+01:00/${promo.until}T23:59+01:00` : '',
    type: CN[p.cat] + (p.sub ? ' > ' + p.sub : ''), custom: p.kind || 'gift',
  });
}
// Google Merchant Center
writeFileSync(OUT + '/google.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>AiPrints.pl</title><link>${S}</link><description>Prezenty personalizowane, grawer i druk – pracownia w Chorzowie</description>
${rows.map((r) => `<item><g:id>${x(r.id)}</g:id><title>${x(r.title)}</title><description>${x(r.description)}</description><link>${x(r.link)}</link><g:image_link>${x(r.image)}</g:image_link>${r.extra.map((e) => `<g:additional_image_link>${x(e)}</g:additional_image_link>`).join('')}<g:availability>in_stock</g:availability><g:min_handling_time>${r.custom === 'ready' ? 1 : r.custom === 'files' ? 2 : 5}</g:min_handling_time><g:max_handling_time>${r.custom === 'ready' ? 3 : r.custom === 'files' ? 7 : 10}</g:max_handling_time><g:price>${r.price}</g:price>${r.sale ? `<g:sale_price>${r.sale}</g:sale_price><g:sale_price_effective_date>${r.saleDates}</g:sale_price_effective_date>` : ''}<g:brand>AiPrints.pl</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists><g:product_type>${x(r.type)}</g:product_type><g:is_bundle>no</g:is_bundle><g:custom_label_0>${x(r.custom)}</g:custom_label_0></item>`).join('\n')}
</channel></rss>
`);
// Meta (Facebook, Instagram) – ten sam plik przyjmuje też katalog TikTok
writeFileSync(OUT + '/meta.csv', ['id,title,description,availability,condition,price,sale_price,sale_price_effective_date,link,image_link,additional_image_link,brand,product_type,custom_label_0',
  ...rows.map((r) => [r.id, r.title, r.description, 'in stock', 'new', r.price, r.sale, r.saleDates, r.link, r.image, r.extra.join(','), 'AiPrints.pl', r.type, r.custom].map(csv).join(','))].join('\n') + '\n');
// OpenAI Ads (ChatGPT) – CSV wg specyfikacji OpenAI, wysyłany przez SFTP w GitHub Actions (hasło tylko w Secrets)
writeFileSync(OUT + '/openai.csv', ['item_id,title,description,url,brand,image_url,price,availability,seller_name,seller_url,return_policy,target_countries,store_country,is_eligible_search,is_eligible_checkout,is_ads_eligible',
  ...rows.map((r) => [r.id, r.title, r.description, r.link, 'AiPrints.pl', r.image, r.sale || r.price, 'in_stock', 'AiPrints.pl', S, S + 'zwroty-i-reklamacje', 'PL', 'PL', 'true', 'false', 'true'].map(csv).join(','))].join('\n') + '\n');
console.log('feeds:', rows.length, 'produktów');
