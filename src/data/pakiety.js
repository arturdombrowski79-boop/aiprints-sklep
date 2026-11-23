// Pakiety fotograficzne (ceny brutto) – ustalone na podstawie cen lokalnej konkurencji (Chorzów/Katowice, XI 2026).
// Zmieniasz cenę tutaj ORAZ cenę „od” w tools/catalog.py (SVC_PRICE).
export const PAKIETY = {
  'zdjecia-do-dokumentow': { note: 'Dowód, paszport, prawo jazdy, legitymacja, wiza. Zgodnie z wymaganiami urzędów (35 × 45 mm).', p: [
    ['Zdjęcia do dokumentów', '30 zł', ['zdjęcie zgodne z wymaganiami urzędu', '4 odbitki 35 × 45 mm na papierze fotograficznym', 'plik cyfrowy do wniosku online w cenie', 'wydruk od ręki']],
    ['Dla rodziny', '25 zł / os.', ['od 3 osób w jednej wizycie', 'jak w pakiecie podstawowym']],
  ] },
  'sesja-portretowa': { note: 'Portret indywidualny, biznesowy, na CV i LinkedIn. Studio w pracowni lub plener.', p: [
    ['Mini LinkedIn / CV', '249 zł', ['ok. 30 minut w studiu', '3 zdjęcia z retuszem', 'wersje do LinkedIn, CV i strony www', '1 odbitka 13 × 18']],
    ['Portret Standard', '449 zł', ['ok. 1 godziny, 2 tła lub stylizacje', '6 zdjęć z retuszem', 'galeria online do wyboru', '3 odbitki 15 × 21 z naszej drukarni']],
    ['Zespół firmy', '69 zł / os.', ['od 5 osób, sesja u nas lub w firmie', '1 zdjęcie z retuszem na osobę', 'jednolite tło i światło dla całego zespołu', 'faktura VAT']],
  ] },
  'sesja-rodzinna': { note: 'W studiu, w plenerze albo u Was w domu – z dziećmi, dziadkami i zwierzakami.', p: [
    ['Rodzinna Standard', '499 zł', ['ok. 1 godziny', '8 zdjęć z retuszem', 'galeria online do wyboru', '8 odbitek 15 × 21 na papierze fotograficznym']],
    ['Rodzinna Premium', '799 zł', ['ok. 1,5 godziny, studio + plener', '15 zdjęć z retuszem', 'odbitki 15 × 21 wszystkich zdjęć', 'obraz na płótnie 40 × 60 z wybranego ujęcia']],
  ] },
  'sesja-plenerowa': { note: 'Narzeczeńska, okolicznościowa, ciążowa, z pupilem – w wybranym miejscu.', p: [
    ['Plener', '549 zł', ['1–1,5 godziny', '10 zdjęć z retuszem', 'galeria online do wyboru', 'dojazd do 20 km od Chorzowa w cenie']],
    ['Plener + album', '849 zł', ['jak Plener, 20 zdjęć z retuszem', 'fotoksiążka A5 ze zdjęciami z sesji']],
  ] },
  'fotografia-produktowa': { note: 'Do sklepu internetowego, Allegro, katalogu i social media. Faktura VAT.', p: [
    ['Packshot na białym tle', '35 zł / zdjęcie', ['1–30 zdjęć: 35 zł, 31–100: 29 zł, powyżej 100: 25 zł', 'białe tło, retusz podstawowy, korekta koloru', 'pliki do sklepu i na Allegro', 'minimalne zamówienie 250 zł']],
    ['Zdjęcia aranżowane', 'od 99 zł / zdjęcie', ['produkt w aranżacji lub w użyciu', 'pełny retusz', 'do reklam i social media']],
  ] },
  'fotografia-architektury': { note: 'Mieszkania, domy, lokale, hotele, biura i realizacje wykonawców.', p: [
    ['Mieszkanie', '449 zł', ['do ok. 60 m²', '15 zdjęć z korektą perspektywy', 'gotowe do ogłoszenia w 48 h']],
    ['Dom / lokal', '799 zł', ['25 zdjęć wnętrz i z zewnątrz', 'korekta perspektywy i światła']],
    ['Dodatek: ujęcia z drona', '+250 zł', ['8 zdjęć z powietrza do pakietu']],
  ] },
  'zdjecia-z-drona': { note: 'Nieruchomości, działki, postęp budowy, wydarzenia. Loty zgodnie z przepisami i strefami.', p: [
    ['Zdjęcia z drona', '399 zł', ['15 zdjęć z obróbką', 'dojazd na terenie aglomeracji śląskiej w cenie']],
    ['Zdjęcia + film', '799 zł', ['15 zdjęć z obróbką', 'film 30–60 s z montażem i muzyką']],
    ['Postęp budowy', '349 zł / wizyta', ['zdjęcia z tych samych punktów co wizytę', 'przy stałej współpracy']],
  ] },
};
