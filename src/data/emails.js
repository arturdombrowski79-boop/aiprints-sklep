// Szablony maili transakcyjnych AiPrints.pl.
// Te same szablony eksportuje tools/emails.mjs do katalogu emails/ (HTML z polami {{…}}) dla backendu PHP na LH.pl.
// Nadawca: zamowienia@aiprints.pl, odpowiedź (Reply-To): kontakt@aiprints.pl. Kopia każdego maila → archiwum (dowód doręczenia).

// link do opinii w wizytówce Google (Menedżer profilu → Poproś o opinie)
export const GOOGLE_REVIEW = 'https://g.page/r/CSmfvq_Mlh6gEBM/review';
const greview = `<p style="font-size:13.5px;color:#5c6064">Po odbiorze będziemy wdzięczni za krótką opinię w Google – każda pomaga małej pracowni: <a href="${GOOGLE_REVIEW}" style="color:#121110">dodaj opinię</a>.</p>`;

export const SELLER = 'AiPrints.pl Artur Dombrowski, ul. Okrężna 98B, 41-500 Chorzów, NIP 6262579694 · kontakt@aiprints.pl · tel. 609 040 274';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const btn = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0"><tr><td style="background:#121110;border-radius:999px"><a href="${href}" style="display:inline-block;padding:14px 26px;color:#fff;text-decoration:none;font-weight:600;font-size:15px">${label}</a></td></tr></table>`;
const box = (html) => `<div style="background:#f2f3f3;border-radius:16px;padding:16px 18px;margin:18px 0;font-size:14px;line-height:1.55">${html}</div>`;

