import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- kształty (jednostka ~ promień 1) ----------
function shapePath(kind, s = 1) {
  const p = new THREE.Shape();
  if (kind === 'circle') { p.absarc(0, 0, s, 0, Math.PI * 2, false); }
  else if (kind === 'star') {
    const n = 5, R = s * 1.08, r = s * .5;
    for (let i = 0; i <= n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; const x = Math.cos(a) * rr, y = Math.sin(a) * rr - s * .08; i ? p.lineTo(x, y) : p.moveTo(x, y); }
  } else if (kind === 'tree') {
    const pts = [[0, 1.08], [.42, .5], [.25, .5], [.66, -.08], [.45, -.08], [.88, -.72], [.14, -.72], [.14, -1.02], [-.14, -1.02], [-.14, -.72], [-.88, -.72], [-.45, -.08], [-.66, -.08], [-.25, .5], [-.42, .5]];
    pts.forEach(([x, y], i) => i ? p.lineTo(x * s, y * s) : p.moveTo(x * s, y * s)); p.closePath();
  } else if (kind === 'heart') {
    const k = s * 1.05; p.moveTo(0, -.95 * k);
    p.bezierCurveTo(-.25 * k, -.62 * k, -1.02 * k, -.2 * k, -1.0 * k, .32 * k);
    p.bezierCurveTo(-.98 * k, .82 * k, -.38 * k, 1.0 * k, 0, .58 * k);
    p.bezierCurveTo(.38 * k, 1.0 * k, .98 * k, .82 * k, 1.0 * k, .32 * k);
    p.bezierCurveTo(1.02 * k, -.2 * k, .25 * k, -.62 * k, 0, -.95 * k);
  }
  return p;
}
const holeY = { circle: .84, star: .86, tree: .9, heart: .5 };
const holeX = { circle: 0, star: 0, tree: 0, heart: 0 };

// ---------- tekstury drewna ----------
const WOODS = {
  oak: { base: '#c99a62', dark: '#a87a45', light: '#ddb37f', burn: 'rgba(70,38,14,.88)', edge: '#4a2a12' },
  walnut: { base: '#7a5237', dark: '#5e3d27', light: '#93694b', burn: 'rgba(28,14,6,.9)', edge: '#2a170b' },
  birch: { base: '#e4cfa8', dark: '#cdb48a', light: '#f0e0c0', burn: 'rgba(88,52,22,.85)', edge: '#5a3618' },
};
const N = 1024, SPAN = 2.4; // canvas odpowiada [-1.2,1.2]
const toC = (v) => (v / SPAN + .5) * N;

function woodCanvas(w, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = w.base; g.fillRect(0, 0, N, N);
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 140; i++) {
    const y0 = rnd() * N, amp = 6 + rnd() * 26, f = .002 + rnd() * .006, ph = rnd() * 6;
    g.strokeStyle = rnd() < .5 ? w.dark : w.light; g.globalAlpha = .08 + rnd() * .22; g.lineWidth = 1 + rnd() * 3.5;
    g.beginPath(); for (let x = -10; x <= N + 10; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * .25; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  }
  g.globalAlpha = 1;
  const img = g.getImageData(0, 0, N, N), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0); return c;
}

// ---------- motywy graweru ----------
function sprig(g, x, y, len, ang, col) {
  g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = col; g.lineCap = 'round';
  g.lineWidth = Math.max(3, len * .03); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .08, len, 0); g.stroke();
  g.lineWidth = Math.max(2.2, len * .014);
  for (let t = .08; t < .98; t += .055) { const px = len * t, py = -len * .08 * 4 * t * (1 - t) * .5; const L = len * .16 * (1 - t * .55);
    [-1, 1].forEach((sd) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + L * .55, py + sd * L); g.stroke(); }); }
  g.restore();
}
function flake(g, x, y, r, col) {
  g.save(); g.translate(x, y); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = r * .09;
  for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r); g.moveTo(0, -r * .55); g.lineTo(-r * .25, -r * .78); g.moveTo(0, -r * .55); g.lineTo(r * .25, -r * .78); g.moveTo(0, -r * .3); g.lineTo(-r * .17, -r * .45); g.moveTo(0, -r * .3); g.lineTo(r * .17, -r * .45); g.stroke(); }
  g.restore();
}
function starIcon(g, x, y, r, col) { g.save(); g.translate(x, y); g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); g.restore(); }

