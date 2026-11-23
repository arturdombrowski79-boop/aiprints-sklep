# AiPrints.pl – sklep (kontekst dla Claude)

Właściciel: Artur Dombrowski, AiPrints.pl, ul. Okrężna 98B, 41-500 Chorzów, NIP 6262579694, tel. 609 040 274.
Prezenty personalizowane (grawer, druk UV, kryształy 3D), druk wielkoformatowy (HP Latex 375, Summa S3), fine art (Epson P9500, D1000L), sublimacja (Epson F500), oznakowanie dla zarządców, szkoły/przedszkola, pamięć i pogrzeb.

## Jak to działa
- Astro (statyczny) + Tailwind v4 + GSAP; kreator Fabric.js. Build: `bash tools/build.sh` → `prod/`.
- Katalog produktów: `data/baza-produktow.csv` → `tools/catalog.py`. Nowe produkty: `tools/new_products.py`. Zdjęcia: `public/img/hf/<slug>-1.jpg` (1200×900).
- Promocja: `PROMO` w `src/data/config.js` (Omnibus: `data/price-history.json`, najniższa cena z 30 dni). Przerwa w pracowni: `BREAK`.
- Płatności: Stripe Checkout, backend PHP w `api/` (bez SDK). Ceny liczone na serwerze z `api/catalog.json`.
- Wdrożenie: push na `main` → GitHub Actions → rsync SSH na LH.pl (`/home/platne/serwer271550/public_html/aiprints`, port 40022). Sekrety LH_* są tylko w GitHub Secrets.
- `api/config.php` (klucze Stripe rk_live_/whsec_) istnieje TYLKO na serwerze – nigdy nie commitować, rsync go pomija. Dane zamówień: `api/data/` na serwerze.
- Skrzynki: kontakt@, zamowienia@ (nadawca maili), reklamacje@, zwroty@, firmy@ (wszystkie @aiprints.pl).
- Panel zamówienia: link „Otwórz zamówienie – pliki i wysyłka” w mailu do pracowni → `api/panel.php` (klucz HMAC z sekretu webhooka): pobieranie plików klienta, numer przesyłki + mail „Wysłane”, „Gotowe do odbioru”. `/admin` to wciąż podgląd demo.

## Zasady (obowiązują zawsze)
- Nigdy nie prosić o hasła, klucze API, dane FTP/SSH w czacie. Klucze wpisuje właściciel sam.
- Regulamin – ostateczne potwierdzenie przez kancelarię; podatki/faktury – księgowa.
- Licencje: nie kopiować projektów ani zdjęć konkurencji; bez zdjęć marketingowych xTool; pliki Atomm/MakerWorld tylko z licencją komercyjną; Adobe Stock na produktach tylko z licencją Extended. Bez logotypów marek (Apple, Netflix, Spotify, Google…).
- Nie publikować danych klientów ze zdjęć realizacji (np. cennik ZALUNI – tylko ceny; DOMIX, WAGO nie używać).
- Laser: nigdy nie ciąć pianki PU ani PVC.
- Logowanie bez haseł (link lub kod).
- Bez obietnic dostawy na święta. Przerwa 21.12–7.01.
- Allegro: tylko odczyt. Nie rozwiązywać CAPTCHA.
- Commity kończą się linią Co-Authored-By zgodnie z instrukcją sesji.
