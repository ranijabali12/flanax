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
  ['Barlow', 'normal', 500, 'Barlow-500'], ['Barlow', 'normal', 600, 'Barlow-600'], ['Barlow', 'normal', 700, 'Barlow-700'], ['Barlow', 'normal', 800, 'Barlow-800'],
  ['Barlow', 'italic', 600, 'Barlow-600i'], ['Barlow', 'italic', 700, 'Barlow-700i'], ['Barlow', 'italic', 800, 'Barlow-800i'], ['Barlow', 'italic', 900, 'Barlow-900i'],
  ['Barlow Condensed', 'normal', 500, 'BarlowCondensed-500'], ['Barlow Condensed', 'normal', 600, 'BarlowCondensed-600'], ['Barlow Condensed', 'normal', 700, 'BarlowCondensed-700']
];

// SVG desenhado como imagem não enxerga as fontes da página: elas vão embutidas em base64
let fontCSS = null;
async function loadFontCSS() {
  if (fontCSS !== null) return fontCSS;
  const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const faces = await Promise.all(FONT_FILES.map(async ([fam, style, w, file]) => {
    try { const r = await fetch(`assets/fonts/${file}.woff2`); if (!r.ok) return ''; return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};src:url(data:font/woff2;base64,${b64(await r.arrayBuffer())}) format('woff2');}`; } catch (e) { return ''; }
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

async function buildProduct(s, renderer, idx) {
  const { w, h, d } = s.box;
  const [front, back] = await Promise.all([svgToCanvas(s.front(), 1100, Math.round(s.vb * 1.1)), svgToCanvas(s.back(), 700, Math.round(s.vb * .7))]);
  const mat = (cv, rough = .45) => new THREE.MeshStandardMaterial({ map: tex(cv, renderer), roughness: rough, metalness: 0, envMapIntensity: .55 });
  const mats = [mat(stopsCanvas(s.sides.right, s.sideLabel)), mat(stopsCanvas(s.sides.left)), mat(gradCanvas(s.top[0], s.top[1])), mat(gradCanvas(s.bottom, s.bottom)), mat(front, .32), mat(back)];
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
