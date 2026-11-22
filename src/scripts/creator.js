// Kreator produktu (edytor na Fabric.js)
import { Canvas, Textbox, FabricImage, Circle, loadSVGFromString, util, filters, ActiveSelection } from 'fabric';
import { UNIT, sizeOf, loadImg, lum, viewOf, areaPx, drawMock, inkFilterSVG, renderPreview, saveDesign, blendOf } from './creator-core.js';
import { addRaw, zl } from './cart.js';
import { toast } from './common.js';

const FONTS = [
  ['Inter Tight Variable', 'Nowoczesny', 600], ['Montserrat', 'Montserrat', 800], ['Oswald', 'Oswald', 600], ['Bebas Neue', 'Bebas', 400], ['Anton', 'Anton', 400],
  ['Playfair Display', 'Elegancki', 700], ['Instrument Serif', 'Szeryfowy', 400], ['Great Vibes', 'Kaligrafia', 400],
  ['Dancing Script', 'Odręczny', 700], ['Pacifico', 'Pacifico', 400],
];
const COLORS = ['#121110', '#ffffff', '#d1196f', '#00a6dd', '#ffd23f', '#c8102e', '#e8641e', '#1f4d3a', '#3aa655', '#1f2a44', '#7b3fa0', '#8a6a3b', '#c9a24f', '#9aa0a6'];
const QUICK = ['Twoje imię', 'Najlepsza Mama', 'Najlepszy Tata', 'Babcia & Dziadek', 'Wszystkiego najlepszego!', 'Team', '2026'];

let el, cfg, S, cv, mockImg, view, area, assets, hist = [], fut = [], lock = false, saveT, P = 0;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const side = () => cfg.sides[S.side];
const mono = () => cfg.mode !== 'print';
const KEY = () => 'aiprints-cr-' + el.dataset.slug;

export async function openCreator() {
  el = $('cr'); cfg = JSON.parse(el.dataset.cfg); P = +el.dataset.price || 0;
  if (!S) {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY())); } catch (e) { }
    S = saved || { side: 0, color: cfg.colors ? cfg.colors[0][1] : null, size: cfg.sizes ? cfg.sizes[1] : null, qty: 1, sides: {} };
    S.side = 0;
  }
  el.classList.add('on'); document.body.style.overflow = 'hidden';
  if (!cv) await init();
  await loadSide();
  tab(innerWidth >= 1024 ? 'tekst' : null);
}
function closeCreator() { el.classList.remove('on'); document.body.style.overflow = ''; persist(); }

async function init() {
  assets = await fetch('creator/assets.json').then((r) => r.json()).catch(() => ({ emoji: {}, clip: {} }));
  cv = new Canvas('crCv', { preserveObjectStacking: true, enableRetinaScaling: true, selectionColor: 'rgba(209,25,111,.08)', selectionBorderColor: '#d1196f' });
  // wygląd uchwytów
  const ctl = { borderColor: '#d1196f', cornerColor: '#ffffff', cornerStrokeColor: '#d1196f', cornerStyle: 'circle', cornerSize: 12, transparentCorners: false, borderScaleFactor: 1.5, padding: 6 };
  cv.on('object:added', (e) => { e.target.set(ctl); snapshot(); });
  ['object:modified', 'object:removed', 'text:changed'].forEach((ev) => cv.on(ev, snapshot));
  ['selection:created', 'selection:updated', 'selection:cleared'].forEach((ev) => cv.on(ev, props));
  cv.on('object:scaling', props); cv.on('object:moving', snap); cv.on('mouse:up', () => { $('crGv').classList.remove('on'); $('crGh').classList.remove('on'); });
  // ui
  $('crClose').onclick = closeCreator;
  $('crUndo').onclick = undo; $('crRedo').onclick = redo;
  $('crReset').onclick = () => { if (cv.getObjects().length && confirm('Usunąć wszystko z tej strony projektu?')) { cv.clear(); snapshot(); } };
  el.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => tab(b.getAttribute('aria-pressed') === 'true' && innerWidth < 1024 ? null : b.dataset.tab));
  $('crFile').onchange = (e) => { const f = e.target.files[0]; if (f) addFile(f); e.target.value = ''; };
  $('crMinus').onclick = () => qty(S.qty - 1); $('crPlus').onclick = () => qty(S.qty + 1); $('crQty').onchange = (e) => qty(+e.target.value || 1);
  $('crAdd').onclick = addToCart;
  if (cfg.sizes) { const s = $('crSize'); s.classList.remove('hidden'); s.innerHTML = cfg.sizes.map((z) => `<option ${z === S.size ? 'selected' : ''}>${z}</option>`).join(''); s.onchange = () => { S.size = s.value; persist(); }; }
  colors(); sides();
  // przeciągnij i upuść plik na scenę
  const st = $('crStageWrap');
  st.addEventListener('dragover', (e) => { e.preventDefault(); st.style.background = 'rgba(209,25,111,.06)'; });
  st.addEventListener('dragleave', () => (st.style.background = ''));
  st.addEventListener('drop', (e) => { e.preventDefault(); st.style.background = ''; const f = e.dataTransfer.files[0]; if (f) addFile(f); });
  addEventListener('keydown', keys);
  addEventListener('resize', () => el.classList.contains('on') && layout());
  if (mono()) { $('crInk').innerHTML = inkFilterSVG('crInkF', cfg.ink || (cfg.mode === 'frost' ? '#ffffff' : '#3b2614'), cfg.mode === 'frost'); }
  price();
}

