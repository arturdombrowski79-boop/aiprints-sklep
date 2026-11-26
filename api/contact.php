<?php
// Formularze „Zapytanie o wycenę” (kontakt, produkty na wycenę, usługi) → mail do pracowni z załącznikami.
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Metoda niedozwolona', 405);
if (!empty($_POST['website'])) out(['ok' => true]); // pułapka na boty (ukryte pole)
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
db()->exec('CREATE TABLE IF NOT EXISTS contacts (at TEXT, ip TEXT, email TEXT, subject TEXT)');
$n = db()->prepare("SELECT COUNT(*) FROM contacts WHERE ip=? AND at > ?"); $n->execute([$ip, date('c', time() - 3600)]);
if ((int)$n->fetchColumn() >= 6) fail('Wysłano już kilka zapytań – spróbuj za godzinę albo zadzwoń: 609 040 274.', 429);

$f = fn($k, $l = 200) => trim(mb_substr((string)($_POST[$k] ?? ''), 0, $l));
$name = $f('name', 120); $email = $f('email', 160); $phone = $f('phone', 40); $firm = $f('firm', 160); $who = $f('who', 60); $about = $f('about', 160); $msg = $f('msg', 5000); $link = $f('link', 500);
if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($msg) < 5) fail('Uzupełnij imię, poprawny e-mail i treść zapytania.');
if (empty($_POST['consent'])) fail('Zaznacz zgodę na kontakt.');

// załączniki: do 10 plików, razem do 20 MB (większe – link)
$EXT = ['jpg', 'jpeg', 'png', 'pdf', 'svg', 'ai', 'eps', 'psd', 'tif', 'tiff', 'heic', 'webp', 'zip', 'stl', '3mf', 'step', 'stp', 'obj', 'dxf', 'xlsx', 'xls', 'csv', 'docx', 'doc', 'txt', 'cdr'];
$att = []; $tot = 0;
if (!empty($_FILES['files']['name'])) foreach ((array)$_FILES['files']['name'] as $i => $fn) {
  if (($_FILES['files']['error'][$i] ?? 4) === 4) continue;
  if ($_FILES['files']['error'][$i] !== 0) fail('Nie udało się wgrać pliku ' . $fn . ' – za duży? Wyślij link.');
  $ext = strtolower(pathinfo($fn, PATHINFO_EXTENSION)); if (!in_array($ext, $EXT, true)) fail('Nieobsługiwany rodzaj pliku: ' . $fn);
  $tot += (int)$_FILES['files']['size'][$i]; if (count($att) >= 10 || $tot > 20 * 1048576) fail('Za dużo lub za duże pliki (do 10 plików, razem 20 MB) – większe wyślij linkiem (WeTransfer, Dysk Google).');
  $safe = preg_replace('/[^A-Za-z0-9._-]+/', '_', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $fn) ?: 'plik.' . $ext);
  $att[$safe] = $_FILES['files']['tmp_name'][$i];
}

$b2b = $firm || ($who && $who !== 'Klient indywidualny');
$to = $b2b ? (string)cfg('mail_b2b', 'firmy@aiprints.pl') : (string)cfg('mail_shop', 'kontakt@aiprints.pl');
$e = fn($s) => nl2br(htmlspecialchars($s, ENT_QUOTES));
$html = '<h2>Zapytanie' . ($about ? ': ' . $e($about) : '') . '</h2><p><b>' . $e($name) . '</b>' . ($firm ? ' · ' . $e($firm) : '') . ($who ? ' · ' . $e($who) : '') . '<br><a href="mailto:' . $e($email) . '">' . $e($email) . '</a>' . ($phone ? ' · ' . $e($phone) : '') . '</p><p>' . $e($msg) . '</p>'
  . ($link ? '<p>Link do plików: <a href="' . $e($link) . '">' . $e($link) . '</a></p>' : '') . ($att ? '<p>Załączniki: ' . count($att) . '</p>' : '') . '<p style="color:#777;font-size:12px">Odpowiedz na tego maila – trafi bezpośrednio do klienta. Wysłano ze strony aiprints.pl, IP ' . $e($ip) . '.</p>';
$ok = send_mail($to, 'Zapytanie' . ($about ? ' – ' . $about : '') . ' – ' . $name, $html, $att, null, $email);
db()->prepare('INSERT INTO contacts VALUES (?,?,?,?)')->execute([date('c'), $ip, $email, $about]);
if (!$ok) fail('Nie udało się wysłać – napisz na kontakt@aiprints.pl albo zadzwoń: 609 040 274.', 500);
ev_bump('contact', mb_substr((string)($about ?? ''), 0, 60));
out(['ok' => true]);
