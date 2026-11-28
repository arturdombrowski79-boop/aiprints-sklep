<?php
// Newsletter z potwierdzeniem (double opt-in).
//  POST {email, src}         → zapis „pending” + mail „Potwierdź zapis” (szablon emails/newsletter.html)
//  GET  ?a=ok&t=TOKEN         → potwierdzenie: status „confirmed”, kod powitalny, wysyłka do MailerLite/Brevo (jeśli jest klucz)
//  GET  ?a=off&t=TOKEN        → wypisanie (link w każdym mailu)
// Zgody (treść, data, źródło, skrót IP) zostają w bazie jako dowód (RODO art. 7 ust. 1).
require __DIR__ . '/lib.php';



db()->exec('CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, status TEXT, token TEXT, src TEXT, consent TEXT, created TEXT, confirmed TEXT, unsub TEXT, iph TEXT, synced TEXT)');

function nl_page(string $title, string $html): never {
  header('Content-Type: text/html; charset=utf-8'); header('X-Robots-Tag: noindex');
  echo '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . htmlspecialchars($title) . ' – AiPrints.pl</title>'
    . '<body style="margin:0;background:#f3f3f2;font:16px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#141210"><main style="max-width:560px;margin:8vh auto;padding:32px;background:#fff;border-radius:28px;border:1px solid #e4e2de">'
    . '<a href="/"><img src="/img/logo.svg" alt="AiPrints.pl" height="28"></a><h1 style="font-size:30px;line-height:1.15;margin:26px 0 12px">' . htmlspecialchars($title) . '</h1>' . $html
    . '<p style="margin-top:28px"><a href="/sklep" style="display:inline-block;background:#141210;color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600">Przejdź do sklepu</a></p></main></body></html>';
  exit;
}

// zapis do zewnętrznego programu do wysyłki (tylko potwierdzeni; bez klucza – nic nie robi)
function nl_sync(string $email, string $src): bool {
  $ctx = fn(array $h, string $body) => stream_context_create(['http' => ['method' => 'POST', 'header' => implode("\r\n", $h), 'content' => $body, 'timeout' => 8, 'ignore_errors' => true]]);
  if ($k = (string)cfg('mailerlite_key', '')) {
    $body = json_encode(['email' => $email, 'groups' => array_values(array_filter([(string)cfg('mailerlite_group', '')])), 'fields' => ['source' => $src], 'status' => 'active']);
    $r = @file_get_contents('https://connect.mailerlite.com/api/subscribers', false, $ctx(['Content-Type: application/json', 'Accept: application/json', 'Authorization: Bearer ' . $k], $body));
    return $r !== false && preg_match('/\s(200|201)\s/', $http_response_header[0] ?? '') === 1;
  }
  if ($k = (string)cfg('brevo_key', '')) {
    $body = json_encode(['email' => $email, 'listIds' => array_map('intval', array_filter([(string)cfg('brevo_list', '')])), 'updateEnabled' => true, 'attributes' => ['SOURCE' => $src]]);
    $r = @file_get_contents('https://api.brevo.com/v3/contacts', false, $ctx(['Content-Type: application/json', 'Accept: application/json', 'api-key: ' . $k], $body));
    return $r !== false && preg_match('/\s(200|201|204)\s/', $http_response_header[0] ?? '') === 1;
  }
  return false;
}

$a = (string)($_GET['a'] ?? '');
if ($a === 'ok' || $a === 'off') {
  $t = (string)($_GET['t'] ?? '');
  $st = db()->prepare('SELECT * FROM subscribers WHERE token=?'); $st->execute([$t]); $s = $st->fetch();
  if (!$s || strlen($t) < 20) nl_page('Link jest nieaktualny', '<p>Ten link już nie działa. Jeśli chcesz się zapisać, wpisz adres jeszcze raz w stopce sklepu.</p>');
  if ($a === 'off') {
    db()->prepare("UPDATE subscribers SET status='unsub', unsub=? WHERE token=?")->execute([date('c'), $t]);
    nl_page('Wypisano z newslettera', '<p>Nie wyślemy już na <b>' . htmlspecialchars($s['email']) . '</b> żadnych wiadomości z newslettera. Wiadomości o Twoich zamówieniach będą przychodzić normalnie.</p>'
      . (cfg('mailerlite_key') || cfg('brevo_key') ? '<p style="color:#5c6064;font-size:14px">Jeśli dostaniesz jeszcze jeden newsletter, wypisz się też linkiem w jego stopce – usuniemy adres z programu do wysyłki najpóźniej w ciągu 2 dni.</p>' : ''));
  }
  if ($s['status'] !== 'confirmed') {
    db()->prepare("UPDATE subscribers SET status='confirmed', confirmed=?, unsub=NULL WHERE token=?")->execute([date('c'), $t]);
    if (nl_sync($s['email'], (string)$s['src'])) db()->prepare('UPDATE subscribers SET synced=? WHERE token=?')->execute([date('c'), $t]);
    ev_bump('nl', 'ok');
  }
  $code = (string)cfg('nl_code', 'WITAMY10'); $pct = (float)(cfg('codes', [])[$code] ?? 0);
  nl_page('Dziękujemy – zapis potwierdzony', '<p>Adres <b>' . htmlspecialchars($s['email']) . '</b> jest na liście. Będziemy pisać rzadko i konkretnie.</p>'
    . ($pct > 0 ? '<p style="background:#f2f3f3;border-radius:18px;padding:18px 20px">Twój kod na pierwsze zamówienie: <b style="font-size:22px;letter-spacing:.04em">' . htmlspecialchars($code) . '</b> – ' . rtrim(rtrim(number_format($pct, 1, ',', ''), '0'), ',') . '% rabatu. Wpisz go w kasie.</p>' : '')
    . '<p style="color:#5c6064;font-size:14px">Wypisać się możesz w każdej chwili – link jest w stopce każdego newslettera.</p>');
}

// ——— zapis (POST z formularza w stopce lub z kasy) ———
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Metoda niedozwolona', 405);
$in = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
if (!empty($in['website'])) out(['ok' => true]); // pułapka na boty
rate_limit('nl', 8);
$r = nl_subscribe((string)($in['email'] ?? ''), mb_substr((string)($in['src'] ?? 'stopka'), 0, 30));
if ($r === 'bad') fail('Podaj poprawny adres e-mail.');
if ($r === 'mailfail') fail('Nie udało się wysłać maila z potwierdzeniem – spróbuj za chwilę.', 500);
out(['ok' => true, 'already' => $r === 'already']);
