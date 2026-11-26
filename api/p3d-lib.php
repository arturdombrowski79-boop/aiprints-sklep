<?php
// Kalkulator druku 3D – serwer: odczyt siatek STL/3MF i wycena.
// Wzór jest lustrzany do src/scripts/p3d-core.js – zmiany wprowadzaj w obu miejscach.

function p3d_cfg(): array { static $c = null; $f = API . '/druk3d.json'; if (!is_file($f)) $f = __DIR__ . '/../src/data/druk3d.json'; return $c ??= json_decode((string)file_get_contents($f), true); }

// ——— statystyki siatki ———
final class P3dAcc {
  public float $vol = 0, $area = 0; public array $mn = [INF, INF, INF], $mx = [-INF, -INF, -INF];
  public function tri(float $ax, float $ay, float $az, float $bx, float $by, float $bz, float $cx, float $cy, float $cz): void {
    $this->vol += ($ax * ($by * $cz - $bz * $cy) - $ay * ($bx * $cz - $bz * $cx) + $az * ($bx * $cy - $by * $cx)) / 6;
    $ux = $bx - $ax; $uy = $by - $ay; $uz = $bz - $az; $vx = $cx - $ax; $vy = $cy - $ay; $vz = $cz - $az;
    $nx = $uy * $vz - $uz * $vy; $ny = $uz * $vx - $ux * $vz; $nz = $ux * $vy - $uy * $vx; $this->area += sqrt($nx * $nx + $ny * $ny + $nz * $nz) / 2;
    foreach ([[$ax, $ay, $az], [$bx, $by, $bz], [$cx, $cy, $cz]] as $p) for ($d = 0; $d < 3; $d++) { if ($p[$d] < $this->mn[$d]) $this->mn[$d] = $p[$d]; if ($p[$d] > $this->mx[$d]) $this->mx[$d] = $p[$d]; }
  }
  public function out(string $name, int $slot): array { return ['name' => $name, 'slot' => $slot, 'vol' => abs($this->vol), 'area' => $this->area, 'min' => $this->mn, 'max' => $this->mx]; }
}

function p3d_stl_stats(string $path, string $name, int $slot): array {
  $sz = filesize($path); $f = fopen($path, 'rb'); $head = fread($f, 84); $n = $sz >= 84 ? unpack('V', substr($head, 80, 4))[1] : -1; $acc = new P3dAcc();
  if ($sz === 84 + 50 * $n && $n > 0) { // binarny
    $left = $n;
    while ($left > 0) {
      $k = min($left, 8192); $buf = fread($f, 50 * $k); if (strlen($buf) < 50 * $k) throw new Exception('Uszkodzony plik STL: ' . $name);
      for ($i = 0; $i < $k; $i++) { $t = unpack('g12', $buf, 50 * $i); $acc->tri($t[4], $t[5], $t[6], $t[7], $t[8], $t[9], $t[10], $t[11], $t[12]); }
      $left -= $k;
    }
  } else { // tekstowy
    fseek($f, 0); $v = [];
    while (($line = fgets($f)) !== false) {
      if (preg_match('/^\s*vertex\s+(\S+)\s+(\S+)\s+(\S+)/i', $line, $m)) { array_push($v, (float)$m[1], (float)$m[2], (float)$m[3]); if (count($v) === 9) { $acc->tri(...$v); $v = []; } }
    }
  }
  fclose($f);
  if ($acc->area <= 0) throw new Exception('Plik nie zawiera siatki 3D: ' . $name);
  return $acc->out($name, $slot);
}

// macierz 3MF: wiersze (m00 m01 m02 / m10 m11 m12 / m20 m21 m22 / m30 m31 m32), punkt' = [x y z 1] · M
function p3d_mat(?string $s): array { $a = $s ? array_map('floatval', preg_split('/\s+/', trim($s))) : []; return count($a) === 12 ? $a : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; }
function p3d_mul(array $a, array $b): array { // najpierw a, potem b
  $r = [];
  for ($i = 0; $i < 4; $i++) for ($j = 0; $j < 3; $j++) $r[$i * 3 + $j] = ($i < 3 ? 0 : $b[9 + $j]) + $a[$i * 3] * $b[$j] + $a[$i * 3 + 1] * $b[3 + $j] + $a[$i * 3 + 2] * $b[6 + $j];
  return $r;
}