// ——— scena ———
async function loadSide() {
  mockImg = await loadImg(side().img); view = viewOf(cfg, side(), mockImg);
  lock = true; cv.clear();
  const j = S.sides[side().id]; if (j) await cv.loadFromJSON(j);
  cv.renderAll(); lock = false; hist = [JSON.stringify(cv.toObject(['kind']))]; fut = [];
  layout(); sides(); props(); btns();
}
function layout() {
  const wrap = $('crStageWrap'), st = $('crStage');
  const ar = view[2] / view[3]; const mw = wrap.clientWidth - 24, mh = wrap.clientHeight - 24;
  let w = mw, h = w / ar; if (h > mh) { h = mh; w = h * ar; }
  w = Math.floor(w); h = Math.floor(h);
  st.style.width = w + 'px'; st.style.height = h + 'px'; st.style.background = cfg.bg || (cfg.mock ? 'linear-gradient(180deg,#f7f7f7,#e9eaeb)' : '#ddd');
  const m = $('crMock'), dpr = Math.min(2, devicePixelRatio || 1); m.width = w * dpr; m.height = h * dpr;
  drawMock(m.getContext('2d'), mockImg, view, cfg.mock ? S.color : null, m.width, m.height);
  area = areaPx(cfg, side(), mockImg, view, w, h);
  const a = $('crArea'); Object.assign(a.style, { left: area.x + 'px', top: area.y + 'px', width: area.w + 'px', height: area.h + 'px' });
  a.classList.toggle('round', side().clip === 'circle'); a.classList.toggle('dark', cfg.mock ? lum(S.color) < .45 : cfg.mode === 'print');
  const [Lw, Lh] = sizeOf(side());
  cv.setDimensions({ width: area.w, height: area.h }); cv.setZoom(area.w / Lw);
  cv.clipPath = side().clip === 'circle' ? new Circle({ radius: Lw / 2, left: Lw / 2, top: Lh / 2, originX: 'center', originY: 'center' }) : null;
  // jak projekt wygląda na materiale
  const low = cv.lowerCanvasEl;
  if (mono()) { low.style.filter = 'url(#crInkF)'; low.style.mixBlendMode = cfg.mode === 'frost' ? 'screen' : (lum(cfg.ink || '#000') > .5 ? 'normal' : 'multiply'); }
  else { const b = blendOf(cfg, S.color); low.style.mixBlendMode = b === 'source-over' ? 'normal' : b; }
  // maska z kształtu produktu: projekt nie wychodzi poza etui, zawieszkę, poduszkę
  if (cfg.mask) {
    const k = w / view[2], url = `url(${side().img})`;
    Object.assign(low.style, { maskImage: url, webkitMaskImage: url, maskRepeat: 'no-repeat', webkitMaskRepeat: 'no-repeat',
      maskSize: `${mockImg.naturalWidth * k}px ${mockImg.naturalHeight * k}px`, webkitMaskSize: `${mockImg.naturalWidth * k}px ${mockImg.naturalHeight * k}px`,
      maskPosition: `${-view[0] * k - area.x}px ${-view[1] * k - area.y}px`, webkitMaskPosition: `${-view[0] * k - area.x}px ${-view[1] * k - area.y}px` });
  } else Object.assign(low.style, { maskImage: '', webkitMaskImage: '' });
  cv.requestRenderAll();
}
// nowy element nie ląduje na poprzednim: kolejne pozycje w pionie
function center() {
  const [Lw, Lh] = sizeOf(side()); const n = cv ? cv.getObjects().length : 0;
  const steps = [0, -0.28, 0.28, -0.14, 0.14, -0.36, 0.36]; return { left: Lw / 2, top: Lh / 2 + Lh * steps[n % steps.length] };
}
function place(o, frac = .6) {
  const [Lw, Lh] = sizeOf(side()); const k = cv.getObjects().length ? .7 : 1; const s = Math.min(Lw * frac * k / o.width, Lh * frac * k / o.height);
  const c = center(); o.set({ ...c, originX: 'center', originY: 'center', scaleX: s, scaleY: s });
  cv.add(o); cv.setActiveObject(o); cv.requestRenderAll(); $('crHint').style.display = 'none';
}
function snap(e) {
  const o = e.target, [Lw, Lh] = sizeOf(side()), tol = 8 / cv.getZoom() * UNIT / 4; const c = o.getCenterPoint();
  const nx = Math.abs(c.x - Lw / 2) < tol, ny = Math.abs(c.y - Lh / 2) < tol;
  if (nx) o.setPositionByOrigin({ x: Lw / 2, y: c.y }, 'center', 'center');
  if (ny) o.setPositionByOrigin({ x: o.getCenterPoint().x, y: Lh / 2 }, 'center', 'center');
  $('crGv').classList.toggle('on', nx); $('crGh').classList.toggle('on', ny);
}

