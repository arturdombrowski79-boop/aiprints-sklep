<?php
// Statystyki sklepu dla pracowni: lejek (wejścia → koszyk → płatność), źródła ruchu, porzucone płatności, wyceny 3D.
// Dostęp tajnym linkiem, który przychodzi mailem na skrzynkę pracowni (mail_shop). Dane bez IP i ciasteczek.
require __DIR__ . '/lib.php';
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
$esc = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);
$base = rtrim((string)cfg('base_url', 'https://aiprints.pl/'), '/');
$css = '<style>body{font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;background:#f3f3f2;color:#141210;margin:0;padding:20px}main{max-width:980px;margin:auto}.c{background:#fff;border:1px solid #e4e2de;border-radius:18px;padding:18px 20px;margin:14px 0;overflow-x:auto}h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:0 0 10px}.m{color:#6b665f;font-size:13px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:6px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}th{font-weight:600;color:#6b665f;font-size:12px;text-transform:uppercase;letter-spacing:.03em}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}.bar{height:8px;background:#141210;border-radius:4px}.tabs a{display:inline-block;padding:6px 12px;border:1px solid #e4e2de;border-radius:99px;margin:0 6px 6px 0;color:#141210;text-decoration:none;background:#fff}.tabs a.on{background:#141210;color:#fff}.b{display:inline-block;padding:1px 8px;border-radius:99px;font-size:12px;background:#eee}.b.paid{background:#d8f3e0}.b.expired,.b.failed{background:#fde2e0}.b.pending{background:#fff1c9}button{font:inherit;padding:10px 18px;border-radius:99px;border:0;background:#141210;color:#fff;cursor:pointer}</style>';

// ——— bez klucza: wysłanie linku na skrzynkę pracowni ———
if (!hash_equals(stats_key(), (string)($_GET['k'] ?? ''))) {
  $msg = '';
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lock = API . '/data/stats-mail.txt';
    if (is_file($lock) && time() - filemtime($lock) < 600) $msg = 'Link został już wysłany przed chwilą – sprawdź skrzynkę.';
    else {
      @touch($lock); $to = (string)cfg('mail_shop', 'kontakt@aiprints.pl'); $url = $base . '/api/stats.php?k=' . stats_key();
      send_mail($to, 'Link do statystyk sklepu AiPrints.pl', '<p>Statystyki sklepu (lejek, źródła ruchu, porzucone płatności, wyceny 3D):</p><p><a href="' . $esc($url) . '">' . $esc($url) . '</a></p><p style="color:#777;font-size:12px">Link jest tajny – nie przekazuj go dalej. Zapisz go w zakładkach.</p>');
      $msg = 'Wysłano link na skrzynkę pracowni.';
    }
  }
  http_response_code(403);
  echo "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><title>Statystyki</title>$css<main><div class=c><h1>Statystyki sklepu</h1><p class=m>Dostęp tylko z linku wysłanego na skrzynkę pracowni.</p>"
    . ($msg ? '<p><b>' . $esc($msg) . '</b></p>' : "<form method=post><button>Wyślij link na skrzynkę pracowni</button></form>") . '</div></main>';
  exit;
}

$k = stats_key();
$days = in_array((int)($_GET['d'] ?? 7), [1, 7, 30, 90], true) ? (int)$_GET['d'] : 7;
$from = date('Y-m-d', strtotime('-' . ($days - 1) . ' days'));
$db = db(); $db->exec('CREATE TABLE IF NOT EXISTS ev (day TEXT, e TEXT, p TEXT, s TEXT, n INTEGER, PRIMARY KEY (day, e, p, s))');
$q = function (string $sql, array $a = []) use ($db) { $st = $db->prepare($sql); $st->execute($a); return $st->fetchAll(); };
$sum = function (string $e, ?string $s = null) use ($q, $from) { $r = $q('SELECT COALESCE(SUM(n),0) n FROM ev WHERE day>=? AND e=?' . ($s ? ' AND s=?' : ''), array_values(array_filter([$from, $e, $s]))); return (int)$r[0]['n']; };

$orders = $q('SELECT no, created, name, email, status, total, data FROM orders WHERE created >= ? ORDER BY created DESC', [$from . 'T00:00:00']);
$ost = ['paid' => 0, 'shipped' => 0, 'ready' => 0, 'pending' => 0, 'expired' => 0, 'failed' => 0]; foreach ($orders as $o) $ost[$o['status']] = ($ost[$o['status']] ?? 0) + 1;
$paid = $ost['paid'] + $ost['shipped'] + $ost['ready'];

