<?php
// Skopiuj jako config.php NA SERWERZE (nie wrzucaj do repozytorium) i wpisz własne klucze.
// Klucze Stripe: Dashboard → Developers → API keys. Najpierw testowe (sk_test_…), potem produkcyjne (sk_live_…).
// Sekret webhooka: Dashboard → Developers → Webhooks → endpoint https://aiprints.pl/api/webhook.php
//   zdarzenia: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed
return [
  'stripe_secret'  => '',            // sk_test_… / sk_live_…
  'stripe_webhook' => '',            // whsec_…
  'base_url'       => 'https://aiprints.pl/',   // dla testów: 'https://aiprints.pl/test/'
  'mail_from'      => 'zamowienia@aiprints.pl',
  'mail_reply'     => 'kontakt@aiprints.pl',
  'mail_shop'      => 'kontakt@aiprints.pl',  // powiadomienia o nowych zamówieniach
  'mail_archive'   => '',            // np. archiwum@aiprints.pl – ukryta kopia każdego maila do klienta (dowód doręczenia)
  'codes'          => [],            // kody rabatowe, np. ['WITAMY10' => 10] (procent)
];