// czyta obiekty z pliku .model: [id => ['v'=>[], 't'=>[], 'comp'=>[[objectid, path, transform]], 'paint'=>bool]]
function p3d_read_model(string $xml, float &$unit): array {
  $r = new XMLReader(); $r->XML($xml, null, LIBXML_PARSEHUGE | LIBXML_NONET); $objs = []; $cur = null; $build = [];
  while ($r->read()) {
    if ($r->nodeType !== XMLReader::ELEMENT) continue;
    switch ($r->localName) {
      case 'model': $u = $r->getAttribute('unit'); $unit = ['micron' => 0.001, 'centimeter' => 10, 'inch' => 25.4, 'foot' => 304.8, 'meter' => 1000][$u] ?? 1; break;
      case 'object': $cur = (string)$r->getAttribute('id'); $objs[$cur] = ['v' => [], 't' => [], 'comp' => [], 'paint' => false]; break;
      case 'vertex': if ($cur !== null) array_push($objs[$cur]['v'], (float)$r->getAttribute('x'), (float)$r->getAttribute('y'), (float)$r->getAttribute('z')); break;
      case 'triangle': if ($cur !== null) { array_push($objs[$cur]['t'], (int)$r->getAttribute('v1'), (int)$r->getAttribute('v2'), (int)$r->getAttribute('v3')); if (!$objs[$cur]['paint'] && ($r->getAttribute('paint_color') ?? '') !== '') $objs[$cur]['paint'] = true; } break;
      case 'component': if ($cur !== null) $objs[$cur]['comp'][] = [(string)$r->getAttribute('objectid'), $r->getAttribute('p:path') ?? $r->getAttributeNs('path', 'http://schemas.microsoft.com/3dmanufacturing/production/2015/06'), p3d_mat($r->getAttribute('transform'))]; break;
      case 'item': $build[] = [(string)$r->getAttribute('objectid'), p3d_mat($r->getAttribute('transform'))]; break;
    }
  }
  return [$objs, $build];
}

