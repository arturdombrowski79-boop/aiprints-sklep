import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export function createCrystal(host) {
  const mobile = matchMedia('(max-width: 900px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const LIGHT_BG = new THREE.Color('#ebe6de'), DARK_BG = new THREE.Color('#0d0c0b');
  scene.background = LIGHT_BG.clone();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0.2, 0.9, 5.2);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.3;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.75;
  controls.target.set(0, 0.25, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfeeff, 0.5); fill.position.set(-4, 2, -2); scene.add(fill);

  // podłoga z miękkim cieniem
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.74; scene.add(shadow);

  const group = new THREE.Group(); scene.add(group);
  const dims = { s: [0.5, 0.8, 0.5], m: [0.6, 1.0, 0.6], l: [0.8, 1.2, 0.8] };
  const st = { size: 's', led: 'warm', img: null, txt: 'Zosia & Tomek', date: '24.12.2026', dark: 0, darkT: 0 };
  let glass, base, ledPlane, ledLight, cloud;

  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.35, ior: 1.5, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.03, attenuationColor: new THREE.Color('#dff1ff'), attenuationDistance: 8, envMapIntensity: 1.1, specularIntensity: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.45, metalness: 0.05 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffc27a });

  // punkty jako miękkie świecące kropki
  const pointsMat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: mobile ? 2.8 : 2.5 }, uColor: { value: new THREE.Color(0.16, 0.21, 0.29) }, uGlow: { value: 0 }, uLed: { value: new THREE.Color(1, .76, .45) }, uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `uniform float uSize;uniform float uPR;uniform float uTime;attribute float aR;varying float vR;varying float vY;
      void main(){vR=aR;vY=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uSize*uPR*(1.+aR*.6)*(3.2/-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uColor;uniform vec3 uLed;uniform float uGlow;uniform float uTime;varying float vR;varying float vY;
      void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float a=smoothstep(.5,.05,d);
      float tw=.75+.25*sin(uTime*2.+vR*40.);vec3 col=mix(uColor,mix(vec3(1.),uLed,.55+.45*clamp(.6-vY,0.,1.))*.75*tw,uGlow);
      gl_FragColor=vec4(col,a*mix(.9,.95,uGlow));}`,
    transparent: true, depthWrite: false, depthTest: true,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x8aa0b2, transparent: true, opacity: .35 });

  function textPts(str, y, h, w, out, font) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 110; const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 640, 110); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 78; x.font = `${font} ${fs}px "Instrument Serif", Georgia, serif`;
    while (x.measureText(str).width > 600 && fs > 20) { fs -= 2; x.font = `${font} ${fs}px "Instrument Serif", Georgia, serif`; }
    x.fillText(str, 320, 56); const px = x.getImageData(0, 0, 640, 110).data;
    for (let j = 0; j < 110; j++) for (let i = 0; i < 640; i++) if (px[(j * 640 + i) * 4] > 120 && Math.random() < .42)
      out.push((i / 640 - .5) * w, y + (.5 - j / 110) * h, (Math.random() - .5) * .012);
  }
  function heartPts(out, s, cy) {
    for (let n = 0; n < (mobile ? 70000 : 110000); n++) {
      const x = (Math.random() * 2 - 1) * 1.3, y = (Math.random() * 2 - 1) * 1.3, z = (Math.random() * 2 - 1) * 1.3;
      const a = x * x + 2.25 * z * z + y * y - 1, f = a * a * a - x * x * y * y * y - .1125 * z * z * y * y * y;
      if (f <= 0 && f > -.07 && Math.random() < .55) out.push(x * s, y * s + cy, z * s * .7);
    }
  }
  function photoPts(img, out, w, h, cy, depth) {
    const R = mobile ? 150 : 190, c = document.createElement('canvas'); c.width = c.height = R; const x = c.getContext('2d');
    const sc = Math.max(R / img.width, R / img.height); x.drawImage(img, (R - img.width * sc) / 2, (R - img.height * sc) / 2, img.width * sc, img.height * sc);
    const px = x.getImageData(0, 0, R, R).data;
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const k = (j * R + i) * 4, L = (.3 * px[k] + .59 * px[k + 1] + .11 * px[k + 2]) / 255;
      const r = Math.hypot(i / R - .5, (j / R - .5) * .85), fade = r > .48 ? 0 : (r > .38 ? (.48 - r) / .1 : 1);
      const p = Math.pow(L, 1.6) * fade, cnt = Math.random() < p ? (Math.random() < p ? 2 : 1) : 0;
      for (let q = 0; q < cnt; q++) out.push((i / R - .5) * w + (Math.random() - .5) * .004, cy + (.5 - j / R) * h + (Math.random() - .5) * .004, (L - .5) * depth + (Math.random() - .5) * .03);
    }
  }

  function build() {
    [glass, base, ledPlane, cloud].forEach(o => o && group.remove(o));
    if (ledLight) group.remove(ledLight);
    const d = dims[st.size], W = d[0] * 1.6, H = d[1] * 1.6, D = d[2] * 1.6, y0 = -0.55;
    glass = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 5, 0.025), glassMat); glass.position.y = y0 + H / 2; glass.renderOrder = 1;
    const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W * .998, H * .998, D * .998)), edgeMat); glass.add(eg); group.add(glass);
    if (st.led !== 'none') {
      const bw = W + 0.26;
      base = new THREE.Mesh(new RoundedBoxGeometry(bw, 0.19, bw, 4, 0.03), woodMat); base.position.y = y0 - 0.095; group.add(base);
      ledPlane = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, D * 0.92), ledMat); ledPlane.rotation.x = -Math.PI / 2; ledPlane.position.y = y0 + 0.002; group.add(ledPlane);
      ledLight = new THREE.PointLight(0xffc27a, 0, 3); ledLight.position.set(0, y0 + 0.1, 0); group.add(ledLight);
    }
    shadow.position.y = st.led !== 'none' ? y0 - 0.19 : y0 - 0.002;
    const pts = [], top = y0 + H, picH = H * .6, picCy = top - H * .08 - picH / 2;
    if (st.img) photoPts(st.img, pts, W * .82, picH, picCy, D * .45); else heartPts(pts, W * .25, picCy);
    if (st.txt) textPts(st.txt, y0 + H * .2, H * .12, W * .86, pts, 'normal');
    if (st.date) textPts(st.date, y0 + H * .09, H * .07, W * .55, pts, 'normal');
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const ar = new Float32Array(pts.length / 3); for (let i = 0; i < ar.length; i++) ar[i] = Math.random(); g.setAttribute('aR', new THREE.BufferAttribute(ar, 1));
    cloud = new THREE.Points(g, pointsMat); cloud.renderOrder = 3; group.add(cloud);
    setLed(st.led);
    const fit = { s: 5.2, m: 5.8, l: 7 }[st.size];
    camTarget = fit;
  }
  let camTarget = 5.2;
  function setLed(v) {
    st.led = v; const c = v === 'rgb' ? new THREE.Color(0.55, 0.45, 1) : new THREE.Color(1, .76, .45);
    pointsMat.uniforms.uLed.value.copy(c); ledMat.color.copy(c); if (ledLight) ledLight.color.copy(c);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0, 0.45, 0.35); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); composer.setSize(r.width, r.height); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host); resize();

  const clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(host);
  function loop() {
    requestAnimationFrame(loop); if (!visible) return;
    const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    st.dark += (st.darkT - st.dark) * (1 - Math.exp(-dt * 4));
    const k = st.dark;
    scene.background.copy(LIGHT_BG).lerp(DARK_BG, k);
    pointsMat.uniforms.uGlow.value = k; pointsMat.uniforms.uTime.value = t;
    pointsMat.blending = k > .5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (st.led === 'rgb') { const c = new THREE.Color().setHSL((t * .08) % 1, .8, .62); pointsMat.uniforms.uLed.value.copy(c); ledMat.color.copy(c); if (ledLight) ledLight.color.copy(c); }
    bloom.strength = k * 0.55;
    ledMat.color.multiplyScalar(1); if (ledPlane) ledPlane.visible = st.led !== 'none';
    if (ledLight) ledLight.intensity = 0.3 + k * 1.6;
    key.intensity = 1.4 * (1 - k * .75); fill.intensity = .5 * (1 - k * .7); scene.environmentIntensity = 1 - k * .7;
    shadow.material.opacity = 1 - k * .6; edgeMat.opacity = .35 + k * .15; edgeMat.color.setRGB(.54 + k * .3, .63 + k * .25, .7 + k * .25);
    const dist = camera.position.distanceTo(controls.target); const nd = dist + (camTarget - dist) * (1 - Math.exp(-dt * 3));
    camera.position.sub(controls.target).setLength(nd).add(controls.target);
    controls.update(); composer.render();
  }
  build(); loop();

  return {
    set(p) { Object.assign(st, p); build(); },
    setLed(v) { st.led = v; build(); },
    dark(on) { st.darkT = on ? 1 : 0; },
    view(n) { const r = camera.position.distanceTo(controls.target); const a = [[0.2, 0.9], [Math.PI / 2, 0.9], [0.3, 3.2], [0.2, 0.9]][n];
      camera.position.set(Math.sin(a[0]) * r, a[1], Math.cos(a[0]) * r); controls.autoRotate = n !== 2; },
    autoRotate(on) { controls.autoRotate = on; },
    snapshot() { composer.render(); return renderer.domElement.toDataURL('image/jpeg', .85); },
    state: st,
  };
}
