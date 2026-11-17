// Γέφυρα ανάμεσα στο παράθυρο και τον υπολογιστή (μόνο συγκεκριμένες λειτουργίες)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gymtrack', {
  load: () => ipcRenderer.invoke('data:load'),
  save: text => ipcRenderer.invoke('data:save', text),
  info: () => ipcRenderer.invoke('data:info'),
  openFolder: () => ipcRenderer.invoke('data:openFolder'),
  chooseFolder: () => ipcRenderer.invoke('data:chooseFolder'),
  importFile: () => ipcRenderer.invoke('data:importFile'),
  saveAs: (text, defaultName, kind) => ipcRenderer.invoke('data:saveAs', { text, defaultName, kind }),
  refocus: () => ipcRenderer.send('app:refocus'),
  backupStatus: () => ipcRenderer.invoke('backup:status'),
  backupNow: kind => ipcRenderer.invoke('backup:now', kind),
  backupChoose: kind => ipcRenderer.invoke('backup:choose', kind),
  backupRemove: kind => ipcRenderer.invoke('backup:remove', kind),
  backupOpen: kind => ipcRenderer.invoke('backup:open', kind),
  openUpdateLog: () => ipcRenderer.invoke('update:openLog'),
  fixShortcuts: () => ipcRenderer.invoke('app:fixShortcuts'),
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  justUpdated: () => ipcRenderer.invoke('update:justUpdated'),
  onUpdate: cb => ipcRenderer.on('update:status', (_e, s) => cb(s))
});