// ——— dodawanie elementów ———
async function addText(t = 'Twój tekst') {
  const [Lw] = sizeOf(side());
  await document.fonts.load('800 80px Montserrat'); // najpierw czcionka, potem pomiar
  const o = new Textbox(t, { fontFamily: 'Montserrat', fontWeight: 800, fontSize: 80, fill: mono() ? '#000000' : (cfg.defColor || (cfg.mock && lum(S.color) < .45 ? '#ffffff' : '#121110')), textAlign: 'center', width: Lw * 3, kind: 'text' });
  o.initDimensions(); const tw = Math.ceil(o.calcTextWidth()) + 8; o.set({ width: tw });
  const s = Math.min(1, (Lw * .86) / tw); o.set({ ...center(), originX: 'center', originY: 'center', scaleX: s, scaleY: s });
  cv.add(o); cv.setActiveObject(o); cv.requestRenderAll(); $('crHint').style.display = 'none';
  if (innerWidth >= 1024) { o.enterEditing(); o.selectAll(); }
}
async function addSvg(body, w, h, kind, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  const { objects, options } = await loadSVGFromString(svg);
  const g = util.groupSVGElements(objects.filter(Boolean), options); g.set({ kind });
  if (color) setColor(g, color);
  place(g, .45);
}
function addFile(f) {
  if (f.size > 25e6) return toast('Plik jest za duży (max 25 MB)');
  const r = new FileReader();
  r.onload = async () => {
    if (f.type === 'image/svg+xml') {
      const { objects, options } = await loadSVGFromString(r.result); const g = util.groupSVGElements(objects.filter(Boolean), options); g.set({ kind: 'logo' }); place(g, .7); return;
    }
    const img = await FabricImage.fromURL(r.result); img.set({ kind: 'photo' });
    place(img, .75); toast('Dodano. Przeciągaj, obracaj i zmieniaj rozmiar narożnikami.');
  };
  f.type === 'image/svg+xml' ? r.readAsText(f) : r.readAsDataURL(f);
}

