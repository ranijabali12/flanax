/* =========================================================
   Flanax · caixas em WebGL (three.js)
   Geometria real com as artes do catalog.js como textura.
   Unidade do mundo = 1 px na profundidade 0.
   ========================================================= */
import * as THREE from './assets/vendor/three.module.min.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';

const FX = window.FX;
const DEG = Math.PI / 180;
const FONT_FILES = [
  ['Archivo', 'normal', '100 900', 'Archivo-VF', '62% 125%'], ['Archivo', 'italic', '100 900', 'Archivo-VF-i', '62% 125%'],
  ['Roboto Condensed', 'normal', '100 900', 'RobotoCondensed-VF', '100%'], ['Roboto Condensed', 'italic', '100 900', 'RobotoCondensed-VF-i', '100%']
];

// SVG desenhado como imagem não enxerga as fontes da página: elas vão embutidas em base64
let fontCSS = null;
async function loadFontCSS() {
  if (fontCSS !== null) return fontCSS;
  const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const faces = await Promise.all(FONT_FILES.map(async ([fam, style, w, file, st]) => {
    try { const r = await fetch(`assets/fonts/${file}.woff2`); if (!r.ok) return ''; return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-stretch:${st};src:url(data:font/woff2;base64,${b64(await r.arrayBuffer())}) format('woff2');}`; } catch (e) { return ''; }
  }));
  fontCSS = faces.join('');
  return fontCSS;
}

async function svgToCanvas(svg, w, h) {
  const css = await loadFontCSS();
  const s = svg.replace(/<svg([^>]*?)class="art"/, `<svg$1width="${w}" height="${h}"`).replace(/(<svg[^>]*>)/, `$1<defs><style>${css}</style></defs>`);
  const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
  const img = new Image(); img.src = url;
  try { await img.decode(); } catch (e) { await new Promise(r => { img.onload = r; img.onerror = r; }); }
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  return cv;
}
function tex(cv, renderer) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function stopsCanvas(stops, label) {
  const H = 512, W = 96, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  stops.forEach(([col, a, b]) => { x.fillStyle = col; x.fillRect(0, Math.floor(a * H), W, Math.ceil((b - a) * H) + 1); });
  if (label) {
    x.save(); x.translate(W / 2, H * .9); x.rotate(-Math.PI / 2);
    x.fillStyle = '#FFD200'; x.font = `italic 900 ${Math.round(W * .3)}px Barlow, "Arial Black", sans-serif`;
    x.textBaseline = 'middle'; x.fillText(label, 0, 0); x.restore();
  }
  return cv;
}
function gradCanvas(a, b) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, a); g.addColorStop(1, b);
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return cv;
}
let shadowTex = null;
function contactShadow(w, d) {
  if (!shadowTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(4,20,60,.55)'); g.addColorStop(.55, 'rgba(4,20,60,.2)'); g.addColorStop(1, 'rgba(4,20,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = -1; return m;
}

async function loadArt(url) {
  const img = new Image(); img.src = url;
  try { await img.decode(); } catch (e) { await new Promise(r => { img.onload = r; img.onerror = r; }); }
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  cv.getContext('2d').drawImage(img, 0, 0);
  return cv;
}
// Laterais/topo/base: perfil de cores lido 2,5% para dentro de cada borda (evita o
// contorno branco da foto), suavizado e esticado → continuidade com a frente
function profile(art, side, soft = .004) {
  const W = art.width, H = art.height, x = art.getContext('2d');
  const v = side === 'left' || side === 'right', N = v ? H : W;
  const inset = Math.round((v ? W : H) * .025), band = Math.max(4, Math.round((v ? W : H) * .012));
  const d = v ? x.getImageData(side === 'left' ? inset : W - inset - band, 0, band, H).data
              : x.getImageData(0, side === 'top' ? inset : H - inset - band, W, band).data;
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    let r = 0, g = 0, b = 0;
    for (let k = 0; k < band; k++) { const o = v ? (i * band + k) * 4 : (k * W + i) * 4; r += d[o]; g += d[o + 1]; b += d[o + 2]; }
    out[i * 3] = r / band; out[i * 3 + 1] = g / band; out[i * 3 + 2] = b / band;
  }
  // suavização (remove ruído de compressão)
  const R = Math.max(2, Math.round(N * soft)), sm = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) {
    let t = 0, n = 0; for (let k = -R; k <= R; k++) { const j = Math.min(N - 1, Math.max(0, i + k)); t += out[j * 3 + c]; n++; }
    sm[i * 3 + c] = t / n;
  }
  // as pontas também ficam com o contorno: repete a cor de 3% para dentro
  const e = Math.round(N * .03);
  for (let i = 0; i < e; i++) for (let c = 0; c < 3; c++) { sm[i * 3 + c] = sm[e * 3 + c]; sm[(N - 1 - i) * 3 + c] = sm[(N - 1 - e) * 3 + c]; }
  return sm;
}
function edge(art, side, depthPx, soft) {
  const p = profile(art, side, soft), v = side === 'left' || side === 'right', N = p.length / 3;
  const cv = document.createElement('canvas'); cv.width = v ? depthPx : N; cv.height = v ? N : depthPx;
  const x = cv.getContext('2d'), img = x.createImageData(cv.width, cv.height);
  for (let yy = 0; yy < cv.height; yy++) for (let xx = 0; xx < cv.width; xx++) {
    const i = v ? yy : xx, o = (yy * cv.width + xx) * 4;
    img.data[o] = p[i * 3]; img.data[o + 1] = p[i * 3 + 1]; img.data[o + 2] = p[i * 3 + 2]; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return cv;
}
function sideLabel(cv, label) {
  const x = cv.getContext('2d'), fs = cv.width * .3;
  x.save(); x.translate(cv.width * .62, cv.height * .94); x.rotate(-Math.PI / 2);
  x.font = `italic 900 ${fs}px Archivo, "Arial Black", sans-serif`;
  x.lineWidth = fs * .12; x.strokeStyle = '#0B1F5C'; x.strokeText(label, 0, 0);
  x.fillStyle = '#FFD200'; x.fillText(label, 0, 0); x.restore();
  return cv;
}
// Verso: cada metade continua a lateral vizinha; no meio as duas se fundem.
// Logotipo FLANAX recortado da frente com bordas suaves.
function backFace(art) {
  const W = art.width, H = art.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const L = edge(art, 'left', 8, .025), Rt = edge(art, 'right', 8, .025);
  x.drawImage(Rt, 0, 0, 8, H, 0, 0, W, H);                         // começa encostado na lateral direita
  const m = document.createElement('canvas'); m.width = W; m.height = H;
  const mx = m.getContext('2d'); mx.drawImage(L, 0, 0, 8, H, 0, 0, W, H);
  mx.globalCompositeOperation = 'destination-in';
  const g = mx.createLinearGradient(W * .25, 0, W * .75, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  mx.fillStyle = g; mx.fillRect(0, 0, W, H);
  x.drawImage(m, 0, 0);                                             // termina encostado na lateral esquerda
  // logotipo com máscara elíptica suave
  const lw = W * .9, lh = H * .27, sx = W * .05, sy = H * .15;
  const lg = document.createElement('canvas'); lg.width = lw; lg.height = lh;
  const lx = lg.getContext('2d'); lx.drawImage(art, sx, sy, lw, lh, 0, 0, lw, lh);
  lx.globalCompositeOperation = 'destination-in';
  const gx = lx.createLinearGradient(0, 0, lw, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.05, '#000'); gx.addColorStop(.95, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
  lx.fillStyle = gx; lx.fillRect(0, 0, lw, lh);
  const gy = lx.createLinearGradient(0, 0, 0, lh); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(.14, '#000'); gy.addColorStop(.86, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  lx.fillStyle = gy; lx.fillRect(0, 0, lw, lh);
  x.drawImage(lg, (W - lw * .8) / 2, H * .36, lw * .8, lh * .8);
  return cv;
}
async function buildProduct(s, renderer, idx) {
  const { w, h, d } = s.box;
  // frente: foto aprimorada; laterais, topo, base e verso: arte vetorizada (cores limpas)
  const art = await loadArt(s.art), lados = art;
  const dp = Math.round(lados.width * d / w);
  const mat = (cv, rough = .4) => new THREE.MeshStandardMaterial({ map: tex(cv, renderer), roughness: rough, metalness: 0, envMapIntensity: .5 });
  const shade = (cv, a) => { const x = cv.getContext('2d'); x.fillStyle = `rgba(6,19,74,${a})`; x.fillRect(0, 0, cv.width, cv.height); return cv; };
  const mats = [mat(sideLabel(shade(edge(lados, 'right', dp), .14), s.sideLabel)), mat(shade(edge(lados, 'left', dp), .06)),
    mat(edge(lados, 'top', dp)), mat(shade(edge(lados, 'bottom', dp), .25)), mat(art, .3), mat(backFace(lados))];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  const outer = new THREE.Group(), pose = new THREE.Group();
  pose.add(mesh); outer.add(pose);
  const sh = contactShadow(w * 1.15, Math.max(d, 70) * 2.4); sh.position.y = -h / 2 - 22; outer.add(sh);
  outer.userData = { idx, mats, shadow: sh, w, h };
  return outer;
}
function setFog(g, fog) {
  if (g.userData.fog === fog) return;
  g.userData.fog = fog;
  g.userData.mats.forEach(m => m.color.setScalar(1 - fog));
}

class Stage {
  constructor(host, { perspective = 1800, lite = false } = {}) {
    this.host = host; this.perspective = perspective;
    this.canvas = document.createElement('canvas'); this.canvas.className = 'gl'; this.canvas.setAttribute('aria-hidden', 'true');
    host.prepend(this.canvas);
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setClearColor(0x000000, 0); r.toneMapping = THREE.NoToneMapping;
    r.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1.5 : 2));
    this.renderer = r;
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(r), .04).texture; pm.dispose();
    const key = new THREE.DirectionalLight(0xFFFFFF, .75); key.position.set(-400, 700, 900); this.scene.add(key);
    this.scene.add(new THREE.AmbientLight(0xFFFFFF, .12));
    this.camera = new THREE.PerspectiveCamera(30, 1, 10, 6000);
    this.ray = new THREE.Raycaster();
    this.resize(); new ResizeObserver(() => this.resize()).observe(host);
  }
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.w = w; this.h = h; this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.fov = 2 * Math.atan(h / 2 / this.perspective) / DEG;
    this.camera.position.set(0, 0, this.perspective); this.camera.updateProjectionMatrix();
  }
  render() { this.renderer.render(this.scene, this.camera); }
  pick(cx, cy, roots) {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera);
    let o = (this.ray.intersectObjects(roots, true)[0] || {}).object;
    while (o && o.userData.idx === undefined) o = o.parent;
    return o ? o.userData.idx : -1;
  }
}
const easeIO = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export async function create({ lite }) {
  await loadFontCSS();
  const orbit = new Stage(document.getElementById('orbit'), { perspective: 1800, lite });
  const items = await Promise.all(FX.SKUS.map((s, i) => buildProduct(s, orbit.renderer, i)));
  items.forEach(g => orbit.scene.add(g));
  const orbitApi = {
    set(i, st) {
      const g = items[i];
      g.position.set(st.x, -st.y + orbit.h * .04, st.z);
      g.rotation.set(0, st.ry * DEG, 0);
      g.scale.setScalar(st.scale);
      g.children[0].rotation.set(st.tilt * DEG, st.yaw * DEG, 0, 'XYZ');
      setFog(g, st.fog);
    },
    render() { orbit.render(); },
    pick(x, y) { return orbit.pick(x, y, items); }
  };

  const vhost = document.getElementById('viewer');
  const viewer = new Stage(vhost, { perspective: 1400, lite });
  const holder = new THREE.Group(); viewer.scene.add(holder);
  const cache = new Map(); let cur = null, next = null, t0 = 0;
  const viewerApi = {
    async setProduct(s, instant) {
      let g = cache.get(s.id);
      if (!g) { g = await buildProduct(s, viewer.renderer, 0); g.userData.shadow.visible = false; cache.set(s.id, g); }
      if (g === cur) return;
      if (instant || !cur) { if (cur) holder.remove(cur); cur = g; holder.add(g); t0 = 0; return; }
      next = g; t0 = performance.now();
    },
    frame(now, rx, ry, bob, scale) {
      let k = 1;
      if (t0) {
        const p = Math.min((now - t0) / 300, 1);
        if (p < .5) k = 1 - .6 * easeIO(p * 2);
        else { if (next) { holder.remove(cur); cur = next; next = null; holder.add(cur); } k = .4 + .6 * easeIO((p - .5) * 2); }
        if (p >= 1) t0 = 0;
      }
      holder.position.set(0, bob + viewer.h * .03, 0);
      holder.scale.setScalar(scale * k);
      holder.rotation.set(-rx * DEG, ry * DEG, 0, 'XYZ');
      viewer.render();
    }
  };
  return { orbit: orbitApi, viewer: viewerApi };
}
