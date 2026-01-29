import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Environment
  getEnvironments: () => ipcRenderer.invoke('get-environments'),
  addEnvironment: (env: any) => ipcRenderer.invoke('add-environment', env),
  updateEnvironment: (id: string, env: any) => ipcRenderer.invoke('update-environment', id, env),
  deleteEnvironment: (id: string) => ipcRenderer.invoke('delete-environment', id),
  testConnection: (env: any) => ipcRenderer.invoke('test-connection', env),

  // K8s
  syncEnvironment: (env: any) => ipcRenderer.invoke('sync-environment', env),
  getCurrentContext: () => ipcRenderer.invoke('get-current-context'),
  listContexts: () => ipcRenderer.invoke('list-contexts'),
  switchContext: (contextName: string) => ipcRenderer.invoke('switch-context', contextName),
  getKubeConfig: () => ipcRenderer.invoke('get-kubeconfig'),
  deleteContext: (contextName: string) => ipcRenderer.invoke('delete-context', contextName),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),

  // Logs
  getLogs: (filter?: any) => ipcRenderer.invoke('get-logs', filter),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),
  exportLogs: (format: 'json' | 'csv') => ipcRenderer.invoke('export-logs', format),

  // Terminal
  terminalConnect: (env: any, cols: number, rows: number) => ipcRenderer.invoke('terminal-connect', env, cols, rows),
  terminalDisconnect: () => ipcRenderer.invoke('terminal-disconnect'),
  terminalStatus: () => ipcRenderer.invoke('terminal-status'),
  terminalWrite: (data: string) => ipcRenderer.invoke('terminal-write', data),
  terminalResize: (cols: number, rows: number) => ipcRenderer.invoke('terminal-resize', cols, rows),
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal-data', (_, data) => callback(data))
  },
  removeTerminalDataListener: () => {
    ipcRenderer.removeAllListeners('terminal-data')
  },

  // Events
  onSyncProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('sync-progress', (_, progress) => callback(progress))
  },
  onNewLog: (callback: (log: any) => void) => {
    ipcRenderer.on('new-log', (_, log) => callback(log))
  }
})