// ——— panel narzędzi ———
function tab(k) {
  el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === k)));
  const p = $('crPanel'); if (!k) { p.classList.add('hidden'); p.classList.remove('block'); requestAnimationFrame(() => mockImg && layout()); return; }
  p.classList.remove('hidden'); p.classList.add('block'); requestAnimationFrame(() => mockImg && layout());
  const H = {
    tekst: () => `<div class="crsec"><h3>Tekst</h3><button id="pAddT" class="btn btn-ink w-full h-12">+ Dodaj tekst</button>
      <p class="text-[12.5px] text-mute mt-3 mb-2">Szybki start:</p><div class="flex flex-wrap gap-2">${QUICK.map((q) => `<button class="crchip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <p class="text-[12.5px] text-mute mt-5">Kliknij dwa razy w tekst na produkcie, aby go edytować. Czcionkę i kolor zmienisz na pasku pod produktem.</p></div>`,
    obraz: () => `<div class="crsec"><h3>Logo lub zdjęcie</h3>
      <button id="pUp" class="w-full rounded-2xl border-2 border-dashed border-line hover:border-ink p-6 text-center"><b class="block">Wgraj plik</b><span class="text-[12.5px] text-mute">PNG, JPG, WEBP lub SVG · do 25 MB<br>albo przeciągnij go na produkt</span></button>
      <ul class="text-[12.5px] text-mute mt-4 grid gap-1.5"><li>• Logo najlepiej jako SVG lub PNG z przezroczystym tłem.</li><li>• Białe tło usuniesz jednym kliknięciem po zaznaczeniu obrazu.</li><li>• Pokażemy ostrzeżenie, jeśli zdjęcie ma za małą rozdzielczość do druku.</li>${mono() ? '<li>• Grawer jest jednokolorowy – zdjęcia zamieniamy na odcienie.</li>' : ''}</ul></div>`,
    emoji: () => `<div class="crsec"><h3>Emotki</h3><div class="crgrid">${Object.entries(assets.emoji).map(([k, b]) => `<button data-emo="${k}" aria-label="${k.replace(/-/g, ' ')}"><svg viewBox="0 0 32 32">${b}</svg></button>`).join('')}</div></div>`,
    grafiki: () => `<div class="crsec"><h3>Grafiki</h3><div class="crgrid">${Object.entries(assets.clip).map(([k, b]) => `<button data-clip="${k}" aria-label="${k.replace(/-fill|-/g, ' ')}"><svg viewBox="0 0 ${assets.clipW} ${assets.clipH}" fill="#121110">${b}</svg></button>`).join('')}</div><p class="text-[12.5px] text-mute mt-3">Kolor grafiki zmienisz po zaznaczeniu.</p></div>`,
    produkt: () => `<div class="crsec">${cfg.colors ? `<h3>Kolor produktu</h3><div class="flex flex-wrap gap-2.5">${cfg.colors.map(([n, h]) => `<button class="crsw" style="background:${h}" data-col="${h}" aria-label="${n}" title="${n}" aria-pressed="${h === S.color}"></button>`).join('')}</div><p class="text-[13px] mt-2"><b id="pColN">${(cfg.colors.find((c) => c[1] === S.color) || [''])[0]}</b></p>` : ''}
      ${cfg.sides.length > 1 ? `<h3 class="mt-6">Strona</h3><div class="flex gap-2">${cfg.sides.map((s, i) => `<button class="crchip" data-side="${i}" aria-pressed="${i === S.side}">${s.name}${s.extra ? ` (+${s.extra} zł)` : ''}</button>`).join('')}</div>` : ''}
      <h3 class="mt-6">Pole nadruku</h3><p class="text-[13.5px] text-mute">${side().mm[0] / 10} × ${side().mm[1] / 10} cm · ${cfg.mode === 'print' ? 'druk w pełnym kolorze' : cfg.mode === 'frost' ? 'grawer w szkle' : 'grawer laserowy'}</p></div>`,
  };
  p.innerHTML = H[k]();
  p.querySelector('#pAddT') && (p.querySelector('#pAddT').onclick = () => addText());
  p.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => addText(b.dataset.q));
  p.querySelector('#pUp') && (p.querySelector('#pUp').onclick = () => $('crFile').click());
  p.querySelectorAll('[data-emo]').forEach((b) => b.onclick = () => addSvg(assets.emoji[b.dataset.emo], 32, 32, 'emoji'));
  p.querySelectorAll('[data-clip]').forEach((b) => b.onclick = () => addSvg(assets.clip[b.dataset.clip], assets.clipW, assets.clipH, 'clip', mono() ? '#000000' : (cfg.mock && lum(S.color) < .45 ? '#ffffff' : '#121110')));
  p.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => color(b.dataset.col));
  p.querySelectorAll('[data-side]').forEach((b) => b.onclick = () => go(+b.dataset.side));
  if (innerWidth < 1024) p.scrollTop = 0;
}

