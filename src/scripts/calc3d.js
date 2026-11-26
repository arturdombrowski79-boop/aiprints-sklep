// Kalkulator druku 3D: wgranie STL/3MF → podgląd → wybór kolorów/rozmiaru/dyszy → cena → koszyk.
// Cena pokazana tutaj to podgląd – przy płatności serwer (api/p3d-lib.php) liczy ją sam z wgranego pliku.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { unzipSync, strFromU8 } from 'three/examples/jsm/libs/fflate.module.js';
import CFG from '../data/druk3d.json';
import { meshStats, mergeStats, estimate, check, fmtH, material } from './p3d-core.js';
import { addItem } from './cart.js';

const $ = (id) => document.getElementById(id);
const zl = (v) => v.toFixed(2).replace('.', ',').replace(',00', '') + ' zł';
const num = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toString().replace('.', ',');
const PAL = Object.fromEntries(CFG.colors.map((c) => [c.id, c]));

// ——— odczyt plików ———
function mat3mf(s) { const a = s ? s.trim().split(/\s+/).map(Number) : []; return a.length === 12 ? a : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; }
function mul(a, b) { const r = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = (i < 3 ? 0 : b[9 + j]) + a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; }
// kolor trójkąta malowanego w Bambu Studio / PrusaSlicer (atrybut paint_color): zapis drzewa podziału, czytany od końca.
// Zwraca numer filamentu dominujący w liściach (0 = kolor obiektu).
function paintState(str) {
  let i = str.length - 1, nib = 0, bit = 4; const cnt = {};
  const getBit = () => { if (bit === 4) { nib = i >= 0 ? parseInt(str[i--], 16) || 0 : 0; bit = 0; } return (nib >> bit++) & 1; };
  const nibble = () => { let v = 0; for (let k = 0; k < 4; k++) v |= getBit() << k; return v; };
  const node = (depth) => {
    const code = nibble(), split = code & 3;
    if (split) { const n = split + 1; for (let k = 0; k < n && depth < 40; k++) node(depth + 1); return; }
    const st = (code & 12) === 12 ? nibble() + 3 : code >> 2; cnt[st] = (cnt[st] || 0) + 1 / (1 << Math.min(depth * 2, 30));
  };
  try { node(0); } catch (e) { return 0; }
  let best = 0, bv = -1; for (const k in cnt) if (cnt[k] > bv) { bv = cnt[k]; best = +k; } return best;
}
function readModel(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml'); const objs = {}, build = [];
  const unit = { micron: 0.001, centimeter: 10, inch: 25.4, foot: 304.8, meter: 1000 }[doc.documentElement.getAttribute('unit')] || 1;
  for (const o of doc.getElementsByTagNameNS('*', 'object')) {
    const v = [], t = [], pc = []; let paint = false;
    for (const e of o.getElementsByTagNameNS('*', 'vertex')) v.push(+e.getAttribute('x'), +e.getAttribute('y'), +e.getAttribute('z'));
    for (const e of o.getElementsByTagNameNS('*', 'triangle')) { t.push(+e.getAttribute('v1'), +e.getAttribute('v2'), +e.getAttribute('v3')); const p = e.getAttribute('paint_color'); if (p) { paint = true; pc[t.length / 3 - 1] = paintState(p); } }
    const comp = [...o.getElementsByTagNameNS('*', 'component')].map((c) => [c.getAttribute('objectid'), c.getAttribute('p:path') || c.getAttributeNS('http://schemas.microsoft.com/3dmanufacturing/production/2015/06', 'path'), mat3mf(c.getAttribute('transform'))]);
    objs[o.getAttribute('id')] = { v, t, comp, paint, pc };
  }
  for (const it of doc.getElementsByTagNameNS('*', 'item')) build.push([it.getAttribute('objectid'), mat3mf(it.getAttribute('transform'))]);
  return { objs, build, unit };
}
function parse3mf(buf, name) {
  const z = unzipSync(new Uint8Array(buf)); const key = (p) => Object.keys(z).find((k) => k.toLowerCase() === p.replace(/^\//, '').toLowerCase());
  const mainK = key('3D/3dmodel.model'); if (!mainK) throw new Error('W pliku 3MF brakuje modelu: ' + name);
  const cache = {}; const get = (p) => cache[p] || (cache[p] = readModel(strFromU8(z[key(p)])).objs);
  const main = readModel(strFromU8(z[mainK])); cache['/' + mainK] = main.objs;
  const ext = {}, partExt = {}, names = {};
  const ms = key('Metadata/model_settings.config');
  if (ms) { const d = new DOMParser().parseFromString(strFromU8(z[ms]), 'application/xml'); for (const o of d.querySelectorAll('config > object')) { const id = o.getAttribute('id');
    for (const m of o.querySelectorAll(':scope > metadata')) { if (m.getAttribute('key') === 'extruder') ext[id] = +m.getAttribute('value'); if (m.getAttribute('key') === 'name') names[id] = m.getAttribute('value'); }
    for (const p of o.querySelectorAll(':scope > part')) for (const m of p.querySelectorAll('metadata')) { if (m.getAttribute('key') === 'extruder') partExt[id + '/' + p.getAttribute('id')] = +m.getAttribute('value'); if (m.getAttribute('key') === 'name') names[id + '/' + p.getAttribute('id')] = m.getAttribute('value'); } } }
  let fil = []; const ps = key('Metadata/project_settings.config'); if (ps) { try { fil = JSON.parse(strFromU8(z[ps])).filament_colour || []; } catch (e) { } }
  const parts = []; let painted = false;
  const walk = (path, oid, M, extr, label) => {
    const o = get(path)[oid]; if (!o) return;
    if (o.t.length) {
      painted = painted || o.paint; const pos = new Float32Array(o.t.length * 3);
      for (let i = 0; i < o.t.length; i++) { const k = o.t[i] * 3, x = o.v[k], y = o.v[k + 1], zz = o.v[k + 2]; pos[i * 3] = (x * M[0] + y * M[3] + zz * M[6] + M[9]) * main.unit; pos[i * 3 + 1] = (x * M[1] + y * M[4] + zz * M[7] + M[10]) * main.unit; pos[i * 3 + 2] = (x * M[2] + y * M[5] + zz * M[8] + M[11]) * main.unit; }
      if (!o.paint) parts.push({ name: label, ext: extr, pos });
      else { // malowany: osobna siatka dla każdego filamentu
        const by = {}; for (let f = 0; f < o.t.length / 3; f++) { const e = o.pc[f] || extr; (by[e] || (by[e] = [])).push(f); }
        for (const e in by) { const L = by[e], q = new Float32Array(L.length * 9); L.forEach((f, j) => q.set(pos.subarray(f * 9, f * 9 + 9), j * 9)); parts.push({ name: label, ext: +e, pos: q, paint: true }); }
      }
    }
    for (const [cid, cp, cm] of o.comp) walk(cp || path, cid, mul(cm, M), extr, label);
  };
  for (const [oid, bm] of main.build) {
    const o = main.objs[oid]; if (!o) continue; const base = ext[oid] || 1, label = names[oid] || 'Obiekt ' + oid;
    if (o.t.length) walk('/' + mainK, oid, bm, base, label);
    for (const [cid, cp, cm] of o.comp) walk(cp || '/' + mainK, cid, mul(cm, bm), partExt[oid + '/' + cid] || base, names[oid + '/' + cid] || label);
  }
  if (!parts.length) throw new Error('W pliku 3MF nie znaleziono siatki: ' + name);
  let used = [...new Set(parts.map((p) => p.ext))].sort((a, b) => a - b);
  if (painted && fil.length > 1) used = Array.from({ length: Math.min(8, fil.length) }, (_, i) => i + 1);
  const map = Object.fromEntries(used.map((e, i) => [e, i]));
  return { parts: parts.map((p) => ({ name: p.name, slot: map[p.ext] ?? 0, pos: p.pos })), colors: used.map((e) => fil[e - 1] || ''), painted };
}
async function readFiles(files) {
  if (files.length === 1 && /\.3mf$/i.test(files[0].name)) return parse3mf(await files[0].arrayBuffer(), files[0].name);
  if (files.some((f) => !/\.stl$/i.test(f.name))) throw new Error('Wgraj jeden plik 3MF albo jeden lub kilka plików STL (każdy plik = część w innym kolorze).');
  const L = new STLLoader(); const parts = [];
  for (const [i, f] of files.entries()) { const g = L.parse(await f.arrayBuffer()); const pos = g.attributes.position.array; if (!pos.length) throw new Error('Plik nie zawiera siatki 3D: ' + f.name); parts.push({ name: f.name.replace(/\.stl$/i, ''), slot: i, pos }); }
  return { parts, colors: files.map(() => ''), painted: false };
}

// najbliższy kolor z palety (dla barw zapisanych w 3MF)
function nearest(hex) {
  if (!/^#?[0-9a-f]{6}/i.test(hex || '')) return null; const h = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  let best = null, bd = 1e9; for (const c of CFG.colors) { if (c.marble) continue; const x = c.hex.slice(1); const d = [0, 2, 4].reduce((s, i, k) => s + (parseInt(x.slice(i, i + 2), 16) - [r, g, b][k]) ** 2, 0); if (d < bd) { bd = d; best = c.id; } } return best;
}

// ——— stan ———
const S = { files: [], model: null, stats: null, srv: null, id: null, colors: [], material: 'pla', scale: 1, nozzle: '0.4', qty: 1, busy: false, err: '', preview: false };
let three = null;

function initThree() {
  const host = $('c3View'); const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); host.appendChild(r.domElement); r.domElement.className = 'absolute inset-0 w-full h-full';
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 2, 1.5); scene.add(dl);
  const ctl = new OrbitControls(cam, r.domElement); ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 1.2;
  ctl.addEventListener('start', () => { ctl.autoRotate = false; });
  const group = new THREE.Group(); group.rotation.x = -Math.PI / 2; scene.add(group); // pliki 3D mają oś Z w górę
  const fit = () => { const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(host); fit();
  let on = true; new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(host);
  r.setAnimationLoop(() => { if (!on) return; ctl.update(); r.render(scene, cam); });
  three = { r, scene, cam, ctl, group, meshes: [] };
}
function show(model) {
  if (!three) initThree(); const { group, cam, ctl } = three;
  three.meshes.forEach((m) => { group.remove(m); m.geometry.dispose(); m.material.dispose(); }); three.meshes = [];
  const box = new THREE.Box3();
  for (const p of model.parts) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p.pos, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.55, metalness: 0.02, flatShading: p.pos.length < 9 * 20000 })); m.userData.slot = p.slot;
    group.add(m); three.meshes.push(m); g.computeBoundingBox(); box.union(g.boundingBox);
  }
  const c = box.getCenter(new THREE.Vector3()); three.meshes.forEach((m) => m.position.set(-c.x, -c.y, -box.min.z));
  const size = box.getSize(new THREE.Vector3()).length() || 50;
  cam.position.set(size * 0.9, size * 0.75, size * 1.1); ctl.target.set(0, (box.max.z - box.min.z) * 0.45, 0); cam.near = size / 100; cam.far = size * 20; cam.updateProjectionMatrix(); ctl.autoRotate = true;
  paint();
}
function paint() { if (!three) return; three.meshes.forEach((m) => { const c = PAL[S.colors[m.userData.slot]]; m.material.color.set(c ? c.hex : '#cccccc'); }); }

