<?php
// Anonimowy licznik zdarzeń ze strony (navigator.sendBeacon). Nie zapisuje IP, ciasteczek ani identyfikatorów –
// tylko dzienne sumy: rodzaj zdarzenia, podstrona/produkt, źródło wejścia (reklama Google, wyszukiwarka, social…).
require __DIR__ . '/lib.php';
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|bingpreview|python|curl|wget/i', $ua)) { http_response_code(204); exit; }
$in = json_decode((string)file_get_contents('php://input', false, null, 0, 2048), true);
if (!is_array($in)) { http_response_code(204); exit; }
$e = (string)($in['e'] ?? ''); $s = (string)($in['s'] ?? 'int');
if (!in_array($e, ['entry', 'view', 'product', 'add', 'cart', 'checkout', 'pay', 'paid', 'lead'], true)) { http_response_code(204); exit; }
if (!in_array($s, ['ads', 'search', 'social', 'direct', 'other', 'int'], true)) $s = 'other';
$p = strtolower(substr(preg_replace('#[^A-Za-z0-9/._-]#', '', (string)($in['p'] ?? '')), 0, 80));
if (str_ends_with($p, '.html')) $p = substr($p, 0, -5);
ev_bump($e, $p === '' ? '/' : $p, $s);
http_response_code(204);
