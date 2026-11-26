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
  return { vol: Math.abs(vol), area, min: mn, max: mx };
}
// łączy statystyki części w jedną bryłę (części drukowane razem)
export function mergeStats(list) {
  const mn = [0, 1, 2].map((d) => Math.min(...list.map((s) => s.min[d]))), mx = [0, 1, 2].map((d) => Math.max(...list.map((s) => s.max[d])));
  const bbox = mx.map((v, d) => v - mn[d]); let vol = list.reduce((a, s) => a + s.vol, 0); const area = list.reduce((a, s) => a + s.area, 0);
  const bv = bbox[0] * bbox[1] * bbox[2]; let approx = false;
  if (bv > 0 && vol < bv * 0.02) { vol = bv * 0.3; approx = true; } // siatka nieszczelna – szacunek z wymiarów
  return { vol, area, bbox, approx };
}

// stats: {vol mm³, area mm², bbox [x,y,z] mm}; opts: {scale (1 = 100%), nozzle '0.4'|'0.8', colors: [id…] (po jednym na slot), qty}
export function estimate(stats, opts, cfg) {
  const s = +opts.scale || 1, nz = cfg.nozzles[opts.nozzle] || cfg.nozzles['0.4'], qty = Math.max(1, Math.min(cfg.maxQty, Math.round(+opts.qty || 1)));
  const V = stats.vol * s ** 3, A = stats.area * s ** 2, H = stats.bbox[2] * s;
  const shell = Math.min(V, A * nz.wall), inner = Math.max(0, V - shell) * cfg.infill, ext = (shell + inner) * cfg.supportK;
  const used = [...new Set(opts.colors)], multi = used.length > 1, pal = Object.fromEntries(cfg.colors.map((c) => [c.id, c]));
  let grams = ext / 1000 * cfg.density, hours = (ext / nz.flow + (H / nz.layer) * cfg.layerSec) / 3600 + cfg.warmMin / 60;
  let mat = grams * cfg.perGram * (used.some((id) => pal[id] && pal[id].marble) ? cfg.marbleK : 1);
  if (multi) { mat *= cfg.multi.matK; hours *= cfg.multi.timeK; grams *= cfg.multi.matK; }
  const extra = multi ? (used.length - 1) * cfg.multi.perColor : 0;
  const unit = r2(Math.max(cfg.minUnit, mat + hours * cfg.perHour + extra + cfg.start / qty));
  return { grams: Math.round(grams), hours, unit, qty, size: stats.bbox.map((v) => Math.round(v * s * 10) / 10), colors: used.length };
}

// sprawdzenie zamówienia (to samo robi serwer); zwraca komunikat błędu albo ''
export function check(stats, opts, cfg) {
  const s = +opts.scale || 1, size = stats.bbox.map((v) => v * s), pal = new Set(cfg.colors.map((c) => c.id));
  if (s < 0.1 || s > 10) return 'Skala musi być między 10% a 1000%.';
  if (size.some((v, i) => v > cfg.max[i] + 0.01)) return `Model jest za duży (${size.map((v) => Math.round(v)).join(' × ')} mm). Maksymalnie ${cfg.max.join(' × ')} mm – zmniejsz skalę albo napisz do nas.`;
  if (Math.max(...size) < cfg.minSize) return 'Model jest za mały – najdłuższy bok musi mieć co najmniej 5 mm.';
  if (!opts.colors.length || opts.colors.length !== stats.slots || opts.colors.some((c) => !pal.has(c))) return 'Wybierz kolor dla każdej części.';
  if (new Set(opts.colors).size > cfg.maxColors) return `Najwięcej ${cfg.maxColors} kolorów w jednym wydruku.`;
  return '';
}
export const fmtH = (h) => { const m = Math.max(1, Math.round(h * 60)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim(); };
