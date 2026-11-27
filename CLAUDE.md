# AiPrints.pl – sklep (kontekst dla Claude)

Właściciel: Artur Dombrowski, AiPrints.pl, ul. Okrężna 98B, 41-500 Chorzów, NIP 6262579694, tel. 609 040 274.
Prezenty personalizowane (grawer, druk UV, kryształy 3D), druk wielkoformatowy (HP Latex 375, Summa S3), fine art (Epson P9500, D1000L), sublimacja (Epson F500), oznakowanie dla zarządców, szkoły/przedszkola, pamięć i pogrzeb.

## Jak to działa
- Astro (statyczny) + Tailwind v4 + GSAP; kreator Fabric.js. Build: `bash tools/build.sh` → `prod/`.
- Katalog produktów: `data/baza-produktow.csv` → `tools/catalog.py`. Nowe produkty: `tools/new_products.py`. Zdjęcia: `public/img/hf/<slug>-1.jpg` (1200×900). Po dodaniu zdjęć: `python3 tools/webp.py` (wersje WebP 480/960 – build dopisuje srcset).
- Promocja: `PROMO` w `src/data/config.js` (Omnibus: `data/price-history.json`, najniższa cena z 30 dni). Przerwa w pracowni: `BREAK`.
- Płatności: Stripe Checkout, backend PHP w `api/` (bez SDK). Ceny liczone na serwerze z `api/catalog.json`.
- Wdrożenie: push na `main` → GitHub Actions → rsync SSH na LH.pl (`/home/platne/serwer271550/public_html/aiprints`, port 40022). Sekrety LH_* są tylko w GitHub Secrets.
- `api/config.php` (klucze Stripe rk_live_/whsec_) istnieje TYLKO na serwerze – nigdy nie commitować, rsync go pomija. Dane zamówień: `api/data/` na serwerze.
- Skrzynki: kontakt@, zamowienia@ (nadawca maili), reklamacje@, zwroty@, firmy@ (wszystkie @aiprints.pl).
- Panel zamówienia: link „Otwórz zamówienie – pliki i wysyłka” w mailu do pracowni → `api/panel.php` (klucz HMAC z sekretu webhooka): pobieranie plików klienta, numer przesyłki + mail „Wysłane”, „Gotowe do odbioru”. `/admin` to wciąż podgląd demo.

- Katalog PDF (`public/pliki/katalog-aiprints.pdf`, okładka `img/site/katalog-okladka.jpg`): po zmianach cen/produktów `bash tools/build.sh && python3 tools/katalog.py && node tools/katalog-pdf.mjs`, potem build jeszcze raz i commit PDF. Katalog dla firm (ceny netto): `KAT=b2b python3 tools/katalog.py && KAT=b2b node tools/katalog-pdf.mjs` → `public/pliki/katalog-firmy-aiprints.pdf`. Broszura A5 do druku na Xerox C75 (A4 składane, zszywane): `KAT=b2b FMT=a5 python3 tools/katalog.py && KAT=b2b FMT=a5 node tools/katalog-pdf.mjs && python3 tools/broszura.py` → `public/pliki/druk/` (A4 i SRA3 ze spadem; nie commitowane).

## Zasady (obowiązują zawsze)
- Nigdy nie prosić o hasła, klucze API, dane FTP/SSH w czacie. Klucze wpisuje właściciel sam.
- Regulamin – ostateczne potwierdzenie przez kancelarię; podatki/faktury – księgowa.
- Licencje: nie kopiować projektów ani zdjęć konkurencji; bez zdjęć marketingowych xTool; pliki Atomm/MakerWorld tylko z licencją komercyjną; Adobe Stock na produktach tylko z licencją Extended. Bez logotypów marek (Apple, Netflix, Spotify, Google…).
- Nie publikować danych klientów ze zdjęć realizacji (np. cennik ZALUNI – tylko ceny; WAGO nie używać). DOMIX: właściciel ma zgodę (23.11.2026) – zdjęcia tablic w realizacjach bez zmian.
- Realizacje (prawdziwe zdjęcia): `src/data/realizacje.json` (galeria /realizacje) i `src/data/real-photos.json` (pierwsze zdjęcia produktów). Zdjęcia dzieci tylko za zgodą rodziców (właściciel potwierdził dla obecnych).
- Laser: nigdy nie ciąć pianki PU ani PVC.
- Logowanie bez haseł (link lub kod).
- Bez obietnic dostawy na święta. Przerwa 21.12–7.01.
- Allegro: tylko odczyt. Nie rozwiązywać CAPTCHA.
- Commity kończą się linią Co-Authored-By zgodnie z instrukcją sesji.

