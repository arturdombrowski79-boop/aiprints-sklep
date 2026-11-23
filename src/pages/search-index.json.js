// Indeks wyszukiwarki ładowany dopiero po otwarciu wyszukiwania (lżejsze strony).
import cat from '../data/catalog.json';
import { SEASON } from '../data/config.js';
export function GET() {
  const C = Object.fromEntries(cat.cats.map((c) => [c.slug, c]));
  const idx = cat.products.filter((p) => SEASON || p.cat !== 'na-swieta').map((p) => ({ s: p.slug, n: p.name, c: C[p.cat].name, p: p.priceText, i: p.img || `img/ph/${p.cat}.svg` }));
  return new Response(JSON.stringify(idx), { headers: { 'Content-Type': 'application/json' } });
}