function tracePath(g, shape, scale) {
  const pts = shape.getPoints(80); g.beginPath(); pts.forEach((p, i) => { const x = toC(p.x * scale), y = toC(-p.y * scale); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
}

function engraveCanvas(o, w) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const col = w.burn, shape = shapePath(o.shape);
  g.save(); tracePath(g, shape, 1); g.clip();
  // obramowanie
  g.strokeStyle = col; g.lineWidth = 5; tracePath(g, shape, .9); g.stroke();
  if (o.motif !== 'minimal') { g.lineWidth = 2; tracePath(g, shape, .86); g.stroke(); }
  const cx = N / 2, cy = toC(o.shape === 'tree' ? .08 : (o.shape === 'heart' ? .02 : -.02));
  if (o.motif === 'pine') {
    const L = N * .23, by = cy + N * (o.shape === 'tree' ? .2 : .2);
    sprig(g, cx - 8, by, L, Math.PI + .38, col); sprig(g, cx + 8, by, L, -.38, col);
    sprig(g, cx - 6, by + 4, L * .62, Math.PI - .05, col); sprig(g, cx + 6, by + 4, L * .62, .05, col);
    g.fillStyle = col; [[-.018, .0], [.02, -.008], [0, .018]].forEach(([dx, dy]) => { g.beginPath(); g.arc(cx + dx * N, by + dy * N, N * .013, 0, 7); g.fill(); });
  } else if (o.motif === 'snow') {
    [[-.24, -.2, .045], [.25, -.17, .035], [-.17, .22, .03], [.2, .2, .045], [0, -.3, .028], [.3, .02, .022], [-.31, .02, .022]].forEach(([dx, dy, r]) => flake(g, cx + dx * N, cy + dy * N, r * N, col));
  } else if (o.motif === 'stars') {
    [[-.22, -.22, .03], [.24, -.2, .022], [-.18, .22, .018], [.21, .2, .028], [0, -.3, .02], [.3, .0, .015], [-.3, .02, .015], [.1, .27, .012]].forEach(([dx, dy, r]) => starIcon(g, cx + dx * N, cy + dy * N, r * N, col));
  }
  // imię
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
  const name = o.name || '';
  const fam = o.font === 'script' ? '"Great Vibes"' : o.font === 'serif' ? '"Instrument Serif"' : 'Inter';
  const maxW = N * ({ circle: .6, star: .42, tree: .44, heart: .56 }[o.shape]);
  let fs = o.font === 'script' ? 200 : 150; const weight = o.font === 'sans' ? '600 ' : '';
  const label = o.font === 'sans' ? name.toUpperCase() : name;
  g.font = `${weight}${fs}px ${fam}`; while (g.measureText(label).width > maxW && fs > 40) { fs -= 4; g.font = `${weight}${fs}px ${fam}`; }
  if (o.font === 'sans') g.letterSpacing = '6px';
  g.fillText(label, cx, cy - (o.year ? N * .02 : 0));
  if (o.year) { g.font = `${N * .05}px "Instrument Serif"`; g.letterSpacing = '8px'; g.fillText(o.year, cx, cy + N * .1); }
  g.restore();
  // lekki „przypalony” rozmyty brzeg graweru
  const c2 = document.createElement('canvas'); c2.width = c2.height = N; const g2 = c2.getContext('2d');
  g2.filter = 'blur(2px)'; g2.globalAlpha = .45; g2.drawImage(c, 0, 0); g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(c, 0, 0);
  return c2;
}
function backCanvas(o, w) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  if (!o.back) return c;
  g.fillStyle = w.burn; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = o.back.split('\n').slice(0, 3); let fs = 80; g.font = `${fs}px "Instrument Serif"`;
  const maxW = N * .52; lines.forEach((l) => { while (g.measureText(l).width > maxW && fs > 30) { fs -= 3; g.font = `${fs}px "Instrument Serif"`; } });
  lines.forEach((l, i) => g.fillText(l, N / 2, N / 2 + (i - (lines.length - 1) / 2) * fs * 1.15));
  return c;
}

