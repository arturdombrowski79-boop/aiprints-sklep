<?php
require __DIR__ . '/lib.php';
out(['ok' => true, 'stripe' => (bool)cfg('stripe_secret'), 'test' => str_starts_with((string)cfg('stripe_secret'), 'sk_test')]);
