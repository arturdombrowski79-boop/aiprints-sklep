<?php
// Tworzy zamówienie i sesję Stripe Checkout. Ceny liczy serwer z api/catalog.json.
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Metoda niedozwolona', 405);
if (!cfg('stripe_secret')) fail('Płatności nie są jeszcze włączone', 503);
$raw = file_get_contents('php://input'); if (strlen((string)$raw) > 60 * 1024 * 1024) fail('Zbyt duże pliki – napisz do nas, prześlemy link do wgrania', 413);
$in = json_decode((string)$raw, true); if (!is_array($in)) fail('Nieprawidłowe dane');
$email = filter_var(trim((string)($in['email'] ?? '')), FILTER_VALIDATE_EMAIL); if (!$email) fail('Podaj poprawny e-mail');
$items = array_slice((array)($in['items'] ?? []), 0, 50); if (!$items) fail('Koszyk jest pusty');
if (empty($in['consent']['tos'])) fail('Zaakceptuj regulamin');
$anyPers = false; foreach ($items as $it) if (!empty($it['pers'])) $anyPers = true;
if ($anyPers && empty($in['consent']['pers'])) fail('Potwierdź informację o produktach personalizowanych');
$C = catalog();

try {
  $lines = []; $sub = 0.0; $boxable = 0; $rows = [];
  foreach ($items as $ix => $it) {
    $qty = max(1, min(999, (int)($it['qty'] ?? 1))); $it['qty'] = $qty;
    $u = unit_price($it); $p = $C['products'][$it['slug']];
    $title = mb_substr($p['n'] . (!empty($it['opt']) ? ' – ' . $it['opt'] : '') . (!empty($p['m2']) ? ' – ' . (int)$it['w'] . '×' . (int)$it['h'] . ' cm (' . str_replace('.', ',', (string)m2_area($it)) . ' m²)' : ''), 0, 120);
    $desc = mb_substr(implode(' · ', array_map('strval', (array)($it['lines'] ?? []))), 0, 300);
    $lines[] = ['name' => $title, 'desc' => $desc, 'amount' => (int)round($u * 100), 'qty' => $qty];
    $sub += $u * $qty; if (!$p['unit']) $boxable += $qty;
    $rows[] = ['slug' => $it['slug'], 'title' => $title, 'opt' => $it['opt'] ?? null, 'sides' => $it['sides'] ?? null, 'qty' => $qty, 'price' => $u, 'lines' => (array)($it['lines'] ?? []), 'text' => mb_substr((string)($it['text'] ?? ''), 0, 500), 'notes' => mb_substr((string)($it['notes'] ?? ''), 0, 2000), 'pers' => !empty($it['pers']), 'kind' => $p['kind'] ?? 'gift', 'w' => (int)($it['w'] ?? 0), 'h' => (int)($it['h'] ?? 0)];
  }
  if (!empty($in['add']['box']) && $boxable) { $lines[] = ['name' => 'Pudełko premium z wkładką', 'desc' => '', 'amount' => $C['add']['box'] * 100, 'qty' => $boxable]; $sub += $C['add']['box'] * $boxable; }
  if (!empty($in['add']['card']) && $boxable) { $lines[] = ['name' => 'Kartka z życzeniami', 'desc' => '', 'amount' => $C['add']['card'] * 100, 'qty' => 1]; $sub += $C['add']['card']; }
  $code = strtoupper(trim((string)($in['code'] ?? ''))); $pct = (float)(cfg('codes', [])[$code] ?? 0);
  $disc = r2($sub * $pct / 100); $after = r2($sub - $disc);
  $sk = (string)($in['delivery'] ?? '15.99'); if (!isset($C['ship'][$sk])) $sk = '15.99';
  $ship = ($after >= $C['free'] && (float)$sk > 0) ? 0.0 : (float)$sk; $total = r2($after + $ship);
  $locker = preg_replace('/[^A-Z0-9-]/', '', strtoupper((string)($in['locker'] ?? '')));
  if (str_contains($C['ship'][$sk], 'Paczkomat') && !$locker) fail('Podaj kod paczkomatu');

  $no = order_no(); $token = bin2hex(random_bytes(16));
  // pliki klienta (projekty z kreatora, zdjęcia, logo) – do produkcji
  $dir = API . '/data/files/' . $no; @mkdir($dir, 0750, true);
  foreach ((array)($in['att'] ?? []) as $ix => $a) file_put_contents("$dir/item-" . (int)$ix . '.json', json_encode($a));
  $data = ['items' => $rows, 'sub' => r2($sub), 'disc' => $disc, 'code' => $pct ? $code : '', 'ship' => $ship, 'shipName' => $C['ship'][$sk], 'locker' => $locker, 'total' => $total,
    'nip' => preg_replace('/\D/', '', (string)($in['nip'] ?? '')), 'firm' => mb_substr((string)($in['firm'] ?? ''), 0, 200), 'add' => $in['add'] ?? [], 'consent' => ['tos' => true, 'pers' => $anyPers, 'at' => date('c'), 'ip' => $_SERVER['REMOTE_ADDR'] ?? ''], 'regulamin' => 'regulamin-aiprints.pdf@' . date('Y-m-d')];
  db()->prepare('INSERT INTO orders (no, created, email, name, phone, status, total, data, token) VALUES (?,?,?,?,?,?,?,?,?)')
    ->execute([$no, date('c'), $email, mb_substr((string)($in['name'] ?? ''), 0, 120), mb_substr((string)($in['phone'] ?? ''), 0, 40), 'pending', $total, json_encode($data, JSON_UNESCAPED_UNICODE), $token]);

  $base = rtrim((string)cfg('base_url', 'https://aiprints.pl/'), '/') . '/';
  $q = ['mode' => 'payment', 'currency' => 'pln', 'locale' => 'pl', 'integration_identifier' => 'aiprints-sklep-kqzwtrmb', 'customer_email' => $email, 'client_reference_id' => $no, 'metadata' => ['no' => $no],
    'payment_intent_data' => ['description' => "Zamówienie $no", 'metadata' => ['no' => $no]],
    'success_url' => $base . "dziekujemy?no=$no&t=$token", 'cancel_url' => $base . 'sklep?platnosc=anulowana', 'line_items' => []];
  foreach ($lines as $l) $q['line_items'][] = ['quantity' => $l['qty'], 'price_data' => ['currency' => 'pln', 'unit_amount' => $l['amount'], 'product_data' => array_filter(['name' => $l['name'], 'description' => $l['desc'] ?: null])]];
  if ($ship > 0) $q['line_items'][] = ['quantity' => 1, 'price_data' => ['currency' => 'pln', 'unit_amount' => (int)round($ship * 100), 'product_data' => ['name' => 'Dostawa: ' . $C['ship'][$sk] . ($locker ? " ($locker)" : '')]]];
  if ($disc > 0) { $cp = stripe('POST', 'coupons', ['amount_off' => (int)round($disc * 100), 'currency' => 'pln', 'duration' => 'once', 'name' => "Kod $code"], "coupon-$no"); $q['discounts'] = [['coupon' => $cp['id']]]; }
  if (str_contains($C['ship'][$sk], 'Kurier')) { $q['shipping_address_collection'] = ['allowed_countries' => ['PL']]; $q['phone_number_collection'] = ['enabled' => 'true']; }
  $s = stripe('POST', 'checkout/sessions', $q, "checkout-$no"); if (empty($s['url'])) throw new Exception('Bramka płatności nie zwróciła adresu');
  db()->prepare('UPDATE orders SET session=? WHERE no=?')->execute([$s['id'], $no]);
  out(['url' => $s['url'], 'no' => $no, 'sub' => $after, 'ship' => $ship, 'total' => $total]);
} catch (Throwable $e) { error_log('checkout: ' . $e->getMessage()); fail($e->getMessage(), 422); }
