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
  const inset = Math.round((v ? W : H) * (v ? .025 : .006)), band = Math.max(4, Math.round((v ? W : H) * .012));
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
/* ---------- Laterais e verso VETORIAIS ----------
   Lê as faixas de cor da borda da frente, transforma em blocos de cor
   sólida (SVG) e desenha logotipo e textos em vetor. Nada de pixel esticado. */
const hex = c => '#' + c.map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')).join('');
function segments(art, side) {
  const p = profile(art, side, .002), N = p.length / 3, segs = [];
  let st = 0, acc = [p[0], p[1], p[2]], n = 1;
  const dist = (i, c) => Math.abs(p[i * 3] - c[0]) + Math.abs(p[i * 3 + 1] - c[1]) + Math.abs(p[i * 3 + 2] - c[2]);
  for (let i = 1; i < N; i++) {
    const c = [acc[0] / n, acc[1] / n, acc[2] / n];
    if (dist(i, c) > 70) { segs.push({ a: st / N, b: i / N, c }); st = i; acc = [0, 0, 0]; n = 0; }
    acc[0] += p[i * 3]; acc[1] += p[i * 3 + 1]; acc[2] += p[i * 3 + 2]; n++;
  }
  segs.push({ a: st / N, b: 1, c: [acc[0] / n, acc[1] / n, acc[2] / n] });
  // funde faixas finas (< 3%) na vizinha maior
  for (let k = 0; k < segs.length; k++) if (segs.length > 1 && segs[k].b - segs[k].a < .03) {
    const j = k === 0 ? 1 : (k === segs.length - 1 ? k - 1 : (segs[k - 1].b - segs[k - 1].a > segs[k + 1].b - segs[k + 1].a ? k - 1 : k + 1));
    segs[j].a = Math.min(segs[j].a, segs[k].a); segs[j].b = Math.max(segs[j].b, segs[k].b); segs.splice(k, 1); k = -1;
  }
  return segs.map(g => ({ ...g, hex: hex(g.c) }));
}
const shadeHex = (c, f) => hex(c.map(v => v * f));
function sideSVG(segs, W, H, label, shade) {
  let r = segs.map(g => `<rect x="0" y="${(g.a * H).toFixed(1)}" width="${W}" height="${((g.b - g.a) * H + 1).toFixed(1)}" fill="${shadeHex(g.c, shade)}"/>`).join('');
  if (label) {
    const fs = W * .3, L = H * .62;
    r += `<text transform="translate(${W * .62} ${H * .93}) rotate(-90)" font-family="Archivo, 'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="${fs}" textLength="${L}" lengthAdjust="spacingAndGlyphs" fill="#FFD200" stroke="#0B1F5C" stroke-width="${fs * .1}" paint-order="stroke" stroke-linejoin="round">${label}</text>`;
    r += bayerSVG(W / 2, H * .14, W * .22);
  }
  return `<svg class="art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${r}</svg>`;
}
function bayerSVG(cx, cy, r) {
  const fs = r * .37; let t = '';
  [...'BAYER'].forEach((ch, i) => { const o = (i - 2) * fs; t += `<text x="${cx}" y="${cy + o + fs * .36}" text-anchor="middle">${ch}</text>`; if (i !== 2) t += `<text x="${cx + o}" y="${cy + fs * .36}" text-anchor="middle">${ch}</text>`; });
  return `<g fill="#FFFFFF" font-family="Archivo, Arial, sans-serif" font-weight="800" font-size="${fs}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FFFFFF" stroke-width="${r * .085}"/>${t}</g>`;
}
// Verso: blocos que começam com as cores da lateral direita e terminam com as da esquerda
function backSVG(L, R, W, H, s) {
  const cuts = [...new Set([0, 1, ...L.map(g => g.a), ...R.map(g => g.a)])].sort((a, b) => a - b);
  const at = (segs, y) => (segs.find(g => y >= g.a && y < g.b) || segs[segs.length - 1]).hex;
  let defs = '', body = '';
  cuts.slice(0, -1).forEach((a, i) => {
    const b = cuts[i + 1], m = (a + b) / 2, id = 'g' + i;
    defs += `<linearGradient id="${id}" x1="0" x2="1"><stop offset=".08" stop-color="${at(R, m)}"/><stop offset=".92" stop-color="${at(L, m)}"/></linearGradient>`;
    body += `<rect x="0" y="${(a * H).toFixed(1)}" width="${W}" height="${((b - a) * H + 1).toFixed(1)}" fill="url(#${id})"/>`;
  });
  const cx = W / 2, ly = H * .5, fs = H * .2, lw = W * .66;
  const logo = (fill, dx, dy, extra = '') => `<text x="${cx + dx}" y="${ly + dy}" text-anchor="middle" font-family="Archivo, 'Arial Black', sans-serif" font-style="italic" font-weight="900" style="font-stretch:125%" font-size="${fs}" textLength="${lw}" lengthAdjust="spacingAndGlyphs" fill="${fill}"${extra}>FLANAX</text>`;
  let ext = ''; for (let i = 8; i >= 1; i--) ext += logo(i > 5 ? '#0B1F5C' : '#163A8E', -i * .6, i * .8);
  const dose = s.line === 'xr' ? 'XR 660 mg' : `${s.doseNum} mg`;
  return `<svg class="art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs>${defs}<linearGradient id="ly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEE80"/><stop offset=".45" stop-color="#FFDA1F"/><stop offset="1" stop-color="#F5B800"/></linearGradient></defs>
    ${body}
    <ellipse cx="${cx}" cy="${H * .46}" rx="${W * .44}" ry="${H * .3}" fill="#0B2A86" opacity=".35"/>
    ${ext}${logo('url(#ly)', 0, 0, ' stroke="#D99A00" stroke-width="3" paint-order="stroke"')}
    <text x="${cx}" y="${ly + fs * .62}" text-anchor="middle" font-family="'Roboto Condensed', 'Arial Narrow', sans-serif" font-size="${fs * .42}" fill="#2DB8EE">naproxeno sódico ${dose}</text>
    <text x="${cx}" y="${H * .88}" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="${fs * .17}" fill="#FFFFFF" opacity=".9">Leia a bula. Bayer S.A. · SAC 0800 723 1010</text>
    ${bayerSVG(W * .9, H * .82, H * .07)}
  </svg>`;
}

