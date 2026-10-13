// Produtos em WebGL; se falhar, o app usa a versão em CSS
try {
  const m = await import('./scene3d.js?v=30');
  window.__fx3d(await m.create({ lite: document.documentElement.classList.contains('lite') }));
} catch (e) { console.warn('WebGL indisponível, usando a versão em CSS', e); window.__fx3d(null); }
