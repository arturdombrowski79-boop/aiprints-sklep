# Nowe produkty (XI 2026): druk wielkoformatowy HP Latex 375, ploter Summa S3, fine art Epson P9500,
# odbitki Epson SureLab D1000, sublimacja Epson F500, szkoły i przedszkola, cmentarz i pogrzeb, zarządcy nieruchomości.
# Warianty z ceną: "Etykieta=cena | Etykieta=cena" (ceny brutto). Uruchamiane raz – dopisuje brakujące wiersze do CSV,
# a dla istniejących slugów z listy UPDATE podmienia cenę i warianty.
import csv, os
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = B + '/data/baza-produktow.csv'
br = lambda netto: round(netto * 1.23, 2)
LATEX, SUMMA, P9500, D1000, F500 = 'HP Latex 375', 'Summa S3 (ploter tnący)', 'Epson SureColor P9500', 'Epson SureLab D1000 (DryLab)', 'Epson SureColor F500 + prasa'
UV, CO2, MOPA = 'GoArt UV A3', 'xTool X1 (CO₂)', 'xTool X1 (MOPA 60 W)'

# kategoria, slug, nazwa, warianty, cena (tekst), maszyna, typowe zamówienie brutto, koszt, minuty, popyt 1–5, uwagi
NEW = [
 # ——— druk wielkoformatowy (HP Latex 375) ———
 ('Druk wielkoformatowy', 'baner-reklamowy', 'Baner reklamowy z oczkami', 'frontlit 510 g, zgrzew i oczka co 50 cm, druk lateksowy odporny na UV i deszcz', '69 zł/m²', LATEX, 207, 45, 25, 5, 'najczęstszy produkt drukarni'),
 ('Druk wielkoformatowy', 'siatka-mesh', 'Siatka mesh na ogrodzenie i rusztowanie', 'siatka 270 g przepuszcza wiatr, oczka, opcjonalnie linki', '79 zł/m²', LATEX, 474, 120, 40, 4, ''),
 ('Druk wielkoformatowy', 'baner-blockout', 'Baner dwustronny blockout', 'nieprzezierny, druk z dwóch stron, do zawieszenia w przestrzeni', '119 zł/m²', LATEX, 357, 90, 40, 3, ''),
 ('Druk wielkoformatowy', 'folia-samoprzylepna-druk', 'Wydruk na folii samoprzylepnej', 'folia monomer lub polimer, laminat mat / połysk, docięcie na wymiar', '79 zł/m²', LATEX, 158, 35, 20, 5, ''),
 ('Druk wielkoformatowy', 'naklejki-po-obrysie', 'Naklejki wycinane po obrysie', 'folia biała lub przezroczysta, laminat, dowolny kształt, od 10 szt.', 'od 49 zł', LATEX + ' + ' + SUMMA, 149, 25, 30, 5, 'Latex drukuje, Summa S3 wycina po znacznikach'),
 ('Druk wielkoformatowy', 'folia-owv-witryna', 'Folia perforowana OWV na witrynę', 'z zewnątrz grafika, od środka widać ulicę; laminat, montaż na miejscu', '99 zł/m²', LATEX, 594, 140, 60, 4, ''),
 ('Druk wielkoformatowy', 'plakat-wielkoformatowy', 'Plakat wielkoformatowy A2–B0', 'papier satynowy 200 g lub blueback do naklejania, wydruk w 24 h', 'A2=29 | A1=45 | B1=55 | A0=69 | B0=89', LATEX, 90, 18, 10, 4, ''),
 ('Druk wielkoformatowy', 'tablica-pcv-dibond', 'Tablica PCV lub Dibond z nadrukiem', 'PCV 3–5 mm lub Dibond 3 mm, druk UV / folia z laminatem, otwory lub taśma', 'A3=49 | A2=89 | 50×70=129 | 100×70=219 | 120×80=299', LATEX + ' / ' + UV, 219, 60, 30, 5, ''),
 ('Druk wielkoformatowy', 'potykacz-a1', 'Potykacz reklamowy A1 z wydrukiem', 'stojak aluminiowy dwustronny, 2 plakaty A1 z laminatem, wymiana plakatów od 59 zł', '349 zł', LATEX, 349, 160, 30, 4, ''),
 ('Druk wielkoformatowy', 'magnes-na-samochod', 'Magnes na samochód', 'folia magnetyczna 0,8 mm z nadrukiem i laminatem, para na drzwi', '149 zł', LATEX + ' + ' + SUMMA, 149, 40, 30, 4, ''),
 ('Druk wielkoformatowy', 'reklama-na-auto', 'Reklama na samochód – oklejenie drzwi i tyłu', 'folia wylewana + laminat, projekt w cenie, montaż w pracowni', 'od 590 zł', LATEX + ' + ' + SUMMA, 890, 260, 240, 3, ''),
 ('Druk wielkoformatowy', 'wydruk-backlit', 'Wydruk backlit do kasetonu i podświetleń', 'folia lub tkanina backlit, równomierne podświetlenie bez prześwitów', '129 zł/m²', LATEX, 258, 70, 30, 3, ''),
 ('Druk wielkoformatowy', 'baner-tekstylny', 'Baner tekstylny i flaga reklamowa', 'tkanina poliestrowa, obszycie, tunel lub oczka; nie gniecie się', '109 zł/m²', LATEX, 218, 55, 40, 3, ''),
 # ——— ploter tnący (Summa S3) ———
 ('Ploter tnący', 'litery-z-folii', 'Litery i napisy z folii', 'folia Oracal 641/651 w 40 kolorach, wysokość od 2 cm, z folią transportową do łatwego naklejenia', 'od 29 zł', SUMMA, 89, 12, 20, 5, ''),
 ('Ploter tnący', 'logo-z-folii-na-szybe', 'Logo i godziny otwarcia z folii na szybę', 'folia biała, złota, szroniona lub w kolorze firmy; projekt i montaż na życzenie', '99 zł', SUMMA, 149, 20, 35, 5, ''),
 ('Ploter tnący', 'naklejki-wycinane-logo', 'Naklejki wycinane z logo (bez tła)', 'folia jednokolorowa, 10–100 szt., na auto, laptop, skrzynkę', 'od 49 zł', SUMMA, 99, 12, 25, 4, ''),
 ('Ploter tnący', 'napis-na-samochod', 'Napis na samochód z folii', 'folia samochodowa 5–7 lat, numer telefonu, strona www, nazwa firmy', '69 zł', SUMMA, 89, 10, 20, 4, ''),
 ('Ploter tnący', 'napis-na-sciane-folia', 'Napis na ścianę z folii (cytat, imię)', 'folia matowa do ścian, wysokość liter dobierzemy do miejsca', '89 zł', SUMMA, 89, 10, 25, 4, ''),
 # ——— fine art i fotografia ———
 ('Fine art i fotografia', 'fine-art-bawelna', 'Wydruk fine art na papierze bawełnianym', 'Hahnemühle Photo Rag Baryta 315 g, ImPrime Premium MC230 lub ImPrime 260 Bright White (inne papiery fine art na zamówienie); 12 tuszów pigmentowych, A4–B0', 'A4=49 | A3=79 | A2=139 | A1=219 | A0=349', P9500, 139, 35, 20, 4, 'Epson P9500 44", profil ICC pod papier'),
 ('Fine art i fotografia', 'digigraphie-edycja', 'Edycja limitowana Digigraphie by Epson', 'numerowana seria, certyfikat autentyczności, papier muzealny', 'od 129 zł', P9500, 390, 90, 60, 3, 'dla artystów i fotografów'),
 ('Fine art i fotografia', 'wydruk-wystawowy', 'Wydruk wystawowy na piance lub Dibond', 'fotografia na piance 5 mm lub Dibond 3 mm, laminat mat, zawieszka', '50×70=149 | 70×100=249 | 100×150=449', P9500, 249, 80, 30, 4, ''),
 ('Fine art i fotografia', 'odbitki-drylab', 'Odbitki fotograficzne DryLab', 'papier błyszczący, matowy lub luster, od 1 szt., wydruk w 24 h', '10×15=1.2 | 13×18=2 | 15×21=3 | 20×30=6', D1000, 60, 15, 15, 5, 'Epson SureLab D1000'),
 ('Fine art i fotografia', 'powiekszenia-zdjec', 'Powiększenia zdjęć do 60×90', 'papier fotograficzny satyna lub fine art, przycięte do formatu', '30×40=29 | 40×60=49 | 50×70=69 | 60×90=99', P9500, 49, 12, 10, 4, ''),
 ('Fine art i fotografia', 'wydruk-w-ramie', 'Wydruk w ramie z passe-partout', 'rama drewniana czarna / biała / dąb, passe-partout bezkwasowe, szkło antyrefleks', '30×40=179 | 40×50=229 | 50×70=329', P9500, 229, 95, 30, 4, ''),
 ('Fine art i fotografia', 'portfolio-box', 'Portfolio box ze zdjęciami z sesji', 'lniane pudełko z grawerem + 20 odbitek 15×21 na papierze fine art', '249 zł', P9500 + ' + ' + CO2, 249, 85, 45, 3, 'dla fotografów ślubnych i rodzinnych'),
 ('Fine art i fotografia', 'retusz-starych-zdjec', 'Retusz i odnowienie starych zdjęć', 'skan, usunięcie rys i plam, odtworzenie kolorów, wydruk 20×30', 'od 79 zł', D1000, 99, 8, 45, 4, ''),
 ('Fine art i fotografia', 'reprodukcja-obrazu', 'Reprodukcja obrazu i grafiki (giclée)', 'skan lub zdjęcie pracy, korekta barw, wydruk na płótnie lub papierze akwarelowym', 'od 149 zł', P9500, 249, 60, 60, 3, ''),
 ('Fine art i fotografia', 'kalendarz-scienny-zdjecia', 'Kalendarz ścienny z własnych zdjęć', 'A3, 13 stron, papier 250 g, spirala, dowolny miesiąc startowy', '99 zł', D1000, 99, 28, 30, 4, ''),
 ('Fine art i fotografia', 'wydruk-probny', 'Wydruk próbny i dopasowanie barw (proof)', 'próbka A4 na wybranym papierze, porównanie z monitorem, profil ICC do pobrania', '39 zł', P9500, 39, 6, 15, 3, ''),
 # ——— sublimacja (Epson F500) ———
 ('Sublimacja', 'koszulka-sportowa-sublimacja', 'Koszulka sportowa z pełnym nadrukiem', 'poliester oddychający, nadruk na całości: numer, nazwisko, herb; komplety dla drużyn od 10 szt. taniej', '89 zł', F500, 890, 380, 150, 4, ''),
 ('Sublimacja', 'koc-ze-zdjeciem', 'Koc polarowy ze zdjęciem', '130×150 cm, miękki polar, kolaż do 12 zdjęć', '199 zł', F500, 199, 75, 30, 4, ''),
 ('Sublimacja', 'recznik-ze-zdjeciem', 'Ręcznik ze zdjęciem lub imieniem', '70×140 cm, mikrofibra z bawełnianym spodem', '119 zł', F500, 119, 40, 20, 3, ''),
 ('Sublimacja', 'podkladka-pod-mysz', 'Podkładka pod mysz ze zdjęciem', '23×19 cm, guma antypoślizgowa, obszyta krawędź', '39 zł', F500, 39, 9, 10, 4, ''),
 ('Sublimacja', 'fartuch-z-nadrukiem', 'Fartuch kuchenny z nadrukiem', 'poliester z wiązaniem, imię, logo lokalu lub zabawny napis', '69 zł', F500, 69, 22, 15, 3, ''),
 ('Sublimacja', 'torba-ze-zdjeciem', 'Torba ze zdjęciem', 'torba na zakupy 38×42 cm, nadruk dwustronny', '49 zł', F500, 49, 14, 12, 3, ''),
 ('Sublimacja', 'kubek-magiczny', 'Kubek magiczny ze zdjęciem', 'czarny, po nalaniu gorącego napoju pojawia się zdjęcie', '59 zł', F500, 59, 16, 12, 4, ''),
 ('Sublimacja', 'kafel-ze-zdjeciem', 'Kafel ceramiczny ze zdjęciem i stojakiem', '20×20 cm, połysk, stojak drewniany', '69 zł', F500, 69, 18, 15, 3, ''),
 ('Sublimacja', 'flaga-szal-kibica', 'Flaga i szal kibica z nadrukiem', 'flaga 100×150 cm z tunelem lub szal satynowy, kolory klubu', 'od 79 zł', F500, 149, 45, 30, 3, ''),
 ('Sublimacja', 'skarpetki-ze-zdjeciem', 'Skarpetki ze zdjęciem', 'twarz psa, kota albo partnera na skarpetkach; rozmiary 36–46', '49 zł', F500, 49, 15, 15, 3, ''),
 # ——— szkoły i przedszkola ———
 ('Szkoły i przedszkola', 'grafika-drzwi-wejsciowe', 'Grafika na drzwi i nadświetle wejścia', 'projekt z postacią i nazwą placówki w cenie, folia z laminatem, montaż na miejscu', 'od 690 zł', LATEX + ' + ' + SUMMA, 990, 210, 300, 4, 'realizacja: Przedszkole nr 22 w Chorzowie'),
 ('Szkoły i przedszkola', 'plakaty-grup-przedszkolnych', 'Plakaty powitalne grup (Pszczółki, Jeżyki, Sówki…)', 'unikalna postać grupy zaprojektowana w AI, 60×60–100×100 cm, folia lub PCV', '60×60=149 | 80×80=199 | 100×100=259', LATEX, 199, 45, 60, 5, 'realizacje w przedszkolu w Chorzowie'),
 ('Szkoły i przedszkola', 'naklejki-na-okna-przedszkole', 'Naklejki na okna – zwierzęta, motyle, chmurki', 'folia z białym poddrukiem, wycinane po obrysie, komplet na jedno okno', 'od 249 zł', LATEX + ' + ' + SUMMA, 249, 55, 60, 5, ''),
 ('Szkoły i przedszkola', 'postacie-zagladajace-drzwi', 'Postacie „zaglądające” przez szklane drzwi', 'chłopiec i dziewczynka wycinani po obrysie, dwustronnie czytelni na szkle', '349 zł', LATEX + ' + ' + SUMMA, 349, 70, 90, 4, ''),
 ('Szkoły i przedszkola', 'fototapeta-sala', 'Fototapeta do sali i korytarza', 'projekt tematyczny w cenie (las, kosmos, ocean), zmywalna, bez PVC', '99 zł/m²', LATEX, 990, 230, 240, 4, ''),
 ('Szkoły i przedszkola', 'baner-rekrutacja', 'Baner na ogrodzenie – rekrutacja i dzień otwarty', '3×1 m, oczka, projekt w cenie', '249 zł', LATEX, 249, 60, 45, 4, ''),
 ('Szkoły i przedszkola', 'tabliczki-sale-komplet', 'Tabliczki na drzwi sal – komplet', 'numer, nazwa sali i piktogram, jeden styl dla całej szkoły, 10 szt.', '390 zł', UV, 390, 90, 90, 4, ''),
 ('Szkoły i przedszkola', 'tablica-urzedowa-szkola', 'Tablica urzędowa szkoły z godłem', '60×40 cm, stal szczotkowana lub akryl, dystanse, wzór zgodny z przepisami', '449 zł', UV + ' + ' + CO2, 449, 140, 60, 3, ''),
 ('Szkoły i przedszkola', 'plakaty-edukacyjne', 'Plakaty edukacyjne do sal', 'alfabet, tabliczka mnożenia, układ słoneczny, mapa; B1 na PCV lub papierze', '79 zł', LATEX, 237, 50, 30, 4, ''),
 ('Szkoły i przedszkola', 'naklejki-podlogowe-gry', 'Naklejki podłogowe – gry ruchowe', 'klasy, ścieżka sensoryczna, twister; folia antypoślizgowa z laminatem', 'od 390 zł', LATEX + ' + ' + SUMMA, 590, 140, 120, 3, ''),
 ('Szkoły i przedszkola', 'tablica-dla-rodzicow', 'Tablica informacyjna dla rodziców', 'korkowa w ramie aluminiowej, nadrukowany nagłówek z nazwą grupy lub placówki', '249 zł', LATEX, 249, 110, 30, 3, ''),
 ('Szkoły i przedszkola', 'dyplomy-ukonczenia-przedszkola', 'Dyplomy ukończenia przedszkola ze zdjęciem grupy', 'A4, karton 300 g, imię dziecka na każdym, 25 szt.', '149 zł', D1000, 149, 30, 45, 4, ''),
 ('Szkoły i przedszkola', 'koszulki-absolwent', 'Koszulki i bluzy dla klasy absolwentów', 'nazwiska całej klasy na plecach, rok, logo szkoły; od 10 szt.', 'od 59 zł', F500, 590, 250, 120, 3, ''),
 # ——— cmentarz i pogrzeb ———
 ('Cmentarz i pogrzeb', 'zdjecie-nagrobne-porcelana', 'Zdjęcie nagrobne na porcelanie', 'owal lub prostokąt 9×12 / 13×18 cm, odporne na mróz i słońce, klej do kamienia w zestawie', '9×12=149 | 13×18=199', F500, 149, 35, 40, 4, 'retusz zdjęcia w cenie'),
 ('Cmentarz i pogrzeb', 'tabliczka-nagrobna-grawer', 'Tabliczka nagrobna z grawerem', 'stal nierdzewna lub granit, imię, daty i sentencja, mocowanie na klej', 'od 129 zł', MOPA, 179, 45, 40, 4, ''),
 ('Cmentarz i pogrzeb', 'tabliczka-na-krzyz', 'Tabliczka na krzyż i tymczasowy pomnik', 'aluminium lub akryl z nadrukiem UV, ze zdjęciem lub bez, wykonanie w 24 h', '79 zł', UV, 79, 15, 25, 4, 'pilne – priorytet w kolejce'),
 ('Cmentarz i pogrzeb', 'klepsydry', 'Klepsydry (nekrologi)', 'A4 lub A3, 10 szt., wzór z krzyżem, gałązką lub bez symboli, gotowe w 24 h', '59 zł', D1000, 59, 10, 20, 4, ''),
 ('Cmentarz i pogrzeb', 'portret-na-pogrzeb', 'Portret na pogrzeb ze sztalugą', 'fotografia 40×50 cm na piance z czarną ramką + sztaluga, retusz zdjęcia', '149 zł', P9500, 149, 50, 30, 3, ''),
 ('Cmentarz i pogrzeb', 'obrazki-pamiatkowe-pogrzeb', 'Obrazki pamiątkowe ze zdjęciem i modlitwą', '7×11 cm, karton 300 g, 50 szt.', '99 zł', D1000, 99, 18, 30, 3, ''),
 ('Cmentarz i pogrzeb', 'podziekowania-za-udzial', 'Podziękowania za udział w pogrzebie', 'karty składane z kopertą, 25 szt., treść do wyboru', '89 zł', D1000, 89, 20, 30, 3, ''),
 ('Cmentarz i pogrzeb', 'szarfa-na-wieniec', 'Szarfa na wieniec z napisem', 'satyna 10 lub 15 cm, napis złoty, srebrny lub czarny, długość do 2 m', '49 zł', F500, 49, 8, 15, 4, ''),
 ('Cmentarz i pogrzeb', 'tabliczka-krzyz-pleksi', 'Tabliczka na krzyż z pleksi – tarcza', 'biała pleksi z czarnym nadrukiem UV, klasyczny kształt tarczy z krzyżem, imię i nazwisko, wiek, data śmierci i sentencja, opcjonalnie zdjęcie, otwory na wkręty, wykonanie w 24 h', '79 zł', UV, 79, 12, 25, 4, 'dodane 25.11.2026 na prośbę właściciela; kształt wycinany laserem CO₂ z pleksi (akryl), nigdy z PVC'),
 ('Cmentarz i pogrzeb', 'lampion-ze-zdjeciem', 'Lampion nagrobny ze zdjęciem', 'szkło z nadrukiem UV lub grawerem, imię i daty', '89 zł', UV, 89, 25, 20, 3, ''),
 ('Cmentarz i pogrzeb', 'kamien-pamieci-pupil', 'Kamień pamięci dla zwierzaka', 'łupek 20×15 cm z grawerem imienia i łapki, do ogrodu', '69 zł', CO2, 69, 15, 15, 3, ''),
 # ——— zarządcy nieruchomości (ceny z cennika netto, w sklepie brutto) ———
 ('Wspólnoty i spółdzielnie', 'instrukcja-ppoz', 'Instrukcja postępowania na wypadek pożaru', 'A4 lub A3, PCV lub płyta fotoluminescencyjna, zgodna z PN (30 zł netto)', f'{br(30)} zł', UV, br(30), 6, 8, 4, ''),
 ('Wspólnoty i spółdzielnie', 'telefony-alarmowe', 'Tabliczka „Telefony alarmowe”', 'A4: 112, 997, 998, 999 + numer awaryjny administracji (20 zł netto)', f'{br(20)} zł', UV, br(20), 4, 6, 4, ''),
 ('Wspólnoty i spółdzielnie', 'znaki-ppoz', 'Znaki ppoż. i ewakuacyjne', 'gaśnica, hydrant, przeciwpożarowy wyłącznik prądu, główny zawór gazu, wyjście ewakuacyjne; fotoluminescencyjne (15 zł netto)', f'{br(15)} zł/szt', UV, br(15) * 6, 3, 4, 5, ''),
 ('Wspólnoty i spółdzielnie', 'dane-zarzadcy-tabliczka', 'Tabliczka z danymi zarządcy i numerami awaryjnymi', '30×40 cm, logo zarządcy, e-mail, telefon, pogotowie (40 zł netto)', f'{br(40)} zł', UV, br(40), 10, 10, 5, ''),
 ('Wspólnoty i spółdzielnie', 'segregacja-odpadow', 'Tablica segregacji odpadów', '30×40 cm, papier, szkło, metale i tworzywa, bio, zmieszane (40 zł netto)', f'{br(40)} zł', UV, br(40), 10, 8, 4, ''),
 ('Wspólnoty i spółdzielnie', 'numery-pieter', 'Numery pięter', '15×15 cm, ten sam styl co tablica przy wejściu (15 zł netto)', f'{br(15)} zł/szt', UV, br(15) * 5, 3, 4, 4, ''),
 ('Wspólnoty i spółdzielnie', 'montaz-oznakowania', 'Montaż oznakowania w budynku', 'montaż od 50 zł netto, dojazd 20 zł netto za lokalizację, Śląsk', f'od {br(50)} zł', '—', br(70), 10, 60, 4, ''),
 # ——— z hurtowni agawa.pl / sublimacja.biz – tylko pozycje z wysoką marżą (półprodukt kilka–kilkadziesiąt zł) ———
 ('Sublimacja', 'kubek-zloty-rant', 'Kubek ze złotym rantem i uchem ze zdjęciem', 'porcelana z powłoką, złoty rant i ucho, pudełko prezentowe', '69 zł', F500, 69, 16, 12, 4, 'półprodukt: agawa.pl'),
 ('Sublimacja', 'kubek-szklany-nadruk', 'Kubek szklany matowy ze zdjęciem', 'szkło satynowe 330 ml, nadruk widoczny pod światło', '55 zł', F500, 55, 13, 12, 3, 'półprodukt: agawa.pl / sublimacja.biz'),
 ('Sublimacja', 'mis-z-koszulka', 'Miś z koszulką ze zdjęciem lub imieniem', 'pluszowy miś 25 cm, koszulka z nadrukiem do zdjęcia', '69 zł', F500, 69, 22, 15, 4, 'maskotki: sublimacja.biz'),
 ('Sublimacja', 'tabliczka-aluminium-zdjecie', 'Tabliczka aluminiowa ze zdjęciem do ogrodu i na zewnątrz', 'aluminium ChromaLuxe Outdoor, odporne na słońce i deszcz, 20×25 lub 28×36 cm', '20×25=149 | 28×36=219', F500, 149, 45, 20, 4, 'blachy: sublimacja.biz'),
 ('Szkoły i przedszkola', 'odblaski-z-logo', 'Odblaski z logo szkoły lub firmy', 'zawieszki odblaskowe z nadrukiem, kształt do wyboru, od 50 szt.', 'od 249 zł', F500, 349, 90, 60, 4, 'odblaski: agawa.pl'),
 ('Szkoły i przedszkola', 'przypinki-buttony', 'Przypinki (buttony) z własnym projektem', 'średnica 38 lub 58 mm, agrafka lub magnes, od 25 szt.', 'od 99 zł', D1000, 149, 25, 45, 4, 'elementy: agawa.pl – wymaga maszynki do buttonów'),
 # ——— oznakowanie gabinetu kosmetycznego / laserowego (lista od właściciela, 23.11.2026) ———
 ('Salony beauty i firmy', 'oznakowanie-gabinetu', 'Oznakowanie gabinetu kosmetycznego i laserowego', 'Zakaz palenia i e-papierosów 15×20=18.45 | Apteczka pierwszej pomocy 15×15=18.45 | Instrukcja pierwszej pomocy A4=36.9 | Uwaga promieniowanie laserowe A4=36.9 | Nakaz okularów ochronnych 10×10=14.76 | Etykiety odpadów medycznych 10×15 (20 szt.)=24.6 | Komplet gabinetu laserowego (6 pozycji)=129', 'od 14,76 zł', UV, 129, 22, 25, 4, 'PCV/plexi lub folia; znaki wg PN-EN ISO 7010 (P002, E003, W004, M004); klasa lasera i długość fali z tabliczki znamionowej klienta'),
 ('Salony beauty i firmy', 'oznakowanie-higieniczne-gabinetu', 'Oznakowanie higieniczne gabinetu (stanowiska, strefy, mycie rąk)', 'Bezpieczeństwo i higiena – A5 na stanowisko=24.6 | Higieniczne mycie rąk A4=30.75 | Higieniczna dezynfekcja rąk A4=30.75 | Strefy: brudna, czysta, sterylna (3 szt.)=49.2 | Tabliczki informacyjne (5 szt.)=79 | Tabliczki na drzwi (3 szt.)=49.2 | Komplet higieniczny gabinetu=199', 'od 24,60 zł', UV, 199, 30, 35, 4, 'lista od właściciela 23.11.2026'),
 ('Salony beauty i firmy', 'pieczatki-firmowe', 'Pieczątki firmowe, imienne i okrągłe', 'Pieczątka w automacie 38×14 mm=49 | Pieczątka w automacie 47×18 mm=59 | Pieczątka w automacie 58×22 mm=69 | Pieczątka imienna (lekarz, kosmetolog) 38×14 mm=49 | Pieczątka kieszonkowa=69 | Pieczątka okrągła Ø 40 mm=79 | Datownik z treścią=99 | Wymiana gumki tekstowej=29', 'od 29 zł', CO2, 59, 14, 15, 5, 'gumka grawerowana laserem CO₂ (guma laserowa bezzapachowa), obudowa automatyczna z poduszką'),
 # ——— cennik podstawowy: druk cyfrowy / ksero i druk UV na płytach (26.11.2026, klientka „z ulicy”) ———
 ('Druk wielkoformatowy', 'druk-cyfrowy-arkusz', 'Druk cyfrowy i ksero A4 / A3 / SRA3', 'Kolor A4=2 | Kolor A3=4 | Kolor SRA3=5 | Kolor A4 karton 200–300 g=3 | Kolor A3 karton 200–300 g=6 | Kolor SRA3 karton 200–300 g=7 | Czarno-biały A4=0.5 | Czarno-biały A3=1 | Czarno-biały SRA3=1.5', 'od 0,50 zł', 'Xerox C75', 40, 8, 10, 4, 'ksero w tej samej cenie; dwustronnie ×1,6; od 50 ark. −20%, od 200 ark. −35% (w pracowni)'),
 ('Druk wielkoformatowy', 'druk-uv-na-plycie', 'Druk UV na płycie PCV, Dibond lub akrylu', 'PCV spienione 5 mm A4=29 | PCV spienione 5 mm 30×40=45 | PCV spienione 5 mm A2=79 | PCV spienione 5 mm 50×70=115 | PCV spienione 5 mm 70×100=199 | Dibond 3 mm A4=39 | Dibond 3 mm 30×40=59 | Dibond 3 mm A2=99 | Dibond 3 mm 50×70=149 | Dibond 3 mm 70×100=249 | Akryl 3 mm A4=49 | Akryl 3 mm 30×40=79', 'od 29 zł', UV + ' / ' + LATEX, 59, 15, 10, 5, 'do 30×40 druk UV bezpośrednio (GoArt A3); A2 i większe: wydruk Latex z laminatem naklejony na płytę; akryl z białym podkładem'),
 # ——— 27.11.2026: półprodukty z xTool (zamówienia EU-69916, EU-75934), ceny zatwierdzone przez właściciela ———
 ('Salony beauty i firmy', 'wizytowki-metalowe', 'Wizytówki metalowe z grawerem', 'aluminium 85×54 mm, czarne błyszczące lub matowe, grawer laserowy logo, danych i kodu QR z obu stron; projekt w cenie', '25 szt.=149 | 50 szt.=249 | 100 szt.=399 | 250 szt.=799', MOPA, 249, 45, 60, 3, 'koszt blanku ok. 0,45 zł/szt.'),
 ('Prezenty', 'moneta-pamiatkowa', 'Moneta pamiątkowa z grawerem', 'Ø ok. 40 mm, grawer z dwóch stron: imiona, data, logo; na ślub, chrzest, jubileusz firmy, dla klubu. Dla firm od 20 szt. – 19 zł/szt. (cynk), zapytaj o wycenę', 'Cynkowa=39 | Mosiężna=59', MOPA, 59, 21, 15, 3, 'cynk ok. 8,50 zł, mosiądz ok. 21 zł'),
 ('Prezenty', 'otwieracz-karta', 'Otwieracz-karta z grawerem', 'czarna stal w rozmiarze karty 85×54 mm, mieści się w portfelu; grawer imienia, dedykacji lub logo. Od 10 szt. – 25 zł/szt., zapytaj o wycenę', '39 zł', MOPA, 39, 5, 10, 3, 'gadżet firmowy, prezent dla niego'),
 ('Dom i dekoracje', 'zawieszka-krysztal-choinka', 'Kryształowa zawieszka z imieniem', 'kryształ K5 w kształcie diamentu, grawer imienia i daty w środku szkła, ze wstążką – na choinkę, do okna albo do auta', '39 zł', 'xTool X1 (UV 5 W, grawer w szkle)', 39, 14, 15, 3, 'mały zapas (3 szt.)'),
]
UPDATE = {
 'krysztal-pupil': ('Kryształ 3D z pupilem', 'grawer zdjęcia pupila w środku kryształu K9; kształt prostokątny lub kość; podstawka LED na zapytanie', 'Prostokąt 5×5×8 cm=229 | Kształt kości=259'),
 'krysztal-slub': ('Kryształ 3D z datą ślubu', 'grawer zdjęcia pary, imion i daty w środku kryształu K9; prostokąt lub serce fasetowane 9,5×8 cm', 'Prostokąt=289 | Serce fasetowane=299'),
 'niesmiertelnik': ('Nieśmiertelnik ze zdjęciem', 'stal nierdzewna, grawer zdjęcia i tekstu z dwóch stron; srebrny lub czarny, na łańcuszku albo jako brelok', 'Srebrny z łańcuszkiem=79 | Czarny z łańcuszkiem=79 | Brelok=69'),
 'medale-grawer': ('Medale z grawerem', 'medale kryształowe ze złotą ramką i wstążką, grawer logo, nazwy zawodów i miejsca; od 10 szt.', 'od 29 zł/szt'),
 'oznakowanie-gabinetu': ('Oznakowanie gabinetu kosmetycznego i laserowego', 'Zakaz palenia i e-papierosów 15×20 – PCV=18.45 | Zakaz palenia i e-papierosów 15×20 – plexi=39 | Apteczka 15×15 – PCV=18.45 | Apteczka 15×15 – plexi=35 | Instrukcja pierwszej pomocy A4 – PCV=36.9 | Instrukcja pierwszej pomocy A4 – plexi=69 | Uwaga promieniowanie laserowe A4 – PCV=36.9 | Uwaga promieniowanie laserowe A4 – plexi=69 | Nakaz okularów ochronnych 10×10 – PCV=14.76 | Nakaz okularów ochronnych 10×10 – plexi=29 | Etykiety odpadów medycznych 10×15 (20 szt.)=24.6 | Komplet gabinetu laserowego – PCV=129 | Komplet gabinetu laserowego – plexi=249', 'od 14,76 zł'),
 'oznakowanie-higieniczne-gabinetu': ('Oznakowanie higieniczne gabinetu (stanowiska, strefy, mycie rąk)', 'Bezpieczeństwo i higiena A5 na stanowisko – PCV=24.6 | Bezpieczeństwo i higiena A5 na stanowisko – plexi=49 | Higieniczne mycie rąk A4 – PCV=30.75 | Higieniczne mycie rąk A4 – plexi=69 | Higieniczna dezynfekcja rąk A4 – PCV=30.75 | Higieniczna dezynfekcja rąk A4 – plexi=69 | Strefy brudna, czysta, sterylna (3 szt.) – PCV=49.2 | Strefy brudna, czysta, sterylna (3 szt.) – plexi=99 | Tabliczki informacyjne (5 szt.) – PCV=79 | Tabliczki informacyjne (5 szt.) – plexi=159 | Tabliczki na drzwi (3 szt.) – PCV=49.2 | Tabliczki na drzwi (3 szt.) – plexi=99 | Komplet higieniczny – PCV=199 | Komplet higieniczny – plexi=399', 'od 24,60 zł'),
 'tablica-wejscie-zarzadca': ('Tablica z numerem domu i nazwą zarządcy', 'PCV 30×40 + tabliczka 30×8=147.6 | PCV 40×60 + tabliczka 40×10=221.4 | LED 230 V 30×40=356.7 | LED 230 V 40×60=479.7 | Solarna 30×40=393.6 | Solarna 40×60=516.6', 'od 147,6 zł'),
 'regulamin-porzadku': ('Regulamin wspólnoty mieszkaniowej', 'tablica 40×60 cm z regulaminem porządku domowego, PCV lub Dibond (60 zł netto)', f'{br(60)} zł'),
 'znaki-zakazu': ('Znaki zakazu i informacyjne na klatkę', 'Zakaz palenia 15×20=18.45 | Zakaz pozostawiania przedmiotów 20×30=30.75 | Obiekt monitorowany 20×30=36.9', 'od 18,45 zł'),
 'oznakowanie-piwnic': ('Oznakowanie piwnic i pomieszczeń', 'piwnica, rozdzielnia, rowerownia, wózkownia 10×20 cm, miejsce parkingowe 15×15 cm (15 zł netto)', f'{br(15)} zł/szt'),
 'tablica-ogloszen': ('Tablica ogłoszeń korkowa w ramie', 'Korkowa 60×90=221.4 | Korkowa 70×100=270.6 | Korkowa 90×120=307.5', 'od 221,4 zł'),
}
rows = list(csv.DictReader(open(F, encoding='utf-8-sig'), delimiter=';')); cols = list(rows[0].keys()); have = {r['slug'] for r in rows}
added = 0
for kat, slug, name, var, cena, mach, typ, koszt, minuty, popyt, uw in NEW:
    if slug in have: continue
    zysk = round(typ / 1.23 - koszt); zh = round(zysk / max(minuty, 1) * 60)
    rows.append(dict(zip(cols, [kat, slug, name, var, cena, '', mach, str(typ), str(koszt), str(minuty), str(zysk), str(zh), str(popyt), 'nie', str(round(zh * popyt / 5)), uw]))); added += 1
for r in rows:
    if r['slug'] in UPDATE: r['nazwa'], r['warianty'], r['nasza_cena'] = UPDATE[r['slug']]
w = csv.DictWriter(open(F, 'w', encoding='utf-8-sig', newline=''), fieldnames=cols, delimiter=';'); w.writeheader(); w.writerows(rows)
print('dodano', added, 'zaktualizowano', len(UPDATE), 'razem', len(rows))
