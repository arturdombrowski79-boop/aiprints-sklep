// Kalkulator druku 3D – wzór wyceny i statystyki siatki.
// Lustrzana implementacja w api/p3d-lib.php (serwer liczy cenę sam) – zmiany wprowadzaj w obu miejscach.
export const r2 = (v) => Math.round((v + 1e-9) * 100) / 100;

// statystyki siatki z trójkątów (Float32Array: x,y,z × 3 wierzchołki na trójkąt)
export function meshStats(pos) {
  let vol = 0, area = 0; const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 9) {
    const ax = pos[i], ay = pos[i + 1], az = pos[i + 2], bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5], cx = pos[i + 6], cy = pos[i + 7], cz = pos[i + 8];
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; area += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
    for (let k = 0; k < 9; k++) { const d = k % 3, v = pos[i + k]; if (v < mn[d]) mn[d] = v; if (v > mx[d]) mx[d] = v; }
  }
  return { vol: Math.abs(vol), sv: vol, area, min: mn, max: mx };
}
// łączy statystyki części w jedną bryłę (części drukowane razem)
export function mergeStats(list) {
  const mn = [0, 1, 2].map((d) => Math.min(...list.map((s) => s.min[d]))), mx = [0, 1, 2].map((d) => Math.max(...list.map((s) => s.max[d])));
  const bbox = mx.map((v, d) => v - mn[d]); let vol = list.reduce((a, s) => a + (s.paint ? 0 : s.vol), 0) + Math.abs(list.reduce((a, s) => a + (s.paint ? s.sv : 0), 0)); /* części malowane = kawałki jednej bryły */ const area = list.reduce((a, s) => a + s.area, 0);
  const bv = bbox[0] * bbox[1] * bbox[2]; let approx = false;
  if (bv > 0 && vol < bv * 0.02) { vol = bv * 0.3; approx = true; } // siatka nieszczelna – szacunek z wymiarów
  return { vol, area, bbox, approx };
}

