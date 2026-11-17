# Rumo ao Poder

Simulador eleitoral 2D. Um único código roda em dois lugares:

- **Site** (`site/`): o jogo completo no navegador, com o selo "Baixe o jogo para uma melhor experiência" no canto.
- **App para Windows** (`desktop/`): o mesmo jogo em janela própria (Electron), 100% offline, com instalador e versão portátil.

## Estrutura

| Pasta | O que é |
| --- | --- |
| `index.html`, `css/`, `js/`, `assets/`, `vendor/` | Código-fonte do jogo (é daqui que tudo é gerado) |
| `js/platform.js` | Diferenças entre site (selo + painel de download) e app (tela cheia, sair) |
| `js/data/outlines/` | Contornos reais dos 5.569 municípios (IBGE), carregados por estado |
| `desktop/` | Projeto Electron (`main.js`, `preload.js`, ícone em `build/`) |
| `site/` | Site pronto para publicar (gerado pelo build) |
| `tools/build.js` | Gera o app e o site |

## Gerar tudo de novo

```bash
cd desktop && npm install && cd ..
node tools/build.js
```

Saída: `desktop/dist/RumoAoPoder-Setup.exe`, `desktop/dist/RumoAoPoder-Portable.exe` e a pasta `site/` (com os dois `.exe` em `site/downloads/`).

Só o site, reaproveitando os `.exe` já gerados: `node tools/build.js --site`

## Publicar o site

A pasta `site/` é estática: funciona em GitHub Pages, Netlify, Vercel ou qualquer hospedagem.
Os `.exe` têm ~80 MB cada. Se a hospedagem limitar o tamanho de arquivos, publique-os em outro lugar
(ex.: GitHub Releases) e gere o site apontando para lá:

```bash
node tools/build.js --site --download-base https://github.com/USUARIO/REPO/releases/latest/download/
```

## Observações

- O app não tem assinatura digital, então o Windows pode mostrar o aviso do SmartScreen na primeira vez
  ("Mais informações" → "Executar assim mesmo"). Um certificado de assinatura de código remove o aviso.
- Em pastas com caminho muito longo, o build compila por um atalho curto em `%TEMP%\rapb` (limite de 260 caracteres do NSIS).
