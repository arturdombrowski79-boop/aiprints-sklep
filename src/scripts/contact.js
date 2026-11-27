// Wysyłka formularzy zapytań do api/contact.php (mail do pracowni z załącznikami).
export function bindQuote(form, okEl, about) {
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault(); const btn = form.querySelector('button:not([type=button])'); const fd = new FormData(form);
    if (about) fd.set('about', about); const who = form.querySelector('#who [aria-pressed=true]'); if (who) fd.set('who', who.textContent.trim());
    btn.disabled = true; const t = btn.textContent; btn.textContent = 'Wysyłam…';
    try {
      const r = await fetch('api/contact.php', { method: 'POST', body: fd }); let j = {}; try { j = await r.json(); } catch (x) { }
      if (!r.ok || j.error) throw new Error(j.error || 'Nie udało się wysłać.');
      form.querySelectorAll('input:not([type=checkbox]):not([type=hidden]),textarea').forEach((i) => (i.value = ''));
      if (window.lead) window.lead('form');
      okEl.textContent = 'Dziękujemy! Zapytanie dotarło – odpiszemy w ciągu 24 h w dni robocze.'; okEl.className = 'text-emerald-700 text-[14px]';
    } catch (err) { okEl.textContent = (err.message || 'Nie udało się wysłać.') + ' Możesz też napisać na kontakt@aiprints.pl lub zadzwonić: 609 040 274.'; okEl.className = 'text-red-700 text-[14px]'; }
    btn.disabled = false; btn.textContent = t;
  };
  const fi = form.querySelector('input[type=file]'); if (fi) fi.onchange = () => { const s = fi.nextElementSibling; if (s && fi.files.length) s.textContent = `📎 ${fi.files.length} ${fi.files.length === 1 ? 'plik' : 'pliki'}: ${[...fi.files].map((f) => f.name).join(', ').slice(0, 80)}`; };
}
