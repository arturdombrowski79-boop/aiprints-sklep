// Wspólny rdzeń kreatora: makieta w kolorze, pliki do produkcji, zapis projektów.
// Używany w sklepie (kreator) i w panelu pracowni (pobieranie plików do druku).
import { StaticCanvas, Circle } from 'fabric';

export const UNIT = 4; // 1 mm = 4 jednostki projektu
export const sizeOf = (side) => [side.mm[0] * UNIT, side.mm[1] * UNIT];

export const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
export const lum = (hex) => { const n = parseInt((hex || '#ffffff').slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

// widok: wycinek obrazu makiety (przybliżenie dla małych produktów, np. zawieszki)
export function viewOf(cfg, side, img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  if (!cfg.zoom) return [0, 0, W, H];
  const [x, y, w, h] = side.area; const cx = (x + w / 2) / 100 * W, cy = (y + h / 2) / 100 * H;
  const vw = W / cfg.zoom, vh = H / cfg.zoom;
  return [Math.max(0, Math.min(W - vw, cx - vw / 2)), Math.max(0, Math.min(H - vh, cy - vh / 2)), vw, vh];
}

// pole nadruku w pikselach widoku; wysokość wynika z proporcji mm (wyśrodkowana w polu z konfiguracji)
export function areaPx(cfg, side, img, view, outW, outH) {
  const W = img.naturalWidth, H = img.naturalHeight; const [vx, vy, vw, vh] = view;
  const [x, y, w, h] = side.area;
  const ax = x / 100 * W, ay = y / 100 * H, aw = w / 100 * W, ah = h / 100 * H;
  let rw = aw, rh = aw * side.mm[1] / side.mm[0];
  if (rh > ah) { rh = ah; rw = ah * side.mm[0] / side.mm[1]; }
  const rx = ax + (aw - rw) / 2, ry = ay + (ah - rh) / 2;
  const kx = outW / vw, ky = outH / vh;
  return { x: (rx - vx) * kx, y: (ry - vy) * ky, w: rw * kx, h: rh * ky };
}

// rysuje makietę w wybranym kolorze, z zachowaniem fałd i cieni
export function drawMock(ctx, img, view, color, W, H) {
  const [sx, sy, sw, sh] = view;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  if (!color || color.toLowerCase() === '#ffffff') return;
  const t = document.createElement('canvas'); t.width = W; t.height = H; const c = t.getContext('2d');
  c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = color; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'destination-in'; c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  ctx.clearRect(0, 0, W, H); ctx.drawImage(t, 0, 0);
  if (lum(color) < 0.4) { // ciemne kolory: przywróć fałdy materiału
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.55; ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H); ctx.restore();
  }
}

// filtr SVG: zamienia projekt na kolor graweru (ciemne = grawer), zachowując półtony zdjęć
export function inkFilterSVG(id, ink, frost) {
  return `<svg width="0" height="0" style="position:absolute"><filter id="${id}" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.3 -.59 -.11 0 1" result="a"/>
    <feComposite in="a" in2="SourceAlpha" operator="in" result="m"/>
    <feFlood flood-color="${ink}" flood-opacity="${frost ? .82 : .92}"/>
    <feComposite in2="m" operator="in" result="c"/>${frost ? '<feGaussianBlur in="c" stdDeviation=".6"/>' : ''}
  </filter></svg>`;
}

// tryb grawer: wszystko czarne (maszyna i tak pracuje w jednym kolorze)
export function toMono(obj) {
  const set = (o) => { if (o.type === 'image') return; if (o.fill && o.fill !== 'transparent' && typeof o.fill === 'string') o.set('fill', '#000000'); if (o.stroke && typeof o.stroke === 'string') o.set('stroke', '#000000'); (o._objects || o.getObjects?.() || []).forEach(set); };
  set(obj);
}

// renderuje stronę projektu do płótna o zadanej rozdzielczości (DPI)
export async function renderSide(json, side, { dpi = 300, mono = false, scale } = {}) {
  const [Lw, Lh] = sizeOf(side);
  const sc = new StaticCanvas(null, { width: Lw, height: Lh, enableRetinaScaling: false });
  await sc.loadFromJSON(json);
  sc.backgroundColor = null;
  if (side.clip === 'circle') sc.clipPath = new Circle({ radius: Lw / 2, left: Lw / 2, top: Lh / 2, originX: 'center', originY: 'center' });
  if (mono) sc.getObjects().forEach(toMono);
  sc.renderAll();
  const mult = scale || (side.mm[0] / 25.4 * dpi) / Lw;
  return { canvas: sc.toCanvasElement(mult), svg: () => sc.toSVG(), dispose: () => sc.dispose() };
}

// podgląd: makieta + projekt (JPG do koszyka, maila i akceptacji)
export async function renderPreview(cfg, design, sideId, px = 900) {
  const side = cfg.sides.find((s) => s.id === sideId); const img = await loadImg(side.img);
  const view = viewOf(cfg, side, img); const H = Math.round(px * view[3] / view[2]);
  const cv = document.createElement('canvas'); cv.width = px; cv.height = H; const ctx = cv.getContext('2d');
  if (cfg.bg) { ctx.fillStyle = '#e4e5e7'; ctx.fillRect(0, 0, px, H); }
  const base = document.createElement('canvas'); base.width = px; base.height = H;
  drawMock(base.getContext('2d'), img, view, cfg.mock ? design.color : null, px, H); ctx.drawImage(base, 0, 0);
  const a = areaPx(cfg, side, img, view, px, H);
  const json = design.sides[sideId]; if (!json) return cv.toDataURL('image/jpeg', .85);
  const mono = cfg.mode !== 'print';
  const r = await renderSide(json, side, { mono, scale: a.w / sizeOf(side)[0] });
  ctx.save();
  if (mono) {
    const id = 'pf' + Math.random().toString(36).slice(2); const holder = document.createElement('div'); holder.innerHTML = inkFilterSVG(id, cfg.ink || (cfg.mode === 'frost' ? '#ffffff' : '#3b2614'), cfg.mode === 'frost'); document.body.appendChild(holder);
    ctx.filter = `url(#${id})`; ctx.globalCompositeOperation = cfg.mode === 'frost' ? 'screen' : (lum(cfg.ink || '#000') > .5 ? 'source-over' : 'multiply');
    ctx.drawImage(r.canvas, a.x, a.y, a.w, a.h); holder.remove();
  } else {
    ctx.globalCompositeOperation = cfg.mock && lum(design.color || '#ffffff') > .55 ? 'multiply' : 'source-over';
    ctx.drawImage(r.canvas, a.x, a.y, a.w, a.h);
  }
  ctx.restore(); r.dispose();
  return cv.toDataURL('image/jpeg', .86);
}

// ——— zapis projektów (IndexedDB; po wdrożeniu: serwer) ———
const DB = () => new Promise((ok, no) => { const r = indexedDB.open('aiprints', 1); r.onupgradeneeded = () => r.result.createObjectStore('designs', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
export async function saveDesign(d) { const db = await DB(); return new Promise((ok, no) => { const t = db.transaction('designs', 'readwrite'); t.objectStore('designs').put(d); t.oncomplete = () => ok(d.id); t.onerror = () => no(t.error); }); }
export async function getDesign(id) { const db = await DB(); return new Promise((ok) => { const r = db.transaction('designs').objectStore('designs').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); }

export function download(name, url) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