// wspólny układ: tabela 600 px, style inline (Gmail, Outlook, Apple Mail)
export function layout({ title, pre = '', body }) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#e7e9ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#121110">
<span style="display:none;max-height:0;overflow:hidden">${esc(pre)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:22px">
<tr><td style="padding:26px 32px 0"><b style="font-size:20px;letter-spacing:-.02em">AiPrints<span style="color:#b08a3e">.pl</span></b></td></tr>
<tr><td style="padding:8px 32px 30px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:18px 32px 26px;border-top:1px solid #dfe2e4;font-size:12px;line-height:1.5;color:#5c6064">${SELLER}<br>Ta wiadomość dotyczy Twojego zamówienia, dlatego wysyłamy ją bez względu na zgody marketingowe.</td></tr>
</table></td></tr></table></body></html>`;
}

const zl = (v) => typeof v === 'string' ? v : (Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '') + ' zł';
// tryb szablonu dla serwera (d.__tpl): pola {{…}} i bloki <!--ITEMS-->, <!--DISC-->, <!--RET-->, <!--BRK--> obsługuje api/lib.php
const blk = (d, name, html) => d.__tpl ? `<!--${name}-->${html}<!--/${name}-->` : html;
export const persNote = (pers) => `<span style="font-size:12.5px;color:${pers ? '#7a5600' : '#1f6b46'}">${pers ? '✎ Wykonany na Twoje zamówienie (personalizacja, Twoje pliki lub wymiary) – bez prawa odstąpienia (art. 38 ust. 1 pkt 3 u.p.k.)' : '↺ Bez personalizacji – 14 dni na odstąpienie od umowy'}</span>`;
const items = (d) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:14px 0">${blk(d, 'ITEMS', d.items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eceef0"><b>${esc(i.title)}</b><br><span style="color:#5c6064">${esc(i.lines.join(' · '))}${i.lines.length && !d.__tpl ? ' · ' : ''}${i.qty} szt. × ${zl(i.price)}</span><br>${i.persHtml ?? persNote(i.pers)}</td><td align="right" valign="top" style="padding:10px 0;border-bottom:1px solid #eceef0;white-space:nowrap"><b>${zl(i.sum ?? i.price * i.qty)}</b></td></tr>`).join(''))}
<tr><td style="padding:10px 0 2px;color:#5c6064">Dostawa: ${esc(d.delivery)}</td><td align="right" style="color:#5c6064">${zl(d.ship)}</td></tr>
${d.disc ? blk(d, 'DISC', `<tr><td style="color:#5c6064">Rabat</td><td align="right" style="color:#5c6064">−${zl(d.disc)}</td></tr>`) : ''}
<tr><td style="padding-top:8px;font-size:17px"><b>Razem (z VAT)</b></td><td align="right" style="padding-top:8px;font-size:17px;white-space:nowrap"><b>${zl(d.total)}</b></td></tr></table>`;

export const TEMPLATES = {
  potwierdzenie: {
    name: 'Potwierdzenie zamówienia (umowy)', when: 'zaraz po opłaceniu', attach: ['Regulamin-AiPrints.pdf (wersja z dnia zamówienia)', 'Formularz-odstapienia.pdf – gdy w zamówieniu jest produkt bez personalizacji'],
    subject: (d) => `Zamówienie ${d.no} przyjęte – potwierdzenie`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 4px">Dziękujemy, ${esc(d.first)}!</h1><p style="margin:0;color:#5c6064">Zamówienie <b style="color:#121110">${d.no}</b> z ${d.date} · zapłacono: ${esc(d.pay)}</p>${items(d)}
${box(`<b>Co dalej?</b><br>${(d.__tpl || d.items.some((i) => i.pers)) ? blk(d, 'PRS', `1. Do ${d.proofBy} wyślemy podgląd projektu do akceptacji.<br>2. Produkcję zaczynamy dopiero po Twojej akceptacji – poprawki są bezpłatne.<br>3. Wysyłka zwykle ${d.lead} od akceptacji.`) : ''}${d.__tpl ? blk(d, 'FIL', `1. Sprawdzimy Twoje pliki (rozdzielczość, kolory, spady) – jeśli coś będzie wymagało poprawy, napiszemy przed drukiem.<br>2. Realizacja zwykle ${d.lead}.<br>3. Napiszemy, gdy zamówienie będzie wysłane lub gotowe do odbioru.`) : ''}${(d.__tpl || !d.items.some((i) => i.pers)) ? blk(d, 'GEN', `1. Przygotujemy Twoje zamówienie – zwykle w ${d.lead}.<br>2. Napiszemy, gdy będzie wysłane lub gotowe do odbioru.`) : ''}${d.breakNote ? blk(d, 'BRK', `<br><br>${esc(d.breakNote)}`) : ''}`)}
${d.__tpl ? blk(d, 'UPL', `<p style="font-size:14px"><b>Pliki do zamówienia:</b> zdjęcia i pliki do druku prześlesz (albo dodasz kolejne) tutaj – bez limitu liczby, do 2 GB na plik:</p>${btn(d.upload, 'Prześlij pliki')}`) : ''}<p style="font-size:14px"><b>Adres dostawy:</b> ${esc(d.address)}<br><b>Dokument sprzedaży:</b> ${d.nip ? 'faktura VAT na NIP ' + esc(d.nip) : 'faktura / dowód zakupu e-mailem'}</p>
${d.__tpl || d.items.some((i) => !i.pers) ? blk(d, 'RET', `<p style="font-size:14px"><b>Odstąpienie od umowy:</b> produkty oznaczone ↺ możesz zwrócić w ciągu 14 dni od odbioru bez podania przyczyny – przyciskiem <a href="https://aiprints.pl/zwroty-i-reklamacje?nr=${d.no}#odstap" style="color:#121110">Odstąp od umowy tutaj</a>, mailem lub na formularzu z załącznika.</p>`) : ''}
<p style="font-size:14px"><b>Reklamacje</b> przysługują przy wszystkich produktach, także personalizowanych: reklamacje@aiprints.pl. W załączniku przesyłamy regulamin w wersji obowiązującej w dniu zamówienia.</p>
${btn(`https://aiprints.pl/konto#zamowienie/${d.no}`, 'Zobacz zamówienie')}`,
  },
  projekt: {
    name: 'Projekt do akceptacji', when: 'gdy wgrasz podgląd w panelu',
    subject: (d) => `Twój projekt jest gotowy – zamówienie ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Sprawdź swój projekt</h1><p>Przygotowaliśmy podgląd do zamówienia <b>${d.no}</b>. Sprawdź pisownię, daty i kadrowanie – grawer i druk wykonamy dokładnie według tego, co zaakceptujesz.</p>
<img src="${d.proofImg}" alt="Podgląd projektu" width="536" style="width:100%;border-radius:16px;margin:10px 0">
${btn(`https://aiprints.pl/konto#zamowienie/${d.no}`, 'Akceptuję albo zgłaszam poprawkę')}<p style="font-size:13.5px;color:#5c6064">Poprawki przed akceptacją są bezpłatne. Jeśli nie odpiszesz w ciągu 3 dni roboczych, przypomnimy się – produkcji bez akceptacji nie zaczynamy.</p>`,
  },
  produkcja: {
    name: 'Projekt zaakceptowany – w produkcji', when: 'po akceptacji klienta',
    subject: (d) => `Zaczynamy produkcję – zamówienie ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Projekt zaakceptowany ✓</h1><p>Dziękujemy! Zamówienie <b>${d.no}</b> trafiło do pracowni. Planowana wysyłka: <b>${d.shipBy}</b>. Numer przesyłki wyślemy, gdy paczka wyjedzie.</p>`,
  },
  wyslane: {
    name: 'Paczka wysłana (tracking)', when: 'po nadaniu w Apaczce',
    subject: (d) => `Twoja paczka jest w drodze – ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Paczka wyjechała z pracowni</h1><p>${esc(d.carrier)} · numer przesyłki <b>${esc(d.tracking)}</b></p>${btn(d.trackUrl, 'Śledź przesyłkę')}<p style="font-size:13.5px;color:#5c6064">Przy odbiorze sprawdź paczkę. Jeśli coś jest uszkodzone, zrób zdjęcie i napisz na reklamacje@aiprints.pl – wymienimy produkt.</p>${greview}`,
  },
  odbior: {
    name: 'Gotowe do odbioru', when: 'przy odbiorze w pracowni, gdy zamówienie jest gotowe',
    subject: (d) => `Zamówienie ${d.no} gotowe do odbioru`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Gotowe – zapraszamy po odbiór</h1><p>Cześć ${esc(d.first)}! Zamówienie <b>${d.no}</b> czeka na Ciebie w pracowni: <b>Chorzów, ul. Okrężna 98B</b>.</p><p style="font-size:14px">Przed przyjazdem zadzwoń: <b>609 040 274</b> – upewnimy się, że ktoś będzie na miejscu. Przy odbiorze podaj numer zamówienia.</p>${greview}`,
  },
  faktura: {
    name: 'Faktura', when: 'po wystawieniu (program do faktur / KSeF)', attach: ['Faktura-{{nr}}.pdf'],
    subject: (d) => `Faktura ${d.invoice} do zamówienia ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Faktura w załączniku</h1><p>Przesyłamy fakturę <b>${d.invoice}</b> do zamówienia <b>${d.no}</b>.${d.nip ? ' Faktura dla firmy została też wysłana do KSeF – numer KSeF: ' + esc(d.ksef) + '.' : ''}</p>`,
  },
  doreczone: {
    name: 'Doręczone + prośba o opinię', when: '3 dni po doręczeniu',
    subject: (d) => `Jak Ci się podoba? – ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Mamy nadzieję, że prezent zrobił wrażenie</h1><p>Twoje zamówienie <b>${d.no}</b> zostało doręczone. Jeśli masz minutę – napisz, jak wyszło. Opinie przyjmujemy tylko od osób, które kupiły produkt, i publikujemy także te krytyczne.</p>${btn(d.reviewUrl, 'Dodaj opinię')}<p style="font-size:13.5px;color:#5c6064">Link jest jednorazowy i działa 30 dni. Coś jest nie tak? Odpisz na tego maila.</p>`,
  },
  odstapienie: {
    name: 'Potwierdzenie odstąpienia od umowy', when: 'od razu po kliknięciu „Potwierdzam odstąpienie”',
    subject: (d) => `Otrzymaliśmy Twoje odstąpienie od umowy – ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Oświadczenie przyjęte</h1><p>${d.date} otrzymaliśmy Twoje oświadczenie o odstąpieniu od umowy w zamówieniu <b>${d.no}</b> w zakresie: <b>${esc(d.scope)}</b>.</p>
${box('<b>Odeślij produkt</b> w ciągu 14 dni na adres: AiPrints.pl, ul. Okrężna 98B, 41-500 Chorzów. Koszt odesłania pokrywasz Ty, chyba że regulamin stanowi inaczej.<br><br><b>Zwrot pieniędzy</b> – w ciągu 14 dni od dziś, tą samą metodą płatności. Możemy wstrzymać zwrot do czasu otrzymania produktu lub dowodu jego odesłania.')}`,
  },
  reklamacja: {
    name: 'Reklamacja przyjęta', when: 'po zgłoszeniu reklamacji',
    subject: (d) => `Reklamacja ${d.rma} przyjęta – zamówienie ${d.no}`,
    body: (d) => `<h1 style="font-size:24px;margin:10px 0 8px">Przyjęliśmy reklamację</h1><p>Numer zgłoszenia: <b>${d.rma}</b>. Odpowiemy najpóźniej do <b>${d.answerBy}</b> (14 dni), zwykle w 1–2 dni robocze. Jeśli trzeba odesłać produkt, prześlemy etykietę – nie płacisz za wysyłkę reklamacyjną.</p>`,
  },
};

// dane przykładowe do podglądu w panelu
export const SAMPLE = {
  no: 'AP-26042', first: 'Anna', date: '23.11.2026', pay: 'BLIK', delivery: 'InPost Paczkomat CHO01M', ship: 14.99, disc: 0, total: 152.99,
  address: 'Anna Kowalska, ul. Przykładowa 1/2, 41-500 Chorzów', nip: '', proofBy: '25.11.2026', lead: '5–10 dni roboczych', shipBy: '3.12.2026',
  breakNote: 'Pracownia ma przerwę 21.12–7.01. Zamówienia z tego okresu realizujemy od 8 stycznia.',
  items: [{ title: 'Etui na telefon z Twoim zdjęciem (druk UV)', lines: ['projekt z kreatora', 'Pudrowy róż'], qty: 1, price: 59, pers: true }, { title: 'Tumbler 20 oz – Brick Red', lines: ['bez graweru'], qty: 1, price: 79, pers: false }],
  proofImg: 'https://aiprints.pl/img/hf/etui-telefon-uv-1.jpg', carrier: 'InPost', tracking: '620123456789012345678901', upload: 'https://aiprints.pl/pliki?no=AP-26042&t=abc', trackUrl: 'https://inpost.pl/sledzenie-przesylek?number=620123456789012345678901',
  invoice: 'FV 42/11/2026', ksef: '—', reviewUrl: 'https://aiprints.pl/opinia?t=…', scope: 'Tumbler 20 oz – Brick Red', rma: 'R-2611-07', answerBy: '7.12.2026',
};

export const render = (id, d = SAMPLE) => { const t = TEMPLATES[id]; return { subject: t.subject(d), html: layout({ title: t.subject(d), pre: t.name, body: t.body(d) }) }; };
