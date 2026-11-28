<?php
// AiPrints.pl – wspólne funkcje backendu (PHP 8, bez zależności). Klucze tylko w api/config.php na serwerze.
declare(strict_types=1);
error_reporting(E_ALL); ini_set('display_errors', '0'); date_default_timezone_set('Europe/Warsaw');

const API = __DIR__;
function cfg(string $k, $def = null) {
  static $c = null;
  if ($c === null) $c = is_file(API . '/config.php') ? require API . '/config.php' : [];
  return $c[$k] ?? $def;
}
function out($data, int $code = 200): never {
  http_response_code($code); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE); exit;
}
function fail(string $msg, int $code = 400): never { out(['error' => $msg], $code); }

// ——— baza (SQLite w api/data, katalog zablokowany w .htaccess) ———
function db(): PDO {
  static $db = null; if ($db) return $db;
  if (!is_dir(API . '/data')) mkdir(API . '/data', 0750, true);
  $db = new PDO('sqlite:' . API . '/data/sklep.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $db->exec('PRAGMA journal_mode=WAL');
  $db->exec('CREATE TABLE IF NOT EXISTS orders (no TEXT PRIMARY KEY, created TEXT, email TEXT, name TEXT, phone TEXT, status TEXT, total REAL, data TEXT, session TEXT, paid TEXT, token TEXT)');
  $db->exec('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, created TEXT)');
  $db->exec('CREATE TABLE IF NOT EXISTS withdrawals (id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, no TEXT, email TEXT, name TEXT, scope TEXT)');
  return $db;
}
function catalog(): array { static $c = null; return $c ??= json_decode((string)file_get_contents(API . '/catalog.json'), true); }
function r2(float $v): float { return round($v + 1e-9, 2); }
function zl(float $v): string { $s = number_format($v, 2, ',', ' '); return (str_ends_with($s, ',00') ? substr($s, 0, -3) : $s) . ' zł'; }

// Cena jednostkowa liczona tak samo jak w sklepie (strona produktu / kreator), z promocją ważną w dniu zakupu.
function unit_price(array $it): float {
  if (($it['slug'] ?? '') === 'druk-3d-z-pliku') { require_once __DIR__ . '/p3d-lib.php'; return p3d_unit_price($it); } // kalkulator druku 3D
  $p = catalog()['products'][$it['slug'] ?? ''] ?? null; if (!$p) throw new Exception('Produkt niedostępny: ' . ($it['title'] ?? ''));
  $k = ($p['until'] && date('Y-m-d') <= $p['until']) ? (float)$p['k'] : 1.0;
  $qty = max(1, (int)($it['qty'] ?? 1));
  if (!empty($it['sides']) && $p['cr']) { // projekt z kreatora: cena bazowa (z promocją) + dopłata za drugą stronę
    $b = (float)$p['b']; foreach ($p['q'] as $t) if ($qty >= $t['q']) $b = (float)$t['p']; // rabaty ilościowe także w kreatorze
    $u = r2($b * $k); $sides = array_values(array_intersect(array_keys($p['cr']), (array)$it['sides']));
    if (count($sides) > 1) foreach ($sides as $s) $u += (float)$p['cr'][$s];
    return r2($u);
  }
  $u = (float)(($it['opt'] ?? null) !== null && isset($p['o'][$it['opt']]) ? $p['o'][$it['opt']] : $p['b']);
  foreach ($p['q'] as $t) if ($qty >= $t['q']) $u = (float)$t['p'];
  if (!empty($p['m2'])) return r2(r2($u * $k) * m2_area($it, $p['n'])); // cena za sztukę = stawka za m² × powierzchnia
  return r2($u * $k);
}

// wymiary w cm → powierzchnia w m² (zaokrąglona do 0,01; rozliczamy min. 1 m²)
function m2_area(array $it, string $name = ''): float {
  $w = (int)($it['w'] ?? 0); $h = (int)($it['h'] ?? 0);
  if ($w < 10 || $h < 10 || $w > 5000 || $h > 5000) throw new Exception('Podaj wymiary (szerokość i wysokość w cm): ' . $name);
  return max(1.0, round($w * $h / 10000, 2));
}

// tajny klucz do panelu zamówienia (link w mailu do pracowni); sekret z config.php – nie trzeba nic dodawać
function panel_key(string $no): string {
  $sec = (string)(cfg('panel_secret') ?: cfg('stripe_webhook') ?: cfg('stripe_secret'));
  if ($sec === '') return bin2hex(random_bytes(16)); // bez sekretu panel jest nieczynny
  return substr(hash_hmac('sha256', 'panel|' . $no, $sec), 0, 32);
}

function order_no(): string { return 'AP-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4)); }

// ——— Stripe (REST, bez biblioteki) ———
function stripe(string $method, string $path, array $params = [], ?string $idem = null): array {
  $ch = curl_init('https://api.stripe.com/v1/' . $path);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_USERPWD => cfg('stripe_secret') . ':', CURLOPT_CUSTOMREQUEST => $method, CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => array_filter(['Stripe-Version: 2026-10-28.endive', $idem ? 'Idempotency-Key: ' . $idem : null]), CURLOPT_POSTFIELDS => $method === 'GET' ? null : http_build_query($params)]);
  $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
  if ($res === false || !$code) throw new Exception('Brak połączenia z bramką płatności' . ($err ? " ($err)" : ''));
  $j = json_decode((string)$res, true) ?: [];
  if ($code >= 400) throw new Exception('Stripe: ' . ($j['error']['message'] ?? 'błąd ' . $code));
  return $j;
}
function stripe_verify(string $payload, string $header, string $secret): bool {
  $t = null; $v1 = [];
  foreach (explode(',', $header) as $part) { [$k, $v] = array_pad(explode('=', trim($part), 2), 2, ''); if ($k === 't') $t = $v; if ($k === 'v1') $v1[] = $v; }
  if (!$t || abs(time() - (int)$t) > 600) return false;
  $sig = hash_hmac('sha256', $t . '.' . $payload, $secret);
  foreach ($v1 as $s) if (hash_equals($sig, $s)) return true;
  return false;
}

