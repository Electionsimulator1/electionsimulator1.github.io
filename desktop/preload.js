// Ponte mínima e segura entre o jogo e o app desktop
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('rapDesktop', {
  toggleFullscreen: () => ipcRenderer.invoke('rap:fullscreen'),
  quit: () => ipcRenderer.invoke('rap:quit'),
  version: () => ipcRenderer.invoke('rap:version'),
});