// ——— wysyłka na serwer (ceny liczy serwer) ———
async function upload(files) {
  const j = async (q, body) => { const r = await fetch('api/p3d.php?' + new URLSearchParams(q), { method: 'POST', body }); const x = await r.json().catch(() => ({})); if (!r.ok) throw new Error(x.error || 'Błąd serwera (' + r.status + ')'); return x; };
  const { id } = await j({ a: 'new' }); const total = files.reduce((s, f) => s + f.size, 0); let sent = 0; const CH = 4 * 1048576;
  for (const [n, f] of files.entries()) {
    let off = 0;
    while (off < f.size) { const r = await j({ a: 'up', id, n, name: f.name, size: f.size, off }, f.slice(off, off + CH)); sent += r.have - off; off = r.have; status(`Wysyłam plik na serwer… ${Math.round(sent / total * 100)}%`); }
  }
  status('Analizuję model…'); return j({ a: 'done', id });
}

// ——— interfejs ———
function status(t) { $('c3Stat').textContent = t || ''; }
async function load(fileList) {
  const files = [...fileList].slice(0, 8); if (!files.length) return;
  if (files.some((f) => f.size > CFG.maxMB * 1048576)) return fail(`Plik może mieć najwyżej ${CFG.maxMB} MB – większy wyślij do wyceny formularzem poniżej.`);
  S.err = ''; S.busy = true; S.srv = null; S.id = null; S.preview = false; $('c3Empty').classList.add('hidden'); $('c3Panel').classList.remove('opacity-40', 'pointer-events-none'); status('Wczytuję model…'); render();
  try {
    const model = await readFiles(files); S.files = files; S.model = model;
    S.stats = mergeStats(model.parts.map((p) => ({ ...meshStats(p.pos), paint: !!p.paint }))); S.stats.slots = model.colors.length;
    S.colors = model.colors.map((h, i) => nearest(h) || ['w', 'k', 'c', 'm', 'y', 'lc', 'lm', 'ly'][i] || 'w');
    S.scale = 1; const big = Math.max(...S.stats.bbox.map((v, i) => v / CFG.max[i])); if (big > 1) S.scale = Math.floor(100 / big) / 100; // za duży – zmniejsz do pola roboczego
    show(model); render();
    const ping = await fetch('api/ping.php', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    S.preview = !(ping && ping.ok);
    if (!S.preview) {
      const r = await upload(files); S.id = r.id; S.srv = r.stats; status('');
      if (S.srv.slots !== S.colors.length) S.colors = Array.from({ length: S.srv.slots }, (_, i) => S.colors[i] || nearest(S.srv.colors[i]) || 'w');
    } else status('Podgląd bez serwera – cena orientacyjna.');
  } catch (e) { fail(e.message); }
  S.busy = false; render();
}
function fail(m) { S.err = m; S.busy = false; status(''); render(); }

function render() {
  const st = S.srv || S.stats; const has = !!st;
  $('c3Name').textContent = S.files.map((f) => f.name).join(', ');
  $('c3Err').textContent = S.err; $('c3Err').classList.toggle('hidden', !S.err);
  if (!has) { $('c3Add').disabled = true; return; }
  const o = { scale: S.scale, nozzle: S.nozzle, colors: S.colors, qty: S.qty, material: S.material }; const MT = material(CFG, S.material), PALM = CFG.colors.filter((c) => (!MT.colors || MT.colors.includes(c.id)) && (!c.marble || MT.group === 'PLA'));
  // kolory części
  const slots = S.colors.map((_, i) => i), byslot = (i) => [...new Set(S.model.parts.filter((p) => p.slot === i).map((p) => p.name))];
  $('c3Colors').innerHTML = (slots.length > 1 ? `<p class="text-[12.5px] text-mute mb-2">${slots.length} ${S.model.painted ? 'kolory z Bambu Studio' : 'części w różnych kolorach'} – druk wielokolorowy (do ${CFG.maxColors} kolorów). Kliknij kolor, a model w podglądzie się zmieni.</p>` : '') +
    slots.map((i) => `<div class="mb-3"><div class="text-[13px] font-medium mb-1.5">${slots.length > 1 ? `Kolor ${i + 1}: <span class="text-mute font-normal">${(S.model.painted ? '' : byslot(i).slice(0, 3).join(', ')) || (S.model.colors[i] ? `<i class="inline-block w-3 h-3 rounded-full align-[-1px] border border-line" style="background:${S.model.colors[i]}"></i> w pliku` : 'część ' + (i + 1))}</span>` : 'Kolor'} – <span class="text-mute font-normal">${PAL[S.colors[i]].name}</span></div><div class="flex flex-wrap gap-1.5">${PALM.map((c) => `<button type="button" data-sl="${i}" data-c="${c.id}" title="${c.name}${c.marble ? ' – PLA marmurkowy (+20% za materiał)' : ''}" aria-label="${c.name}" aria-pressed="${S.colors[i] === c.id}" class="w-8 h-8 rounded-full border-2 transition ${S.colors[i] === c.id ? 'border-ink scale-110' : 'border-white shadow-[0_0_0_1px_rgba(0,0,0,.12)]'}" style="background:${c.marble ? `linear-gradient(135deg,${c.hex} 0 40%,#fff 45%,${c.hex} 52% 70%,#999 74%,${c.hex} 78%)` : c.hex}"></button>`).join('')}</div></div>`).join('');
  $('c3Colors').querySelectorAll('[data-sl]').forEach((b) => b.onclick = () => { S.colors[+b.dataset.sl] = b.dataset.c; paint(); render(); });
  $('c3Scale').value = Math.round(S.scale * 100); $('c3Long').value = Math.round(Math.max(...st.bbox) * S.scale);
  document.querySelectorAll('[name=c3Nz]').forEach((r) => { r.checked = r.value === S.nozzle; });
  $('c3Qty').value = S.qty;
  const err = check(st, o, CFG); const e = estimate(st, o, CFG);
  $('c3Size').textContent = e.size.map((v) => num(v)).join(' × ') + ' mm';
  $('c3G').textContent = '≈ ' + e.grams + ' g'; $('c3T').textContent = '≈ ' + fmtH(e.hours) + (S.qty > 1 ? ' / szt.' : '');
  $('c3U').textContent = zl(e.unit); $('c3Sum').textContent = zl(e.unit * S.qty);
  $('c3Note').textContent = st.approx ? 'Siatka modelu nie jest szczelna – wagę oszacowaliśmy z wymiarów; sprawdzimy plik przed drukiem.' : '';
  $('c3Warn').textContent = err; $('c3Warn').classList.toggle('hidden', !err);
  $('c3Add').disabled = S.busy || !!err || !!S.err || !(S.id || S.preview);
}

function snapshot() { try { three.r.render(three.scene, three.cam); return three.r.domElement.toDataURL('image/jpeg', 0.85); } catch (e) { return 'img/hf/druk-3d-z-pliku-1.jpg'; } }

export function initCalc3d() {
  const drop = $('c3Drop'), inp = $('c3In');
  inp.onchange = () => { load(inp.files); inp.value = ''; };
  $('c3In2').onchange = () => { load($('c3In2').files); $('c3In2').value = ''; };
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('ring-2', 'ring-ink'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('ring-2', 'ring-ink'); }));
  drop.addEventListener('drop', (e) => load(e.dataTransfer.files));
  $('c3Scale').onchange = () => { const v = Math.max(10, Math.min(1000, +$('c3Scale').value || 100)); S.scale = v / 100; render(); };
  $('c3Long').onchange = () => { const st = S.srv || S.stats; if (!st) return; const v = +$('c3Long').value; if (v > 0) S.scale = Math.max(0.1, Math.min(10, v / Math.max(...st.bbox))); render(); };
  $('c3Mat').onchange = () => { S.material = $('c3Mat').value; const m = material(CFG, S.material); $('c3MatHint').textContent = m.hint || '';
    S.colors = S.colors.map((c) => (m.colors && !m.colors.includes(c) ? m.colors[0] : PAL[c].marble && m.group !== 'PLA' ? 'w' : c)); paint(); render(); };
  document.querySelectorAll('[name=c3Nz]').forEach((r) => r.onchange = () => { S.nozzle = r.value; render(); });
  $('c3Minus').onclick = () => { S.qty = Math.max(1, S.qty - 1); render(); }; $('c3Plus').onclick = () => { S.qty = Math.min(CFG.maxQty, S.qty + 1); render(); };
  $('c3Qty').onchange = () => { S.qty = Math.max(1, Math.min(CFG.maxQty, Math.round(+$('c3Qty').value || 1))); render(); };
  $('c3Add').onclick = () => {
    const st = S.srv || S.stats; const o = { scale: S.scale, nozzle: S.nozzle, colors: [...S.colors], qty: S.qty, material: S.material }; if (check(st, o, CFG)) return; const MT = material(CFG, S.material);
    const e = estimate(st, o, CFG); const cols = [...new Set(S.colors)].map((c) => PAL[c].name);
    addItem({ slug: 'druk-3d-z-pliku', title: 'Druk 3D z Twojego pliku', price: e.unit, qty: S.qty, img: snapshot(), boxable: false, pers: true,
      lines: [S.files.map((f) => f.name).join(', '), MT.name + (cols.length > 1 ? ' wielokolor: ' : ' ') + cols.join(', '), `Dysza ${S.nozzle.replace('.', ',')} mm · ${e.size.map((v) => num(v)).join(' × ')} mm`, `≈ ${e.grams} g · ≈ ${fmtH(e.hours)}`],
      p3d: { id: S.id, scale: S.scale, nozzle: S.nozzle, material: S.material, colors: [...S.colors] } }, three.r.domElement);
  };
  render();
}
