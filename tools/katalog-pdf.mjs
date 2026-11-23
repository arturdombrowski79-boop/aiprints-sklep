// Drukuje prod/_katalog.html do public/pliki/katalog-aiprints.pdf (+ okładka JPG do strony). Wymaga playwright (lokalnie).
import { createRequire } from 'module';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch (e) { pw = req('/opt/npm-tools/node_modules/playwright'); }
const { chromium } = pw;
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { extname, join } from 'path';
const B = new URL('..', import.meta.url).pathname, P = B + 'prod';
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = createServer((q, s) => { const f = join(P, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' }); s.end(readFileSync(f)); }).listen(8823);
const B2B = process.env.KAT === 'b2b', A5 = process.env.FMT === 'a5', X = A5 ? '-a5' : '';
const SRC = (B2B ? '_katalog-firmy' : '_katalog') + X + '.html', PDF = (B2B ? 'katalog-firmy-aiprints' : 'katalog-aiprints') + X + '.pdf';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:8823/' + SRC, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
mkdirSync(B + 'public/pliki', { recursive: true });
const over = await p.evaluate(() => [...document.querySelectorAll('.page')].map((s, i) => { const r = s.getBoundingClientRect(); const bad = [...s.querySelectorAll('*')].some(e => { const q = e.getBoundingClientRect(); return q.bottom > r.bottom + 0.5 && q.height > 0; }); return bad ? i + 1 : 0; }).filter(Boolean));
if (over.length) console.log('UWAGA – treść wychodzi poza stronę:', over.join(', '));
await p.pdf({ path: B + 'public/pliki/' + PDF, format: A5 ? 'A5' : 'A4', printBackground: true, preferCSSPageSize: true });
if (!A5) await p.setViewportSize({ width: 794, height: 1123 }), await p.screenshot({ path: B + (B2B ? 'public/img/site/katalog-firmy-okladka.jpg' : 'public/img/site/katalog-okladka.jpg'), type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 794, height: 1123 } });
mkdirSync(P + '/pliki', { recursive: true }); copyFileSync(B + 'public/pliki/' + PDF, P + '/pliki/' + PDF);
await b.close(); srv.close(); console.log('PDF gotowy');
