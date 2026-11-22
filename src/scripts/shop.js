import { $, $$, press, toast, initPage, priceAnim } from './common.js';
import { addItem, openCo, zl } from './cart.js';
import { createCrystal } from './crystal.js';
initPage();
const cr = createCrystal($('stage'));
const P = { s: 179, m: 229, l: 299 }, L = { none: 0, warm: 49, rgb: 59 };
const st = { size: 's', led: 'warm', qty: 1, dark: false };
const unit = () => P[st.size] + L[st.led];
function price() { const u = unit(); priceAnim('price'); $('price').textContent = zl(u); $('sP').textContent = zl(u); $('omni').textContent = 'Najniższa cena z 30 dni: ' + zl(u); }
$$('[data-size]').forEach((b) => b.onclick = () => { st.size = b.dataset.size; press('[data-size]', b); cr.set({ size: st.size }); price(); });
$$('[data-led]').forEach((b) => b.onclick = () => { st.led = b.dataset.led; press('[data-led]', b); cr.set({ led: st.led }); price(); });
let tm; ['txt', 'date'].forEach((id) => $(id).addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => cr.set({ txt: $('txt').value.trim(), date: $('date').value.trim() }), 160); }));
function loadFile(f) { if (!f || !f.type.startsWith('image/')) return; const img = new Image(); img.onload = () => { cr.set({ img }); $('upT').textContent = 'Zdjęcie gotowe ✓ – kliknij, aby zmienić'; $('thumb').innerHTML = `<img src="${img.src}" class="w-full h-full object-cover">`; toast('Zdjęcie zamienione w grawer 3D ✨'); }; img.src = URL.createObjectURL(f); }
$('file').addEventListener('change', (e) => loadFile(e.target.files[0]));
const drop = $('drop');
['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('!border-ink', '!bg-white'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('!border-ink', '!bg-white'); }));
drop.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));
$('pl').onclick = () => { st.qty = Math.min(20, st.qty + 1); $('q').textContent = st.qty; };
$('mi').onclick = () => { st.qty = Math.max(1, st.qty - 1); $('q').textContent = st.qty; };
function setDark(on) { st.dark = on; cr.dark(on); $('darkT').textContent = on ? 'Zapal światło' : 'Zgaś światło'; $('stageWrap').classList.toggle('dark-stage', on); }
$('darkBtn').onclick = () => setDark(!st.dark);
$$('[data-view]').forEach((b) => b.onclick = () => { press('[data-view]', b); const n = +b.dataset.view; cr.view(n); setDark(n === 3); });
$('stage').addEventListener('pointerdown', () => { $('hint').style.opacity = 0; }, { once: true });
const item = () => ({ title: 'Kryształ 3D ze zdjęciem', lines: [`${st.size.toUpperCase()} · ${st.led === 'none' ? 'bez podstawki' : st.led === 'warm' ? 'LED ciepła' : 'LED kolorowa'}`, `„${$('txt').value.trim() || '—'}” ${$('date').value.trim()}`], qty: st.qty, price: unit(), img: cr.snapshot(), boxable: true });
$('add').onclick = () => addItem(item(), $('stage')); $('add2').onclick = () => addItem(item(), $('stage'));
$('buyNow').onclick = () => addItem(item(), $('stage'), openCo);
