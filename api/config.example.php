<?php
// Skopiuj jako config.php NA SERWERZE (nie wrzucaj do repozytorium) i wpisz własne klucze.
// Klucz Stripe: zalecany KLUCZ OGRANICZONY (rk_…) – Dashboard → Developers → API keys → Create restricted key
//   uprawnienia: Checkout Sessions = Write, Coupons = Write, reszta None. Najpierw testowy (rk_test_…), potem produkcyjny (rk_live_…).
// Sekret webhooka: Dashboard → Developers → Webhooks → endpoint https://aiprints.pl/api/webhook.php
//   zdarzenia: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired
return [
  'stripe_secret'  => '',            // rk_test_… / rk_live_… (albo sk_…)
  'stripe_webhook' => '',            // whsec_…
  'base_url'       => 'https://aiprints.pl/',   // dla testów: 'https://aiprints.pl/test/'
  'mail_from'      => 'zamowienia@aiprints.pl',
  'mail_reply'     => 'kontakt@aiprints.pl',
  'mail_shop'      => 'kontakt@aiprints.pl',  // powiadomienia o nowych zamówieniach
  'mail_archive'   => '',            // np. archiwum@aiprints.pl – ukryta kopia każdego maila do klienta (dowód doręczenia)
  'codes'          => [],            // kody rabatowe, np. ['WITAMY10' => 10] (procent)
];