export function createBauble(host) {
  const mobile = matchMedia('(max-width: 900px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .7;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, .3, 6.2);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
  controls.target.set(0, .15, 0); controls.minPolarAngle = .9; controls.maxPolarAngle = 2.2;
  const key = new THREE.DirectionalLight(0xfff3e2, 2.2); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9a0, .8); rim.position.set(-3, 2, -3); scene.add(rim);
  const warm = new THREE.PointLight(0xffb45c, 0, 8); warm.position.set(-1.5, 1, 2); scene.add(warm);

  // tło choinki: rozmyte światełka
  const bokeh = new THREE.Group(); scene.add(bokeh);
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 46; i++) {
    const m = new THREE.SpriteMaterial({ map: dot, color: new THREE.Color().setHSL(.08 + Math.random() * .06, .9, .55 + Math.random() * .2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const s = new THREE.Sprite(m); const sc = .25 + Math.random() * .7; s.scale.set(sc, sc, 1);
    s.position.set((Math.random() - .5) * 9, (Math.random() - .5) * 6, -3 - Math.random() * 4); s.userData.ph = Math.random() * 6; bokeh.add(s);
  }
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x1f3b24, roughness: .9, transparent: true, opacity: 0 });
  const needles = new THREE.Group(); scene.add(needles);
  for (let i = 0; i < 260; i++) { const n = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .22, 4), branchMat); const t = i / 260; n.position.set(-2.6 + t * 5.4, 2.05 + Math.sin(t * 3) * .1, -.4 + (Math.random() - .5) * .3); n.rotation.z = (i % 2 ? 1 : -1) * (.9 + Math.random() * .3); n.rotation.x = (Math.random() - .5) * .8; needles.add(n); }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, 5.6, 8), new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: .9, transparent: true, opacity: 0 })); stem.rotation.z = Math.PI / 2 + .03; stem.position.set(0, 2.08, -.4); scene.add(stem);

  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(60,40,20,.35)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); shadow.position.set(0, -1.55, -.6); scene.add(shadow);

  const swing = new THREE.Group(); swing.position.y = 2.1; scene.add(swing);
  const orn = new THREE.Group(); swing.add(orn);
  const o = { shape: 'circle', wood: 'oak', motif: 'pine', name: 'Zosia', year: '2026', font: 'script', back: 'Wesołych Świąt\nod Babci i Dziadka', ribbon: 'red', tree: 0, treeT: 0 };
  let parts = [];
  const T = 0.07; // grubość 3 mm w skali

  function texFrom(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.repeat.set(1 / SPAN, 1 / SPAN); t.offset.set(.5, .5); return t; }
  function build() {
    parts.forEach((p) => { orn.remove(p); p.geometry?.dispose(); }); parts = [];
    const w = WOODS[o.wood], shape = shapePath(o.shape);
    const hole = new THREE.Path(); hole.absarc(holeX[o.shape], holeY[o.shape], .07, 0, Math.PI * 2, true); shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 72 });
    geo.translate(0, 0, -T / 2);
    const woodTex = texFrom(woodCanvas(w, o.wood.length * 7 + 3));
    const faceMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: .78, metalness: 0 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: w.edge, roughness: .9 });
    const body = new THREE.Mesh(geo, [faceMat, edgeMat]); body.castShadow = true; parts.push(body);
    const decalGeo = new THREE.ShapeGeometry(shapePath(o.shape), 72);
    const front = new THREE.Mesh(decalGeo, new THREE.MeshStandardMaterial({ map: texFrom(engraveCanvas(o, w)), transparent: true, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 })); front.position.z = T / 2 + .0075; parts.push(front);
    const back = new THREE.Mesh(decalGeo, new THREE.MeshStandardMaterial({ map: texFrom(backCanvas(o, w)), transparent: true, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 })); back.rotation.y = Math.PI; back.position.z = -T / 2 - .0075;
    // po obrocie o 180° tekstura się odwraca, więc backCanvas jest już lustrzany
    parts.push(back);
    // zawieszka
    const hy = holeY[o.shape];
    const rib = o.ribbon === 'red' ? { c: 0x8e1b24, r: .022, rough: .55 } : o.ribbon === 'gold' ? { c: 0xc9a24a, r: .016, rough: .3, m: .8 } : { c: 0xa98a5c, r: .014, rough: 1 };
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, hy - .05, .0), new THREE.Vector3(.06, hy + .25, 0), new THREE.Vector3(0, 2.1 - 0, 0)].map((v) => v));
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.085, rib.r, 10, 32), new THREE.MeshStandardMaterial({ color: rib.c, roughness: rib.rough, metalness: rib.m || 0 })); loop.position.set(0, hy, 0); loop.rotation.y = Math.PI / 2; parts.push(loop);
    const str = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, hy + .08, 0), new THREE.Vector3(.02, hy + .7, 0), new THREE.Vector3(0, 2.1 - .0, 0)]), 24, rib.r * .8, 8), loop.material); parts.push(str);
    if (o.ribbon === 'red') { const bow = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 24), loop.material); bow.scale.set(1.4, .7, .5); bow.position.set(0, hy + .32, .01); parts.push(bow); const bow2 = bow.clone(); bow2.rotation.z = Math.PI / 2.4; bow2.position.x = -.05; parts.push(bow2); }
    parts.forEach((p) => orn.add(p));
    orn.position.y = -2.1;
  }

  function resize() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host); resize();
  const clock = new THREE.Clock(); let visible = true, auto = true, spin = 0;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(host);
  function loop() {
    requestAnimationFrame(loop); if (!visible) return;
    const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    o.tree += (o.treeT - o.tree) * (1 - Math.exp(-dt * 3)); const k = o.tree;
    swing.rotation.z = Math.sin(t * 1.1) * .035; if (auto) spin += dt * .55; orn.rotation.y = spin + Math.sin(t * .7) * .1;
    bokeh.children.forEach((s) => { s.material.opacity = k * (.35 + .35 * Math.sin(t * 1.3 + s.userData.ph)); });
    branchMat.opacity = k; stem.material.opacity = k; needles.visible = k > .02; stem.visible = k > .02;
    warm.intensity = k * 6; key.intensity = 2.2 - k * 1; scene.environmentIntensity = .7 - k * .35; shadow.material.opacity = 1 - k;
    controls.update(); renderer.render(scene, camera);
  }
  document.fonts.load('200px "Great Vibes"').then(() => document.fonts.load('80px "Instrument Serif"')).finally(build);
  build(); loop();
  return {
    set(p) { Object.assign(o, p); build(); },
    tree(on) { o.treeT = on ? 1 : 0; },
    view(n) { const r = 6.2; const a = [[0, .3], [Math.PI, .3], [Math.PI / 2.2, .3]][n] || [0, .3]; spin = 0; orn.rotation.y = 0; camera.position.set(Math.sin(a[0]) * r, a[1], Math.cos(a[0]) * r); auto = n === 0; },
    autoRotate(on) { auto = on; },
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    state: o,
  };
}
