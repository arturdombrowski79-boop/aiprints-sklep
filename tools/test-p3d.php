<?php
// Testy kalkulatora druku 3D: php tools/test-p3d.php
define('API', sys_get_temp_dir() . '/p3d-test-api'); @mkdir(API . '/data/models', 0777, true);
copy(__DIR__ . '/../src/data/druk3d.json', API . '/druk3d.json');
require __DIR__ . '/../api/p3d-lib.php';
function p3d_cfg_test(): array { return json_decode(file_get_contents(__DIR__ . '/../src/data/druk3d.json'), true); }
$F = __DIR__ . '/fixtures-3d'; $cfg = p3d_cfg_test(); $fail = 0;
function ok(string $n, bool $c, $info = '') { global $fail; echo ($c ? 'PASS ' : 'FAIL ') . $n . ($c ? '' : ' → ' . json_encode($info)) . "\n"; if (!$c) $fail++; }
$near = fn($a, $b, $e = 0.01) => abs($a - $b) <= $e;

$s = p3d_stats([["$F/cube.stl", 'cube.stl']]); ok('STL binarny: objętość 1000', $near($s['vol'], 1000), $s); ok('STL binarny: powierzchnia 600', $near($s['area'], 600), $s); ok('STL binarny: wymiary', $s['bbox'] == [10.0, 10.0, 10.0], $s['bbox']);
$s = p3d_stats([["$F/cube-ascii.stl", 'cube-ascii.stl']]); ok('STL tekstowy: objętość 1000', $near($s['vol'], 1000), $s);
$s = p3d_stats([["$F/scaled.3mf", 'scaled.3mf']]); ok('3MF z transformacją ×2: objętość 8000', $near($s['vol'], 8000), $s); ok('3MF ×2: wymiary 20', $near($s['bbox'][0], 20), $s['bbox']);
$s = p3d_stats([["$F/bambu2.3mf", 'bambu2.3mf']]); ok('3MF Bambu: 2 sloty', $s['slots'] === 2, $s); ok('3MF Bambu: kolory z projektu', $s['colors'] === ['#FF0000', '#0000FF'], $s['colors']); ok('3MF Bambu: objętość 2000, szerokość 30', $near($s['vol'], 2000) && $near($s['bbox'][0], 30), $s);
$s = p3d_stats([["$F/cube.stl", 'a.stl'], ["$F/cube.stl", 'b.stl']]); ok('2 pliki STL: 2 sloty', $s['slots'] === 2, $s);

$small = ['vol' => 8000, 'area' => 2400, 'bbox' => [20, 20, 20], 'slots' => 1];
ok('mały model = minimum 10 zł', p3d_estimate($small, ['scale' => 1, 'nozzle' => '0.4', 'colors' => ['c'], 'qty' => 1], $cfg)['unit'] == 10.0);
$big = ['vol' => 400000, 'area' => 40000, 'bbox' => [80, 80, 100], 'slots' => 2];
$e1 = p3d_estimate($big, ['scale' => 1, 'nozzle' => '0.4', 'colors' => ['c', 'c'], 'qty' => 1], $cfg); $e2 = p3d_estimate($big, ['scale' => 1, 'nozzle' => '0.4', 'colors' => ['c', 'm'], 'qty' => 1], $cfg);
ok('wielokolor droższy', $e2['unit'] > $e1['unit'] + 5, [$e1, $e2]);
$e3 = p3d_estimate($big, ['scale' => 1, 'nozzle' => '0.8', 'colors' => ['c', 'c'], 'qty' => 1], $cfg); ok('dysza 0,8 tańsza', $e3['unit'] < $e1['unit'], [$e1, $e3]);
ok('check: nieznany kolor', p3d_check($big, ['scale' => 1, 'colors' => ['zzz', 'c']], $cfg) !== '');
ok('check: zła liczba kolorów', p3d_check($big, ['scale' => 1, 'colors' => ['c']], $cfg) !== '');
ok('check: za duży', p3d_check(['bbox' => [400, 10, 10], 'slots' => 1], ['scale' => 1, 'colors' => ['c']], $cfg) !== '');
ok('check: CF tylko czarny', p3d_check($big, ['scale' => 1, 'material' => 'pa6-cf', 'colors' => ['c', 'k']], $cfg) !== '');
ok('check: marmur nie w PETG', p3d_check($big, ['scale' => 1, 'material' => 'petg', 'colors' => ['mb', 'k']], $cfg) !== '');
ok('check: nieznany materiał', p3d_check($big, ['scale' => 1, 'material' => 'xxx', 'colors' => ['c', 'k']], $cfg) !== '');
$ea = p3d_estimate($big, ['scale' => 1, 'nozzle' => '0.4', 'colors' => ['k', 'k'], 'material' => 'asa', 'qty' => 1], $cfg); ok('ASA droższy od PLA', $ea['unit'] > $e1['unit'], [$ea, $e1]);
ok('check: poprawny', p3d_check($big, ['scale' => 1, 'colors' => ['c', 'm']], $cfg) === '');
// zgodność z JS
$js = json_decode(shell_exec('node ' . escapeshellarg(__DIR__ . '/test-p3d.mjs') . ' --dump'), true);
ok('JS = PHP (cena)', $js && $near($js['unit'], $e2['unit']), [$js, $e2]);
echo $fail ? "\n$fail błędów\n" : "\nWszystko OK\n"; exit($fail ? 1 : 0);
