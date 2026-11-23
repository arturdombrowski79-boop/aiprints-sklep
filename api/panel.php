<?php
// Panel jednego zamówienia dla pracowni – otwierany tajnym linkiem z maila „Nowe zamówienie”.
// Pobieranie plików klienta, numer przesyłki + mail „Wysłane”, mail „Gotowe do odbioru”.
require __DIR__ . '/lib.php';
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

$no = (string)($_REQUEST['no'] ?? '');
if (!preg_match('/^AP-\d{6}-[A-Z0-9]{4}$/', $no) || !hash_equals(panel_key($no), (string)($_REQUEST['k'] ?? ''))) { http_response_code(403); exit('Brak dostępu – użyj linku z maila o zamówieniu.'); }
$st = db()->prepare('SELECT * FROM orders WHERE no=?'); $st->execute([$no]); $o = $st->fetch();
if (!$o) { http_response_code(404); exit('Nie znaleziono zamówienia.'); }
$d = json_decode($o['data'], true) ?: [];
$self = 'panel.php?no=' . rawurlencode($no) . '&k=' . panel_key($no);
$esc = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES);

// ——— pliki klienta ———
$item_files = function (int $i) use ($no): array {
  $f = API . "/data/files/$no/item-$i.json"; if (!is_file($f)) return [];
  $a = json_decode((string)file_get_contents($f), true) ?: []; $out = [];
  foreach (['photo' => 'zdjecie', 'logo' => 'logo'] as $k => $n) if (!empty($a['files'][$k])) $out["$n"] = $a['files'][$k];
  if (!empty($a['design']['previews'])) foreach ($a['design']['previews'] as $side => $u) $out["projekt-$side"] = $u;
  if (!empty($a['design']['sides'])) { $j = 0; foreach ($a['design']['sides'] as $side => $obj) foreach ((array)($obj['objects'] ?? []) as $ob) if (($ob['type'] ?? '') === 'image' && str_starts_with((string)($ob['src'] ?? ''), 'data:')) $out['grafika-' . $side . '-' . (++$j)] = $ob['src']; }
  return $out;
};
if (isset($_GET['f'], $_GET['i'])) {
  $all = $item_files((int)$_GET['i']); $name = (string)$_GET['f'];
  if (!isset($all[$name]) || !preg_match('#^data:([a-z0-9.+/-]+);base64,(.*)$#is', $all[$name], $m)) { http_response_code(404); exit('Brak pliku.'); }
  $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/svg+xml' => 'svg', 'application/pdf' => 'pdf', 'image/gif' => 'gif'][strtolower($m[1])] ?? 'bin';
  header('Content-Type: application/octet-stream');
  header('Content-Disposition: attachment; filename="' . $no . '-poz' . ((int)$_GET['i'] + 1) . '-' . $name . '.' . $ext . '"');
  echo base64_decode($m[2]); exit;
}

// pliki przesłane przez klienta po zamówieniu (upload.php) – pobieranie bez ładowania do pamięci
$updir = API . "/data/files/$no/up";
$uploaded = []; foreach (glob("$updir/*") ?: [] as $f) if (!str_ends_with($f, '.part')) $uploaded[basename($f)] = filesize($f);
if (isset($_GET['u']) && isset($uploaded[(string)$_GET['u']])) {
  $f = "$updir/" . basename((string)$_GET['u']);
  header('Content-Type: application/octet-stream'); header('Content-Length: ' . filesize($f));
  header('Content-Disposition: attachment; filename="' . $no . '-' . basename($f) . '"'); readfile($f); exit;
}
if (isset($_GET['zip']) && $uploaded && class_exists('ZipArchive')) {
  $tmp = tempnam(sys_get_temp_dir(), 'zip'); $z = new ZipArchive(); $z->open($tmp, ZipArchive::OVERWRITE);
  foreach ($uploaded as $n => $_) $z->addFile("$updir/$n", $n); $z->close();
  header('Content-Type: application/zip'); header('Content-Length: ' . filesize($tmp)); header('Content-Disposition: attachment; filename="' . $no . '-pliki.zip"');
  readfile($tmp); unlink($tmp); exit;
}

