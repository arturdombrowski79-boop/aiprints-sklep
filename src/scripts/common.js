import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCart } from './cart.js';
gsap.registerPlugin(ScrollTrigger);
export const $ = (id) => document.getElementById(id);
export const $$ = (s) => [...document.querySelectorAll(s)];
export function press(group, btn) { $$(group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn))); }
let tt;
export function toast(m) { const t = $('toast'); t.textContent = m; t.style.opacity = 1; t.style.transform = 'translate(-50%,0)'; clearTimeout(tt); tt = setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translate(-50%,16px)'; }, 2400); }
export function initPage() {
  const lenis = { stop() {}, start() {} }; // natywne przewijanie – szybsze i dostępne
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) $$('.reveal').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  else $$('.reveal').forEach((el) => gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 94%' } }));
  if ($('line')) gsap.to('#line', { width: '100%', ease: 'none', scrollTrigger: { trigger: '#line', start: 'top 80%', end: 'top 40%', scrub: true } });
  if ($('sticky') && $('add')) ScrollTrigger.create({ trigger: '#add', start: 'bottom top', onEnter: () => $('sticky').style.transform = 'translateY(0)', onLeaveBack: () => $('sticky').style.transform = 'translateY(110%)' });
  initCart({ lenis, toast });
  const tick = () => { const el = $('cut'); if (!el) return; const now = new Date(), cut = new Date(now); cut.setHours(14, 0, 0, 0); if (now > cut) cut.setDate(cut.getDate() + 1); const ms = cut - now; el.textContent = Math.floor(ms / 3600000) + ' h ' + Math.floor(ms % 3600000 / 60000) + ' min'; };
  tick(); setInterval(tick, 30000);
  return lenis;
}
export function priceAnim(id) { gsap.fromTo('#' + id, { y: 8, opacity: .3 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' }); }
