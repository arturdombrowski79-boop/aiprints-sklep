<?php
require __DIR__ . '/lib.php';
out(['ok' => true, 'stripe' => (bool)cfg('stripe_secret'), 'test' => (bool)preg_match('/^(sk|rk)_test_/', (string)cfg('stripe_secret'))]);
