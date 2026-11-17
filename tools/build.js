// Build do Rumo ao Poder: gera o app desktop (instalador + portátil) e o site com os downloads.
// Uso: node tools/build.js            (tudo)
//      node tools/build.js --site     (só o site, reaproveitando os .exe já gerados)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DESKTOP = path.join(ROOT, 'desktop');
const SITE = path.join(ROOT, 'site');
const SRC = ['index.html', 'css', 'js', 'assets', 'vendor'];
const onlySite = process.argv.includes('--site');
const version = JSON.parse(fs.readFileSync(path.join(DESKTOP, 'package.json'), 'utf8')).version;

const clean = (dir) => { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); };
const copySrc = (dest) => SRC.forEach((p) => fs.cpSync(path.join(ROOT, p), path.join(dest, p), { recursive: true }));
const log = (s) => console.log('\x1b[32m›\x1b[0m ' + s);

if (!onlySite) {
  log('Copiando o jogo para desktop/app');
  clean(path.join(DESKTOP, 'app'));
  copySrc(path.join(DESKTOP, 'app'));
  log('Empacotando com electron-builder (instalador NSIS + portátil)');
  // O NSIS não aceita caminhos com mais de 260 caracteres: em pastas profundas, compila por um atalho (junction) curto.
  let cwd = DESKTOP; const env = { ...process.env };
  if (process.platform === 'win32' && DESKTOP.length > 90) {
    const j = path.join(require('os').tmpdir(), 'rapb');
    if (fs.existsSync(j) && fs.realpathSync(j) !== DESKTOP) fs.rmSync(j, { recursive: false, force: true });
    if (!fs.existsSync(j)) fs.symlinkSync(DESKTOP, j, 'junction');
    cwd = j; env.NODE_OPTIONS = '--preserve-symlinks --preserve-symlinks-main';
  }
  execSync('npx electron-builder --win nsis portable --x64', { cwd, env, stdio: 'inherit' });
}

log('Montando o site em site/');
clean(SITE);
copySrc(SITE);
fs.mkdirSync(path.join(SITE, 'downloads'), { recursive: true });
const dist = path.join(DESKTOP, 'dist');
const files = { setup: 'RumoAoPoder-Setup.exe', portable: 'RumoAoPoder-Portable.exe' };
// --download-base <url>: os .exe ficam hospedados fora do site (ex.: GitHub Releases) e o site só aponta para eles
const bi = process.argv.indexOf('--download-base');
const base = bi > 0 ? process.argv[bi + 1].replace(/\/?$/, '/') : 'downloads/';
const info = { version, setup: { file: base + files.setup, size: 0 }, portable: { file: base + files.portable, size: 0 } };
for (const k of Object.keys(files)) {
  const from = path.join(dist, files[k]);
  if (fs.existsSync(from)) { if (bi < 0) fs.copyFileSync(from, path.join(SITE, 'downloads', files[k])); info[k].size = fs.statSync(from).size; }
  else console.warn('  aviso: ' + files[k] + ' não encontrado em desktop/dist');
}
if (bi > 0) fs.rmSync(path.join(SITE, 'downloads'), { recursive: true, force: true });
fs.writeFileSync(path.join(SITE, 'js', 'download-info.js'), '/* Gerado pelo build */\nwindow.RAP_DOWNLOADS = ' + JSON.stringify(info) + ';\n');
log(`Pronto. Instalador: ${(info.setup.size / 1048576).toFixed(1)} MB · Portátil: ${(info.portable.size / 1048576).toFixed(1)} MB`);