## Rolki i social media (stan 27.11.2026)
- Publikacja: YouTube Shorts (YouTube Studio), Instagram + Facebook jedną rolką (Meta Business Suite → Utwórz rolkę, „AiPrints.pl i aiprints.pl”), TikTok (TikTok Studio, zaznaczać „Treść wygenerowana przez AI”, gdy są ujęcia AI). Zawsze opis + hashtagi; bez linku w opisie IG/TikTok („link w bio”).
- Wgrywanie pliku z wbudowanej przeglądarki: mp4 w `public/pliki/rolki/` (nagłówek CORS w .htaccess) → pobrać w karcie aiprints.pl, przenieść kawałkami (≤100 KB) do karty serwisu, podmienić `HTMLInputElement.prototype.click` dla input[type=file] i kliknąć „Dodaj film”.
- Facebook: limit 8 postów z linkiem / miesiąc (nawet tekst „AiPrints.pl” w poście się liczy).
- Lektor: głos Artura – klon „Artur AiPrints” w Higgsfield (`voice_type: element`, `voice_id: d77fe341-a514-4897-8092-00cb474c6df9`): `text2speech_v2`, wariant elevenlabs, albo `voice_change` na nagraniu Artura (usuwa pogłos, zachowuje tempo). Zapasowo głos Arthur `30fc8796-ceb6-4a66-b3a7-4a145ef7f346` (preset). Na końcu „ej aj prints kropka pe el”. Prawdziwa pracownia i prawdziwe maszyny – bez wymyślonych wnętrz.
- Filmy z iPhone'a są HDR (HLG, BT.2020 10 bit): przed montażem przeliczać na SDR (zscale → linear npl=100 → tonemap=hable → bt709), inaczej obraz jest wyblakły.
- Wizytówka Google: filmy max 30 s.
- Link w bio: strona `/bio` (`src/pages/bio.astro`, dane `src/data/bio.js`) – po każdej nowej rolce dopisać temat z produktami NA GÓRZE listy. Linki: TikTok/Instagram `https://aiprints.pl/bio?utm_source=tiktok|instagram&utm_medium=bio` (ustawia się w aplikacji mobilnej), YouTube – pierwszy link kanału (ustawiony 27.11.2026).

## Fine art – frazy (stan 27.11.2026)
- W reklamach, opisach, SEO i hashtagach fine art zawsze używać też: „druk pigmentowy”, „giclée”, „fine art”, „Digigraphie®”, „papier bawełniany”, „Hahnemühle”, „Epson P9500”. Hashtagi: #drukpigmentowy #fineart #giclee #digigraphie #hahnemuhle #wydrukfineart #drukartystyczny.
- Cennik papierów: `FineArtCennik.astro` na /dla-fotografow – karty papierów z opisem, zdjęciem i ceną A4–A0 (opisy w `src/data/fineart-papers.js`, ceny z catalog.json; 10 papierów = 10 produktów `fine-art-*`). Ceny papierów: koszt roli 44" z centrumpapieru.pl (27.11.2026) → cena proporcjonalna do Photo Rag Baryta (skrypt w opisie commita). Proces/Digigraphie/EIZO: /druk-dla-artystow.

## Bezpieczeństwo API
- `rate_limit()` w `api/lib.php` (IP jako skrót, 24 h): checkout 30/h, odstąpienie 5/h, kody 30/h, kalkulator 3D 40/h; kontakt ma własny limit 6/h. Modele 3D: limit 8 GB na dysku, 3MF max 600 MB po rozpakowaniu.
- Dane strukturalne: bez zmyślonych opinii (review/aggregateRating tylko z prawdziwych).

