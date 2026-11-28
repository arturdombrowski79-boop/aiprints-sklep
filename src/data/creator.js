// Konfiguracja kreatora produktów.
// area: pole nadruku w % obrazu makiety (x, y, w, h); mm: fizyczny wymiar pola (szer., wys.)
// mode: print = pełny kolor (UV / DTF / sublimacja), laser = grawer (jeden kolor), frost = grawer w szkle
const GARMENT = [
  ['Biały', '#ffffff'], ['Czarny', '#1d1d1f'], ['Granatowy', '#1f2a44'], ['Szary melanż', '#9a9da1'], ['Czerwony', '#c8102e'],
  ['Butelkowa zieleń', '#1f4d3a'], ['Pudrowy róż', '#e8b4b8'], ['Błękitny', '#8ec5e8'], ['Żółty', '#f6c945'],
];
const TUMBLER = [['Biały', '#ffffff'], ['Czarny', '#232325'], ['Granatowy', '#24324f'], ['Miętowy', '#a8dcc8'], ['Różowy', '#f2b8c6'], ['Grafitowy', '#55585c']];
const PLATE = [['Biały akryl', '#ffffff'], ['Czarny akryl', '#151515'], ['Złote lustro', '#d4ab45'], ['Srebrne lustro', '#c3c7cc'], ['Grafit', '#4a4d52']];
const CASE = [['Biały', '#ffffff'], ['Czarny', '#1d1d1f'], ['Pudrowy róż', '#e8b4b8'], ['Miętowy', '#a8dcc8'], ['Lawendowy', '#c9b8e6'], ['Granatowy', '#24324f']];
const MUG = [['Biały', '#ffffff'], ['Czarny', '#232325'], ['Różowy', '#f2b8c6'], ['Błękitny', '#9fd0ee'], ['Miętowy', '#a8dcc8']];

const tee = { mock: true, colors: GARMENT, sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], mode: 'print',
  sides: [{ id: 'front', name: 'Przód', img: 'img/mk/koszulka-przod.webp', area: [32, 24, 36, 46], mm: [280, 360] },
          { id: 'back', name: 'Tył', img: 'img/mk/koszulka-tyl.webp', area: [31, 18, 38, 50], mm: [300, 400], extra: 20 }] };
const hoodie = { mock: true, colors: GARMENT, sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], mode: 'print',
  sides: [{ id: 'front', name: 'Przód', img: 'img/mk/bluza-przod.webp', area: [35, 29, 30, 25], mm: [250, 210] },
          { id: 'back', name: 'Tył', img: 'img/mk/bluza-tyl.webp', area: [32, 30, 36, 42], mm: [300, 350], extra: 25 }] };
const tumbler = (mode) => ({ mock: true, colors: TUMBLER, mode, ink: mode === 'laser' ? '#cfd3d7' : null,
  sides: [{ id: 'front', name: 'Przód', img: 'img/mk/tumbler.webp', area: [35, 24, 30, 54], mm: [70, 130] }] });
const plate = { mock: true, colors: PLATE, mode: 'print', bg: 'linear-gradient(180deg,#e9eaeb,#d9dadc)',
  sides: [{ id: 'front', name: 'Tabliczka', img: 'img/mk/tabliczka.webp', area: [12, 24, 76, 52], mm: [300, 200] }] };
const round = { mock: true, colors: PLATE, mode: 'print', bg: 'linear-gradient(180deg,#e9eaeb,#d9dadc)',
  sides: [{ id: 'front', name: 'Szyld', img: 'img/mk/szyld-okragly.webp', area: [14, 14, 72, 72], mm: [500, 500], clip: 'circle' }] };

const BG = 'linear-gradient(180deg,#eef0f1,#dfe2e4)';
const STEEL = '#3d4043', WOOD = '#4a2a12';
const one = (img, area, mm, o = {}) => ({ bg: BG, mask: true, ...o, sides: [{ id: 'front', name: o.name || 'Przód', img: 'img/mk/' + img + '.webp', area, mm, ...(o.clip ? { clip: o.clip } : {}) }] });

