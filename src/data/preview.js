// Podgląd na żywo: strefy w % szerokości/wysokości zdjęcia głównego.
export const PREVIEW = {
  'krysztal-zdjecie': { img: 'img/f/krysztal-para.jpg', ratio: '1408/768', photo: { l: 31.2, t: 21.5, w: 39.4, h: 55.5 }, text: { x: 50.8, y: 73.6, size: 1.9, color: '#f4f1ea', blend: 'screen', font: 'serif', ph: 'Anna i Tomek · 2026' } },
  'krysztal-slub': { img: 'img/f/krysztal-para.jpg', ratio: '1408/768', photo: { l: 31.2, t: 21.5, w: 39.4, h: 55.5 }, text: { x: 50.8, y: 73.6, size: 1.9, color: '#f4f1ea', blend: 'screen', font: 'serif', ph: 'Anna i Tomek · 14.06.2026' } },
  'koperta-drewniana': { img: 'img/f/koperta-drewniana.jpg', ratio: '1408/768', text: { x: 50.6, y: 36.4, size: 2.9, color: '#6e4420', blend: 'multiply', font: 'script', ph: 'Ania' } },
  'bombka-akryl-zloty': { img: 'img/f/bombka-zlota.jpg', ratio: '1408/768', text: { x: 50.4, y: 60.6, size: 2.6, color: '#7a5a16', blend: 'multiply', font: 'script', ph: 'Zosia' } },
};
export const RECIPIENTS = [
  ['dla-niej', 'Dla niej', 'Prezenty personalizowane dla niej – biżuteria z grawerem, kryształy ze zdjęciem, akryle z piosenką i dekoracje z imieniem.', /naszyjnik|bransolet|krysztal-zdjecie|swieca|poduszka|akryl-piosenka|akryl-polaroid|zdjecie-na|lupek|etui-telefon|puzzle-akryl|litofania|szklo-ramka|kieliszki/],
  ['dla-niego', 'Dla niego', 'Prezenty z grawerem dla niego – karafki, szklanki do whisky, deski, breloki i nieśmiertelniki.', /kufel|whisky|karafka|deska|brelok-drewno|niesmiertelnik|tablica-rejestracyjna|etui-grawer|dlugopisy|kubek-termiczny|tumbler|skrzynka-wino/],
  ['dla-pary', 'Dla pary', 'Na rocznicę, walentynki i ślub – kryształy ze wspólnym zdjęciem, mapa nieba z dnia, w którym się poznaliście, i akryle z Waszą piosenką.', /krysztal-zdjecie|krysztal-slub|mapa-nieba|mapa-poznalismy|nasza-data|piosenka|kieliszki|puzzle-akryl|maz-zona|okladka-magazynu|akryl-bilet/],
  ['dla-dziecka', 'Dla dziecka', 'Prezenty z imieniem dziecka – inicjały na ścianę, bidony, książeczki, tablice do nauki pisania i zabawki 3D.', /inicjal|bidon|ksiazeczka|nauka-imienia|naklejki-scienne|lamibook|smok|kliker|puzzle-imie|brelok-3d|figurka|ruchomy|pchac/],
  ['dla-pupila', 'Dla pupila', 'Dla właścicieli psów i kotów – adresówki z grawerem, sylwetki z imieniem, portrety i kryształy ze zdjęciem pupila.', /pupil|psa|adresowka/],
];
const T = (x, y, size, o = {}) => ({ x, y, size, color: '#5a3a1c', blend: 'multiply', font: 'script', ...o });
Object.assign(PREVIEW, {
  'deska-do-krojenia': { img: 'img/hf/deska-do-krojenia-1.jpg', ratio: '4/3', text: T(50.5, 50, 3.6, { ph: 'Kuchnia Babci Basi', color: '#4a2c12' }) },
  'numer-domu': { img: 'img/hf/numer-domu-1.jpg', ratio: '4/3', text: T(44.5, 55, 9, { ph: '24', color: '#ffffff', blend: 'normal', font: 'sans', weight: 700, shadow: 'none' }) },
  'niesmiertelnik': { img: 'img/hf/niesmiertelnik-1.jpg', ratio: '4/3', text: T(44, 47, 2.8, { ph: 'Tata', color: '#3c3c3c', font: 'serif', rotate: 22 }) },
  'naszyjnik-grawer': { img: 'img/hf/naszyjnik-grawer-1.jpg', ratio: '4/3', text: T(46.8, 58.5, 3.2, { ph: 'Zosia', color: '#6d5210' }) },
  'karafka-grawer': { img: 'img/hf/karafka-grawer-1.jpg', ratio: '4/3', text: T(50, 60, 5, { ph: 'AK', color: 'rgba(255,255,255,.8)', blend: 'normal', font: 'serif', shadow: '0 0 .2cqw rgba(0,0,0,.35)' }) },
  'szklanki-whisky': { img: 'img/hf/szklanki-whisky-1.jpg', ratio: '4/3', texts: [[34.5, 66], [65.5, 66]], text: T(0, 0, 2.8, { ph: 'Marek', color: 'rgba(255,255,255,.85)', blend: 'normal', shadow: '0 0 .2cqw rgba(0,0,0,.4)' }) },
  'sylwetka-psa': { img: 'img/hf/sylwetka-psa-1.jpg', ratio: '4/3', text: T(51.5, 76, 1.5, { ph: 'Luna', color: '#3b2410', font: 'serif' }) },
  'adresowka-psa': { img: 'img/hf/adresowka-psa-1.jpg', ratio: '4/3', text: T(64.2, 82, 1.5, { ph: 'Burek', color: '#3c3c3c', font: 'serif' }) },
  'tablica-wejscie-zarzadca': { img: 'img/hf/tablica-wejscie-zarzadca-1.jpg', ratio: '4/3', text: T(70, 46, 2.2, { ph: 'Wspólnota Mieszkaniowa', color: '#22262b', font: 'sans', weight: 600, blend: 'multiply', wrap: 14 }) },
  'termos-logo': { img: 'img/hf/termos-logo-1.jpg', ratio: '4/3', texts: [[35.5, 57], [50.5, 57], [66.3, 57]], text: T(0, 0, 1.2, { ph: 'TEAM', color: '#d9dde2', blend: 'screen', font: 'sans', weight: 700 }) },
  'mapa-nieba': { img: 'img/hf/mapa-nieba-1.jpg', ratio: '4/3', stars: { x: 50, y: 30.5, d: 15.8 }, text: T(50, 46, 1.0, { ph: 'Kraków · 14.06.2019', color: '#ffffff', blend: 'normal', font: 'serif' }) },
  'poduszka-zdjecie': { img: 'img/hf/poduszka-zdjecie-1.jpg', ratio: '4/3', photo: { l: 31, t: 33, w: 38, h: 50, blend: 'multiply', mask: false } },
  'obraz-plotno': { img: 'img/hf/obraz-plotno-1.jpg', ratio: '4/3', photo: { l: 40, t: 8, w: 25, h: 38, blend: 'multiply', mask: false } },
});
