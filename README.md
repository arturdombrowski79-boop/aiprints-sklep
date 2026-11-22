# AiPrints.pl – sklep

Sklep z prezentami personalizowanymi (Astro, statyczny build).

## Uruchomienie

```bash
npm install
python3 tools/catalog.py   # buduje src/data/catalog.json z bazy produktów
npx astro dev              # podgląd na http://localhost:4321
npx astro build            # wersja do wgrania: dist/
```

## Ważne pliki

- `src/data/config.js` – przerwa w pracy, czasy realizacji, identyfikatory GA4 / Meta Pixel
- `src/data/catalog.json` – katalog produktów (generowany)
- `src/pages/admin.astro` – panel pracowni (podgląd; dane w przeglądarce do czasu podłączenia backendu)
- `src/pages/konto.astro` – konto klienta (logowanie bez hasła)
- `tools/WDROZENIE.txt` – wdrożenie na LH.pl

Hasła, klucze API i dane dostępowe nie trafiają do repozytorium (`.env` jest w `.gitignore`).
