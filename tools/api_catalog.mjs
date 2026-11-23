// Cennik dla serwera (api/catalog.json): serwer liczy ceny sam – klient nie może ich podmienić.
import { readFileSync, writeFileSync } from 'fs';
import { CREATOR } from '../src/data/creator.js';
import { qtyTiers, optionsOf, isM2 } from '../src/data/copy.js';
const B = new URL('..', import.meta.url).pathname; const out = process.argv[2] || B + 'prod/api/catalog.json';
const cat = JSON.parse(readFileSync(B + 'src/data/catalog.json', 'utf8'));
const P = {};
for (const p of cat.products) {
  if (!p.price || p.quote) continue;
  const o = optionsOf(p); const cr = CREATOR[p.slug];
  P[p.slug] = { n: p.name, b: p.tiers ? p.tiers[0].p : p.price, o: o ? Object.fromEntries(o.opts.filter((x) => x.p).map((x) => [x.k, x.p])) : {}, q: qtyTiers(p.priceText), unit: !!p.unit, m2: isM2(p),
    k: p.promo ? p.promo.k : 1, until: p.promo ? p.promo.until : null, cr: cr ? Object.fromEntries(cr.sides.map((s) => [s.id, s.extra || 0])) : null };
}
writeFileSync(out, JSON.stringify({ built: new Date().toISOString(), add: { box: 19, card: 9 }, ship: { '15.99': 'InPost Paczkomat 24/7', '19.99': 'Kurier DPD', '0': 'Odbiór w pracowni' }, free: 199, products: P }));
console.log('api catalog', Object.keys(P).length);