async function buildProduct(s, renderer, idx) {
  const { w, h, d } = s.box;
  // frente: foto aprimorada; laterais, topo, base e verso: arte vetorizada (cores limpas)
  const [art, topArt] = await Promise.all([loadArt(s.art), s.topImg ? loadArt(s.topImg) : null]), lados = art;
  const dp = Math.round(lados.width * d / w);
  const mat = (cv, rough = .4) => new THREE.MeshStandardMaterial({ map: tex(cv, renderer), roughness: rough, metalness: 0, envMapIntensity: .5 });
  const shade = (cv, a) => { const x = cv.getContext('2d'); x.fillStyle = `rgba(6,19,74,${a})`; x.fillRect(0, 0, cv.width, cv.height); return cv; };
  const segL = segments(art, 'left'), segR = segments(art, 'right'), segT = segments(art, 'top'), segB = segments(art, 'bottom');
  const SH = 1600, SW = Math.round(SH * d / h), BW = Math.round(SH * w / h);
  const [cR, cL, cB] = await Promise.all([
    svgToCanvas(sideSVG(segR, SW, SH, s.sideLabel, .86), SW, SH),
    svgToCanvas(sideSVG(segL, SW, SH, null, .94), SW, SH),
    svgToCanvas(backSVG(segL, segR, BW, SH, s), BW, SH)
  ]);
  const capSVG = (segs, f) => `<svg class="art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 10" preserveAspectRatio="none">${segs.map(g => `<rect y="0" height="10" x="${g.a * 1000}" width="${(g.b - g.a) * 1000 + 1}" fill="${shadeHex(g.c, f)}"/>`).join('')}</svg>`;
  const [cT, cBt] = await Promise.all([svgToCanvas(capSVG([{ a: 0, b: 1, c: segR[0].c }], 1.04), 1024, 64), svgToCanvas(capSVG(segB, .7), 1024, 64)]);
  const mats = [mat(cR), mat(cL), mat(topArt || cT), mat(cBt), mat(art, .3), mat(cB)];
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