// ——— akcje ———
const CARRIERS = ['InPost' => 'https://inpost.pl/sledzenie-przesylek?number=', 'DPD' => 'https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1=', 'DHL' => 'https://www.dhl.com/pl-pl/home/sledzenie.html?tracking-id=', 'GLS' => 'https://gls-group.com/PL/pl/sledzenie-paczek?match=', 'UPS' => 'https://www.ups.com/track?loc=pl_PL&tracknum=', 'Poczta Polska' => 'https://emonitoring.poczta-polska.pl/?numer=', 'FedEx' => 'https://www.fedex.com/fedextrack/?trknbr='];
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $first = explode(' ', trim($o['name'] ?: 'Kliencie'))[0];
  if (($_POST['a'] ?? '') === 'ship') {
    $car = isset(CARRIERS[$_POST['carrier'] ?? '']) ? $_POST['carrier'] : 'InPost';
    $tr = preg_replace('/[^A-Za-z0-9-]/', '', (string)($_POST['tracking'] ?? ''));
    if (strlen($tr) < 6) $msg = 'Wpisz numer przesyłki.';
    else {
      $d['shipping'] = ['carrier' => $car, 'tracking' => $tr, 'at' => date('c')];
      db()->prepare("UPDATE orders SET status='shipped', data=? WHERE no=?")->execute([json_encode($d, JSON_UNESCAPED_UNICODE), $no]);
      $ok = send_mail($o['email'], "Twoja paczka jest w drodze – $no", tpl('wyslane', ['no' => $no, 'first' => $first, 'carrier' => $car, 'tracking' => $tr, 'trackUrl' => CARRIERS[$car] . rawurlencode($tr)]), [], cfg('mail_archive') ?: null);
      $o['status'] = 'shipped'; $msg = $ok ? "Wysłano mail do klienta ($car, $tr)." : 'Status zapisany, ale mail się nie wysłał – sprawdź pocztę na serwerze.';
    }
  } elseif (($_POST['a'] ?? '') === 'ready') {
    $d['shipping'] = ['carrier' => 'Odbiór w pracowni', 'tracking' => '', 'at' => date('c')];
    db()->prepare("UPDATE orders SET status='ready', data=? WHERE no=?")->execute([json_encode($d, JSON_UNESCAPED_UNICODE), $no]);
    $ok = send_mail($o['email'], "Zamówienie $no gotowe do odbioru", tpl('odbior', ['no' => $no, 'first' => $first]), [], cfg('mail_archive') ?: null);
    $o['status'] = 'ready'; $msg = $ok ? 'Wysłano mail „Gotowe do odbioru”.' : 'Status zapisany, ale mail się nie wysłał.';
  }
}