$entries = $sum('entry');
$funnel = [
  ['Wejścia na stronę (z zewnątrz)', $entries],
  ['Obejrzenie produktu / usługi', $sum('product')],
  ['Dodanie do koszyka', $sum('add')],
  ['Otwarcie koszyka', $sum('cart')],
  ['Otwarcie kasy (formularz dostawy)', $sum('checkout')],
  ['Przejście do płatności Stripe', $sum('pay')],
  ['Opłacone zamówienia', $paid],
];
$max = max(1, ...array_column($funnel, 1));
$SRC = ['ads' => 'Reklamy płatne (Google, ChatGPT)', 'search' => 'Wyszukiwarka (bezpłatnie)', 'social' => 'Facebook / Instagram / TikTok', 'direct' => 'Wpisany adres / zakładka', 'other' => 'Inne strony', 'int' => 'wewnętrzne'];
$ST = ['pending' => 'czeka na płatność', 'paid' => 'opłacone', 'shipped' => 'wysłane', 'ready' => 'gotowe do odbioru', 'failed' => 'płatność nieudana', 'expired' => 'nieopłacone (porzucone)'];

// wyceny 3D (pliki trzymane 7 dni)
$q3 = []; foreach (glob(API . '/data/models/*/stats.json') ?: [] as $f) { $s = json_decode((string)file_get_contents($f), true) ?: []; if (($s['at'] ?? '') >= $from) $q3[] = $s; }
usort($q3, fn($a, $b) => strcmp($b['at'] ?? '', $a['at'] ?? ''));
$contacts = []; try { $contacts = $q('SELECT at AS created, subject AS about FROM contacts WHERE at >= ? ORDER BY at DESC', [$from . 'T00:00:00']); } catch (Throwable $t) { }

$tbl = function (array $head, array $rows) use ($esc) {
  if (!$rows) return '<p class=m>Brak danych w tym okresie.</p>';
  $h = '<table><tr>'; foreach ($head as $i => $t) $h .= '<th' . ($i ? ' class=n' : '') . '>' . $esc($t) . '</th>'; $h .= '</tr>';
  foreach ($rows as $r) { $h .= '<tr>'; foreach (array_values($r) as $i => $v) $h .= '<td' . ($i ? ' class=n' : '') . '>' . $esc($v) . '</td>'; $h .= '</tr>'; }
  return $h . '</table>';
};
?><!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Statystyki – AiPrints.pl</title><?= $css ?></head><body><main>
<p class="m">AiPrints.pl · statystyki sklepu (link tylko dla pracowni – nie przekazuj go dalej)</p>
<h1>Statystyki sklepu</h1>
<div class="tabs"><?php foreach ([1 => 'Dziś', 7 => '7 dni', 30 => '30 dni', 90 => '90 dni'] as $d => $t): ?><a class="<?= $d === $days ? 'on' : '' ?>" href="?k=<?= $k ?>&d=<?= $d ?>"><?= $t ?></a><?php endforeach; ?></div>
<p class="m">Liczniki działają od 26.11.2026. Nie liczą robotów ani Twoich wizyt z urządzeń, na których otworzysz raz <a href="<?= $esc($base) ?>/?nostat=1">ten link</a> (włącza „nie licz mnie” na tym urządzeniu).</p>

<div class="c"><h2>Lejek sprzedaży</h2><table>
<?php foreach ($funnel as $i => [$t, $n]): $prev = $i ? $funnel[$i - 1][1] : 0; ?>
<tr><td style="width:38%"><?= $esc($t) ?></td><td class="n" style="width:10%"><b><?= $n ?></b></td><td><div class="bar" style="width:<?= max(1, round($n / $max * 100)) ?>%"></div></td><td class="n m" style="width:14%"><?= $i && $prev ? round($n / $prev * 100) . '% z poprz.' : '' ?></td></tr>
<?php endforeach; ?></table>
<p class="m">Porzucone na płatności: <b><?= $ost['expired'] + $ost['failed'] ?></b> · czeka na płatność: <b><?= $ost['pending'] ?></b> · wyceny w kalkulatorze 3D: <b><?= $sum('calc3d') ?></b> · zapytania z formularzy: <b><?= $sum('contact') ?></b></p></div>

<div class="c"><h2>Skąd przychodzą klienci</h2>
<?= $tbl(['Źródło', 'Wejścia'], array_map(fn($r) => [$SRC[$r['s']] ?? $r['s'], $r['n']], $q("SELECT s, SUM(n) n FROM ev WHERE day>=? AND e='entry' GROUP BY s ORDER BY n DESC", [$from]))) ?></div>

