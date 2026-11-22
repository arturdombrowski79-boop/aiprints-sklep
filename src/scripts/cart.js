import gsap from 'gsap';
const $ = (id) => document.getElementById(id);
const $$ = (s) => [...document.querySelectorAll(s)];
export const zl = (v) => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '') + ' zł';

const KEY = 'aiprints-cart-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
const S = load() || { items: [], add: { box: false, card: false, exp: false }, disc: false };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
const ADD = { box: 19, card: 9, exp: 0 };
const count = () => S.items.reduce((s, i) => s + i.qty, 0);
const boxable = () => S.items.reduce((s, i) => s + (i.boxable ? i.qty : 0), 0);
function totals() {
  const sub = S.items.reduce((s, i) => s + i.price * i.qty, 0) + (S.items.length ? (S.add.box ? ADD.box * boxable() : 0) + (S.add.card ? ADD.card : 0) + (S.add.exp ? ADD.exp : 0) : 0);
  const d = S.disc ? Math.round(sub * 10) / 100 : 0; return { sub, d, after: sub - d };
}
let lenis = null, toastFn = () => { };
export function thumb(dataUrl) {
  return new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'); g.fillStyle = '#ebe6de'; g.fillRect(0, 0, 180, 180); const s = Math.max(180 / im.width, 180 / im.height); g.drawImage(im, (180 - im.width * s) / 2, (180 - im.height * s) / 2, im.width * s, im.height * s); res(c.toDataURL('image/jpeg', .8)); }; im.src = dataUrl; });
}

