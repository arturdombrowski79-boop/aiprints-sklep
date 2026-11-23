export const machineText = (m) => {
  const t = [];
  if (/UV 5|szkle/.test(m)) t.push(['Grawer laserowy we wnętrzu szkła', 'Laser xTool rysuje obraz punkt po punkcie w środku bryły. Grawer jest zamknięty w szkle – nie da się go zetrzeć ani zarysować.']);
  if (/MOPA/.test(m)) t.push(['Laser MOPA', 'Znakujemy stal i aluminium laserem MOPA. Grawer jest ciemny albo kolorowy, trwały i odporny na ścieranie.']);
  if (/CO₂|CO2/.test(m)) t.push(['Laser CO₂', 'Grawer jest wypalony w drewnie, skórze albo akrylu. Nie odpada i nie blaknie jak nadruk.']);
  if (/GoArt|UV A3/.test(m)) t.push(['Druk UV', 'Drukujemy na drukarce UV z białym poddrukiem i lakierem. Kolory są żywe, a nadruk odporny na wodę i zarysowania.']);
  if (/Latex/.test(m)) t.push(['HP Latex + ploter Summa', 'Druk wielkoformatowy farbami lateksowymi – bez zapachu, odporny na słońce i deszcz. Docinamy na ploterze Summa S3.']);
  if (/Bambu/.test(m)) t.push(['Druk 3D', 'Drukujemy na drukarkach Bambu Lab, także w kilku kolorach naraz. Każdy wydruk sprawdzamy i wykańczamy ręcznie.']);
  if (/Epson|P9500|D1000|F500/.test(m)) t.push(['Druk fotograficzny Epson', 'Profesjonalne drukarki fotograficzne i monitor Eizo z kalibracją – kolor na wydruku zgadza się z tym, co widzisz w projekcie.']);
  if (/Xerox/.test(m)) t.push(['Druk cyfrowy Xerox', 'Druk na papierach do 350 g z wykończeniem: bigowanie, zszywanie, broszurowanie.']);
  if (!t.length) t.push(['Pracownia AiPrints.pl', 'Projekt, produkcja i pakowanie w naszej pracowni w Chorzowie.']);
  return t;
};
export const B2B = ['dla-firm', 'wspolnoty-i-spoldzielnie', 'salony-beauty', 'druk-wielkoformatowy', 'szkoly-i-przedszkola'];
export function describe(p, catName) {
  const b2b = B2B.includes(p.cat);
  const a = `${p.name}${p.variants ? ' – ' + p.variants.charAt(0).toLowerCase() + p.variants.slice(1) : ''}.`;
  const b = b2b
    ? 'Przygotujemy projekt według Twoich danych i logo, a przed produkcją wyślemy go do akceptacji. Przy kolejnych zamówieniach korzystamy z tego samego szablonu, więc nie płacisz drugi raz za projekt. Wystawiamy fakturę VAT.'
    : 'Po zamówieniu przygotujemy projekt i wyślemy go do akceptacji na e-mail. Produkcję zaczynamy dopiero, gdy go zatwierdzisz – poprawki przed akceptacją są bezpłatne. Wykonanie trwa zwykle 5–10 dni roboczych od akceptacji.';
  return [a, b];
}
export const optionsOf = (p) => {
  if (p.tiers) return { label: p.tiers.every((t) => /^[SML]$/.test(t.k)) ? 'Rozmiar' : 'Wariant', opts: p.tiers.map((t) => ({ k: t.k, p: t.p })) };
  const seg = (p.variants || '').split(',').map((s) => s.trim()).find((s) => s.includes('/') && s.length < 48);
  if (!seg) return null;
  return { label: 'Wariant', opts: seg.split('/').map((s) => ({ k: s.trim(), p: null })).filter((o) => o.k) };
};
export const qtyTiers = (t) => [...(t || '').matchAll(/(\d+)\+\s*(\d+)/g)].map((m) => ({ q: +m[1], p: +m[2] }));

// produkty liczone za m² (fototapety, banery, folie): klient podaje wymiary w cm
export const isM2 = (p) => /zł\s*\/\s*m²/.test(p.priceText || '');
