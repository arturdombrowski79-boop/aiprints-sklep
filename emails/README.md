# Szablony maili AiPrints.pl

Nadawca: zamowienia@aiprints.pl · Reply-To: kontakt@aiprints.pl · kopia do archiwum.
Pola {{…}} uzupełnia backend. Źródło: src/data/emails.js (podgląd: panel → Maile do klientów).

- **potwierdzenie.html** – Potwierdzenie zamówienia (umowy) (zaraz po opłaceniu). Temat: „Zamówienie {{no}} przyjęte – potwierdzenie”. Załączniki: Regulamin-AiPrints.pdf (wersja z dnia zamówienia); Formularz-odstapienia.pdf – gdy w zamówieniu jest produkt bez personalizacji
- **projekt.html** – Projekt do akceptacji (gdy wgrasz podgląd w panelu). Temat: „Twój projekt jest gotowy – zamówienie {{no}}”
- **produkcja.html** – Projekt zaakceptowany – w produkcji (po akceptacji klienta). Temat: „Zaczynamy produkcję – zamówienie {{no}}”
- **wyslane.html** – Paczka wysłana (tracking) (po nadaniu w Apaczce). Temat: „Twoja paczka jest w drodze – {{no}}”
- **faktura.html** – Faktura (po wystawieniu (program do faktur / KSeF)). Temat: „Faktura {{invoice}} do zamówienia {{no}}”. Załączniki: Faktura-{{nr}}.pdf
- **doreczone.html** – Doręczone + prośba o opinię (3 dni po doręczeniu). Temat: „Jak Ci się podoba? – {{no}}”
- **odstapienie.html** – Potwierdzenie odstąpienia od umowy (od razu po kliknięciu „Potwierdzam odstąpienie”). Temat: „Otrzymaliśmy Twoje odstąpienie od umowy – {{no}}”
- **reklamacja.html** – Reklamacja przyjęta (po zgłoszeniu reklamacji). Temat: „Reklamacja {{rma}} przyjęta – zamówienie {{no}}”