// ——— maile (szablony z emails/, wysyłka mail() z domeny sklepu; załączniki PDF) ———
function tpl(string $name, array $vars): string {
  $h = (string)file_get_contents(API . '/emails/' . $name . '.html');
  if (preg_match('/<!--ITEMS-->(.*?)<!--\/ITEMS-->/s', $h, $m)) {
    $rows = ''; foreach ($vars['items'] ?? [] as $it) $rows .= strtr($m[1], $it);
    $h = str_replace($m[0], $rows, $h);
  }
  foreach (['DISC', 'RET', 'BRK', 'PRS', 'GEN', 'FIL', 'UPL'] as $blk) if (empty($vars['show_' . strtolower($blk)])) $h = preg_replace('/<!--' . $blk . '-->.*?<!--\/' . $blk . '-->/s', '', $h);
  $rep = []; foreach ($vars as $k => $v) if (is_scalar($v)) $rep['{{' . $k . '}}'] = htmlspecialchars((string)$v, ENT_QUOTES);
  return strtr($h, $rep);
}
function send_mail(string $to, string $subject, string $html, array $files = [], ?string $bcc = null, ?string $replyTo = null): bool {
  $from = cfg('mail_from', 'zamowienia@aiprints.pl'); $reply = ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) ? $replyTo : cfg('mail_reply', 'kontakt@aiprints.pl');
  $b = 'b' . bin2hex(random_bytes(8));
  $hdr = "From: AiPrints.pl <$from>\r\nReply-To: $reply\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$b\"\r\n" . ($bcc ? "Bcc: $bcc\r\n" : '');
  $body = "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html));
  foreach ($files as $name => $path) if (is_file($path))
    $body .= "--$b\r\nContent-Type: " . (str_ends_with(strtolower($name), '.pdf') ? 'application/pdf' : 'application/octet-stream') . "; name=\"$name\"\r\nContent-Disposition: attachment; filename=\"$name\"\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode((string)file_get_contents($path)));
  $body .= "--$b--";
  return mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $hdr, '-f' . $from);
}