// liczba zmian filamentu – jak p3d_changes() w PHP
export function countChanges(st, colors, scale, layer) {
  const zm = st.zm || []; if (!zm.length || new Set(colors).size < 2) return 0;
  const bh = (st.zb || 0.1) * scale, n = Math.ceil(zm.length * bh / layer); let last = null, ch = 0;
  for (let l = 0; l < n; l++) {
    const a = Math.floor(l * layer / bh), b = Math.min(zm.length - 1, Math.floor(((l + 1) * layer - 1e-9) / bh)); let m = 0;
    for (let q = a; q <= b; q++) m |= zm[q];
    const set = []; for (let sl = 0; sl < colors.length; sl++) if ((m >> sl) & 1 && !set.includes(colors[sl])) set.push(colors[sl]);
    const k = set.length; if (!k) continue;
    ch += last === null ? k - 1 : k - (set.includes(last) ? 1 : 0);
    last = k > 1 ? (set[k - 1] === last ? set[0] : set[k - 1]) : set[0];
  }
  return ch;
}
// mapa kolorów w osi Z z trójkątów części [{pos, slot}] (pasy 0,1 mm, maska slotów) – podgląd przed odpowiedzią serwera
export function zMask(parts, bin = 0.1) {
  let z0 = Infinity, z1 = -Infinity; for (const p of parts) for (let i = 2; i < p.pos.length; i += 3) { const z = p.pos[i]; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const b0 = Math.floor(z0 / bin), nb = Math.min(4000, Math.floor(z1 / bin) - b0 + 1), zm = new Array(Math.max(1, nb)).fill(0);
  for (const p of parts) { const bit = 1 << p.slot; for (let i = 0; i < p.pos.length; i += 9) { const za = p.pos[i + 2], zb = p.pos[i + 5], zc = p.pos[i + 8]; const a = Math.floor(Math.min(za, zb, zc) / bin) - b0, b = Math.floor(Math.max(za, zb, zc) / bin) - b0; for (let k = Math.max(0, a); k <= Math.min(nb - 1, b); k++) zm[k] |= bit; } }
  return zm;
}
// stats: {vol mm³, area mm², bbox [x,y,z] mm}; opts: {scale (1 = 100%), nozzle '0.4'|'0.8', colors: [id…] (po jednym na slot), qty}
export function estimate(stats, opts, cfg) {
  const s = +opts.scale || 1, nz = cfg.nozzles[opts.nozzle] || cfg.nozzles['0.4'], qty = Math.max(1, Math.min(cfg.maxQty, Math.round(+opts.qty || 1)));
  const V = stats.vol * s ** 3, A = stats.area * s ** 2, H = stats.bbox[2] * s;
  const shell = Math.min(V, A * nz.wall), inner = Math.max(0, V - shell) * cfg.infill, ext = (shell + inner) * cfg.supportK;
  // czas: ścianki drukują się wolniej niż wypełnienie (kalibracja na Bambu Studio)
  const used = [...new Set(opts.colors)], multi = used.length > 1, pal = Object.fromEntries(cfg.colors.map((c) => [c.id, c])), mt = material(cfg, opts.material);
  let grams = ext / 1000 * (mt.density || cfg.density), hours = (mt.timeK || 1) * ((shell / nz.flow + inner / (nz.flowInfill || nz.flow)) * cfg.supportK + (H / nz.layer) * cfg.layerSec) / 3600 + cfg.warmMin / 60;
  let mat = grams * cfg.perGram * Math.max(1, mt.eur / cfg.baseEur) * (used.some((id) => pal[id] && pal[id].marble) ? cfg.marbleK : 1);
  let changes = 0;
  if (multi && stats.zm && stats.zm.length) { // zmiany filamentu: czas i materiał na przepłukanie
    changes = Math.round(countChanges(stats, opts.colors, s, nz.layer) * cfg.multi.changeK);
    hours += changes * cfg.multi.changeSec / 3600; const purge = changes * cfg.multi.changeG; grams += purge; mat += purge * cfg.perGram * Math.max(1, mt.eur / cfg.baseEur);
  } else if (multi) { mat *= cfg.multi.matK; hours *= cfg.multi.timeK; grams *= cfg.multi.matK; }
  const extra = multi ? (used.length - 1) * cfg.multi.perColor : 0;
  const unit = r2(Math.max(cfg.minUnit, mat + hours * cfg.perHour + extra + cfg.start / qty));
  return { grams: Math.round(grams), hours, unit, qty, size: stats.bbox.map((v) => Math.round(v * s * 10) / 10), colors: used.length, changes };
}

export const material = (cfg, id) => cfg.materials.find((m) => m.id === id) || cfg.materials[0];
// cena materiału za gram dla klienta
export const gramPrice = (cfg, m) => Math.round(cfg.perGram * Math.max(1, m.eur / cfg.baseEur) * 100) / 100;
// sprawdzenie zamówienia (to samo robi serwer); zwraca komunikat błędu albo ''
export function check(stats, opts, cfg) {
  const s = +opts.scale || 1, size = stats.bbox.map((v) => v * s), pal = new Set(cfg.colors.map((c) => c.id));
  if (s < 0.1 || s > 10) return 'Skala musi być między 10% a 1000%.';
  if (size.some((v, i) => v > cfg.max[i] + 0.01)) return `Model jest za duży (${size.map((v) => Math.round(v)).join(' × ')} mm). Maksymalnie ${cfg.max.join(' × ')} mm – zmniejsz skalę albo napisz do nas.`;
  if (Math.max(...size) < cfg.minSize) return 'Model jest za mały – najdłuższy bok musi mieć co najmniej 5 mm.';
  if (opts.material && !cfg.materials.some((m) => m.id === opts.material)) return 'Wybierz materiał.';
  const mt = material(cfg, opts.material);
  if (!opts.colors.length || opts.colors.length !== stats.slots || opts.colors.some((c) => !pal.has(c) || (mt.colors && !mt.colors.includes(c)) || (mt.group !== 'PLA' && cfg.colors.find((x) => x.id === c).marble))) return 'Wybierz kolor dla każdej części.';
  if (new Set(opts.colors).size > cfg.maxColors) return `Najwięcej ${cfg.maxColors} kolorów w jednym wydruku.`;
  return '';
}
export const fmtH = (h) => { const m = Math.max(1, Math.round(h * 60)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim(); };
