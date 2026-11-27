// Ustawienia sklepu – zmieniasz tutaj, przebudowujesz i gotowe.
export const SEASON = false;               // true = pokaż dział „Na święta” (np. od października 2027)
export const LEAD = '5–10 dni roboczych';   // czas wykonania po akceptacji projektu
export const PREVIEW = '2 dni robocze';     // do kiedy wysyłamy podgląd projektu
// Przerwa w pracy pracowni: komunikat pokazuje się automatycznie od `show` do `to`.
export const BREAK = { show: '2026-12-01', from: '2026-12-21', to: '2027-01-07', resume: '8 stycznia' };
// Statystyki i reklamy – wpisz identyfikatory, gdy założysz konta. Puste = nic się nie ładuje.
export const GA4_ID = 'G-R03DHVLXMW';      // np. 'G-XXXXXXXXXX' (Google Analytics 4 / Google Ads przez gtag)
export const ADS_ID = 'AW-18592432895';  // tag Google Ads (konwersja „Zakup” = wejście na /dziekujemy)
export const ADS_LEAD = 'AW-18592432895/11I2COmC2sAdEP-FyKFF';  // konwersja „Kontakt – telefon, WhatsApp, formularz” (27.11.2026)
export const META_PIXEL = '1459923272271488';  // np. '123456789012345'

// Promocja (Omnibus): przy obniżce pokazujemy najniższą cenę z 30 dni przed jej startem – liczona z data/price-history.json.
// Po `until` promocja znika sama (przebudowa sklepu o północy przez GitHub Actions + zabezpieczenie w przeglądarce).
// Uwaga: obniżka ma sens prawny dopiero, gdy produkt był wcześniej sprzedawany w cenie regularnej (min. 30 dni na żywej stronie).
export const PROMO = {
  on: true, pct: 5, from: '2026-11-23', until: '2026-12-31', name: 'Na koniec roku −5%',
  // 40 produktów o najwyższym zysku na godzinę pracy (data/baza-produktow.csv); bez cennika dla zarządców
  slugs: ["fine-art-druk", "krysztal-slub", "numery-stol-podstawka", "plakat-mapa-2d", "karafka-grawer", "fotopanel-aluminium", "lusterko-logo", "krysztal-zdjecie", "krysztal-pupil", "mapa-nieba", "numery-stol-lustro", "krysztal-pamiatkowy", "naszyjnik-grawer", "bransoletka-stal", "lupek-zdjecie", "jelen-sklejka", "statuetka-krysztal", "fototapeta", "puzzle-akryl-serce", "statuetka-3-kody", "tablica-nauka-imienia", "tabliczki-pomieszczenia", "odbitki-polaroid", "tablica-rejestracyjna", "napis-recepcja", "akryl-polaroid", "logo-lustro", "zestaw-higieniczny", "wc-komplet", "termos-logo", "swieca-szklo-imie", "podziekowania-rodzice", "wizytowki-lakier-3d", "wydruk-w-ramie", "wydruk-wystawowy", "koc-ze-zdjeciem", "portfolio-box", "kubek-magiczny", "plakat-wielkoformatowy"],
};

// profile w mediach społecznościowych (puste = ukryte); używane w stopce, na stronie kontakt i w danych dla Google (sameAs)
export const SOCIAL = { facebook: 'https://www.facebook.com/AIPrintsPL/', instagram: 'https://www.instagram.com/aiprints.pl/', tiktok: 'https://www.tiktok.com/@aiprints.pl', youtube: 'https://www.youtube.com/@aiprintspl' };