// Czy pozycja nie zmieści się w paczkomacie (gabaryt C 41×38×64 cm). Ta sama reguła co src/data/ship.js.
function too_big(array $it): bool {
  $RIGID = ['tablica-pcv-dibond', 'wydruk-wystawowy', 'wydruk-w-ramie', 'tablica-ogloszen', 'tablica-wejscie-zarzadca', 'tablica-dla-rodzicow', 'tablica-urzedowa-szkola', 'regulamin-porzadku'];
  $ALWAYS = ['potykacz-a1', 'baner-rekrutacja', 'plakaty-edukacyjne', 'pakiet-budynek', 'grafika-drzwi-wejsciowe', 'naklejki-podlogowe-gry', 'postacie-zagladajace-drzwi'];
  $ISO = ['A2' => [42, 59.4], 'A1' => [59.4, 84.1], 'A0' => [84.1, 118.9], 'B1' => [70, 100], 'B0' => [100, 141]];
  $slug = (string)($it['slug'] ?? ''); if (in_array($slug, $ALWAYS, true)) return true;
  $d = null;
  if (!empty($it['w']) && !empty($it['h'])) $d = [(float)$it['w'], (float)$it['h']];
  else { $o = (string)($it['opt'] ?? '');
    if (preg_match('/(\d+(?:[.,]\d+)?)\s*×\s*(\d+(?:[.,]\d+)?)/u', $o, $m)) $d = [(float)str_replace(',', '.', $m[1]), (float)str_replace(',', '.', $m[2])];
    elseif (preg_match('/\b(A[0-2]|B[01])\b/', $o, $m)) $d = $ISO[$m[1]]; }
  if (!$d) return false;
  return in_array($slug, $RIGID, true) ? max($d) > 60 : min($d) > 60;
}

// ——— anonimowe statystyki (bez ciasteczek, bez IP): dzienne liczniki zdarzeń ———
function ev_bump(string $e, string $p = '', string $s = 'srv'): void {
  try {
    $db = db(); $db->exec('CREATE TABLE IF NOT EXISTS ev (day TEXT, e TEXT, p TEXT, s TEXT, n INTEGER, PRIMARY KEY (day, e, p, s))');
    $k = [date('Y-m-d'), $e, $p, $s];
    $db->prepare('INSERT OR IGNORE INTO ev VALUES (?,?,?,?,0)')->execute($k);
    $db->prepare('UPDATE ev SET n=n+1 WHERE day=? AND e=? AND p=? AND s=?')->execute($k);
  } catch (Throwable $t) { }
}
// limit żądań z jednego IP (ochrona przed zalewaniem formularzy, maili i dysku); IP trzymamy tylko jako skrót, 24 h
function rate_limit(string $act, int $max, int $per = 3600): void {
  try {
    $db = db(); $db->exec('CREATE TABLE IF NOT EXISTS hits (act TEXT, ip TEXT, at INTEGER)');
    $ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . (string)cfg('stripe_webhook', 'x')); $now = time();
    if (random_int(1, 50) === 1) $db->prepare('DELETE FROM hits WHERE at < ?')->execute([$now - 86400]);
    $n = $db->prepare('SELECT COUNT(*) FROM hits WHERE act=? AND ip=? AND at > ?'); $n->execute([$act, $ip, $now - $per]);
    if ((int)$n->fetchColumn() >= $max) fail('Zbyt wiele prób w krótkim czasie – spróbuj za chwilę albo zadzwoń: 609 040 274.', 429);
    $db->prepare('INSERT INTO hits VALUES (?,?,?)')->execute([$act, $ip, $now]);
  } catch (PDOException $e) { }
}
// tajny klucz do strony statystyk (link przychodzi mailem na skrzynkę pracowni)
function stats_key(): string {
  $sec = (string)(cfg('panel_secret') ?: cfg('stripe_webhook') ?: cfg('stripe_secret'));
  return $sec === '' ? bin2hex(random_bytes(16)) : substr(hash_hmac('sha256', 'stats|v1', $sec), 0, 32);
}
