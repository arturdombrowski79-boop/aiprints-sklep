<?php
// Status zamówienia dla strony „Dziękujemy” (numer + jednorazowy token z adresu powrotu).
require __DIR__ . '/lib.php';
$st = db()->prepare('SELECT no, status, total, email, data, token FROM orders WHERE no=?'); $st->execute([(string)($_GET['no'] ?? '')]); $o = $st->fetch();
if (!$o || !hash_equals($o['token'], (string)($_GET['t'] ?? ''))) fail('Nie znaleziono zamówienia', 404);
$d = json_decode($o['data'], true);
out(['no' => $o['no'], 'status' => $o['status'], 'shipping' => $d['shipping'] ?? null, 'total' => $o['total'], 'email' => $o['email'], 'items' => array_map(fn($i) => ['title' => $i['title'], 'qty' => $i['qty'], 'price' => $i['price'], 'pers' => $i['pers']], $d['items'])]);
