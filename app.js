/* Flanax · interações */
(() => {
  const { SKUS, LINES, FAQ, BULA, flat, byId } = window.FX;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = n => String(n).padStart(2, '0');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const lite = !fine || (navigator.hardwareConcurrency || 8) <= 4 || !!navigator.connection?.saveData;
  if (lite) document.documentElement.classList.add('lite');
  const fullName = s => `${s.name} ${s.dose}${s.line === 'xr' ? '' : ` · ${s.qty} comp.`}`;
  const title = s => (s.line === 'xr' ? 'Flanax XR 660 mg' : `Flanax ${s.dose}`);
  $('#year').textContent = new Date().getFullYear();

  let toastT;
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); };

  /* ---------- Tema ---------- */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  $('#themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => { document.documentElement.dataset.theme = next; store.set('fx-theme', next); };
    if (document.startViewTransition && !reduced) document.startViewTransition(apply); else apply();
    toast(next === 'dark' ? 'Tema escuro ativado' : 'Tema claro ativado');
    drawMol();
  });

  /* ---------- Abas ---------- */
  const tabBtns = $$('.tabs__btn'), pill = $('.tabs__pill');
  const order = ['inicio', 'produtos', 'xr', 'duvidas'];
  let current = 'inicio';
  function movePill() {
    const btn = $(`.tabs__btn[data-go="${current}"]`); if (!btn) return;
    pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    const nav = btn.parentElement;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
  }
  function go(id, { push = true, scrollTo = null, hash = null } = {}) {
    if (!order.includes(id)) id = 'inicio';
    const finish = () => { if (!scrollTo) return; const t = typeof scrollTo === 'string' ? document.getElementById(scrollTo) : scrollTo; if (t) setTimeout(() => t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 140); };
    if (push) history.pushState({ id }, '', '#' + (hash || id));
    if (id === current) { if (!scrollTo) scrollTo0(); finish(); return; }
    const from = $(`.view[data-view="${current}"]`), to = $(`.view[data-view="${id}"]`);
    current = id;
    tabBtns.forEach(b => { const on = b.dataset.go === id; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    movePill();
    const swap = () => {
      from.classList.remove('is-active', 'is-leaving', 'is-settled');
      window.scrollTo(0, 0);
      to.classList.add('is-active');
      to.addEventListener('animationend', function done(ev) { if (ev.target !== to) return; to.classList.add('is-settled'); to.removeEventListener('animationend', done); });
      observeReveals(to); onEnter(id); finish();
    };
    if (reduced) return swap();
    from.classList.add('is-leaving'); setTimeout(swap, 200);
  }
  const scrollTo0 = () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go]'); if (!el) return;
    e.preventDefault();
    if (el.dataset.sku) selectSku(el.dataset.sku, true);
    go(el.dataset.go, { scrollTo: el.dataset.scroll || null, hash: el.dataset.sku || null });
  });
  $('.tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const id = order[(order.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length];
    go(id); $(`.tabs__btn[data-go="${id}"]`).focus();
  });
  addEventListener('popstate', () => { const h = location.hash.slice(1); if (byId(h)) { selectSku(h, true); go('produtos', { push: false }); } else go(h || 'inicio', { push: false }); });
  addEventListener('resize', movePill);
  document.fonts?.ready.then(movePill);

  /* ---------- Reveal + contadores ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    $$('.counter', en.target).forEach(runCounter);
    if (en.target.matches('.molecule')) drawMol(true);
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  function observeReveals(scope) {
    const g = new Map();
    $$('.reveal:not(.in)', scope).forEach(el => { const n = g.get(el.parentElement) || 0; g.set(el.parentElement, n + 1); el.style.setProperty('--d', Math.min(n * 60, 300) + 'ms'); io.observe(el); });
  }
  function runCounter(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const target = +el.dataset.count; if (reduced) { el.textContent = target; return; }
    const t0 = performance.now();
    const tick = now => { const p = Math.min((now - t0) / 1100, 1), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; el.textContent = Math.round(target * e); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ---------- Header ---------- */
  const topbar = $('.topbar'), prog = $('.scroll-progress span');
  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', scrollY > 24);
    document.body.classList.toggle('on-hero', current === 'inicio' && scrollY < innerHeight * .8);
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Cursor ---------- */
  const cursor = $('#cursor');
  if (fine && !reduced) {
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY; cursor.classList.add('is-on');
      const t = e.target.closest('[data-cursor]'); cursor.classList.toggle('is-label', !!t);
      if (t) $('.cursor__label', cursor).textContent = t.dataset.cursor;
    });
    document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    (function loop() { cx = lerp(cx, mx, .22); cy = lerp(cy, my, .22); cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; requestAnimationFrame(loop); })();
  }

  /* ---------- Partículas do hero ---------- */
  const canvas = $('#particles'), ctx = canvas.getContext('2d');
  let parts = [], pRAF = null, pSkip = false, heroVisible = true;
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }).observe($('#hero'));
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect(), dpr = lite ? 1 : Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(clamp(r.width / (lite ? 60 : 30), 10, lite ? 22 : 46));
    parts = Array.from({ length: n }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height * .45, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .2, r: 1 + Math.random() * 2 }));
  }
  function particles() {
    pRAF = requestAnimationFrame(particles);
    if ((lite && (pSkip = !pSkip)) || !heroVisible) return;
    const w = canvas.clientWidth, h = canvas.clientHeight * .45;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) { const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 110) { ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 110) * .22})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      ctx.fillStyle = 'rgba(255,230,120,.7)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (!reduced) { sizeCanvas(); addEventListener('resize', sizeCanvas); }

  /* ---------- Órbita ---------- */
  const orbitEl = $('#orbit'), N = SKUS.length, step = (Math.PI * 2) / N;
  let GL = null, angle = -1.2, targetIdx = 0, introT0 = performance.now(), hoverIdx = -1, oDrag = false, oLastX = 0, oMoved = 0, hoverPause = false, autoT0 = performance.now(), oRAF = null, frontIdx = -1;
  const AUTO = 3800;
  const geo = () => { const w = orbitEl.clientWidth; return { rx: w < 640 ? w * .56 : clamp(w * .36, 240, 540), rz: clamp(w * .18, 120, 260), k: w < 640 ? .66 : w < 1000 ? .9 : 1.1 }; };
  let G = geo(); addEventListener('resize', () => { G = geo(); });
  function setFront(i) {
    if (i === frontIdx) return; frontIdx = i;
    const s = SKUS[i], hud = $('#hud'); hud.classList.add('is-swap');
    setTimeout(() => {
      $('#hudIdx').textContent = pad(i + 1);
      $('#hudFam').textContent = s.line === 'xr' ? 'Flanax XR · novo · liberação prolongada' : 'Flanax · naproxeno sódico';
      $('#hudName').textContent = title(s);
      $('#hudMeta').textContent = s.qtyLabel;
      hud.classList.remove('is-swap');
    }, reduced ? 0 : 160);
  }
  $('#hudTotal').textContent = pad(N);
  function orbitFrame(now) {
    oRAF = requestAnimationFrame(orbitFrame);
    if (!heroVisible) { autoT0 = now - Math.min(now - autoT0, AUTO); return; }
    if (!oDrag) { if (!hoverPause && !reduced && now - autoT0 > AUTO) { targetIdx++; autoT0 = now; } angle = lerp(angle, -targetIdx * step, reduced ? 1 : .07); }
    $('#hudBar').style.transform = `scaleX(${hoverPause || oDrag ? 0 : clamp((now - autoT0) / AUTO, 0, 1)})`;
    const ie = 1 - Math.pow(1 - (reduced ? 1 : clamp((now - introT0) / 1500, 0, 1)), 3);
    if (GL) {
      for (let i = 0; i < N; i++) {
        const th = angle + i * step, c = Math.cos(th), sn = Math.sin(th), depth = (c + 1) / 2;
        GL.orbit.set(i, {
          x: sn * G.rx * ie, y: -c * 10 - (1 - depth) * 40 + (1 - ie) * 180 + Math.sin(now / 900 + i * 1.7) * 7, z: c * G.rz,
          ry: -sn * 20, scale: (.5 + .5 * depth) * G.k * (.7 + .3 * ie) * (i === hoverIdx ? 1.06 : 1),
          tilt: 14, yaw: -26 + Math.sin(now / 1300 + i * 1.3) * 7, fog: Math.round((1 - depth) * 8) / 25
        });
      }
      GL.orbit.render();
    }
    setFront(((Math.round(-angle / step) % N) + N) % N);
  }
  const nudge = d => { targetIdx = Math.round(-angle / step) + d; autoT0 = performance.now(); };
  $('#orbitPrev').addEventListener('click', () => nudge(-1));
  $('#orbitNext').addEventListener('click', () => nudge(1));
  $('#hudOpen').addEventListener('click', () => { selectSku(SKUS[frontIdx].id, true); go('produtos', { hash: SKUS[frontIdx].id }); });
  orbitEl.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hoverPause = true; });
  orbitEl.addEventListener('pointerleave', () => { hoverPause = false; hoverIdx = -1; autoT0 = performance.now(); });
  orbitEl.addEventListener('pointerdown', e => { oDrag = true; oLastX = e.clientX; oMoved = 0; orbitEl.setPointerCapture(e.pointerId); });
  orbitEl.addEventListener('pointermove', e => {
    if (!oDrag) { if (e.pointerType === 'mouse' && GL) hoverIdx = GL.orbit.pick(e.clientX, e.clientY); return; }
    const dx = e.clientX - oLastX; oMoved += Math.abs(dx); angle += dx * .006; oLastX = e.clientX;
  });
  orbitEl.addEventListener('pointerup', e => {
    if (!oDrag) return; oDrag = false; targetIdx = Math.round(-angle / step); autoT0 = performance.now();
    if (oMoved < 6 && GL) {
      const i = GL.orbit.pick(e.clientX, e.clientY);
      if (i >= 0) { if (i === frontIdx) { selectSku(SKUS[i].id, true); go('produtos', { hash: SKUS[i].id }); } else { let d = (i - frontIdx + N) % N; if (d > N / 2) d -= N; nudge(d); } }
    }
  });
  orbitEl.addEventListener('pointercancel', () => { oDrag = false; targetIdx = Math.round(-angle / step); });
  document.addEventListener('keydown', e => {
    if (current !== 'inicio' || e.target.closest('input, textarea, dialog, .tabs')) return;
    if (e.key === 'ArrowRight') nudge(1); if (e.key === 'ArrowLeft') nudge(-1);
  });

  /* ---------- Ticker e linhas ---------- */
  const tick = ['Flanax 275 mg', 'Flanax 550 mg', 'Flanax XR 660 mg', 'Dupla camada', 'Naproxeno sódico', 'Bayer'];
  $('#tickerTrack').innerHTML = [...tick, ...tick].map(t => `<span>${t}</span><b>✦</b>`).join('');
  $('#lines').innerHTML = ['flanax', 'xr'].map(k => {
    const L = LINES[k];
    return `<article class="line-card${k === 'xr' ? ' line-card--xr' : ''} reveal">
      <div class="line-card__head"><h3 class="line-card__word">FLANAX${k === 'xr' ? ' <b>XR</b>' : ''}</h3>${k === 'xr' ? '<span class="line-card__tag">Novo</span>' : ''}</div>
      <p class="line-card__lead">${L.lead}</p>
      <div class="line-card__list">${SKUS.filter(s => s.line === k).map(s => `
        <button class="line-sku" data-go="produtos" data-sku="${s.id}" data-cursor="abrir">${flat(s)}<div><b>${title(s)}</b><span>${s.qtyLabel}</span></div><i aria-hidden="true">→</i></button>`).join('')}</div>
    </article>`;
  }).join('');

  /* ---------- Produtos ---------- */
  const view = $('#view-produtos');
  let sku = SKUS[0], line = 'flanax';
  function setLine(k, keep) {
    line = k; view.dataset.line = k;
    $$('.switch__btn').forEach(b => { const on = b.dataset.line === k; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $('#lineTitle').innerHTML = k === 'xr' ? 'FLANAX <b>XR</b>' : 'FLANAX';
    $('#lineLead').textContent = LINES[k].lead;
    const list = SKUS.filter(s => s.line === k);
    $('#skuList').innerHTML = list.map((s, i) => `<button class="sku" role="option" data-id="${s.id}" style="--i:${i}" aria-selected="false">${flat(s)}<div><b>${s.dose}</b><span>${s.qtyLabel}</span></div></button>`).join('');
    $$('#skuList .sku').forEach(b => b.addEventListener('click', () => { selectSku(b.dataset.id); history.replaceState(null, '', '#' + b.dataset.id); }));
    if (!keep) selectSku(list[0].id);
  }
  function selectSku(id, instant) {
    const s = byId(id); if (!s) return;
    if (s.line !== line) setLine(s.line, true);
    const changed = s !== sku; sku = s;
    $$('#skuList .sku').forEach(b => { const on = b.dataset.id === id; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    const rows = [['Princípio ativo', s.ativo], ['Concentração', s.dose], ['Composição', s.equiv], ['Apresentação', s.qtyLabel], ['Detalhe', s.extra], ['Bula', 'Veja indicações e cuidados abaixo'], ...(window.LOJAS && LOJAS.chips(s.id) ? [['Comprar', LOJAS.chips(s.id)]] : [])];
    $('#sheet').innerHTML = `<div class="sheet__head"><span class="eyebrow">Ficha do produto</span><h3 class="sheet__name">${s.line === 'xr' ? 'Flanax <b>XR</b>' : 'Flanax'} ${s.dose}</h3><span class="sheet__formula">${s.formula}</span></div>
      <dl>${rows.map(([k, v], i) => `<div class="sheet__row" style="--i:${i}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    renderBula(s);
    $('#viewerFallback').innerHTML = flat(s);
    if (GL && (changed || instant)) { GL.viewer.setProduct(s, instant || reduced); if (changed && !instant && !reduced) vy += 360; }
  }
  let bulaTab = 'indicacao';
  const bulaCache = {};
  const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // Bula completa: títulos numerados, tópicos, e a tabela de efeitos adversos (linhas com tabulação)
  function bulaHTML(txt) {
    const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
    let html = '', rows = [];
    const flush = () => { if (!rows.length) return; html += `<div class="bula__tw"><table class="bula__table"><thead><tr>${rows[0].map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${(r.length === 2 ? ['', ...r] : r).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; rows = []; };
    for (const l of lines) {
      if (l.includes('\t')) { rows.push(l.split('\t')); continue; }
      flush();
      if (/^\d+\.\s/.test(l) || /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{6,}$/.test(l)) html += `<h4>${esc(l)}</h4>`;
      else html += `<p>${esc(l.replace(/^•\s*/, '• '))}</p>`;
    }
    flush();
    return html;
  }
  async function renderBula(s) {
    const B = BULA[s.bulaKey], T = [['indicacao', 'Indicação'], ['posologia', 'Posologia'], ['contra', 'Contraindicações'], ['adv', 'Advertências'], ['reacoes', 'Reações adversas'], ['bula', 'Bula completa']];
    $('#bulaTitle').textContent = s.line === 'xr' ? 'Flanax XR 660 mg' : `Flanax ${s.dose}`;
    $('#bulaTabs').innerHTML = T.map(([k, n]) => `<button class="bula__tab${k === bulaTab ? ' is-on' : ''}" role="tab" aria-selected="${k === bulaTab}" data-k="${k}">${n}</button>`).join('');
    const body = $('#bulaBody');
    if (bulaTab !== 'bula') {
      const head = bulaTab === 'contra' ? '<p class="bula__lead">Não consumir o remédio em caso de:</p>' : '';
      body.innerHTML = head + `<ul class="bula__list">${B[bulaTab].map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join('')}</ul>`;
      return;
    }
    body.innerHTML = '<p class="bula__lead">Carregando a bula…</p>';
    try {
      const k = s.bulaKey;
      bulaCache[k] = bulaCache[k] || await (await fetch(`assets/bula/${k}.txt`)).text();
      if (bulaTab === 'bula' && sku.bulaKey === k) body.innerHTML = `<div class="bula__full">${bulaHTML(bulaCache[k])}</div>`;
    } catch (e) { body.innerHTML = '<p class="bula__lead">Não foi possível carregar a bula agora. Tente de novo.</p>'; }
  }
  $('#bulaTabs').addEventListener('click', e => { const b = e.target.closest('.bula__tab'); if (!b) return; bulaTab = b.dataset.k; renderBula(sku); });
  $$('.switch__btn').forEach(b => b.addEventListener('click', () => { setLine(b.dataset.line); history.replaceState(null, '', '#' + sku.id); }));
  const viewer = $('#viewer');
  let vx = -10, vy = -24, rvx = vx, rvy = vy, vDrag = false, vlx = 0, vly = 0, idle = 0, lock = 0, vRAF = null;
  viewer.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; vDrag = true; vlx = e.clientX; vly = e.clientY; viewer.setPointerCapture(e.pointerId); });
  viewer.addEventListener('pointermove', e => { if (!vDrag) return; vy += (e.clientX - vlx) * .5; vx = clamp(vx - (e.clientY - vly) * .3, -45, 45); vlx = e.clientX; vly = e.clientY; idle = 0; lock = 0; });
  ['pointerup', 'pointercancel'].forEach(t => viewer.addEventListener(t, () => { vDrag = false; }));
  $$('[data-view-angle]').forEach(b => b.addEventListener('click', () => { const base = Math.round((vy + 24) / 360) * 360; vy = base + { front: -24, side: -90, back: 180 }[b.dataset.viewAngle]; vx = -8; idle = 0; lock = 240; }));
  function viewerLoop(now = performance.now()) {
    vRAF = requestAnimationFrame(viewerLoop);
    if (!GL) return;
    if (!vDrag) {
      idle++;
      if (lock > 0) lock--; else if (idle > 90) { const base = Math.round((vy + 24) / 360) * 360 - 24; vy = lerp(vy, base + Math.sin(now / 1700) * 24, .03); }
      vx = lerp(vx, -10, .02);
    }
    rvx = lerp(rvx, vx, .1); rvy = lerp(rvy, vy, .1);
    const w = viewer.clientWidth;
    GL.viewer.frame(now, rvx, rvy, Math.sin(now / 800) * 7, w < 420 ? .95 : w < 640 ? 1.05 : 1.3);
  }

  /* ---------- Comparativo ---------- */
  (function matrix() {
    const rows = [['Princípio ativo', s => s.ativo], ['Concentração', s => s.dose], ['Composição', s => s.equiv], ['Embalagem', s => s.qtyLabel], ['Detalhe', s => s.extra]];
    const t = $('#matrix');
    t.innerHTML = `<thead><tr><th scope="col"><span class="sr-only">Atributo</span></th>${SKUS.map((s, i) => `<th scope="col" data-col="${i}">${flat(s)}<b>${title(s)}</b></th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map(([k, fn]) => `<tr><th scope="row">${k}</th>${SKUS.map((s, i) => `<td data-col="${i}">${fn(s)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    t.addEventListener('pointerover', e => { const c = e.target.closest('[data-col]'); $$('.is-col', t).forEach(x => x.classList.remove('is-col')); if (c) $$(`[data-col="${c.dataset.col}"]`, t).forEach(x => x.classList.add('is-col')); });
    t.addEventListener('pointerleave', () => $$('.is-col', t).forEach(x => x.classList.remove('is-col')));
  })();

  /* ---------- XR: comprimido e molécula ---------- */
  $('#tablet').addEventListener('click', () => $('#tablet').classList.toggle('is-open'));
  function drawMol(animate) {
    const c = $('#molCanvas'); if (!c || !c.clientWidth) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const x = c.getContext('2d');
    // Naproxeno sódico: naftaleno com OCH₃ e CH(CH₃)COO⁻ Na⁺ (coordenadas em 400×200)
    const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
    const A = hex(170, 100, 30), B = hex(170 + 30 * Math.sqrt(3), 100, 30);
    const ring = (p, dbl) => p.map((a, i) => [a, p[(i + 1) % 6], dbl.includes(i)]);
    const ch = [B[5][0] + 26, B[5][1] - 15], me = [ch[0], ch[1] - 30], co = [ch[0] + 26, ch[1] + 15];
    const o1 = [co[0], co[1] + 30], o2 = [co[0] + 26, co[1] - 15];
    const om = [A[3][0] - 26, A[3][1] + 15], cm = [om[0] - 26, om[1] - 15];
    const bonds = [...ring(A, [1, 3]), ...ring(B, [0, 2, 4]).filter(([a, b]) => !(Math.abs(a[0] - A[0][0]) < 1 && Math.abs(b[0] - A[5][0]) < 1)),
      [B[5], ch], [ch, me], [ch, co], [co, o1, true], [co, o2], [A[3], om], [om, cm]];
    const atoms = [[o1, 'O'], [o2, 'O⁻ Na⁺'], [om, 'O'], [cm, 'CH₃'], [me, 'CH₃']];
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim(), acc = css.getPropertyValue('--sky').trim(), bg = css.getPropertyValue('--surface').trim();
    const sc = Math.min(w / 400, h / 200), ox = (w - 400 * sc) / 2, oy = (h - 200 * sc) / 2;
    const P = ([a, b]) => [ox + a * sc, oy + b * sc];
    const t0 = performance.now(), dur = animate && !reduced ? 1400 : 1;
    const frame = now => {
      const p = Math.min((now - t0) / dur, 1);
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      x.lineCap = 'round'; x.lineWidth = 1.8; x.strokeStyle = ink;
      const shown = bonds.length * p;
      bonds.forEach(([a, b, d], i) => {
        const f = clamp(shown - i, 0, 1); if (!f) return;
        const A1 = P(a), B0 = P(b), B1 = [A1[0] + (B0[0] - A1[0]) * f, A1[1] + (B0[1] - A1[1]) * f];
        x.beginPath(); x.moveTo(...A1); x.lineTo(...B1); x.stroke();
        if (d) { const dx = B0[0] - A1[0], dy = B0[1] - A1[1], L = Math.hypot(dx, dy), nx = -dy / L * 4, ny = dx / L * 4; x.beginPath(); x.moveTo(A1[0] + nx, A1[1] + ny); x.lineTo(B1[0] + nx, B1[1] + ny); x.stroke(); }
      });
      if (p > .6) {
        x.globalAlpha = (p - .6) / .4; x.font = `600 ${Math.round(13 * sc)}px "Geist Mono", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
        atoms.forEach(([pt, l]) => { const [ax, ay] = P(pt), tw = x.measureText(l).width + 8; x.fillStyle = bg; x.fillRect(ax - tw / 2, ay - 10 * sc, tw, 20 * sc); x.fillStyle = acc; x.fillText(l, ax, ay); });
        x.globalAlpha = 1;
      }
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- FAQ e onde comprar ---------- */
  $('#faq').innerHTML = FAQ.map(([q, a], i) => `<details class="faq__item reveal" id="faq-${i}"${i === 0 ? ' open' : ''}><summary>${q}<i aria-hidden="true"></i></summary><div class="faq__a"><p>${a}</p></div></details>`).join('');
  $$('.faq__item').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.faq__item').forEach(o => { if (o !== d) o.open = false; }); }));
  const cep = $('#cep'), msg = $('#cepMsg');
  cep.addEventListener('input', () => { let v = cep.value.replace(/\D/g, '').slice(0, 8); if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5); cep.value = v; msg.textContent = ''; });
  $('#finderForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = cep.value.replace(/\D/g, '');
    if (d.length !== 8) { msg.textContent = 'Digite o CEP com 8 números, por exemplo 01310-100.'; cep.focus(); return; }
    const url = `https://www.google.com/maps/search/farm%C3%A1cia+${d}`;
    msg.innerHTML = `Farmácias perto de ${cep.value}: <a href="${url}" target="_blank" rel="noopener">abrir no mapa ↗</a>`;
    window.open(url, '_blank', 'noopener');
  });

  /* ---------- Farmácias perto de mim e compra on-line ---------- */
  $('#buyBtn').addEventListener('click', e => { e.preventDefault(); $('#buyList').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); });
  $('#geoBtn').addEventListener('click', () => {
    const open = url => { msg.innerHTML = `Farmácias perto de você: <a href="${url}" target="_blank" rel="noopener">abrir no mapa ↗</a>`; window.open(url, '_blank', 'noopener'); };
    if (!navigator.geolocation) return open('https://www.google.com/maps/search/farm%C3%A1cia');
    msg.textContent = 'Procurando sua localização…';
    navigator.geolocation.getCurrentPosition(
      p => open(`https://www.google.com/maps/search/farm%C3%A1cia/@${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)},15z`),
      () => { msg.textContent = 'Não foi possível usar sua localização. Digite seu CEP acima.'; cep.focus(); },
      { timeout: 8000, maximumAge: 300000 });
  });
  const BUY_ITEMS = SKUS.map(s => [s.id, title(s), s.qtyLabel]);
  if (window.LOJAS) $('#buyRows').innerHTML = BUY_ITEMS.map(([id, nome, sub], i) => {
    const c = LOJAS.chips(id); if (!c) return '';
    return `<div class="buylist__row" style="--i:${i}"><div class="buylist__name"><b>${nome}</b><span>${sub}</span></div>${c}</div>`;
  }).join('');

  /* ---------- Busca (Ctrl K) ---------- */
  const pal = $('#palette'), pin = $('#paletteInput'), plist = $('#paletteList');
  const tabNames = { inicio: 'Início', produtos: 'Produtos', xr: 'Flanax XR · dupla camada', duvidas: 'Dúvidas e onde comprar' };
  const index = [
    ...SKUS.map(s => ({ title: title(s), sub: s.qtyLabel, text: `${title(s)} ${s.qtyLabel} ${s.equiv} naproxeno ${s.qty}`, s, run: () => { selectSku(s.id, true); go('produtos', { hash: s.id }); } })),
    ...order.map(id => ({ title: tabNames[id], sub: 'Ir para a aba', text: tabNames[id], ic: 'aba', run: () => go(id) })),
    ...FAQ.map(([q, a], i) => ({ title: q, sub: 'Dúvida frequente', text: `${q} ${a}`, ic: '?', run: () => { const d = $(`#faq-${i}`); go('duvidas', { scrollTo: d }); setTimeout(() => { d.open = true; d.classList.add('in'); }, 260); } }))
  ];
  let results = [], sel = 0;
  function renderPal() {
    const q = norm(pin.value.trim());
    results = q ? index.filter(it => q.split(/\s+/).every(w => norm(it.text).includes(w))) : index.slice(0, 9); sel = 0;
    plist.innerHTML = results.length ? results.slice(0, 12).map((it, i) => `<li class="palette__item${i ? '' : ' is-sel'}" role="option" data-i="${i}" aria-selected="${!i}">${it.s ? flat(it.s) : `<span class="palette__ic">${it.ic}</span>`}<div><b>${it.title}</b><span>${it.sub}</span></div><kbd>Enter</kbd></li>`).join('')
      : `<li class="palette__empty">Nada encontrado para “${pin.value}”. Tente “XR”, “550” ou “20”.</li>`;
  }
  function moveSel(d) { const els = $$('.palette__item', plist); if (!els.length) return; sel = (sel + d + els.length) % els.length; els.forEach((el, i) => { el.classList.toggle('is-sel', i === sel); el.setAttribute('aria-selected', i === sel); }); els[sel].scrollIntoView({ block: 'nearest' }); }
  const openPal = () => { if (pal.open) return; pin.value = ''; renderPal(); pal.showModal(); pin.focus(); };
  const runSel = (i = sel) => { const it = results[i]; if (!it) return; pal.close(); it.run(); };
  $('#openPalette').addEventListener('click', openPal);
  pin.addEventListener('input', renderPal);
  pin.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); } if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); } if (e.key === 'Enter') { e.preventDefault(); runSel(); } });
  plist.addEventListener('click', e => { const li = e.target.closest('.palette__item'); if (li) runSel(+li.dataset.i); });
  pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); }
    else if (e.key === '/' && !e.target.closest('input, textarea')) { e.preventDefault(); openPal(); }
  });

  /* ---------- Ciclo por aba ---------- */
  function onEnter(id) {
    cancelAnimationFrame(vRAF); vRAF = null;
    if (id === 'inicio') { if (!oRAF) oRAF = requestAnimationFrame(orbitFrame); if (!reduced && !pRAF) { sizeCanvas(); pRAF = requestAnimationFrame(particles); } autoT0 = performance.now(); }
    else { cancelAnimationFrame(oRAF); oRAF = null; cancelAnimationFrame(pRAF); pRAF = null; }
    if (id === 'produtos') vRAF = requestAnimationFrame(viewerLoop);
    if (id === 'xr') drawMol();
    onScroll();
  }

  /* ---------- 3D ---------- */
  (window.FX3D || Promise.resolve(null)).then(api => {
    if (api) { GL = api; document.documentElement.classList.add('gl-on'); GL.viewer.setProduct(sku, true); }
    else { $('#orbitStage').innerHTML = `<div class="orbit__fallback">${SKUS.map(flat).join('')}</div>`; }
    introT0 = performance.now(); orbitEl.classList.add('is-ready');
  });

  /* ---------- Início ---------- */
  setLine('flanax');
  const h = location.hash.slice(1);
  const start = byId(h) ? 'produtos' : (order.includes(h) ? h : 'inicio');
  if (byId(h)) selectSku(h, true);
  if (start !== 'inicio') {
    $('.view.is-active').classList.remove('is-active'); current = start;
    $(`.view[data-view="${start}"]`).classList.add('is-active');
    tabBtns.forEach(b => { const on = b.dataset.go === start; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
  }
  $('.view.is-active').classList.add('is-settled');
  movePill(); observeReveals($('.view.is-active')); onEnter(current);
})();
