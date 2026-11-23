<?php
// Sprawdzenie kodu rabatowego – kody (procent) są tylko w api/config.php → 'codes'.
require __DIR__ . '/lib.php';
header('Cache-Control: no-store');
usleep(300000); // spowalnia zgadywanie kodów
$c = strtoupper(trim((string)($_GET['c'] ?? '')));
$pct = ($c !== '' && strlen($c) <= 40) ? (float)(cfg('codes', [])[$c] ?? 0) : 0;
out(['pct' => $pct > 0 && $pct < 100 ? $pct : 0]);