export const CREATOR = {
  'koszulka-z-nadrukiem': { ...tee, colors: [['Biały', '#ffffff']] }, // 28.11: sublimacja – tylko biała poliestrowa, nadruk do 40×60 cm
  'bluza-z-nadrukiem': hoodie,
  // 28.11: odzież z folii flex i sublimacja – kreator do własnego projektu (flex = jeden kolor folii; projekt i tak idzie do akceptacji)
  'koszulka-firmowa-flex': tee, 'koszulka-logo-imie-flex': tee, 'bluza-firmowa-flex': hoodie, 'koszulka-sportowa-sublimacja': tee,
  'kubek-z-nadrukiem': { mock: true, colors: MUG, mode: 'print', sides: [{ id: 'front', name: 'Przód', img: 'img/mk/kubek.webp', area: [13, 28, 46, 42], mm: [90, 80] }] },
  'tumbler-uv-kolor': tumbler('print'),
  'termos-logo': tumbler('laser'),
  'kubek-termiczny-grawer': tumbler('laser'),
  'tabliczka-drzwi': plate, 'tabliczka-logo-salon': plate, 'tabliczka-adres-dystanse': plate, 'tabliczka-scienna-qr': plate, 'tabliczki-pomieszczenia': plate,
  'szyld-okragly-logo': round, 'szyld-okragly-led': round,
  // etui, foto, drewno, stal (makiety bez tła, projekt przycinany do kształtu produktu)
  'etui-telefon-uv': one('etui-bialy', [29.8, 8, 40.5, 84], [75, 156], { mock: true, colors: CASE, mode: 'print', name: 'Tył etui' }),
  'etui-grawer': one('etui-drewno', [28.7, 8, 42.6, 84], [76, 150], { mode: 'laser', ink: WOOD, name: 'Tył etui' }),
  'bidon-dziecko-uv': one('bidon', [37, 32, 25.6, 52], [70, 142], { mock: true, colors: TUMBLER, mode: 'print', name: 'Bidon' }),
  'tabliczka-wc-kwadrat': { ...one('tabliczka-kw', [14, 14, 72, 72], [150, 150], { mock: true, colors: PLATE, mode: 'print', name: 'Tabliczka' }) },
  'tabliczka-przedszkole': plate,
  'poduszka-zdjecie': one('poduszka', [14, 14, 72, 72], [380, 380], { mode: 'print', blend: 'multiply', name: 'Poszewka' }),
  'obraz-plotno': one('plotno', [19, 11.7, 53.6, 71.5], [300, 400], { mode: 'print', blend: 'multiply', name: 'Płótno' }),
  'fotopanel-aluminium': one('fotopanel', [8, 20.6, 84, 58.8], [300, 210], { mode: 'print', name: 'Fotopanel' }),
  'puzzle-zdjecie': one('puzzle', [8, 18.4, 84, 63.1], [280, 210], { mode: 'print', blend: 'multiply', name: 'Puzzle' }),
  'zdjecie-na-drewnie': one('sklejka', [8, 17.6, 84, 64.8], [300, 231], { mode: 'print', blend: 'multiply', name: 'Deska' }),
  'lupek-zdjecie': one('lupek', [12, 25, 76, 50], [300, 197], { mode: 'print', defColor: '#ffffff', name: 'Łupek' }),
  'podkladki-zestaw': one('podkladka', [12, 12, 76, 76], [95, 95], { mode: 'laser', ink: WOOD, clip: 'circle', name: 'Podkładka' }),
  'pudelko-grawer': one('pudelko', [12, 21, 76, 58], [250, 190], { mode: 'laser', ink: WOOD, name: 'Wieczko' }),
  'brelok-drewno-skora': one('brelok-drewno', [47, 40, 41, 17.5], [56, 24], { mode: 'laser', ink: WOOD, zoom: 1.5, name: 'Brelok' }),
  'adresowka-psa': one('adresowka', [22, 40, 56, 34], [33, 20], { mode: 'laser', ink: STEEL, name: 'Adresówka' }),
  'niesmiertelnik': one('niesmiertelnik', [37, 45, 25, 41], [26, 43], { mode: 'laser', ink: STEEL, zoom: 1.6, name: 'Blaszka' }),
  'bransoletka-stal': one('bransoletka', [18, 45.5, 68, 9], [48, 6.4], { mode: 'laser', ink: STEEL, zoom: 1.4, name: 'Blaszka' }),
  // produkty na prawdziwych zdjęciach (bez zmiany koloru)
  'deska-do-krojenia': { mode: 'laser', ink: '#4a2a12', sides: [{ id: 'front', name: 'Deska', img: 'img/hf/deska-do-krojenia-1.jpg', area: [36, 30, 28, 42], mm: [180, 200] }] },
  'naszyjnik-grawer': { mode: 'laser', ink: '#4b3510', zoom: 3.2, sides: [{ id: 'front', name: 'Zawieszka', img: 'img/hf/naszyjnik-grawer-1.jpg', area: [59, 49.5, 11, 14.5], mm: [20, 20], clip: 'circle' }] },
  'karafka-grawer': { mode: 'frost', zoom: 2.2, sides: [{ id: 'front', name: 'Karafka', img: 'img/hf/karafka-grawer-1.jpg', area: [44, 58, 14, 18], mm: [70, 68] }] },
  'numer-domu': { mode: 'print', defColor: '#ffffff', sides: [{ id: 'front', name: 'Tabliczka', img: 'img/hf/numer-domu-1.jpg', area: [26, 35, 31, 27], mm: [300, 195] }] },
};

// nowe produkty z kreatorem (dokładane do katalogu)
export const CREATOR_PRODUCTS = [
  { slug: 'koszulka-z-nadrukiem', name: 'Koszulka z własnym nadrukiem', price: 69, variants: '9 kolorów, S–3XL, nadruk przód i tył', sub: 'Odzież i kubki' },
  { slug: 'bluza-z-nadrukiem', name: 'Bluza z kapturem z własnym nadrukiem', price: 149, variants: '9 kolorów, S–3XL, przód i tył', sub: 'Odzież i kubki' },
  { slug: 'kubek-z-nadrukiem', name: 'Kubek ceramiczny z nadrukiem', price: 45, variants: '330 ml, 5 kolorów, zdjęcie lub logo', sub: 'Odzież i kubki' },
];
