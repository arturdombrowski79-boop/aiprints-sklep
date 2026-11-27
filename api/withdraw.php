<?php
// „Odstąp od umowy tutaj” – zapis oświadczenia i potwierdzenie e-mailem (trwały nośnik).
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Metoda niedozwolona', 405);
rate_limit('withdraw', 5);
$in = json_decode((string)file_get_contents('php://input'), true) ?: [];
$email = filter_var(trim((string)($in['email'] ?? '')), FILTER_VALIDATE_EMAIL); $no = preg_replace('/[^A-Z0-9-]/', '', strtoupper((string)($in['no'] ?? '')));
$name = mb_substr(trim((string)($in['name'] ?? '')), 0, 120); $scope = mb_substr(implode(', ', array_map('strval', (array)($in['items'] ?? []))), 0, 1000);
if (!$email || !$no || !$name) fail('Uzupełnij numer zamówienia, e-mail i imię i nazwisko');
db()->prepare('INSERT INTO withdrawals (created, no, email, name, scope) VALUES (?,?,?,?,?)')->execute([date('c'), $no, $email, $name, $scope]);
$html = tpl('odstapienie', ['no' => $no, 'date' => date('d.m.Y'), 'scope' => $scope]);
send_mail($email, "Otrzymaliśmy Twoje odstąpienie od umowy – $no", $html, [], cfg('mail_archive') ?: null);
send_mail((string)cfg('mail_shop', 'kontakt@aiprints.pl'), "Odstąpienie od umowy – $no", "<p>" . htmlspecialchars($name) . " (" . htmlspecialchars($email) . ") odstąpił(a) od umowy w zamówieniu <b>$no</b> w zakresie: " . htmlspecialchars($scope) . '</p>');
out(['ok' => true]);