$ST = ['pending' => 'czeka na płatność', 'paid' => 'opłacone', 'shipped' => 'wysłane', 'ready' => 'gotowe do odbioru', 'failed' => 'płatność nieudana', 'expired' => 'nieopłacone (wygasło)'];
$pickup = (float)($d['ship'] ?? 1) == 0 && str_contains((string)($d['shipName'] ?? ''), 'Odbiór');
?><!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title><?= $esc($no) ?> – panel</title>
<style>body{font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;background:#f3f3f2;color:#141210;margin:0;padding:24px}main{max-width:760px;margin:auto}.c{background:#fff;border:1px solid #e4e2de;border-radius:18px;padding:20px 22px;margin:14px 0}h1{font-size:26px;margin:0}h2{font-size:17px;margin:0 0 10px}.m{color:#6b6661;font-size:13.5px}a.b,button{display:inline-block;background:#141210;color:#fff;border:0;border-radius:99px;padding:10px 18px;font:600 14px system-ui;text-decoration:none;cursor:pointer}a.f{display:inline-block;border:1px solid #d6d3ce;border-radius:99px;padding:6px 12px;margin:4px 6px 0 0;color:#141210;text-decoration:none;font-size:13.5px}select,input{font:15px system-ui;padding:10px 12px;border:1px solid #d6d3ce;border-radius:12px}.ok{background:#e8f5ec;border-color:#b9dfc6}.st{display:inline-block;background:#f0eee9;border-radius:99px;padding:3px 10px;font-size:13px}</style></head><body><main>
<p class="m">AiPrints.pl · panel zamówienia (link tylko dla pracowni – nie przekazuj go dalej)</p>
<h1><?= $esc($no) ?> <span class="st"><?= $esc($ST[$o['status']] ?? $o['status']) ?></span></h1>
<?php if ($msg): ?><div class="c ok"><?= $esc($msg) ?></div><?php endif; ?>
<div class="c"><h2>Klient</h2><?= $esc($o['name']) ?> · <a href="mailto:<?= $esc($o['email']) ?>"><?= $esc($o['email']) ?></a> · <?= $esc($o['phone']) ?><br>
<?= $esc(($d['shipName'] ?? '') . (!empty($d['locker']) ? ' ' . $d['locker'] : '')) ?><?= !empty($d['address']) ? ' · ' . $esc($d['address']) : '' ?><br>
<?= !empty($d['nip']) ? 'Faktura: ' . $esc($d['firm'] ?? '') . ', NIP ' . $esc($d['nip']) . '<br>' : '' ?><span class="m">Razem <?= zl((float)$o['total']) ?> · złożone <?= $esc(date('d.m.Y H:i', strtotime($o['created']))) ?></span></div>
<div class="c"><h2>Pozycje i pliki do produkcji</h2><ol>
<?php foreach ((array)($d['items'] ?? []) as $i => $it): $fs = $item_files($i); ?>
<li style="margin-bottom:12px"><b><?= $esc($it['title']) ?></b> × <?= (int)$it['qty'] ?> – <?= zl((float)$it['price']) ?><br><span class="m"><?= $esc(implode(' · ', (array)$it['lines'])) ?></span>
<?= !empty($it['text']) ? '<br>Tekst: „' . $esc($it['text']) . '”' : '' ?><?= !empty($it['notes']) ? '<br>Uwagi: ' . nl2br($esc($it['notes'])) : '' ?><br>
<?php if ($fs): foreach ($fs as $n => $_): ?><a class="f" href="<?= $esc($self . '&i=' . $i . '&f=' . rawurlencode($n)) ?>">⬇ <?= $esc($n) ?></a><?php endforeach; else: ?><span class="m">brak plików od klienta</span><?php endif; ?></li>
<?php endforeach; ?></ol></div>
<div class="c"><h2>Pliki przesłane przez klienta (<?= count($uploaded) ?>)</h2>
<?php if ($uploaded): ?><p><a class="b" href="<?= $esc($self . '&zip=1') ?>">⬇ Pobierz wszystkie (ZIP, <?= number_format(array_sum($uploaded) / 1048576, 1, ',', ' ') ?> MB)</a></p>
<?php foreach ($uploaded as $n => $sz): ?><a class="f" href="<?= $esc($self . '&u=' . rawurlencode($n)) ?>">⬇ <?= $esc($n) ?> <span class="m"><?= number_format($sz / 1048576, 1, ',', ' ') ?> MB</span></a><?php endforeach; ?>
<?php else: ?><p class="m">Jeszcze brak. Klient dostał w mailu link „Prześlij pliki” – gdy coś wyśle, przyjdzie mail na kontakt@.</p><?php endif; ?>
<p class="m">Link dla klienta (gdyby zgubił maila): <?= $esc(rtrim((string)cfg('base_url', 'https://aiprints.pl/'), '/') . '/pliki?no=' . rawurlencode($no) . '&t=' . $o['token']) ?></p></div>
<?php if ($o['status'] !== 'pending'): ?>
<div class="c"><h2>Wysyłka</h2>
<?php if (!empty($d['shipping']['tracking'])): ?><p class="m">Wysłano: <?= $esc($d['shipping']['carrier'] . ' ' . $d['shipping']['tracking']) ?> (<?= $esc(date('d.m.Y H:i', strtotime($d['shipping']['at']))) ?>). Możesz poprawić numer i wysłać mail ponownie.</p><?php endif; ?>
<form method="post" action="<?= $esc($self) ?>" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input type="hidden" name="a" value="ship">
<select name="carrier"><?php foreach (array_keys(CARRIERS) as $c): ?><option<?= (($d['shipping']['carrier'] ?? (str_contains((string)($d['shipName'] ?? ''), 'DPD') ? 'DPD' : 'InPost')) === $c) ? ' selected' : '' ?>><?= $esc($c) ?></option><?php endforeach; ?></select>
<input name="tracking" placeholder="Numer przesyłki" value="<?= $esc($d['shipping']['tracking'] ?? '') ?>" style="flex:1;min-width:220px">
<button>Oznacz jako wysłane i powiadom klienta</button></form>
<?php if ($pickup): ?><form method="post" action="<?= $esc($self) ?>" style="margin-top:12px"><input type="hidden" name="a" value="ready"><button>Gotowe do odbioru – powiadom klienta</button></form><?php endif; ?>
<p class="m">Numer przesyłki skopiuj z Apaczki (albo z InPost/DPD) po nadaniu paczki. Klient dostanie mail z linkiem do śledzenia.</p></div>
<?php endif; ?>
</main></body></html>
