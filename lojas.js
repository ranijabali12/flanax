/* Links diretos dos produtos nas farmácias on-line (conferidos nas lojas).
   Só entram as redes que vendem a apresentação; cada produto tem seus próprios links. */
window.LOJAS = {
 "farmacias": [
  [
   "saopaulo",
   "Drogaria São Paulo"
  ],
  [
   "pacheco",
   "Drogarias Pacheco"
  ],
  [
   "paguemenos",
   "Pague Menos"
  ],
  [
   "venancio",
   "Drogaria Venancio"
  ]
 ],
 "links": {
  "flanax-275-8": {
   "pacheco": "https://www.drogariaspacheco.com.br/flanax-275mg-bayer-8-comprimidos/p",
   "saopaulo": "https://www.drogariasaopaulo.com.br/flanax-275mg-bayer-8-comprimidos/p",
   "paguemenos": "https://www.paguemenos.com.br/flanax-275mg-com-8-comprimidos/p",
   "venancio": "https://www.drogariavenancio.com.br/flanax-275mg-bayer-8comprimidos/p"
  },
  "flanax-275-20": {
   "pacheco": "https://www.drogariaspacheco.com.br/flanax-275mg-bayer-20-comprimidos/p",
   "saopaulo": "https://www.drogariasaopaulo.com.br/flanax-275mg-bayer-20-comprimidos/p",
   "paguemenos": "https://www.paguemenos.com.br/flanax-275mg-com-20-comprimidos/p",
   "venancio": "https://www.drogariavenancio.com.br/flanax-275mg-bayer-20-comprimidos-revestidos/p"
  },
  "flanax-550-10": {
   "pacheco": "https://www.drogariaspacheco.com.br/flanax-550mg-bayer-10-comprimidos/p",
   "saopaulo": "https://www.drogariasaopaulo.com.br/flanax-550mg-bayer-10-comprimidos/p",
   "paguemenos": "https://www.paguemenos.com.br/flanax-550mg-com-10-comprimidos/p",
   "venancio": "https://www.drogariavenancio.com.br/flanax-550mg-bayer-10-comprimidos/p"
  },
  "flanax-550-15": {
   "pacheco": "https://www.drogariaspacheco.com.br/flanax-550mg-bayer-15-comprimidos/p",
   "saopaulo": "https://www.drogariasaopaulo.com.br/flanax-550mg-bayer-15-comprimidos/p",
   "paguemenos": "https://www.paguemenos.com.br/flanax-550mg-com-15-comprimidos/p",
   "venancio": "https://www.drogariavenancio.com.br/flanax-550mg-15cpr-revest/p"
  },
  "flanax-xr": {
   "pacheco": "https://www.drogariaspacheco.com.br/flanax-xr-660mg-bayer-8-comprimidos-revestidos/p",
   "saopaulo": "https://www.drogariasaopaulo.com.br/flanax-xr-660mg-bayer-8-comprimidos-revestidos/p",
   "paguemenos": "https://www.paguemenos.com.br/flanax-xr-660mg-com-8-comprimidos/p",
   "venancio": "https://www.drogariavenancio.com.br/flanax-xr-660mg-bayer-8-comprimidos/p"
  }
 }
};
window.LOJAS.chips = (id, cls = '') => {
  const L = window.LOJAS, m = L.links[id] || {};
  const items = L.farmacias.filter(([k]) => m[k]);
  if (!items.length) return '';
  return `<div class="buy ${cls}">${items.map(([k, n]) => `<a class="buy__chip" href="${m[k]}" target="_blank" rel="noopener" data-ph="${k}">${n}<span aria-hidden="true">↗</span></a>`).join('')}</div>`;
};