## Reklamy, wizytówka i SEO – stan 27.11.2026 (czytaj na starcie sesji)
- Google Ads (ocid 8685864612, tag AW-18592432895): PMax „Pracownia AiPrints.pl Chorzów” 20 zł/dzień (miasta Śląska) + Search „Wyszukiwarka – druk zdjęć, fine art, naklejki, folia, 3D” 15 zł/dzień (25 km od Okrężnej 98B). 27.11: +35 słów (wyrażenia) w 5 grupach, 32 wykluczenia. Konwersje: „Zakup” (/dziekujemy) i „Kontakt – telefon, WhatsApp, formularz” (`ADS_LEAD` w config.js, `window.lead()` w Base.astro). Budżetów nie zmieniać bez zgody. Weryfikacja reklamodawcy – Artur do 27.12.2026.
- Meta: konto reklamowe 362150420589780; kampanie: Prezenty świąteczne rolka (do 20.12), Fototapety i naklejki, Ruch w witrynie (do 6.12).
- TikTok: promocje 3D i fine art („Więcej obserwujących”, ~5 €/dzień); weryfikacja firmy odrzucona (wybrano KRS) – ponowić przez CEIDG.
- Wizytówka Google (location 14539092192061111941): 5,0 / 12 opinii, kategoria główna Drukarnia, 10 produktów (linki sprawdzone), usługi (także dopisane przez Google – Artur potwierdził, że wszystkie OK), godziny pn–pt 9–17, przerwa 21.12–7.01 wpisana 27.11. Link do opinii: https://g.page/r/CSmfvq_Mlh6gEBM/review (stopka + maile „Wysłane” i „Gotowe do odbioru”). Odpowiedzi na opinie i wpisy – tylko po akceptacji Artura.
- Search Console: właściwość URL https://aiprints.pl/ (konto kontakt@), sitemap odczytana 26.11. Analiza zapytań (dużo wyświetleń, mało kliknięć) – w połowie grudnia.
- Merchant Center: konto „AIPrints. Artur Dombrowski” ID 5919295181 (założone 27.11, admin kontakt@; Business Manager om-4474445483527858608 razem z Google Ads 657-215-1703; wizytówka jest w osobnym Business Managerze „AiPrints.pl” om-2447953301588129792, połączona prośbą 27.11). Źródło: https://aiprints.pl/feed/google.xml (PRODUCTS SOURCE 2, co 24 h, 258 produktów). Dostawa: 15,99 zł, darmowa od 199 zł. Zwroty: 14 dni, odsyła klient na swój koszt, w sklepie i pocztą; wyjątek `return_policy_label=personalizowane` (wszystko poza kind=ready) – tylko wadliwe. Do zrobienia: po zatwierdzeniu produktów rozważyć PMax na produkty (budżet tylko za zgodą Artura).
- NAP: tylko „AiPrints.pl, ul. Okrężna 98B, 41-500 Chorzów, 609 040 274”. Okrężna 146 = wyłącznie adres do doręczeń. Stare adresy (146, Powstańców 24/LU2) na evstudio.pl i GoWork – Artur poprawia.
- Strona główna: pasek „Widziałeś nas na TikToku?” → /bio. Do zrobienia: mocniejsze strony kategorii (kryształy 3D, prezenty ze zdjęciem, grawer, fine art, dla firm), alt zdjęć, szybkość na telefonie.

## Dziennik prac (skrót; szczegóły: `git log`, zadania na później: `DO-ZROBIENIA.md`)
- 24.11: zdjęcia do wizytówki Google i FB; DO-ZROBIENIA.md – nowa kategoria puchary/medale/statuetki (analiza konkurencji Remar, Dawar; dostawcy; landing „Puchary i medale Chorzów”).
- 25.11: strona główna (ścieżki Sklep/Usługi, sekcja usług z kadrami z pracowni, wideo, Shorts); GA4 G-R03DHVLXMW i tag Google Ads po zgodzie; linki social w stopce/kontakcie/sameAs; /kontakt – mapa ładowana po kliknięciu; Pamięć i pogrzeb: tabliczka na krzyż z pleksi, rolka + grafiki.
- 26.11: kalkulator druku 3D na /druk-3d (wycena na serwerze, kalibracja X1C/H2C, kolory, galeria modeli na wolnej licencji); cennik druku /cennik (cyfrowy A4–SRA3, UV na PCV/Dibond/akrylu); tytuły stron usług pod frazy (wielkoformat, fine art, 3D, Katowice); Consent Mode v2; weryfikacja Search Console; anonimowe statystyki lejka; feed CSV dla OpenAI Ads (SFTP w Actions); rolka druk 3D (34 s); film promocyjny pracowni 9:16 i 16:9.
- 27.11: fine art (papiery Hahnemühle/ImPrime, ceny poniżej Studio Gamut/Fotosilesia, sekcje EIZO i „10×15 vs automat”); rolka fine art z głosem Artura (klon) – opublikowana FB/IG (rolka + relacja 30 s), YT Shorts, TikTok, wizytówka Google; strona /bio; TikTok bio i promocje; Google Ads – konwersja Kontakt, słowa i wykluczenia; wizytówka – przerwa świąteczna, link do opinii; pasek TikTok na stronie głównej.
- 27.11 (wieczór): Merchant Center założony i skonfigurowany (feed, dostawa, zwroty, Ads, wizytówka); naprawione puste zdjęcia 2 produktów w feedzie.
- Zasada: po każdym dniu pracy dopisać tu jedną linię.