// ——— pasek właściwości zaznaczonego elementu ———
function props() {
  const o = cv.getActiveObject(), box = $('crProps');
  if (!o) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const isT = o.type === 'textbox', isImg = o.type === 'image', isClip = o.kind === 'clip' || o.kind === 'logo';
  let warn = '';
  if (isImg && cfg.mode === 'print') { const mm = o.getScaledWidth() / UNIT; const dpi = Math.round(o.width / (mm / 25.4)); if (dpi < 150) warn = `<span class="crwarn">Niska jakość do druku: ${dpi} DPI – zmniejsz obraz lub wgraj większy plik</span>`; }
  const sw = (cur) => mono() ? '' : `<div class="crprop">${COLORS.map((c) => `<button class="crsw !w-7 !h-7" style="background:${c}" data-fc="${c}" aria-label="Kolor ${c}" aria-pressed="${String(cur).toLowerCase() === c}"></button>`).join('')}<label class="crsw !w-7 !h-7 cursor-pointer overflow-hidden relative" title="Inny kolor" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"><input type="color" id="pFcC" class="absolute inset-0 opacity-0 cursor-pointer" value="${typeof cur === 'string' && cur.startsWith('#') ? cur : '#121110'}"></label></div>`;
  box.innerHTML = `<div class="flex items-center gap-3 min-w-max">
    ${isT ? `<div class="crprop"><select id="pFont" aria-label="Czcionka">${FONTS.map(([f, n, w]) => `<option value="${f}|${w}" ${o.fontFamily === f ? 'selected' : ''} style="font-family:'${f}';font-weight:${w}">${n}</option>`).join('')}</select>
      <button class="crb border border-line ${o.fontStyle === 'italic' ? 'bg-paper' : ''}" id="pIt" aria-label="Kursywa"><i class="font-serif text-[17px]">I</i></button>
      ${['left', 'center', 'right'].map((a) => `<button class="crb border border-line ${o.textAlign === a ? 'bg-paper' : ''}" data-al="${a}" aria-label="Wyrównaj ${a}"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="${a === 'left' ? 'M4 6h16M4 12h10M4 18h14' : a === 'center' ? 'M4 6h16M7 12h10M5 18h14' : 'M4 6h16M10 12h10M6 18h14'}"/></svg></button>`).join('')}
      <label class="crprop text-[12.5px] text-mute">Odstęp <input type="range" id="pSp" min="-100" max="600" step="10" value="${o.charSpacing || 0}" class="w-20 accent-ink"></label>
      ${mono() ? '' : `<button class="crb border border-line ${o.strokeWidth ? 'bg-paper' : ''}" id="pOut" aria-label="Obrys" title="Obrys"><b style="-webkit-text-stroke:1px currentColor;color:transparent">A</b></button>`}</div>` : ''}
    ${(isT || isClip) ? sw(o.fill) : ''}
    ${isImg ? `<div class="crprop"><button class="crchip" id="pBg">${(o.filters || []).some((f) => f.type === 'RemoveColor') ? 'Przywróć tło' : 'Usuń białe tło'}</button>${warn}</div>` : ''}
    <div class="crprop text-mute">
      <button class="crb border border-line" id="pCx" aria-label="Wyśrodkuj w poziomie" title="Wyśrodkuj"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v18M7 8h10v8H7z"/></svg></button>
      <button class="crb border border-line" id="pFw" aria-label="Na wierzch" title="Na wierzch"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 4h12v12H8z"/><path d="M4 8v12h12" opacity=".5"/></svg></button>
      <button class="crb border border-line" id="pDup" aria-label="Duplikuj" title="Duplikuj"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></button>
      <button class="crb border border-line" id="pDel" aria-label="Usuń" title="Usuń (Delete)"><svg width="16" height="16" fill="none" stroke="#c8102e" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
    </div></div>`;
  const q = (s) => box.querySelector(s); const upd = () => { cv.requestRenderAll(); snapshot(); };
  q('#pFont') && (q('#pFont').onchange = async (e) => { const [f, w] = e.target.value.split('|'); await document.fonts.load(`${w} 60px "${f}"`); o.set({ fontFamily: f, fontWeight: +w, width: 4000 }); o.initDimensions(); o.set({ width: Math.ceil(o.calcTextWidth()) + 8 }); o.setCoords(); upd(); });
  q('#pIt') && (q('#pIt').onclick = () => { o.set('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic'); upd(); props(); });
  box.querySelectorAll('[data-al]').forEach((b) => b.onclick = () => { o.set('textAlign', b.dataset.al); upd(); props(); });
  q('#pSp') && (q('#pSp').oninput = (e) => { o.set('charSpacing', +e.target.value); cv.requestRenderAll(); }); q('#pSp') && (q('#pSp').onchange = snapshot);
  q('#pOut') && (q('#pOut').onclick = () => { o.set(o.strokeWidth ? { strokeWidth: 0, stroke: null } : { stroke: lum(o.fill) > .5 ? '#121110' : '#ffffff', strokeWidth: 4, paintFirst: 'stroke' }); upd(); props(); });
  box.querySelectorAll('[data-fc]').forEach((b) => b.onclick = () => { setColor(o, b.dataset.fc); upd(); props(); });
  q('#pFcC') && (q('#pFcC').oninput = (e) => { setColor(o, e.target.value); cv.requestRenderAll(); }); q('#pFcC') && (q('#pFcC').onchange = snapshot);
  q('#pBg') && (q('#pBg').onclick = () => { const has = (o.filters || []).some((f) => f.type === 'RemoveColor'); o.filters = has ? [] : [new filters.RemoveColor({ color: '#ffffff', distance: 0.12 })]; o.applyFilters(); upd(); props(); });
  q('#pCx').onclick = () => { const [Lw] = sizeOf(side()); o.setPositionByOrigin({ x: Lw / 2, y: o.getCenterPoint().y }, 'center', 'center'); o.setCoords(); upd(); };
  q('#pFw').onclick = () => { cv.bringObjectToFront(o); upd(); };
  q('#pDup').onclick = async () => { const c = await o.clone(['kind']); c.set({ left: o.left + 30, top: o.top + 30 }); cv.add(c); cv.setActiveObject(c); upd(); };
  q('#pDel').onclick = del;
}
function setColor(o, c) { if (o.type === 'textbox') return o.set('fill', c); const f = (x) => { if (x._objects) x._objects.forEach(f); else if (x.fill && x.fill !== 'none') x.set('fill', c); }; f(o); o.set('dirty', true); }
function del() { const a = cv.getActiveObjects(); if (!a.length) return; a.forEach((o) => cv.remove(o)); cv.discardActiveObject(); cv.requestRenderAll(); }
function keys(e) {
  if (!el.classList.contains('on')) return;
  const o = cv.getActiveObject(), editing = o && o.isEditing, inField = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === 'Escape' && !editing) { cv.getActiveObject() ? (cv.discardActiveObject(), cv.requestRenderAll()) : closeCreator(); return; }
  if (editing || inField) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && o) { e.preventDefault(); del(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  if (o && e.key.startsWith('Arrow')) { e.preventDefault(); const d = e.shiftKey ? 20 : 4; o.set({ left: o.left + (e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0), top: o.top + (e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0) }); o.setCoords(); cv.requestRenderAll(); snapshot(); }
}

// ——— historia i zapis ———
function snapshot() {
  if (lock) return;
  clearTimeout(snapshot.t); snapshot.t = setTimeout(() => {
    const j = JSON.stringify(cv.toObject(['kind'])); if (hist[hist.length - 1] === j) return;
    hist.push(j); if (hist.length > 60) hist.shift(); fut = []; S.sides[side().id] = JSON.parse(j); btns(); price(); persist();
  }, 120);
}
async function restore(j) { lock = true; await cv.loadFromJSON(JSON.parse(j)); cv.renderAll(); lock = false; S.sides[side().id] = JSON.parse(j); props(); btns(); price(); persist(); }
function undo() { if (hist.length < 2) return; fut.push(hist.pop()); restore(hist[hist.length - 1]); }
function redo() { if (!fut.length) return; const j = fut.pop(); hist.push(j); restore(j); }
function btns() { $('crUndo').disabled = hist.length < 2; $('crRedo').disabled = !fut.length; }
function persist() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) { /* duże zdjęcia: zapis lokalny pominięty */ } }, 400); }