<div class="c"><h2>Na które strony wchodzą z reklam</h2>
<?= $tbl(['Strona', 'Wejścia'], array_map(fn($r) => [$r['p'], $r['n']], $q("SELECT p, SUM(n) n FROM ev WHERE day>=? AND e='entry' AND s='ads' GROUP BY p ORDER BY n DESC LIMIT 20", [$from]))) ?></div>

<div class="c"><h2>Najczęściej oglądane strony</h2>
<?= $tbl(['Strona', 'Odsłony'], array_map(fn($r) => [$r['p'], $r['n']], $q("SELECT p, SUM(n) n FROM ev WHERE day>=? AND e IN ('entry','view') GROUP BY p ORDER BY n DESC LIMIT 25", [$from]))) ?></div>

<div class="c"><h2>Produkty: obejrzane i dodane do koszyka</h2>
<?= $tbl(['Produkt', 'Obejrzane', 'Do koszyka'], array_map(fn($r) => [$r['p'], $r['v'], $r['a']], $q("SELECT p, SUM(CASE WHEN e='product' THEN n ELSE 0 END) v, SUM(CASE WHEN e='add' THEN n ELSE 0 END) a FROM ev WHERE day>=? AND e IN ('product','add') GROUP BY p ORDER BY a DESC, v DESC LIMIT 30", [$from]))) ?></div>

<div class="c"><h2>Zamówienia i porzucone płatności</h2>
<?php if (!$orders): ?><p class="m">Nikt jeszcze nie przeszedł do płatności w tym okresie.</p><?php else: ?><table><tr><th>Data</th><th>Nr</th><th>Klient</th><th>Koszyk</th><th class="n">Kwota</th><th>Status</th></tr>
<?php foreach ($orders as $o): $d = json_decode($o['data'], true) ?: []; $items = implode(', ', array_map(fn($i) => ($i['qty'] ?? 1) . '× ' . ($i['title'] ?? $i['slug'] ?? ''), (array)($d['items'] ?? []))); ?>
<tr><td><?= $esc(date('d.m H:i', strtotime($o['created']))) ?></td><td><a href="panel.php?no=<?= rawurlencode($o['no']) ?>&k=<?= panel_key($o['no']) ?>"><?= $esc($o['no']) ?></a></td><td><?= $esc(explode(' ', trim((string)$o['name']))[0]) ?><br><span class="m"><?= $esc($o['email']) ?></span></td><td><?= $esc(mb_substr($items, 0, 160)) ?></td><td class="n"><?= zl((float)$o['total']) ?></td><td><span class="b <?= $esc($o['status']) ?>"><?= $esc($ST[$o['status']] ?? $o['status']) ?></span></td></tr>
<?php endforeach; ?></table><p class="m">Do porzuconych możesz napisać z kontakt@ (np. „czy coś nie zadziałało przy płatności?”) – klient sam podał adres przy zamówieniu.</p><?php endif; ?></div>

<div class="c"><h2>Wyceny w kalkulatorze druku 3D</h2>
<?= $tbl(['Kiedy', 'Pliki', 'Wymiary (mm)'], array_map(fn($s) => [date('d.m H:i', strtotime($s['at'] ?? 'now')), implode(', ', array_slice((array)($s['files'] ?? []), 0, 3)), isset($s['bbox']) ? implode(' × ', array_map(fn($v) => round((float)$v), (array)$s['bbox'])) : ''], array_slice($q3, 0, 40))) ?>
<p class="m">Pliki modeli są kasowane po 7 dniach.</p></div>

<div class="c"><h2>Zapytania z formularzy</h2>
<?= $tbl(['Kiedy', 'Temat'], array_map(fn($r) => [date('d.m H:i', strtotime($r['created'])), $r['about'] ?: '(ogólne)'], array_slice($contacts, 0, 40))) ?></div>

<div class="c"><h2>Dzień po dniu</h2>
<?= $tbl(['Dzień', 'Wejścia', 'Z reklamy', 'Do koszyka', 'Kasa', 'Płatność'], array_map(fn($r) => [$r['day'], $r['en'], $r['ad'], $r['a'], $r['c'], $r['p']], $q("SELECT day, SUM(CASE WHEN e='entry' THEN n ELSE 0 END) en, SUM(CASE WHEN e='entry' AND s='ads' THEN n ELSE 0 END) ad, SUM(CASE WHEN e='add' THEN n ELSE 0 END) a, SUM(CASE WHEN e='checkout' THEN n ELSE 0 END) c, SUM(CASE WHEN e='pay' THEN n ELSE 0 END) p FROM ev WHERE day>=? GROUP BY day ORDER BY day DESC", [$from]))) ?></div>
</main></body></html>