function p3d_3mf_stats(string $path, string $name): array {
  $z = new ZipArchive(); if ($z->open($path) !== true) throw new Exception('To nie jest prawidłowy plik 3MF: ' . $name);
  $files = []; $mainPath = null;
  for ($i = 0; $i < $z->numFiles; $i++) { $n = $z->getNameIndex($i); if (preg_match('~\.model$~i', $n)) { $files['/' . ltrim($n, '/')] = true; if (preg_match('~^/?3D/3dmodel\.model$~i', $n)) $mainPath = '/' . ltrim($n, '/'); } }
  if (!$mainPath) throw new Exception('W pliku 3MF brakuje modelu: ' . $name);
  $cache = []; $get = function (string $p) use ($z, &$cache) { if (!isset($cache[$p])) { $u = 1.0; $xml = $z->getFromName(ltrim($p, '/')); if ($xml === false) throw new Exception('Uszkodzony plik 3MF'); [$o] = p3d_read_model($xml, $u); $cache[$p] = $o; } return $cache[$p]; };
  $unit = 1.0; [$mainObjs, $build] = p3d_read_model((string)$z->getFromName(ltrim($mainPath, '/')), $unit); $cache[$mainPath] = $mainObjs;
  // przypisanie filamentów (Bambu Studio / OrcaSlicer)
  $ext = []; $partExt = []; $names = [];
  if (($cf = $z->getFromName('Metadata/model_settings.config')) !== false) {
    $x = @simplexml_load_string($cf);
    if ($x) foreach ($x->object as $o) { $oid = (string)$o['id'];
      foreach ($o->metadata as $m) { if ((string)$m['key'] === 'extruder') $ext[$oid] = (int)$m['value']; if ((string)$m['key'] === 'name') $names[$oid] = (string)$m['value']; }
      foreach ($o->part as $p) foreach ($p->metadata as $m) { if ((string)$m['key'] === 'extruder') $partExt[$oid . '/' . (string)$p['id']] = (int)$m['value']; if ((string)$m['key'] === 'name') $names[$oid . '/' . (string)$p['id']] = (string)$m['value']; } }
  }
  $fil = []; if (($ps = $z->getFromName('Metadata/project_settings.config')) !== false) { $j = json_decode($ps, true); if (is_array($j['filament_colour'] ?? null)) $fil = $j['filament_colour']; }
  $parts = []; $painted = false; $tris = 0;
  $walk = function (string $path, string $oid, array $M, int $extr, string $label) use (&$walk, $get, &$parts, &$painted, &$tris) {
    $objs = $get($path); $o = $objs[$oid] ?? null; if (!$o) return;
    if ($o['t']) {
      $acc = new P3dAcc(); $v = $o['v']; $t = $o['t']; $painted = $painted || $o['paint']; $nt = count($t); $tris += $nt / 3;
      if ($tris > 3000000) throw new Exception('Model ma zbyt wiele trójkątów – napisz do nas.');
      $tp = function (int $i) use ($v, $M) { $x = $v[3 * $i]; $y = $v[3 * $i + 1]; $zz = $v[3 * $i + 2]; return [$x * $M[0] + $y * $M[3] + $zz * $M[6] + $M[9], $x * $M[1] + $y * $M[4] + $zz * $M[7] + $M[10], $x * $M[2] + $y * $M[5] + $zz * $M[8] + $M[11]]; };
      for ($i = 0; $i < $nt; $i += 3) { $a = $tp($t[$i]); $b = $tp($t[$i + 1]); $c = $tp($t[$i + 2]); $acc->tri($a[0], $a[1], $a[2], $b[0], $b[1], $b[2], $c[0], $c[1], $c[2]); }
      $parts[] = $acc->out($label, $extr);
    }
    foreach ($o['comp'] as [$cid, $cpath, $cm]) $walk($cpath ?: $path, $cid, p3d_mul($cm, $M), $extr, $label);
  };
  foreach ($build as [$oid, $bm]) {
    $o = $mainObjs[$oid] ?? null; if (!$o) continue; $base = $ext[$oid] ?? 1; $label = $names[$oid] ?? ('Obiekt ' . $oid);
    if ($o['t']) $walk($mainPath, $oid, $bm, $base, $label);
    foreach ($o['comp'] as [$cid, $cpath, $cm]) $walk($cpath ?: $mainPath, $cid, p3d_mul($cm, $bm), $partExt[$oid . '/' . $cid] ?? $base, $names[$oid . '/' . $cid] ?? $label);
  }
  $z->close();
  if (!$parts) throw new Exception('W pliku 3MF nie znaleziono siatki: ' . $name);
  if ($unit != 1.0) foreach ($parts as &$p) { $p['vol'] *= $unit ** 3; $p['area'] *= $unit ** 2; $p['min'] = array_map(fn($v) => $v * $unit, $p['min']); $p['max'] = array_map(fn($v) => $v * $unit, $p['max']); } unset($p);
  return ['parts' => $parts, 'painted' => $painted, 'fil' => $fil];
}

// statystyki całego zlecenia z listy plików [[ścieżka, nazwa]]
function p3d_stats(array $files): array {
  $parts = []; $colors = []; $painted = false;
  if (count($files) === 1 && preg_match('~\.3mf$~i', $files[0][1])) {
    $r = p3d_3mf_stats($files[0][0], $files[0][1]); $painted = $r['painted'];
    $used = array_values(array_unique(array_column($r['parts'], 'slot'))); sort($used);
    if ($painted && count($r['fil']) > 1) $used = range(1, min(8, count($r['fil'])));
    $map = array_flip($used);
    foreach ($r['parts'] as $p) { $p['slot'] = $map[$p['slot']] ?? 0; $parts[] = $p; }
    foreach ($used as $e) $colors[] = (string)($r['fil'][$e - 1] ?? '');
  } else {
    foreach ($files as $i => [$path, $name]) {
      if (!preg_match('~\.stl$~i', $name)) throw new Exception('Kilka plików naraz – tylko STL (każdy plik to część w innym kolorze).');
      $parts[] = p3d_stl_stats($path, $name, $i); $colors[] = '';
    }
  }
  $mn = [0, 1, 2]; $mx = [0, 1, 2];
  foreach ([0, 1, 2] as $d) { $mn[$d] = min(array_map(fn($p) => $p['min'][$d], $parts)); $mx[$d] = max(array_map(fn($p) => $p['max'][$d], $parts)); }
  $bbox = array_map(fn($d) => $mx[$d] - $mn[$d], [0, 1, 2]); $vol = array_sum(array_column($parts, 'vol')); $area = array_sum(array_column($parts, 'area'));
  $bv = $bbox[0] * $bbox[1] * $bbox[2]; $approx = false; if ($bv > 0 && $vol < $bv * 0.02) { $vol = $bv * 0.3; $approx = true; }
  $slots = max(1, count($colors));
  return ['vol' => $vol, 'area' => $area, 'bbox' => $bbox, 'approx' => $approx, 'slots' => $slots, 'colors' => $colors, 'painted' => $painted,
    'parts' => array_map(fn($p) => ['name' => mb_substr($p['name'], 0, 80), 'slot' => $p['slot']], $parts)];
}