// ——— produkt: kolor, strony, ilość, cena ———
function colors() {
  const b = $('crColors'); if (!cfg.colors) { b.innerHTML = ''; return; }
  b.innerHTML = cfg.colors.map(([n, h]) => `<button class="crsw" style="background:${h}" data-c="${h}" aria-label="${n}" title="${n}" aria-pressed="${h === S.color}"></button>`).join('');
  b.querySelectorAll('[data-c]').forEach((x) => x.onclick = () => color(x.dataset.c));
}
function color(h) {
  const dark = lum(h) < .45, from = dark ? '#121110' : '#ffffff', to = dark ? '#ffffff' : '#121110';
  if (!mono()) cv.getObjects().forEach((o) => { if ((o.type === 'textbox' || o.kind === 'clip') && String(o.fill).toLowerCase() === from) setColor(o, to); });
  S.color = h; colors(); layout(); persist(); snapshot(); if ($('crPanel').querySelector('[data-col]')) tab('produkt'); }
function sides() {
  const b = $('crSides'); if (cfg.sides.length < 2) { b.innerHTML = ''; return; }
  b.innerHTML = cfg.sides.map((s, i) => `<button class="crchip shadow-sm ${i === S.side ? '!bg-ink !text-white !border-ink' : ''}" data-sd="${i}">${s.name}${S.sides[s.id] && S.sides[s.id].objects?.length ? ' ✓' : ''}</button>`).join('');
  b.querySelectorAll('[data-sd]').forEach((x) => x.onclick = () => go(+x.dataset.sd));
}
async function go(i) { if (i === S.side) return; S.sides[side().id] = cv.toObject(['kind']); S.side = i; cv.discardActiveObject(); await loadSide(); if (!$('crPanel').classList.contains('hidden')) { const t = el.querySelector('[data-tab][aria-pressed=true]'); t && tab(t.dataset.tab); } }
function qty(n) { S.qty = Math.max(1, Math.min(999, n)); $('crQty').value = S.qty; price(); persist(); }
const used = () => cfg.sides.filter((s) => (s.id === side().id ? cv.getObjects().length : S.sides[s.id]?.objects?.length));
function unit() { const u = used(); return P + (u.length > 1 ? u.reduce((a, s) => a + (s.extra || 0), 0) : 0); }
function price() { const u = unit(); $('crPrice').textContent = zl(u * S.qty); $('crPriceNote').textContent = S.qty > 1 ? `${zl(u)} / szt.` : used().length > 1 ? 'nadruk z dwóch stron' : 'z VAT'; }

