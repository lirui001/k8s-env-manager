import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'

// Helper to convert reactive object to plain object for IPC
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(toRaw(obj)))
}

export const useEnvironmentStore = defineStore('environment', () => {
  const environments = ref<Environment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeEnvironments = computed(() =>
    environments.value.filter(env => env.status === 'active')
  )

  const errorEnvironments = computed(() =>
    environments.value.filter(env => env.status === 'error')
  )

  const inactiveEnvironments = computed(() =>
    environments.value.filter(env => env.status === 'inactive')
  )

  async function loadEnvironments() {
    loading.value = true
    error.value = null
    try {
      environments.value = await window.electronAPI.getEnvironments()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function addEnvironment(env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    loading.value = true
    error.value = null
    try {
      const newEnv = await window.electronAPI.addEnvironment(env)
      environments.value.push(newEnv)
      return newEnv
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateEnvironment(id: string, env: Partial<Environment>) {
    loading.value = true
    error.value = null
    try {
      const updated = await window.electronAPI.updateEnvironment(id, env)
      const index = environments.value.findIndex(e => e.id === id)
      if (index !== -1) {
        environments.value[index] = updated
      }
      return updated
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteEnvironment(id: string) {
    loading.value = true
    error.value = null
    try {
      await window.electronAPI.deleteEnvironment(id)
      environments.value = environments.value.filter(e => e.id !== id)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function testConnection(env: Environment) {
    try {
      return await window.electronAPI.testConnection(toPlainObject(env))
    } catch (e) {
      return { success: false, message: (e as Error).message }
    }
  }

  async function syncEnvironment(env: Environment) {
    try {
      await window.electronAPI.syncEnvironment(toPlainObject(env))
      // Update environment status after sync
      const index = environments.value.findIndex(e => e.id === env.id)
      if (index !== -1) {
        environments.value[index].status = 'active'
        environments.value[index].lastSync = new Date().toISOString()
      }
    } catch (e) {
      const index = environments.value.findIndex(e => e.id === env.id)
      if (index !== -1) {
        environments.value[index].status = 'error'
      }
      throw e
    }
  }

  return {
    environments,
    loading,
    error,
    activeEnvironments,
    errorEnvironments,
    inactiveEnvironments,
    loadEnvironments,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    testConnection,
    syncEnvironment
  }
})