// ——— wycena (jak estimate() w p3d-core.js) ———
function p3d_estimate(array $st, array $o, ?array $cfg = null): array {
  $cfg ??= p3d_cfg(); $s = (float)($o['scale'] ?? 1) ?: 1.0; $nz = $cfg['nozzles'][(string)($o['nozzle'] ?? '0.4')] ?? $cfg['nozzles']['0.4'];
  $qty = max(1, min((int)$cfg['maxQty'], (int)round((float)($o['qty'] ?? 1))));
  $V = $st['vol'] * $s ** 3; $A = $st['area'] * $s ** 2; $H = $st['bbox'][2] * $s;
  $shell = min($V, $A * $nz['wall']); $inner = max(0, $V - $shell) * $cfg['infill']; $ext = ($shell + $inner) * $cfg['supportK'];
  $used = array_values(array_unique(array_map('strval', (array)($o['colors'] ?? [])))); $multi = count($used) > 1; $pal = array_column($cfg['colors'], null, 'id');
  $grams = $ext / 1000 * $cfg['density']; $hours = ($ext / $nz['flow'] + ($H / $nz['layer']) * $cfg['layerSec']) / 3600 + $cfg['warmMin'] / 60;
  $marble = false; foreach ($used as $id) if (!empty($pal[$id]['marble'])) $marble = true;
  $mat = $grams * $cfg['perGram'] * ($marble ? $cfg['marbleK'] : 1);
  if ($multi) { $mat *= $cfg['multi']['matK']; $hours *= $cfg['multi']['timeK']; $grams *= $cfg['multi']['matK']; }
  $extra = $multi ? (count($used) - 1) * $cfg['multi']['perColor'] : 0;
  $unit = round(max($cfg['minUnit'], $mat + $hours * $cfg['perHour'] + $extra + $cfg['start'] / $qty) + 1e-9, 2);
  return ['grams' => (int)round($grams), 'hours' => $hours, 'unit' => $unit, 'qty' => $qty, 'size' => array_map(fn($v) => round($v * $s, 1), $st['bbox']), 'colors' => count($used)];
}

function p3d_check(array $st, array $o, ?array $cfg = null): string {
  $cfg ??= p3d_cfg(); $s = (float)($o['scale'] ?? 1) ?: 1.0; $size = array_map(fn($v) => $v * $s, $st['bbox']); $pal = array_column($cfg['colors'], 'id'); $c = array_map('strval', (array)($o['colors'] ?? []));
  if ($s < 0.1 || $s > 10) return 'Skala musi być między 10% a 1000%.';
  foreach ($size as $i => $v) if ($v > $cfg['max'][$i] + 0.01) return 'Model jest za duży (' . implode(' × ', array_map(fn($v) => (int)round($v), $size)) . ' mm). Maksymalnie ' . implode(' × ', $cfg['max']) . ' mm.';
  if (max($size) < $cfg['minSize']) return 'Model jest za mały – najdłuższy bok musi mieć co najmniej 5 mm.';
  if (!$c || count($c) !== (int)$st['slots'] || array_diff($c, $pal)) return 'Wybierz kolor dla każdej części.';
  if (count(array_unique($c)) > $cfg['maxColors']) return 'Najwięcej ' . $cfg['maxColors'] . ' kolorów w jednym wydruku.';
  return '';
}

