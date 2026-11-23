<?php
// Odbiera raporty CSP (Content-Security-Policy-Report-Only) i zapisuje je w api/data/csp.log (maks. 1 MB).
$f = __DIR__ . '/data/csp.log';
$raw = substr((string)file_get_contents('php://input'), 0, 4000);
if ($raw !== '' && (!is_file($f) || filesize($f) < 1048576)) {
  $j = json_decode($raw, true); $r = $j['csp-report'] ?? $j[0]['body'] ?? $j ?? [];
  $line = date('c') . ' ' . json_encode(['doc' => $r['document-uri'] ?? $r['documentURL'] ?? '', 'dir' => $r['violated-directive'] ?? $r['effectiveDirective'] ?? '', 'blocked' => $r['blocked-uri'] ?? $r['blockedURL'] ?? ''], JSON_UNESCAPED_SLASHES) . "\n";
  @file_put_contents($f, $line, FILE_APPEND | LOCK_EX);
}
http_response_code(204);
