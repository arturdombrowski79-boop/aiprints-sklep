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
// Dłuższe opisy wybranych produktów (akapity między nazwą a informacją o realizacji).
const EXTRA = {
  'oznakowanie-gabinetu': [
    'Podstawowe oznakowanie gabinetu kosmetycznego i gabinetu z laserem: zakaz palenia tytoniu i e-papierosów (przy wejściu lub recepcji, 15×20 cm), apteczka pierwszej pomocy (nad apteczką, 15×15 cm), instrukcja udzielania pierwszej pomocy z numerami 112 i 999 oraz listą osób przeszkolonych (przy apteczce, A4), ostrzeżenie o promieniowaniu laserowym (na drzwiach gabinetu, A4), nakaz stosowania okularów ochronnych (drzwi i stanowisko lasera, 10×10 cm) i etykiety odpadów medycznych na pojemniki i worki (ok. 10×15 cm). Tabliczki wykonujemy na PCV 1 mm albo na plexi 3 mm z nadrukiem UV.',
    'Na tablicy przy laserze umieszczamy tekst: „UWAGA! PROMIENIOWANIE LASEROWE. Wstęp podczas wykonywania zabiegu wyłącznie dla osób upoważnionych. Obowiązek stosowania odpowiednio dobranych okularów ochronnych.” oraz klasę lasera i długość fali – przepisujemy je dokładnie z instrukcji lub tabliczki znamionowej Twojego urządzenia (prześlij jej zdjęcie), nigdy z domysłu. To, czy trzeba wyznaczyć i oznakować strefę laserową, zależy od oceny ryzyka w gabinecie.',
  ],
  'pieczatki-firmowe': [
    'Pieczątki dla firm, gabinetów, szkół i wspólnot: firmowe z nazwą, adresem i NIP, imienne (lekarz, kosmetolog, nauczyciel), okrągłe, kieszonkowe i datowniki. Gumkę grawerujemy laserem w naszej pracowni, więc tekst i logo są ostre nawet przy małych literach.',
    'Wpisz treść pieczątki (linia po linii) albo prześlij logo – przed wykonaniem wyślemy projekt odcisku do akceptacji. Kolor tuszu do wyboru: niebieski, czarny, czerwony, zielony, fioletowy. Zużytą gumkę w Twojej obudowie wymienimy na nową.',
  ],
  'oznakowanie-higieniczne-gabinetu': [
    'Na każde stanowisko zabiegowe – tabliczka A5 „BEZPIECZEŃSTWO I HIGIENA: Narzędzia, sprzęt, przybory i akcesoria używane podczas zabiegu są czyste, zdezynfekowane, a jeżeli jest to wymagane – wysterylizowane. Pakiety sterylne otwieramy bezpośrednio przed zabiegiem w obecności klienta.” Taką informację przy stanowisku pracy wskazują aktualne zalecenia GIS dla gabinetów.',
    'W komplecie także: instrukcja higienicznego mycia rąk (A4 nad umywalką) i higienicznej dezynfekcji rąk (A4 przy dozowniku); oznaczenia stref: brudna – narzędzia użyte, czysta – narzędzia umyte i zdezynfekowane, sterylna – pakiety po sterylizacji; tabliczki: pakiety sterylne – przechowywać w suchym i zamkniętym miejscu, narzędzia jednorazowe, bielizna czysta, bielizna brudna, środki czystości i preparaty chemiczne – dostęp tylko dla personelu; tabliczki na drzwi: pomieszczenie gospodarcze, zaplecze personelu, WC.',
    'Dwie wersje: PCV 1 mm z nadrukiem (ekonomiczna, lekka, zmywalna) albo plexi 3 mm z nadrukiem UV na dystansach lub taśmie (elegancka, do recepcji i gabinetów). Wszystko w jednym stylu z logo i kolorami salonu. Liczbę stanowisk podaj w uwagach – tabliczkę A5 dostaje każde stanowisko. Wymagania sanepidu mogą się różnić – przed zamówieniem warto potwierdzić listę z inspektorem.',
  ],
};
export function describe(p, catName) {
  const b2b = B2B.includes(p.cat);
  const a = `${p.name}${p.variants ? ' – ' + p.variants.charAt(0).toLowerCase() + p.variants.slice(1) : ''}.`;
  const b = p.kind === 'files'
    ? `Drukujemy z Twoich plików: wybierasz je tutaj (do 2 GB na plik), wgrywasz po zakupie z linku w mailu albo podajesz link do Dysku Google czy WeTransfer.${p.many ? ' Potrzebne: ' + p.many + '.' : ''} Przed drukiem sprawdzamy każdy plik – rozdzielczość, spady, kolory i kadr. Jeśli coś trzeba poprawić albo plik trzeba przyciąć do wymiaru, przed produkcją wyślemy Ci podgląd do akceptacji; gdy plik jest gotowy do druku, od razu drukujemy. Realizacja zwykle 2–7 dni roboczych.`
    : p.kind === 'ready'
    ? 'Gotowy produkt z naszej pracowni – wysyłamy zwykle w 1–3 dni robocze. Bez personalizacji możesz go zwrócić w ciągu 14 dni.'
    : b2b
    ? 'Przygotujemy projekt według Twoich danych i logo, a przed produkcją wyślemy go do akceptacji. Przy kolejnych zamówieniach korzystamy z tego samego szablonu, więc nie płacisz drugi raz za projekt. Wystawiamy fakturę VAT.'
    : 'Po zamówieniu przygotujemy projekt i wyślemy go do akceptacji na e-mail. Produkcję zaczynamy dopiero, gdy go zatwierdzisz – poprawki przed akceptacją są bezpłatne. Wykonanie trwa zwykle 5–10 dni roboczych od akceptacji.';
  return [a, ...(EXTRA[p.slug] || []), b];
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
