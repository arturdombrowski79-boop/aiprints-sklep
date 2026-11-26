# Kalkulator druku 3D – projekt

Data: 26.11.2026 · Właściciel: Artur Dombrowski (AiPrints.pl)

## Po co
Klient z własnym plikiem 3D ma dostać cenę od razu i zapłacić, bez czekania na wycenę mailem
(dziś strona /druk-3d ma tylko formularz „wyślij plik do wyceny”). Tak działają konkurenci
(send3d.pl, chcewydruk.pl, bezbajzlu.pl). Sukces: zamówienia z pliku wpadają opłacone, a cena
pokrywa materiał i czas maszyny.

## Zakres
- Wgranie pliku **STL lub 3MF** (do 100 MB), podgląd modelu 3D (obracanie), wymiary w mm.
- Wybory klienta:
  - **kolor PLA**: CMYK (cyan, magenta, żółty, czarny), light CMYK (jasny cyan, jasna magenta,
    jasny żółty, szary) + biały, oraz **marmurkowe** (+20% do ceny materiału);
  - **rozmiar**: skala w % albo wpisanie docelowej najdłuższej krawędzi w mm;
  - **dysza**: 0,4 mm „Dokładnie” albo 0,8 mm „Szybko” (grubsze warstwy, krótszy czas, taniej);
  - **ilość sztuk** (1–50).
- Na żywo: waga (g), szacowany czas druku, cena za sztukę i razem.
- „Do koszyka” → zwykły koszyk → Stripe Checkout. Plik trafia do zamówienia i do panelu pracowni.

Poza zakresem (na teraz): STEP/OBJ, inne materiały (PETG, ASA…), wielokolor z 3MF (drukujemy
jednym kolorem wybranym przez klienta), cięcie modelu na części, slicer na serwerze.

## Cennik (zatwierdzony kierunek, brutto)
- materiał PLA **0,25 zł/g** (koszt Artura 55 zł/kg); marmurkowe ×1,2
- czas drukarki **4 zł/h**
- opłata startowa **6 zł / model** (pozycję)
- minimum **10 zł za sztukę**
- wszystkie stawki w jednym pliku konfiguracyjnym (`src/data/druk3d.json`, kopiowany do API)

Przykłady: 5 g/0,5 h → 10 zł · 50 g/3 h → 30,50 zł · 150 g/7 h → 71,50 zł · 500 g/20 h → 211 zł.

## Podejścia (rozważone)
1. **Szacunek z geometrii (wybrane).** Objętość i powierzchnia siatki → waga i czas wzorem
   skalibrowanym na drukarkach Artura. Natychmiast, bez nowej infrastruktury. Ryzyko: modele
   z dużymi podporami wyjdą zaniżone – Artur i tak otwiera plik w Bambu Studio przed drukiem;
   przy dużej różnicy kontakt z klientem/zwrot.
2. Slicer na serwerze – dokładny, ale hosting LH.pl (współdzielony PHP) go nie uruchomi;
   wymagałby osobnej maszyny. Możliwe później jako weryfikacja na QNAP (patrz niżej).
3. Stała cena za gram bez czasu – najprostsze, ale źle wycenia wydruki długie i lekkie.

## Jak to działa
**Przeglądarka:** three.js (jest już w projekcie) wczytuje STL (binarny/ASCII) i 3MF (ZIP + XML
siatki), liczy objętość (suma tetraedrów), powierzchnię i wymiary, pokazuje model. Cena liczona
tą samą formułą co serwer – tylko podgląd.

**Serwer (źródło prawdy):** nowy `api/model3d.php`
- `POST` – przyjmuje plik (w kawałkach jak `upload.php`), sprawdza format, parsuje siatkę w PHP,
  zapisuje do `api/data/models/<id>/` z `stats.json` (objętość mm³, powierzchnia mm², bbox),
  zwraca `id` (losowe, 32 znaki) i statystyki;
- pliki modeli bez zamówienia kasowane po 7 dniach.

**Koszyk / checkout:** pozycja `slug: "druk-3d-z-pliku"` z polami `model` (id), `color`, `scale`,
`nozzle`, `qty`. `unit_price()` dla tego produktu czyta `stats.json`, przelicza wagę/czas/cenę
z parametrami pozycji (klient nie może podać ceny). Checkout kopiuje plik modelu do
`data/files/<nr>/` i dopisuje do opisu pozycji: kolor, dysza, skala, wymiary, waga, czas.
Panel zamówienia pokazuje plik do pobrania jak inne pliki klienta.

**Wzór (do kalibracji):**
- skorupa: powierzchnia × grubość ścian (0,4: 1,2 mm; 0,8: 1,6 mm), ograniczona do objętości;
- wnętrze: (objętość − skorupa) × wypełnienie 15%;
- waga = (skorupa + wnętrze) × 1,24 g/cm³ × 1,05 (podpory/obrys, współczynnik);
- czas = objętość wytłoczona / wydajność (0,4: ~10 mm³/s, 0,8: ~22 mm³/s) + wysokość/warstwa ×
  narzut na warstwę + 5 min rozgrzewania.
Współczynniki dopasujemy do 4–5 modeli z Bambu Studio od Artura (waga + czas).

**Limity:** największy wymiar po skalowaniu ≤ 320 × 320 × 320 mm (H2C/X1C; do potwierdzenia
pole robocze A2L); mniejszy niż 5 mm – odrzucamy. Za duży → komunikat „napisz do nas”
(formularz wyceny zostaje na stronie). Siatka nieszczelna → szacujemy z wypukłej otoczki/bbox
z ostrzeżeniem.

## Gdzie na stronie
Sekcja „Wyceń od razu” na `/druk-3d` nad obecnym formularzem; formularz zostaje dla STEP,
zdjęć i nietypowych zleceń. Link w menu Usługi i w produkcie „Druk 3D z pliku”.

## Ryzyka / anty-cele
- Nie obiecujemy terminu świątecznego (przerwa 21.12–7.01).
- Licencje: klient oświadcza, że ma prawo do pliku (checkbox), zgodnie z zasadą o plikach
  Atomm/MakerWorld.
- Nie publikujemy plików klientów; brak publicznego URL do `data/models`.

## Później (opcjonalnie)
Weryfikacja slicerem na QNAP TS-453: kontener z OrcaSlicer/Bambu Studio CLI co kilka minut
pobiera z serwera nowe opłacone modele (połączenie wychodzące, bez otwierania portów), tnie je
i zapisuje w panelu dokładną wagę i czas – sygnał dla Artura, gdy szacunek odbiega o >25%.