function lastOrder() { const el = $('lastOrd'); if (!el) return; let O = []; try { O = JSON.parse(localStorage.getItem('aiprints-orders') || '[]'); } catch (e) { } const o = O[0]; if (!o) return; const st = ['Czeka na akceptację projektu', 'Projekt zaakceptowany', 'W produkcji', 'Wysłane', 'Doręczone'][o.status]; el.href = 'konto.html#zamowienie/' + o.no; el.innerHTML = `<i class="w-2 h-2 rounded-full ${o.status === 0 ? 'bg-acc animate-pulse' : 'bg-emerald-400'}"></i><span class="flex-1">Zamówienie #${o.no}: <b>${st}</b></span><span>→</span>`; el.classList.remove('hidden'); el.classList.add('flex'); }
export function renderCart() {
  lastOrder();
  const n = count(); $('cnt').textContent = n; $('cnt').style.transform = n ? 'scale(1)' : 'scale(0)';
  const box = $('items');
  if (!S.items.length) box.innerHTML = `<div class="text-center text-mute py-16"><div class="font-display text-[34px] text-ink">Pusto tutaj</div><p class="mt-2">Zaprojektuj swój prezent ✨</p></div>`;
  else box.innerHTML = S.items.map((i, ix) => `<div class="flex gap-4 py-4 border-b border-line"><img src="${i.img}" class="w-20 h-20 rounded-2xl object-cover bg-paper2"><div class="flex-1 text-[14px]"><b class="font-semibold">${i.title}</b>${i.pers === false ? '<div class="text-[12px] text-emerald-700">Bez personalizacji · 14 dni na zwrot</div>' : ''}${i.lines.map((l) => `<div class="text-[12.5px] text-mute">${l}</div>`).join('')}<button data-rm="${ix}" class="text-[12px] underline text-mute mt-1">Usuń</button></div><div class="text-right font-semibold text-[14px]">${zl(i.price * i.qty)}<div class="text-[12px] text-mute font-normal">${i.qty} × ${zl(i.price)}</div></div></div>`).join('') +
    `<div class="text-[11.5px] tracking-[.16em] uppercase text-gold font-semibold mt-5 mb-2">Dodaj do prezentu</div>` +
    [['box', 'Pudełko premium z wkładką', 'czarne, wkładka z pianki EVA', '+19 zł/szt.'], ['card', 'Kartka z Twoimi życzeniami', 'wydrukujemy i dołożymy', '+9 zł']].map(([k, t, d, p]) =>
      `<label class="flex items-center gap-3 rounded-2xl border ${S.add[k] ? 'border-ink bg-white' : 'border-line bg-white/60'} px-4 py-3 mb-2 cursor-pointer text-[14px] transition"><input type="checkbox" data-ad="${k}" ${S.add[k] ? 'checked' : ''} class="w-[18px] h-[18px] accent-[#141210]"><span class="flex-1"><b class="font-medium">${t}</b><span class="block text-[12px] text-mute">${d}</span></span><b class="whitespace-nowrap">${p}</b></label>`).join('') +
    `<div class="flex gap-2 mt-3"><input id="code" placeholder="Kod rabatowy (test: WITAMY10)" value="${S.disc ? 'WITAMY10' : ''}" class="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-[14px] outline-none focus:border-ink"><button id="codeB" class="rounded-full border border-ink px-4 text-[14px] font-medium">Użyj</button></div>`;
  const t = totals(); $('sSub').textContent = zl(t.sub); $('rDisc').classList.toggle('hidden', !S.disc); $('sDisc').textContent = '−' + zl(t.d); $('sTot').textContent = zl(t.after);
  const left = Math.max(0, 199 - t.after), pct = Math.min(100, t.after / 199 * 100);
  $('fs').innerHTML = `${left > 0 ? `Brakuje <b>${zl(left)}</b> do darmowej dostawy` : '🎉 Masz <b>darmową dostawę</b>'}<div class="h-1.5 rounded-full bg-paper2 mt-2 overflow-hidden"><div id="fsBar" class="h-full rounded-full bg-gradient-to-r from-gold to-gold2 transition-all duration-700" style="width:0"></div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { const b = $('fsBar'); if (b) b.style.width = pct + '%'; }));
  $('toCo').disabled = !S.items.length; $('toCo').style.opacity = S.items.length ? 1 : .4;
  box.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { S.items.splice(+b.dataset.rm, 1); save(); renderCart(); });
  box.querySelectorAll('[data-ad]').forEach((c) => c.onchange = () => { S.add[c.dataset.ad] = c.checked; save(); renderCart(); });
  const cb = $('codeB'); if (cb) cb.onclick = () => { S.disc = $('code').value.trim().toUpperCase() === 'WITAMY10'; save(); toastFn(S.disc ? 'Kod WITAMY10: −10% ✓' : 'Nieprawidłowy kod'); renderCart(); };
}
export function addRaw(items) { items.forEach((i) => S.items.push(i)); save(); renderCart(); openCart(); }
export function openCart() { renderCart(); $('drawer').classList.add('on'); $('scrim').classList.add('on'); if (innerWidth < 1024) lenis && lenis.stop(); }
export function closeCart() { $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); lenis && lenis.start(); }

export async function addItem(item, fromEl, then) {
  const full = item.img; item.img = await thumb(full); S.items.push(item); save();
  const r = fromEl.getBoundingClientRect(), c = $('cartBtn').getBoundingClientRect();
  const f = Object.assign(document.createElement('img'), { src: full }); f.className = 'fixed z-[95] rounded-3xl object-cover shadow-2xl pointer-events-none';
  Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); document.body.appendChild(f);
  gsap.to(f, { left: c.left + c.width / 2 - 12, top: c.top + c.height / 2 - 12, width: 24, height: 24, borderRadius: 12, opacity: .4, duration: .85, ease: 'power3.inOut', onComplete: () => { f.remove(); renderCart(); gsap.fromTo('#cartBtn', { scale: 1.12 }, { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' }); then ? then() : openCart(); } });
}

const shipVal = () => { const v = +document.querySelector('[name=d]:checked').value; return totals().after >= 199 && v > 0 ? 0 : v; };
function renderCo() {
  const t = totals();
  $('coItems').innerHTML = S.items.map((i) => `<div class="flex gap-3 py-3 border-b border-[#eef1f4]"><img src="${i.img}" class="w-14 h-14 rounded-lg object-cover"><div class="flex-1 text-[13.5px]"><b class="font-semibold">${i.title}</b><div class="text-[12px] text-[#697386]">${i.lines[0] || ''} · ${i.qty} szt.</div></div><b class="text-[13.5px]">${zl(i.price * i.qty)}</b></div>`).join('') +
    (S.add.box && boxable() ? `<div class="flex justify-between text-[13px] text-[#697386] pt-2"><span>Pudełko premium</span><span>${zl(ADD.box * boxable())}</span></div>` : '') + (S.add.card ? `<div class="flex justify-between text-[13px] text-[#697386]"><span>Kartka</span><span>9 zł</span></div>` : '') + (S.add.exp ? `<div class="flex justify-between text-[13px] text-[#697386]"><span>Ekspres</span><span>19 zł</span></div>` : '');
  const s = shipVal(), tot = t.after + s;
  $('cSub').textContent = zl(t.sub); $('cDiscR').classList.toggle('hidden', !S.disc); $('cDisc').textContent = '−' + zl(t.d); $('cShip').textContent = s ? zl(s) : '0 zł'; $('cTot').textContent = zl(tot); $('payT').textContent = 'Zamawiam i płacę ' + zl(tot);
  const P = S.items.filter((i) => i.pers !== false), G = S.items.filter((i) => i.pers === false);
  $('persBox').classList.toggle('hidden', !P.length); $('persList').textContent = P.length === S.items.length ? (P.length > 1 ? 'wszystkie produkty z tego zamówienia' : 'ten produkt') : P.map((i) => i.title).join(', ');
  $('retInfo').classList.toggle('hidden', !G.length); $('retInfo').textContent = G.length ? `Bez personalizacji: ${G.map((i) => i.title).join(', ')} – możesz odstąpić od umowy w ciągu 14 dni od odbioru, bez podania przyczyny.` : '';
}
export function openCo() { const b = document.getElementById('brk'); $('coBrk').classList.toggle('hidden', !b || b.hidden); $('co').classList.add('on'); $('coForm').classList.remove('hidden'); $('ok').classList.add('hidden'); lenis && lenis.stop(); document.body.style.overflow = 'hidden'; renderCo(); $('co').scrollTop = 0; }
function closeCo() { $('co').classList.remove('on'); document.body.style.overflow = ''; lenis && lenis.start(); }

export function initCart(opts) {
  lenis = opts.lenis; toastFn = opts.toast;
  $('cartBtn').onclick = () => $('drawer').classList.contains('on') ? closeCart() : openCart(); addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); }); $('close').onclick = closeCart; $('scrim').onclick = closeCart;
  $('toCo').onclick = () => { if (S.items.length) { closeCart(); openCo(); } };
  $('coBack').onclick = closeCo; $('again').onclick = closeCo;
  $$('[name=d]').forEach((r) => r.onchange = renderCo);
  let pm = 'blik';
  $$('[data-p]').forEach((b) => b.onclick = () => { pm = b.dataset.p; $$('[data-p]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $$('.pane').forEach((p) => p.classList.toggle('hidden', p.id !== 'p-' + pm)); });
  $('blik').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
  $$('[data-x]').forEach((b) => b.onclick = () => pay('wallet'));
  $('pay').onclick = () => pay(pm);
  function pay(m) {
    const em = $('em').value.trim(); let bad = false;
    const emOk = /^\S+@\S+\.\S+$/.test(em) || m === 'wallet'; $('emErr').classList.toggle('hidden', emOk); if (!emOk) bad = true;
    $('tosErr').classList.toggle('hidden', $('tos').checked); if (!$('tos').checked) bad = true;
    const needP = !$('persBox').classList.contains('hidden'); $('persErr').classList.toggle('hidden', !needP || $('pers').checked); if (needP && !$('pers').checked) bad = true;
    if (m === 'blik') { const ok = /^\d{6}$/.test($('blik').value); $('blErr').classList.toggle('hidden', ok); if (!ok) bad = true; }
    if (bad) return;
    $('pay').disabled = true; $('spin').classList.remove('hidden'); $('payT').textContent = m === 'blik' ? 'Potwierdź w aplikacji banku…' : 'Przetwarzanie…';
    setTimeout(() => {
      $('pay').disabled = false; $('spin').classList.add('hidden'); $('coForm').classList.add('hidden'); $('ok').classList.remove('hidden');
      const no = 'AP-' + (26000 + Math.floor(Math.random() * 900)); const t = totals(); const sh = shipVal();
      $('ordNo').textContent = '#' + no; $('ordEm').textContent = em || 'Twój e-mail'; $('co').scrollTop = 0;
      try { const O = JSON.parse(localStorage.getItem('aiprints-orders') || '[]'); O.unshift({ no, date: new Date().toISOString(), email: em, items: S.items.map((i) => ({ title: i.title, lines: i.lines, img: i.img, qty: i.qty, price: i.price, pers: i.pers !== false, ...(i.design ? { design: i.design } : {}) })), sub: t.after, ship: sh, total: t.after + sh, pay: m, delivery: document.querySelector('[name=d]:checked').closest('label').querySelector('b').textContent, status: 0 }); localStorage.setItem('aiprints-orders', JSON.stringify(O)); if (em) localStorage.setItem('aiprints-session', em); } catch (e) { }
      const lk = document.getElementById('ordLink'); if (lk) lk.href = 'konto.html#zamowienie/' + no;
      S.items.length = 0; S.add = { box: false, card: false, exp: false }; S.disc = false; save(); renderCart();
      gsap.from('#ok', { y: 20, opacity: 0, duration: .6, ease: 'expo.out' });
    }, m === 'blik' ? 2600 : 1700);
  }
  renderCart();
}
