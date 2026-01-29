import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'

// Helper to convert reactive object to plain object for IPC
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(toRaw(obj)))
}

const defaultSettings: Settings = {
  general: {
    language: 'zh-CN',
    theme: 'system',
    minimizeToTray: false
  },
  k8s: {
    localConfigPath: '~/.kube/config',
    enableBackup: true,
    backupRetention: 5
  },
  ssh: {
    timeout: 30,
    retryCount: 3,
    defaultPort: 22
  },
  logging: {
    level: 'INFO',
    retentionDays: 30
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadSettings() {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.electronAPI.getSettings()
    } catch (e) {
      error.value = (e as Error).message
      settings.value = defaultSettings
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(newSettings: Partial<Settings>) {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.electronAPI.updateSettings(toPlainObject(newSettings))
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  function resetSettings() {
    settings.value = defaultSettings
  }

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    resetSettings
  }
})
