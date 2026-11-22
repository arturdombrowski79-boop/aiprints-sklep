import { $, $$, press, toast, initPage, priceAnim } from './common.js';
import { addItem, zl } from './cart.js';
import gsap from 'gsap';
initPage();
const st = { qty: 1, font: 'script', i: 0 };
const FONTS = { script: ["'Great Vibes',cursive", 7.2, 'none', '0'], serif: ["'Instrument Serif',serif", 6, 'none', '0'], sans: ['Inter,sans-serif', 3.6, 'uppercase', '.5cqw'] };
const thumbs = $$('.thumb');
const unitBase = () => st.qty >= 30 ? 22 : st.qty >= 10 ? 29 : st.qty >= 3 ? 34 : 39;
const unit = () => unitBase() + ($('backOn').checked ? 5 : 0);
function price() { const u = unit(); priceAnim('price'); $('price').textContent = zl(u); $('addP').textContent = zl(u * st.qty); $('sP').textContent = zl(u * st.qty); $('tierNote').textContent = (st.qty >= 3 ? `za sztukę przy ${st.qty} szt.` : 'za sztukę') + ($('backOn').checked ? ', z grawerem z tyłu' : ''); }

function overlay() {
  const t = thumbs[st.i].dataset, name = $('name').value.trim(), year = $('year').value.trim(), f = FONTS[st.font];
  const ov = $('ov'), back = $('ovBack');
  const isBack = t.back === '1', noOv = +t.x < 0;
  ov.style.display = isBack || noOv ? 'none' : '';
  back.classList.toggle('hidden', !isBack || !$('backOn').checked);
  if (!isBack && !noOv) {
    Object.assign(ov.style, { left: t.x + '%', top: t.y + '%', width: t.w + '%', transform: `translate(-50%,-50%) scaleX(${t.sx})` });
    const k = +t.w / 31, len = Math.max(4, name.length);
    const n = $('ovName'); n.textContent = name || 'Imię'; n.style.opacity = name ? 1 : .35;
    Object.assign(n.style, { fontFamily: f[0], textTransform: f[2], letterSpacing: f[3], fontSize: Math.min(f[1], f[1] * 6 / len) * k + 'cqw', fontWeight: st.font === 'sans' ? 600 : 400 });
    const y = $('ovYear'); y.textContent = year; y.style.fontSize = 2.4 * k + 'cqw';
  }
  back.textContent = $('back').value;
}
function show(i) {
  st.i = (i + thumbs.length) % thumbs.length; const t = thumbs[st.i];
  thumbs.forEach((b, k) => { b.classList.toggle('border-ink', k === st.i); b.classList.toggle('border-transparent', k !== st.i); b.classList.toggle('opacity-70', k !== st.i); });
  const img = $('mainImg');
  gsap.to(img, { opacity: 0, duration: .15, onComplete: () => { img.src = `img/bombka/${t.dataset.f}.jpg`; overlay(); gsap.to(img, { opacity: 1, duration: .3 }); } });
  $('gl').textContent = `${st.i + 1} / ${thumbs.length}`;
}
thumbs.forEach((b, k) => b.onclick = () => show(k));
$('prev').onclick = (e) => { e.stopPropagation(); show(st.i - 1); }; $('next').onclick = (e) => { e.stopPropagation(); show(st.i + 1); };
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(st.i + 1); if (e.key === 'ArrowLeft') show(st.i - 1); });
// przesuwanie palcem
let sx = null; const main = $('main');
main.addEventListener('pointerdown', (e) => { sx = e.clientX; });
main.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 40) show(st.i + (e.clientX < sx ? 1 : -1)); sx = null; });
// lupa na komputerze
if (matchMedia('(hover:hover)').matches) {
  main.addEventListener('mousemove', (e) => { const r = main.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100; $('mainImg').style.transformOrigin = `${x}% ${y}%`; $('mainImg').style.transform = 'scale(1.6)'; $('ov').style.opacity = 0; $('ovBack').style.opacity = 0; });
  main.addEventListener('mouseleave', () => { $('mainImg').style.transform = ''; $('ov').style.opacity = 1; $('ovBack').style.opacity = 1; });
}
$$('[data-font]').forEach((el) => el.onclick = () => { st.font = el.dataset.font; press('[data-font]', el); if (thumbs[st.i].dataset.back) show(0); else overlay(); });
['name', 'year'].forEach((id) => $(id).addEventListener('input', () => { if (thumbs[st.i].dataset.back || +thumbs[st.i].dataset.x < 0) show(0); else overlay(); }));
$('back').addEventListener('input', () => { if (!thumbs[st.i].dataset.back) show(6); else overlay(); });
$('backOn').addEventListener('change', () => { $('back').classList.toggle('hidden', !$('backOn').checked); overlay(); price(); });
$('pl').onclick = () => { st.qty = Math.min(200, st.qty + 1); $('q').textContent = st.qty; price(); };
$('mi').onclick = () => { st.qty = Math.max(1, st.qty - 1); $('q').textContent = st.qty; price(); };

// miniatura do koszyka: zdjęcie główne + napis
function snapshot() {
  const c = document.createElement('canvas'); c.width = c.height = 600; const g = c.getContext('2d'); const img = new Image();
  return new Promise((res) => { img.onload = () => { g.drawImage(img, 0, 0, 600, 600); const f = FONTS[st.font]; const name = $('name').value.trim(); const len = Math.max(4, name.length);
    g.fillStyle = 'rgba(86,46,18,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${st.font === 'sans' ? '600 ' : ''}${Math.min(f[1], f[1] * 6 / len) * 6}px ${f[0]}`;
    g.fillText(st.font === 'sans' ? name.toUpperCase() : name, 600 * .497, 600 * .55 - 6); g.font = `${2.4 * 6}px 'Instrument Serif'`; g.fillText($('year').value.trim(), 600 * .497, 600 * .55 + 30);
    res(c.toDataURL('image/jpeg', .85)); }; img.src = 'img/bombka/glowne.jpg'; });
}
async function item() { return { title: 'Bombka ze śnieżynkami z imieniem', lines: [`„${$('name').value.trim() || '—'}” ${$('year').value.trim()}`, `dwuwarstwowa, 12 cm${$('backOn').checked ? ' · grawer z tyłu' : ''}`], qty: st.qty, price: unit(), img: await snapshot(), boxable: true }; }
$('add').onclick = async () => addItem(await item(), main); $('add2').onclick = async () => addItem(await item(), main);
$('another').onclick = async () => addItem(await item(), main, () => { $('name').value = ''; $('name').focus(); show(0); toast('Dodano ✓ Wpisz kolejne imię'); });
document.fonts.ready.then(overlay); overlay(); price();
