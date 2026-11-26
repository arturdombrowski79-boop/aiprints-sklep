<?php
// Kalkulator druku 3D: przyjmowanie modeli przed zakupem (w kawałkach) i ich analiza.
// POST ?a=new                         → {id}
// POST ?a=up&id&n&name&size&off      (treść = kawałek ≤ 8 MB) → {have}
// POST ?a=done&id                     → {id, stats}
require __DIR__ . '/lib.php';
require __DIR__ . '/p3d-lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Metoda niedozwolona', 405);
const P3D_KEEP_DAYS = 7, P3D_MAX_FILES = 8;
$cfg = p3d_cfg(); $a = (string)($_GET['a'] ?? '');

try {
  if ($a === 'new') {
    // sprzątanie modeli starszych niż 7 dni (bez zamówienia)
    foreach (glob(API . '/data/models/*', GLOB_ONLYDIR) ?: [] as $d) if (filemtime($d) < time() - P3D_KEEP_DAYS * 86400) { array_map('unlink', glob("$d/*") ?: []); @rmdir($d); }
    $id = bin2hex(random_bytes(16)); mkdir(p3d_dir($id), 0750, true); out(['id' => $id]);
  }
  $dir = p3d_dir((string)($_GET['id'] ?? '')); if (!is_dir($dir)) fail('Model wygasł – wgraj plik ponownie.', 404);

  if ($a === 'up') {
    $n = (int)($_GET['n'] ?? -1); if ($n < 0 || $n >= P3D_MAX_FILES) fail('Najwięcej ' . P3D_MAX_FILES . ' plików naraz.');
    $orig = (string)($_GET['name'] ?? ''); $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
    if (!in_array($ext, ['stl', '3mf'], true)) fail('Kalkulator przyjmuje pliki STL i 3MF. Inne formaty (STEP, OBJ) wyślij do wyceny formularzem poniżej.');
    $size = (int)($_GET['size'] ?? 0); $off = (int)($_GET['off'] ?? 0);
    if ($size <= 0 || $size > $cfg['maxMB'] * 1048576) fail('Plik może mieć najwyżej ' . $cfg['maxMB'] . ' MB.');
    $part = "$dir/$n.$ext.part"; if ($off === 0) @unlink($part);
    $have = is_file($part) ? filesize($part) : 0; if ($off !== $have) out(['have' => $have]);
    $chunk = file_get_contents('php://input'); if ($chunk === false || $chunk === '' || strlen($chunk) > 8 * 1048576) fail('Błąd przesyłania – spróbuj ponownie.');
    if ($have + strlen($chunk) > $size) fail('Nieprawidłowy rozmiar pliku.');
    file_put_contents($part, $chunk, FILE_APPEND | LOCK_EX); $have += strlen($chunk);
    if ($have === $size) { foreach (glob("$dir/$n.*") ?: [] as $old) if ($old !== $part) @unlink($old); rename($part, "$dir/$n.$ext"); file_put_contents("$dir/$n.name", mb_substr($orig, 0, 120)); }
    out(['have' => $have]);
  }

  if ($a === 'done') {
    @set_time_limit(120); ini_set('memory_limit', '1024M');
    $files = []; foreach (glob("$dir/*.{stl,3mf}", GLOB_BRACE) ?: [] as $f) { $k = (int)basename($f); $files[$k] = [$f, (string)@file_get_contents("$dir/$k.name") ?: basename($f)]; }
    ksort($files); $files = array_values($files); if (!$files) fail('Nie przesłano pliku.');
    $st = p3d_stats($files); $st['files'] = array_column($files, 1); $st['at'] = date('c');
    file_put_contents("$dir/stats.json", json_encode($st, JSON_UNESCAPED_UNICODE)); out(['id' => basename($dir), 'stats' => $st]);
  }
  fail('Nieznana akcja');
} catch (Throwable $e) { error_log('p3d: ' . $e->getMessage()); fail($e->getMessage(), 422); }
