// Test wzoru JS kalkulatora druku 3D: node tools/test-p3d.mjs  (--dump: wynik dla porównania z PHP)
import { readFileSync } from 'fs';
import { estimate, meshStats, check } from '../src/scripts/p3d-core.js';
const cfg = JSON.parse(readFileSync(new URL('../src/data/druk3d.json', import.meta.url)));
const big = { vol: 400000, area: 40000, bbox: [80, 80, 100], slots: 2 };
const e2 = estimate(big, { scale: 1, nozzle: '0.4', colors: ['c', 'm'], qty: 1 }, cfg);
if (process.argv.includes('--dump')) { console.log(JSON.stringify(e2)); process.exit(0); }
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' → ' + JSON.stringify(i))); if (!c) fail++; };
const V = [[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0], [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10]];
const F = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
const s = meshStats(new Float32Array(F.flatMap((t) => t.flatMap((i) => V[i]))));
ok('sześcian: objętość 1000', Math.abs(s.vol - 1000) < 0.01, s); ok('sześcian: powierzchnia 600', Math.abs(s.area - 600) < 0.01, s);
ok('mały model = 10 zł', estimate({ vol: 8000, area: 2400, bbox: [20, 20, 20] }, { scale: 1, nozzle: '0.4', colors: ['c'], qty: 1 }, cfg).unit === 10);
ok('check poprawny', check(big, { scale: 1, colors: ['c', 'm'] }, cfg) === '');
ok('check za duży', check({ bbox: [400, 10, 10], slots: 1 }, { scale: 1, colors: ['c'] }, cfg) !== '');
console.log(fail ? `${fail} błędów` : 'Wszystko OK'); process.exit(fail ? 1 : 0);