// ——— do koszyka ———
async function addToCart() {
  S.sides[side().id] = cv.toObject(['kind']);
  const u = used(); if (!u.length) { toast('Dodaj tekst, logo albo grafikę do projektu'); return; }
  const b = $('crAdd'); b.disabled = true; b.textContent = 'Przygotowuję podgląd…';
  try {
    const id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const design = { id, slug: el.dataset.slug, name: el.dataset.name, color: S.color, colorName: cfg.colors ? (cfg.colors.find((c) => c[1] === S.color) || [''])[0] : null, size: S.size, mode: cfg.mode, sides: {}, previews: {}, created: new Date().toISOString() };
    for (const s of u) design.sides[s.id] = S.sides[s.id];
    for (const s of u) design.previews[s.id] = await renderPreview(cfg, design, s.id, 900);
    await saveDesign(design);
    const thumb = await renderPreview(cfg, design, u[0].id, 360);
    const lines = [design.colorName, design.size && 'rozmiar ' + design.size, 'projekt z kreatora: ' + u.map((s) => s.name.toLowerCase()).join(' + ')].filter(Boolean);
    addRaw([{ title: el.dataset.name, lines, img: thumb, qty: S.qty, price: unit(), design: id }]);
    closeCreator(); toast('Dodano do koszyka – projekt zobaczysz jeszcze do akceptacji');
  } catch (e) { console.error(e); toast('Nie udało się zapisać projektu. Spróbuj mniejszego pliku.'); }
  b.disabled = false; b.textContent = 'Dodaj do koszyka';
}
