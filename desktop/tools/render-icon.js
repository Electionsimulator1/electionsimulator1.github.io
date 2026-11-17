// Renderiza assets/icon.svg em PNG 512/256 e ICO, com transparência (npx electron tools/render-icon.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const build = path.join(__dirname, '..', 'build');
  const svg = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'icon.svg'), 'utf8');
  const size = 512;
  const win = new BrowserWindow({ width: size, height: size, show: false, transparent: true, frame: false, useContentSize: true, webPreferences: { offscreen: true } });
  const tmp = path.join(build, '_icon.html');
  fs.writeFileSync(tmp, `<html><body style="margin:0;background:transparent;overflow:hidden">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await win.loadFile(tmp);
  await new Promise((r) => setTimeout(r, 500));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: size, height: size });
  fs.unlinkSync(tmp);
  const png512 = img.toPNG();
  const png256 = img.resize({ width: 256, height: 256, quality: 'best' }).toPNG();
  fs.writeFileSync(path.join(build, 'icon.png'), png512);
  fs.writeFileSync(path.join(build, 'icon-256.png'), png256);
  // ICO com PNG embutido (256x256)
  const hdr = Buffer.alloc(6); hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16); dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6); dir.writeUInt32LE(png256.length, 8); dir.writeUInt32LE(22, 12);
  fs.writeFileSync(path.join(build, 'icon.ico'), Buffer.concat([hdr, dir, png256]));
  console.log('icon ok', png512.length, png256.length, img.getSize());
  app.quit();
});
