/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    // Environment
    getEnvironments: () => Promise<Environment[]>
    addEnvironment: (env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Environment>
    updateEnvironment: (id: string, env: Partial<Environment>) => Promise<Environment>
    deleteEnvironment: (id: string) => Promise<void>
    testConnection: (env: Environment) => Promise<{ success: boolean; message: string }>

    // K8s
    syncEnvironment: (env: Environment) => Promise<void>
    getCurrentContext: () => Promise<string | null>
    listContexts: () => Promise<K8sContext[]>
    switchContext: (contextName: string) => Promise<void>
    getKubeConfig: () => Promise<string>
    deleteContext: (contextName: string) => Promise<void>

    // Settings
    getSettings: () => Promise<Settings>
    updateSettings: (settings: Partial<Settings>) => Promise<Settings>

    // Logs
    getLogs: (filter?: LogFilter) => Promise<LogEntry[]>
    clearLogs: () => Promise<void>
    exportLogs: (format: 'json' | 'csv') => Promise<string>

    // Events
    onSyncProgress: (callback: (progress: SyncProgress) => void) => void
    onNewLog: (callback: (log: LogEntry) => void) => void
  }
}

interface Environment {
  id: string
  name: string
  identifier: string
  sshConfig: {
    host: string
    port: number
    username: string
    authType: 'password' | 'key' | 'agent'
    password?: string
    privateKeyPath?: string
  }
  description?: string
  status: 'active' | 'inactive' | 'error'
  lastSync?: string
  createdAt: string
  updatedAt: string
}

interface K8sContext {
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

interface Settings {
  general: {
    language: 'zh-CN' | 'en-US'
    theme: 'light' | 'dark' | 'system'
    minimizeToTray: boolean
  }
  k8s: {
    localConfigPath: string
    enableBackup: boolean
    backupRetention: number
  }
  ssh: {
    timeout: number
    retryCount: number
    defaultPort: number
  }
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
    retentionDays: number
  }
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'INFO' | 'WARNING' | 'ERROR'
  operation: string
  environment?: string
  status: 'success' | 'failure'
  message: string
  error?: string
}

interface LogFilter {
  level?: string
  operation?: string
  environment?: string
  startDate?: string
  endDate?: string
}

interface SyncProgress {
  step: number
  totalSteps: number
  message: string
  progress?: number
}
