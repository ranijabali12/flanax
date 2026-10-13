/* =========================================================
   Flanax · catálogo e desenho vetorial das embalagens
   Medidas e cores tiradas das fotos das caixas (frente = 1000 de largura).
   O site não traz indicação nem posologia: só identifica cada produto.
   ========================================================= */
window.FX = (() => {
  const C = {
    sky: '#0A9BE2', sky2: '#0880CC', royal: '#1B3A92', royal2: '#122E78', arc: '#55C7F1',
    cyan: '#2CB9F0', yellow: '#FFD200', yellow2: '#FFB800', orange: '#E84A2D', orange2: '#FF7D15',
    red: '#D0102B', navy: '#0D2A6E', pill: '#8CCAF0', xrBlue: '#1B47B8', xrYellow: '#FFD400'
  };
  const F_LOGO = 'Barlow, Arial Black, sans-serif';
  const F_COND = "'Barlow Condensed', 'Arial Narrow', sans-serif";
  const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

  // Texto com largura exata (independe da fonte carregada)
  const T = (txt, x, y, size, len, fill, o = {}) =>
    `<text x="${x}" y="${y}" font-family="${o.font || F_COND}" font-size="${size}" font-weight="${o.w || 600}"` +
    `${o.italic ? ' font-style="italic"' : ''}${len ? ` textLength="${len}" lengthAdjust="spacingAndGlyphs"` : ''}` +
    `${o.anchor ? ` text-anchor="${o.anchor}"` : ''} fill="${fill}"${o.extra || ''}>${txt}</text>`;

  function bayerCross(cx, cy, r, color = '#FFFFFF') {
    const fs = r * .36, st = r * .36;
    let v = '', h = '';
    [...'BAYER'].forEach((ch, i) => {
      const o = (i - 2) * st;
      v += `<text x="${cx}" y="${cy + o + fs * .36}" text-anchor="middle">${ch}</text>`;
      if (i !== 2) h += `<text x="${cx + o}" y="${cy + fs * .36}" text-anchor="middle">${ch}</text>`;
    });
    return `<g fill="${color}" font-family="Barlow, Arial, sans-serif" font-weight="700" font-size="${fs}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${r * .08}"/>${v}${h}</g>`;
  }

  // Logotipo FLANAX: face amarela com bisel e extrusão azul-escura
  function logo(x, y, size, len, id) {
    let ext = '';
    for (let i = 12; i >= 1; i--) ext += T('FLANAX', x - i * .9, y - i * .55, size, len, i > 9 ? '#0A1F55' : C.navy, { font: F_LOGO, w: 900, italic: true });
    return `<g>
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4A8"/><stop offset=".38" stop-color="#FFE14A"/><stop offset=".62" stop-color="#FFD200"/><stop offset="1" stop-color="#F2A900"/></linearGradient></defs>
      ${T('FLANAX', x + 4, y + 6, size, len, 'rgba(0,20,60,.45)', { font: F_LOGO, w: 900, italic: true })}
      ${ext}
      ${T('FLANAX', x, y, size, len, `url(#${id})`, { font: F_LOGO, w: 900, italic: true, extra: ` stroke="#C98A00" stroke-width="1.6" paint-order="stroke"` })}
      ${T('FLANAX', x - 1.5, y - 1.5, size, len, 'none', { font: F_LOGO, w: 900, italic: true, extra: ` stroke="rgba(255,255,255,.55)" stroke-width="1.2"` })}
    </g>`;
  }

  function pill(cx, cy, rx, ry, id, disc) {
    return `<g><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8E7FA"/><stop offset=".55" stop-color="${C.pill}"/><stop offset="1" stop-color="#4E95CB"/></linearGradient></defs>
      <ellipse cx="${cx + 6}" cy="${cy + ry * .7}" rx="${rx}" ry="${ry * .7}" fill="rgba(0,20,60,.35)"/>
      ${disc ? `<ellipse cx="${cx}" cy="${cy + ry * .28}" rx="${rx}" ry="${ry}" fill="#4A8EC4"/>` : `<rect x="${cx - rx}" y="${cy - ry + ry * .3}" width="${rx * 2}" height="${ry * 2}" rx="${ry}" fill="#4A8EC4"/>`}
      ${disc ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>` : `<rect x="${cx - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" rx="${ry}" fill="url(#${id})"/>`}
      <ellipse cx="${cx - rx * .25}" cy="${cy - ry * .45}" rx="${rx * .5}" ry="${ry * .22}" fill="rgba(255,255,255,.55)"/>
    </g>`;
  }

  function clock(cx, cy, r) {
    let ticks = '';
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * .62 + (i / 40) * Math.PI * 1.76, r1 = r * (i % 5 ? .9 : .84);
      ticks += `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}" x2="${cx + Math.cos(a) * r * .96}" y2="${cy + Math.sin(a) * r * .96}" stroke="rgba(255,255,255,.7)" stroke-width="${i % 5 ? 1.2 : 2}"/>`;
    }
    const arc = (a0, a1) => `M${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`;
    return `<g>${ticks}
      <path d="${arc(-2.5, -.25)}" fill="none" stroke="${C.yellow}" stroke-width="5"/>
      <path d="${arc(.5, 2.4)}" fill="none" stroke="${C.yellow}" stroke-width="5"/>
      <path d="M${cx + Math.cos(-.25) * r - 12} ${cy + Math.sin(-.25) * r - 10} l14 10 l-16 6 z" fill="${C.yellow}"/>
      <path d="M${cx + Math.cos(2.4) * r + 12} ${cy + Math.sin(2.4) * r + 9} l-14 -10 l16 -6 z" fill="${C.yellow}"/>
      ${T('POR ATÉ', cx, cy - r * .3, r * .24, r * .9, '#FFFFFF', { anchor: 'middle', italic: true, w: 600 })}
      ${T('12', cx - 6, cy + r * .42, r * .98, r * 1.04, C.yellow, { anchor: 'middle', italic: true, w: 800, font: F_LOGO })}
      ${T('H', cx + r * .56, cy - r * .1, r * .3, 0, C.yellow, { italic: true, w: 800, font: F_LOGO })}
    </g>`;
  }

  /* ---------- Flanax 275 / 550 ---------- */
  function regularFront(s) {
    const top = s.topBar ? 64 : 0, H = 760 + top, id = uid('fx');
    const orange = s.claim === 'intensa';
    const claim = orange
      ? `${T('ação eficaz na', 611, 520, 36, 252, C.orange2, { w: 700, font: F_LOGO })}${T('DOR INTENSA', 611, 566, 46, 300, C.orange2, { w: 800, font: F_LOGO })}${T('em minutos', 611, 604, 36, 214, C.cyan, { w: 500, font: F_LOGO })}`
      : `${T('eficaz no alívio da', 611, 540, 34, 326, '#FFFFFF', { w: 700, font: F_LOGO })}${T('DOR NO CORPO', 611, 588, 44, 326, '#FFFFFF', { w: 700, font: F_LOGO })}`;
    const strip = s.strip;
    const contemFill = strip ? C.red : '#FFFFFF';
    return `<svg class="art" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12A8EC"/><stop offset="1" stop-color="${C.sky2}"/></linearGradient>
        <radialGradient id="${id}dk" cx=".32" cy=".62" r=".8"><stop offset="0" stop-color="#1E3F99"/><stop offset=".55" stop-color="${C.royal}"/><stop offset=".85" stop-color="#1450A8"/><stop offset="1" stop-color="#0B74C4"/></radialGradient>
        <linearGradient id="${id}or" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.orange}"/><stop offset="1" stop-color="#F06A2A"/></linearGradient>
        <linearGradient id="${id}ys" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.yellow}"/><stop offset=".86" stop-color="${C.yellow}"/><stop offset="1" stop-color="${C.yellow}" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id}bl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9EEF2"/><stop offset=".6" stop-color="#9AA7B2"/><stop offset="1" stop-color="#5B6874"/></linearGradient>
      </defs>
      <rect width="1000" height="${H}" fill="url(#${id}bg)"/>
      ${s.topBar ? `<rect width="1000" height="${top}" fill="${C.yellow}"/>${T(`${s.qty} COMPRIMIDOS`, 500, 46, 38, 0, C.red, { anchor: 'middle', w: 700 })}` : ''}
      <g transform="translate(0 ${top})">
        ${orange ? `<rect width="1000" height="112" fill="url(#${id}or)"/>` : ''}
        <path d="M0 162 C240 70 640 52 1000 76 V760 H0 Z" fill="url(#${id}dk)"/>
        <path d="M0 162 C240 70 640 52 1000 76" fill="none" stroke="${C.arc}" stroke-width="16" opacity=".9"/>
        <path d="M0 150 C240 58 640 40 1000 64" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".35"/>
        ${orange ? `<path d="M0 480 C60 560 160 650 330 760 H0 Z" fill="url(#${id}or)"/>` : ''}
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M0 ${560 + i * 28} C120 ${600 + i * 26} 260 ${680 + i * 12} ${380 + i * 10} 760" fill="none" stroke="rgba(255,255,255,${.18 - i * .018})" stroke-width="2"/>`).join('')}
        <path d="M150 650 C230 690 320 730 420 760 L380 760 C290 735 210 705 140 670 Z" fill="url(#${id}bl)" opacity=".9"/>
        ${T('DOR NO CORPO', 45, 78, 32, 250, '#FFFFFF', { italic: true, w: 600, font: F_LOGO })}
        <text x="952" y="78" text-anchor="end" font-family="${F_LOGO}" font-style="italic" fill="#FFFFFF"><tspan font-size="34" font-weight="700">${s.qty} </tspan><tspan font-size="24" font-weight="600">comprimidos</tspan></text>
        ${logo(118, 300, 232, 816, id + 'lg')}
        ${T('®', 930, 290, 26, 0, '#FFFFFF', { w: 500 })}
        ${T('naproxeno sódico', 114, 428, 156, 714, C.cyan, { w: 500 })}
        <text x="111" y="562" font-family="${F_COND}" font-weight="700" fill="#FFFFFF"><tspan font-size="118">${s.doseNum}</tspan><tspan font-size="78" dx="4">mg</tspan></text>
        ${pill(172, 624, 68, 30, id + 'pl', false)}
        ${clock(524, 540, 76)}
        ${claim}
        ${strip ? `<path d="M318 640 H1000 V760 H262 Z" fill="url(#${id}ys)"/>` : ''}
        ${bayerCross(876, 668, 46, strip ? C.royal : '#FFFFFF')}
        ${T('CONTÉM:', 452, 686, 32, 152, contemFill, { w: 700, font: F_LOGO })}
        ${T(String(s.qty), 452, 744, 64, s.qty > 9 ? 74 : 36, contemFill, { w: 700, font: F_LOGO })}
        ${T('comprimidos revestidos', s.qty > 9 ? 536 : 500, 716, 26, 300, contemFill, { w: 600, font: F_LOGO })}
        ${T('USO ORAL / USO ADULTO', s.qty > 9 ? 536 : 500, 742, 20, 256, contemFill, { w: 700, font: F_LOGO })}
      </g>
    </svg>`;
  }

  /* ---------- Flanax XR ---------- */
  function xrFront(s) {
    const H = 740, id = uid('xr');
    return `<svg class="art" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${id}bg" cx=".45" cy=".55" r=".8"><stop offset="0" stop-color="#2556C8"/><stop offset=".6" stop-color="${C.xrBlue}"/><stop offset="1" stop-color="#10308C"/></radialGradient>
        <linearGradient id="${id}ye" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE03A"/><stop offset=".5" stop-color="${C.xrYellow}"/><stop offset="1" stop-color="#F5C400"/></linearGradient>
        <linearGradient id="${id}xr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#E3EAEE"/><stop offset=".55" stop-color="#A9B9C3"/><stop offset="1" stop-color="#DCE4E9"/></linearGradient>
        <linearGradient id="${id}bl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF2F5"/><stop offset=".6" stop-color="#9AA7B2"/><stop offset="1" stop-color="#5B6874"/></linearGradient>
      </defs>
      <rect width="1000" height="${H}" fill="url(#${id}bg)"/>
      <path d="M0 0 H1000 V144 C700 132 300 150 0 214 Z" fill="url(#${id}ye)"/>
      <path d="M0 214 C300 150 700 132 1000 144 V176 C700 166 320 186 0 250 Z" fill="#2AA9E8"/>
      <path d="M0 250 C320 186 700 166 1000 176" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4"/>
      <path d="M0 214 C300 150 700 132 1000 144" fill="none" stroke="#FFFFFF" stroke-width="5"/>
      ${T('NOVO', 26, 72, 34, 92, C.xrBlue, { w: 700, font: F_LOGO })}
      ${T('USO ADULTO', 826, 46, 22, 140, '#B79A12', { w: 500, font: F_LOGO })}
      ${T('USO ORAL', 826, 74, 22, 112, '#B79A12', { w: 500, font: F_LOGO })}
      ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M0 ${520 + i * 34} C120 ${560 + i * 30} 230 ${640 + i * 16} ${330 + i * 12} 740" fill="none" stroke="rgba(255,255,255,${.16 - i * .02})" stroke-width="2"/>`).join('')}
      <path d="M110 600 C210 650 300 700 380 740 L330 740 C260 710 180 670 100 625 Z" fill="url(#${id}bl)"/>
      ${logo(200, 331, 212, 702, id + 'lg')}
      ${T('®', 896, 344, 24, 0, '#FFFFFF', { w: 500 })}
      ${T('naproxeno sódico', 168, 452, 124, 456, '#2AC2E8', { w: 500 })}
      ${T('XR', 642, 486, 156, 230, '#0A1F55', { font: F_LOGO, w: 900, italic: true, extra: ' transform="translate(-7 -5)"' })}
      ${T('XR', 642, 486, 156, 230, `url(#${id}xr)`, { font: F_LOGO, w: 900, italic: true })}
      <text x="174" y="566" font-family="${F_COND}" font-weight="700" fill="#FFFFFF"><tspan font-size="112">660</tspan><tspan font-size="66" dx="4">mg</tspan></text>
      ${pill(166, 612, 82, 40, id + 'pl', true)}
      ${T('DUPLA CAMADA', 625, 598, 38, 270, '#FFFFFF', { w: 800, font: F_LOGO })}
      <text x="625" y="634" font-family="${F_LOGO}"><tspan font-size="30" font-weight="800" fill="${C.xrYellow}">RÁPIDO</tspan><tspan font-size="26" font-weight="600" font-style="italic" fill="#FFFFFF" dx="8">alívio</tspan></text>
      ${T('Liberação', 625, 672, 22, 92, '#FFFFFF', { w: 600, italic: true, font: F_LOGO })}${T('PROLONGADA', 722, 672, 24, 150, C.xrYellow, { w: 800, font: F_LOGO })}
      ${T('24h', 880, 680, 62, 96, C.xrYellow, { w: 900, italic: true, font: F_LOGO })}
      ${bayerCross(946, 590, 30)}
      ${T('8 comprimidos revestidos de liberação prolongada', 500, 718, 22, 520, '#FFFFFF', { anchor: 'middle', w: 600, font: F_LOGO })}
    </svg>`;
  }

  // Verso: marca sobre o azul
  function backSVG(s) {
    const H = s.vb, xr = s.line === 'xr';
    return `<svg class="art" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="${H}" fill="${xr ? C.xrBlue : C.royal}"/>
      <rect width="1000" height="${H * .16}" fill="${xr ? C.xrYellow : C.sky}"/>
      ${logo(250, H * .5, H * .22, 500, uid('bk'))}
      ${T(`naproxeno sódico ${s.dose}${xr ? ' · liberação prolongada' : ''}`, 500, H * .66, H * .07, 0, C.cyan, { anchor: 'middle', w: 500 })}
      ${T('Leia a bula. Bayer S.A.', 500, H * .86, H * .05, 0, '#FFFFFF', { anchor: 'middle', w: 500 })}
    </svg>`;
  }

  const SKUS = [
    { id: 'flanax-275-8', line: 'flanax', name: 'Flanax', dose: '275 mg', doseNum: '275', qty: 8, qtyLabel: '8 comprimidos revestidos', claim: 'corpo', vb: 760,
      box: { w: 300, h: 228, d: 56 }, equiv: 'Equivale a 250 mg de naproxeno', extra: 'Comprimido revestido azul, oblongo' },
    { id: 'flanax-275-20', line: 'flanax', name: 'Flanax', dose: '275 mg', doseNum: '275', qty: 20, qtyLabel: '20 comprimidos revestidos', claim: 'corpo', topBar: true, strip: true, vb: 824,
      box: { w: 300, h: 247, d: 76 }, equiv: 'Equivale a 250 mg de naproxeno', extra: 'Comprimido revestido azul, oblongo' },
    { id: 'flanax-550-10', line: 'flanax', name: 'Flanax', dose: '550 mg', doseNum: '550', qty: 10, qtyLabel: '10 comprimidos revestidos', claim: 'intensa', vb: 760,
      box: { w: 300, h: 228, d: 66 }, equiv: 'Equivale a 500 mg de naproxeno', extra: 'Comprimido revestido azul, oblongo' },
    { id: 'flanax-550-15', line: 'flanax', name: 'Flanax', dose: '550 mg', doseNum: '550', qty: 15, qtyLabel: '15 comprimidos revestidos', claim: 'intensa', topBar: true, strip: true, vb: 824,
      box: { w: 300, h: 247, d: 80 }, equiv: 'Equivale a 500 mg de naproxeno', extra: 'Comprimido revestido azul, oblongo' },
    { id: 'flanax-xr', line: 'xr', name: 'Flanax XR', dose: '660 mg', doseNum: '660', qty: 8, qtyLabel: '8 comprimidos revestidos de liberação prolongada', vb: 740, isNew: true,
      box: { w: 320, h: 237, d: 62 }, equiv: 'Dupla camada: 264 mg de liberação imediata + 396 mg de liberação prolongada', extra: 'Comprimido revestido azul, redondo' }
  ];

  // Frente = a própria arte da embalagem (foto endireitada), proporção real de cada caixa
  const PHOTO_RATIO = { 'flanax-275-8': 1.314, 'flanax-275-20': 1.298, 'flanax-550-10': 1.32, 'flanax-550-15': 1.276, 'flanax-xr': 1.359 };
  SKUS.forEach(s => {
    s.photo = `assets/frentes/${s.id}.webp`;
    s.ratio = PHOTO_RATIO[s.id];
    s.box.h = Math.round(s.box.w / s.ratio);
    s.ativo = 'Naproxeno sódico';
    s.formula = 'C₁₄H₁₃NaO₃';
    s.front = () => (s.line === 'xr' ? xrFront(s) : regularFront(s));
    s.back = () => backSVG(s);
    const xr = s.line === 'xr', orange = s.claim === 'intensa';
    const topPart = s.topBar ? 64 / s.vb : 0;
    // Laterais: mesmas faixas da borda da frente (topo, faixa de cima, azul)
    s.sides = xr
      ? { right: [[C.xrYellow, 0, .2], ['#FFFFFF', .2, .215], ['#2AA9E8', .215, .25], ['#163FA8', .25, 1]], left: [[C.xrYellow, 0, .29], ['#FFFFFF', .29, .3], ['#2AA9E8', .3, .34], ['#173FA6', .34, 1]] }
      : {
        right: [...(s.topBar ? [[C.yellow, 0, topPart]] : []), [orange ? C.orange : '#0D8ED6', topPart, topPart + .1], [C.arc, topPart + .1, topPart + .118], ['#0B74C4', topPart + .118, 1]],
        left: [...(s.topBar ? [[C.yellow, 0, topPart]] : []), [orange ? C.orange : '#12A8EC', topPart, topPart + .2], [C.arc, topPart + .2, topPart + .222], [orange ? C.orange : C.royal, topPart + .222, 1]]
      };
    s.top = xr ? [C.xrYellow, '#F2C200'] : (s.topBar ? [C.yellow, '#F0C300'] : (orange ? [C.orange, '#D8401F'] : ['#16A6EA', '#0A8BD3']));
    s.bottom = xr ? '#10308C' : C.royal2;
    s.sideLabel = xr ? 'FLANAX XR' : `FLANAX ${s.doseNum} mg`;
  });

  const LINES = {
    flanax: { key: 'flanax', name: 'Flanax', lead: 'Naproxeno sódico da Bayer em comprimidos revestidos de 275 mg e 550 mg.' },
    xr: { key: 'xr', name: 'Flanax XR', lead: 'Naproxeno sódico 660 mg em comprimido de dupla camada: uma parte de liberação imediata e outra de liberação prolongada.' }
  };

  const FAQ = [
    ['Qual o princípio ativo do Flanax?', 'Naproxeno sódico. O comprimido de 275 mg equivale a 250 mg de naproxeno e o de 550 mg equivale a 500 mg.'],
    ['O que é o Flanax XR?', 'É a versão de liberação prolongada: cada comprimido de 660 mg tem duas camadas, uma de liberação imediata com 264 mg e outra de liberação prolongada com 396 mg de naproxeno sódico.'],
    ['Quais apresentações existem?', 'Flanax 275 mg em caixas com 8 e 20 comprimidos revestidos, Flanax 550 mg em caixas com 10 e 15 comprimidos revestidos, e Flanax XR 660 mg em caixa com 8 comprimidos.'],
    ['Qual a diferença entre 275 mg e 550 mg?', 'A quantidade de naproxeno sódico em cada comprimido. As embalagens também são diferentes: a de 550 mg tem a faixa laranja.'],
    ['Preciso de receita?', 'São medicamentos isentos de prescrição. Mesmo assim, leia a bula e fale com um farmacêutico ou médico antes de usar.'],
    ['Onde encontro a bula?', 'Dentro de cada embalagem e no Bulário Eletrônico da Anvisa, no site consultas.anvisa.gov.br.']
  ];

  const flat = s => `<div class="flat" style="aspect-ratio:${s.ratio}"><img src="${s.photo}" alt="Embalagem de ${s.name} ${s.dose}, ${s.qtyLabel}" loading="lazy" decoding="async" /></div>`;
  return { C, SKUS, LINES, FAQ, flat, bayerCross, byId: id => SKUS.find(s => s.id === id) };
})();
