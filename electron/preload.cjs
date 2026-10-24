const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stoaDesktop', Object.freeze({
  platform: process.platform,
  retry: () => ipcRenderer.send('stoa:retry'),
}));
