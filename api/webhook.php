<?php
// Stripe → serwer: potwierdzenie płatności, mail do klienta (z regulaminem PDF) i do sklepu.
require __DIR__ . '/lib.php';
$payload = (string)file_get_contents('php://input');
if (!stripe_verify($payload, $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '', (string)cfg('stripe_webhook'))) fail('Zły podpis', 400);
$ev = json_decode($payload, true); $type = $ev['type'] ?? ''; $s = $ev['data']['object'] ?? [];
try { db()->prepare('INSERT INTO events (id, created) VALUES (?, ?)')->execute([$ev['id'], date('c')]); } catch (Throwable $e) { out(['ok' => true, 'dup' => true]); }
$no = $s['client_reference_id'] ?? ($s['metadata']['no'] ?? '');
$st = db()->prepare('SELECT * FROM orders WHERE no=?'); $st->execute([$no]); $o = $st->fetch();
if (!$o) out(['ok' => true, 'unknown' => $no]);

if ($type === 'checkout.session.expired' && $o['status'] === 'pending') { db()->prepare("UPDATE orders SET status='expired' WHERE no=?")->execute([$no]); out(['ok' => true]); }
if ($type === 'checkout.session.async_payment_failed') { db()->prepare("UPDATE orders SET status='failed' WHERE no=?")->execute([$no]); out(['ok' => true]); }
$paid = ($type === 'checkout.session.completed' && ($s['payment_status'] ?? '') === 'paid') || $type === 'checkout.session.async_payment_succeeded';
if (!$paid || $o['status'] === 'paid') out(['ok' => true]);

$d = json_decode($o['data'], true);
$addr = $s['shipping_details']['address'] ?? ($s['collected_information']['shipping_details']['address'] ?? null);
if ($addr) $d['address'] = trim(($s['shipping_details']['name'] ?? $o['name']) . ', ' . ($addr['line1'] ?? '') . ' ' . ($addr['line2'] ?? '') . ', ' . ($addr['postal_code'] ?? '') . ' ' . ($addr['city'] ?? ''));
$d['payment'] = ['intent' => $s['payment_intent'] ?? null, 'method' => $s['payment_method_types'][0] ?? null, 'amount' => ($s['amount_total'] ?? 0) / 100];
db()->prepare("UPDATE orders SET status='paid', paid=?, data=? WHERE no=?")->execute([date('c'), json_encode($d, JSON_UNESCAPED_UNICODE), $no]);

// mail do klienta: potwierdzenie zawarcia umowy na trwałym nośniku + regulamin (i formularz, gdy są produkty bez personalizacji)
$anyRet = false; $anyPers = false; $items = [];
foreach ($d['items'] as $it) {
  if (!$it['pers']) $anyRet = true; else $anyPers = true;
  $items[] = ['{{item.title}}' => htmlspecialchars($it['title']), '{{item.lines}}' => $it['lines'] ? htmlspecialchars(implode(' · ', $it['lines'])) . ' · ' : '', '{{item.qty}}' => (string)$it['qty'], '{{item.price}}' => zl($it['price']), '{{item.sum}}' => zl($it['price'] * $it['qty']),
    '{{item.pers}}' => $it['pers'] ? '<span style="font-size:12.5px;color:#7a5600">✎ Produkt personalizowany – bez prawa odstąpienia (art. 38 ust. 1 pkt 3 u.p.k.)</span>' : '<span style="font-size:12.5px;color:#1f6b46">↺ Bez personalizacji – 14 dni na odstąpienie od umowy</span>'];
}
$wd = function (int $n) { $t = time(); while ($n > 0) { $t += 86400; if ((int)date('N', $t) < 6) $n--; } return date('d.m.Y', $t); };
$vars = ['no' => $no, 'first' => explode(' ', trim($o['name'] ?: 'Kliencie'))[0], 'date' => date('d.m.Y', strtotime($o['created'])), 'pay' => 'online',
  'delivery' => $d['shipName'] . ($d['locker'] ? ' ' . $d['locker'] : ''), 'ship' => zl($d['ship']), 'disc' => zl($d['disc']), 'total' => zl($d['total']), 'address' => $d['address'] ?? ($d['locker'] ? 'Paczkomat ' . $d['locker'] : 'Chorzów, ul. Okrężna 98B'),
  'proofBy' => $wd(2), 'lead' => '5–10 dni roboczych', 'breakNote' => cfg('break_note', ''), 'items' => $items, 'show_disc' => $d['disc'] > 0, 'show_ret' => $anyRet, 'show_brk' => (bool)cfg('break_note', ''), 'show_prs' => $anyPers, 'show_gen' => !$anyPers];
$files = ['Regulamin-AiPrints.pdf' => API . '/../docs/regulamin-aiprints.pdf'];
if ($anyRet) $files['Formularz-odstapienia.pdf'] = API . '/../docs/formularz-odstapienia.pdf';
send_mail($o['email'], "Zamówienie $no przyjęte – potwierdzenie", tpl('potwierdzenie', $vars), $files, cfg('mail_archive') ?: null);

// powiadomienie do pracowni
$h = "<h2>Nowe zamówienie $no – " . zl($d['total']) . "</h2><p>" . htmlspecialchars($o['name']) . " · " . htmlspecialchars($o['email']) . " · " . htmlspecialchars($o['phone']) . "<br>" . htmlspecialchars($vars['delivery']) . " · " . htmlspecialchars($vars['address']) . ($d['nip'] ? '<br>Faktura: ' . htmlspecialchars($d['firm']) . ', NIP ' . $d['nip'] : '') . "</p><ol>";
foreach ($d['items'] as $i => $it) $h .= '<li><b>' . htmlspecialchars($it['title']) . "</b> × {$it['qty']} – " . zl($it['price']) . '<br>' . htmlspecialchars(implode(' · ', $it['lines'])) . ($it['text'] ? '<br>Tekst: „' . htmlspecialchars($it['text']) . '”' : '') . ($it['notes'] ? '<br>Uwagi: ' . htmlspecialchars($it['notes']) . '' : '') . ($it['pers'] ? '' : '<br><i>bez personalizacji</i>') . "<br><small>pliki: api/data/files/$no/item-$i.json</small></li>";
send_mail((string)cfg('mail_shop', 'kontakt@aiprints.pl'), "Nowe zamówienie $no (" . zl($d['total']) . ')', $h . '</ol>');
out(['ok' => true]);
