# Flanax · Bayer

Site conceitual da linha Flanax (naproxeno sódico), com as cinco embalagens em 3D.

| Produto | Apresentação |
| --- | --- |
| Flanax 275 mg | 8 comprimidos revestidos |
| Flanax 275 mg | 20 comprimidos revestidos |
| Flanax 550 mg | 10 comprimidos revestidos |
| Flanax 550 mg | 15 comprimidos revestidos |
| Flanax XR 660 mg | 8 comprimidos de liberação prolongada (dupla camada: 264 mg + 396 mg) |

Site estático, sem build: sirva a pasta (`python3 -m http.server`) e abra `index.html`.

## Arquivos
- `assets/arte`: frentes (e topos) recortadas das fotos em alta resolução das embalagens.
- `catalog.js`: dados dos produtos.
- `scene3d.js`: caixas em WebGL (three.js, em `assets/vendor`), com as artes como textura.
- `app.js`: interações (abas, órbita, visualizador, busca Ctrl K, tema).
- `styles.css`: sistema visual, tema claro e escuro.
- `assets/fonts`: Barlow e Barlow Condensed, embutidas nas texturas.

## Abas
- **Início**: as cinco caixas em órbita no centro da tela (arraste, setas ou clique).
- **Produtos**: troca entre Flanax e Flanax XR, caixa 3D que gira ao arrastar, ficha e comparativo.
- **Flanax XR**: o comprimido de dupla camada se separa ao passar o mouse ou tocar; molécula do naproxeno sódico.
- **Dúvidas**: perguntas frequentes e busca de farmácias por CEP.

O site não traz indicação, posologia nem recomendação de uso.

## Publicar no GitHub Pages
1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions → Publicar no GitHub Pages → Run workflow** (ou faça um push).

O site fica em `https://ranijabali12.github.io/flanax/`.
