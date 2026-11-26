# Kalkulator druku 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klient wgrywa STL/3MF, wybiera kolory/rozmiar/dyszę/ilość, widzi cenę i kupi przez koszyk; serwer liczy cenę sam.

**Architecture:** Wspólny cennik w `src/data/druk3d.json` (kopiowany do `prod/api/druk3d.json`). Formuła wyceny w dwóch lustrzanych implementacjach: `src/scripts/p3d-core.js` (podgląd) i `api/p3d-lib.php` (źródło prawdy). Pliki modeli trafiają przed zakupem do `api/data/models/<id>/` przez `api/p3d.php` (kawałki jak `upload.php`), serwer parsuje siatki i zapisuje `stats.json`. `unit_price()` dla slugu `druk-3d-z-pliku` wycenia z `stats.json`; checkout kopiuje pliki do `data/files/<nr>/up/`, więc panel je pokazuje bez zmian.

**Tech Stack:** Astro + Tailwind, three.js (STLLoader, OrbitControls, fflate z three), PHP 8.3 (ZipArchive, XMLReader).

**Spec:** `docs/superpowers/specs/2026-11-26-kalkulator-druku-3d-design.md`

## Global Constraints
- Cennik: 0,25 zł/g; 4 zł/h; start 6 zł na pozycję (dzielony przez ilość w cenie sztuki); min 10 zł/szt.; marmur ×1,2 na materiał; wielokolor +5 zł/dodatkowy kolor, czas ×1,3, materiał ×1,15.
- Maks. 8 kolorów; pole robocze 320×320×320 mm; najmniejszy wymiar modelu ≥ 5 mm; plik ≤ 100 MB; ilość 1–50; skala 10–1000%.
- Dysze: „0.4” i „0.8”. Kolory tylko z palety w `druk3d.json`.
- Pliki modeli bez zamówienia kasowane po 7 dniach; brak publicznego dostępu do `api/data/`.
- Copy po polsku; bez obietnic terminów świątecznych.

## Review Focus
- Siatka nieszczelna / odwrócone normalne → objętość ujemna lub ~0: bierz |V|, a gdy |V| < 2% objętości bbox – użyj 30% objętości bbox i oznacz `approx: true`.
- 3MF z Bambu ze składnikami (`<components>`, pliki `3D/Objects/*.model`, transformacje) → objętość musi uwzględniać transformacje (test na pliku z `transform` skalującym ×2 → objętość ×8).
- Klient podmienia cenę/kolory w localStorage → serwer odrzuca nieznane kolory, złą liczbę slotów, model > pole robocze.
- Bardzo mały model (brelok 5 g) → cena = minimum 10 zł.
- ASCII STL zamiast binarnego → poprawna objętość (test na sześcianie 10 mm = 1000 mm³).

---

### Task 1: Cennik + formuła (JS i PHP, lustrzane)
**Files:** Create `src/data/druk3d.json`, `src/scripts/p3d-core.js`, `api/p3d-lib.php` (funkcja `p3d_estimate`), `tools/test-p3d.mjs`, `tools/test-p3d.php`.
**Interfaces:** Produces `estimate(stats, opts, cfg) -> {grams, hours, unit, colors}` (JS) i `p3d_estimate(array $stats, array $opts, array $cfg): array` (PHP); `stats = {vol, area, bbox:[x,y,z], slots}`, `opts = {scale, nozzle, colors:[id..], qty}`.
- [ ] Test: dla sześcianu 20 mm (vol 8000, area 2400, bbox 20³), dysza 0.4, 1 kolor, qty 1 → `unit == 10` (minimum); dla vol 400000 mm³, area 40000 → JS i PHP dają identyczne `unit` (±0,01).
- [ ] Implementacja wg wzoru ze specu; uruchom oba testy → PASS; commit.

### Task 2: Parsowanie siatek na serwerze + endpoint
**Files:** Modify `api/p3d-lib.php` (`p3d_stl_stats(string $path): array`, `p3d_3mf_stats(string $path): array`), Create `api/p3d.php`, `tools/test-p3d.php` (rozszerzony).
**Interfaces:** `api/p3d.php?a=new` → `{id}`; `?a=up&id&name&size&off` (treść = kawałek ≤ 8 MB) → `{have}`; `?a=done&id` → `{id, stats}`; `stats.parts=[{name, slot}]`, `stats.slots`, `stats.colors` (barwy z 3MF), `stats.approx`.
- [ ] Testy: sześcian 10 mm binarny i ASCII → vol 1000±0,1, area 600; 3MF z transformacją ×2 → vol 8000; 3MF z 2 obiektami i extruderami 1/2 → slots 2.
- [ ] Implementacja (STL strumieniowo, 3MF: ZipArchive + XMLReader, extruder z `Metadata/model_settings.config`, kolory z `Metadata/project_settings.config` `filament_colour`); PASS; commit.

### Task 3: Cena po stronie serwera + checkout
**Files:** Modify `api/lib.php` (`unit_price` → `p3d_unit_price($it)` dla `druk-3d-z-pliku`), `api/checkout.php` (tytuł, kopiowanie plików do `data/files/<nr>/up/`, pole `p3d` w wierszu), `tools/api_catalog.mjs` (wpis produktu `druk-3d-z-pliku`, `unit: true`, `kind: service`), `tools/build.sh` (kopiowanie `druk3d.json`).
- [ ] Test PHP: `unit_price` dla pozycji z nieznanym kolorem → wyjątek; z modelem 400×10×10 mm → wyjątek „za duży”; poprawna → równa `p3d_estimate`.
- [ ] Implementacja; PASS; commit.

### Task 4: Interfejs kalkulatora
**Files:** Create `src/components/Calc3D.astro`, `src/scripts/calc3d.js`; Modify `src/pages/druk-3d.astro` (sekcja „Wyceń od razu” nad formularzem), `src/scripts/cart.js` (`goStripe` przekazuje `p3d`).
- [ ] Wgrywanie (przeciągnij/wybierz, wiele STL lub jeden 3MF), podgląd three.js z kolorami części, lista części → wybór koloru z palety, skala %/mm, dysza, ilość, podsumowanie (waga, czas, cena), „Do koszyka” (miniatura z canvas).
- [ ] Sprawdzenie: build, podgląd strony w przeglądarce, wgranie sześcianu testowego, dodanie do koszyka; commit.

### Task 5: Weryfikacja i wdrożenie
- [ ] `bash tools/build.sh`, testy PHP/JS, przegląd całości; push na `main`; test na aiprints.pl (wgranie, cena, koszyk, bez płacenia).
