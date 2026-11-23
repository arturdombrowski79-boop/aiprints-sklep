<?php
// Przesyłanie plików klienta do opłaconego zamówienia (odbitki, druk, projekty) – w kawałkach, bez limitu liczby plików.
// GET  ?no&t            → lista przesłanych plików
// POST ?no&t&i&name&size&off  (treść = kawałek pliku) → dopisuje kawałek; wznowienie od 'have'
// POST ?no&t&done=1     → powiadomienie pracowni, że klient skończył wysyłać
require __DIR__ . '/lib.php';
const MAX_FILE = 2147483648, MAX_ORDER = 5368709120, MAX_COUNT = 1000, KEEP_DAYS = 90;
const EXT = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'pdf', 'psd', 'ai', 'eps', 'svg', 'heic', 'heif', 'webp', 'zip', 'cdr', 'dng', 'raw', 'cr2', 'cr3', 'nef', 'arw'];

$st = db()->prepare('SELECT no, status, created, email, name, token FROM orders WHERE no=?'); $st->execute([(string)($_GET['no'] ?? '')]); $o = $st->fetch();
if (!$o || !hash_equals($o['token'], (string)($_GET['t'] ?? ''))) fail('Nie znaleziono zamówienia', 404);
if (in_array($o['status'], ['expired', 'failed'], true)) fail('To zamówienie nie zostało opłacone.', 409);
if (strtotime($o['created']) < time() - KEEP_DAYS * 86400) fail('Minął termin przesyłania plików do tego zamówienia – napisz do nas.', 410);
$no = $o['no']; $dir = API . "/data/files/$no/up"; if (!is_dir($dir)) mkdir($dir, 0750, true);

$list = function () use ($dir): array { $r = []; foreach (glob("$dir/*") ?: [] as $f) if (!str_ends_with($f, '.part')) $r[] = ['name' => basename($f), 'size' => filesize($f)]; return $r; };
if ($_SERVER['REQUEST_METHOD'] === 'GET') out(['no' => $no, 'files' => $list()]);

if (!empty($_GET['done'])) {
  $n = count($list()); if (!$n) out(['ok' => true]);
  $panel = rtrim((string)cfg('base_url', 'https://aiprints.pl/'), '/') . '/api/panel.php?no=' . rawurlencode($no) . '&k=' . panel_key($no);
  send_mail((string)cfg('mail_shop', 'kontakt@aiprints.pl'), "Pliki do zamówienia $no ($n)", '<p>' . htmlspecialchars($o['name']) . " przesłał(a) pliki do zamówienia <b>$no</b> – razem $n.</p><p><a href=\"" . htmlspecialchars($panel) . '">Otwórz zamówienie – pliki i wysyłka</a></p>');
  out(['ok' => true, 'files' => $n]);
}

// ——— kawałek pliku ———
$i = max(-1, min(99, (int)($_GET['i'] ?? -1)));
$orig = (string)($_GET['name'] ?? ''); $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
if (!in_array($ext, EXT, true)) fail('Ten rodzaj pliku nie jest obsługiwany: .' . $ext . ' (spakuj go do ZIP)');
$base = preg_replace('/[^A-Za-z0-9._-]+/', '_', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', pathinfo($orig, PATHINFO_FILENAME)) ?: 'plik');
$name = ($i >= 0 ? 'poz' . ($i + 1) . '-' : '') . substr(trim($base, '._-') ?: 'plik', 0, 80) . '.' . $ext;
$size = (int)($_GET['size'] ?? 0); $off = (int)($_GET['off'] ?? 0);
if ($size <= 0 || $size > MAX_FILE) fail('Plik może mieć najwyżej 2 GB – większy wyślij linkiem (WeTransfer, Dysk Google).');
$final = "$dir/$name"; $part = "$final.part";
if (is_file($final) && filesize($final) === $size && $off === 0) out(['have' => $size, 'done' => true, 'name' => $name]); // już jest
if ($off === 0) {
  $used = array_sum(array_column($list(), 'size'));
  if ($used + $size > MAX_ORDER) fail('Za dużo danych w jednym zamówieniu (limit 5 GB) – resztę wyślij linkiem.');
  if (count($list()) >= MAX_COUNT) fail('Limit 1000 plików w zamówieniu – resztę spakuj do ZIP.');
  @unlink($part);
}
$have = is_file($part) ? filesize($part) : 0;
if ($off !== $have) out(['have' => $have]); // klient wznowi od właściwego miejsca
$chunk = file_get_contents('php://input');
if ($chunk === false || $chunk === '' || strlen($chunk) > 8 * 1048576) fail('Błąd przesyłania – spróbuj ponownie.');
if ($have + strlen($chunk) > $size) fail('Nieprawidłowy rozmiar pliku.');
file_put_contents($part, $chunk, FILE_APPEND | LOCK_EX); $have += strlen($chunk);
if ($have < $size) out(['have' => $have]);

// plik kompletny – sprawdź, czy zawartość zgadza się z rozszerzeniem
$h = (string)file_get_contents($part, false, null, 0, 16);
$ok = match ($ext) {
  'jpg', 'jpeg' => str_starts_with($h, "\xFF\xD8"), 'png' => str_starts_with($h, "\x89PNG"), 'pdf', 'ai' => str_contains($h, '%PDF') || str_starts_with($h, '%!PS'),
  'tif', 'tiff', 'dng', 'cr2', 'nef', 'arw' => str_starts_with($h, "II*\0") || str_starts_with($h, "MM\0*"), 'zip' => str_starts_with($h, "PK"), 'psd' => str_starts_with($h, '8BPS'),
  'webp' => str_starts_with($h, 'RIFF'), 'heic', 'heif', 'cr3' => substr($h, 4, 4) === 'ftyp', 'eps' => str_starts_with($h, '%!PS') || str_starts_with($h, "\xC5\xD0\xD3\xC6"),
  'svg' => (bool)preg_match('/^\s*(<\?xml|<svg|<!--)/', $h), default => true,
};
if (!$ok) { @unlink($part); fail("Plik $orig nie wygląda na prawidłowy plik .$ext"); }
if (is_file($final)) $final = "$dir/" . pathinfo($name, PATHINFO_FILENAME) . '-' . substr(bin2hex(random_bytes(2)), 0, 4) . '.' . $ext;
rename($part, $final);
out(['have' => $have, 'done' => true, 'name' => basename($final)]);