// ——— modele przed zakupem ———
function p3d_dir(string $id): string { if (!preg_match('/^[a-f0-9]{32}$/', $id)) throw new Exception('Nieprawidłowy model'); return API . '/data/models/' . $id; }
function p3d_load(string $id): array { $f = p3d_dir($id) . '/stats.json'; if (!is_file($f)) throw new Exception('Model wygasł – wgraj plik ponownie.'); return json_decode((string)file_get_contents($f), true); }

// cena za sztukę pozycji koszyka (wywołuje unit_price)
function p3d_unit_price(array $it): float {
  $o = (array)($it['p3d'] ?? []); $st = p3d_load((string)($o['id'] ?? ''));
  $o['qty'] = $it['qty'] ?? 1; $err = p3d_check($st, $o); if ($err) throw new Exception('Druk 3D: ' . $err);
  return p3d_estimate($st, $o)['unit'];
}

// nazwa i opis pozycji (Stripe, mail, panel) – z danych serwera
function p3d_line(array $it): array {
  $o = (array)($it['p3d'] ?? []); $st = p3d_load((string)($o['id'] ?? '')); $o['qty'] = $it['qty'] ?? 1; $e = p3d_estimate($st, $o); $cfg = p3d_cfg();
  $pal = array_column($cfg['colors'], 'name', 'id'); $cols = array_map(fn($c) => $pal[$c] ?? $c, (array)$o['colors']);
  $byslot = []; foreach ($st['parts'] as $p) $byslot[$p['slot']][] = $p['name'];
  $cdesc = count($cols) === 1 ? 'PLA ' . $cols[0] : 'PLA wielokolor: ' . implode(', ', array_map(fn($i, $c) => $c . ' (' . implode('/', array_unique($byslot[$i] ?? ['kolor ' . ($i + 1)])) . ')', array_keys($cols), $cols));
  $file = implode(', ', (array)($st['files'] ?? []));
  $desc = mb_substr("$file · $cdesc · dysza " . str_replace('.', ',', (string)($o['nozzle'] ?? '0.4')) . ' mm · skala ' . round(((float)($o['scale'] ?? 1)) * 100) . '% · ' . implode('×', array_map(fn($v) => str_replace('.', ',', (string)$v), $e['size'])) . ' mm · ok. ' . $e['grams'] . ' g · ok. ' . p3d_fmt_h($e['hours']) . ($st['approx'] ? ' · siatka nieszczelna – sprawdzić' : '') . ($st['painted'] ? ' · malowany w Bambu Studio' : ''), 0, 480);
  return [mb_substr('Druk 3D z pliku – ' . ($st['files'][0] ?? 'model'), 0, 120), $desc];
}
function p3d_fmt_h(float $h): string { $m = max(1, (int)round($h * 60)); return $m < 60 ? "$m min" : intdiv($m, 60) . ' h' . ($m % 60 ? ' ' . ($m % 60) . ' min' : ''); }
// kopiuje pliki modelu do zamówienia (data/files/<nr>/up/poz<N>-…), żeby pracownia pobrała je z panelu
function p3d_attach(string $id, string $up, int $ix): void {
  $dir = p3d_dir($id); if (!is_dir($dir)) return; if (!is_dir($up)) mkdir($up, 0750, true);
  foreach (glob("$dir/*.{stl,3mf}", GLOB_BRACE) ?: [] as $f) {
    $k = (int)basename($f); $orig = (string)@file_get_contents("$dir/$k.name") ?: basename($f);
    $base = preg_replace('/[^A-Za-z0-9._-]+/', '_', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', pathinfo($orig, PATHINFO_FILENAME)) ?: 'model');
    copy($f, "$up/poz" . ($ix + 1) . '-' . substr(trim($base, '._-') ?: 'model', 0, 80) . '.' . strtolower(pathinfo($f, PATHINFO_EXTENSION)));
  }
  touch($dir); // przedłuża życie modelu (sprzątanie po 7 dniach)
}
