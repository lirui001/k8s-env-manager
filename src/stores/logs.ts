import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'

// Helper to convert reactive object to plain object for IPC
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(toRaw(obj)))
}

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<LogFilter>({})

  const filteredLogs = computed(() => {
    let result = [...logs.value]

    if (filter.value.level) {
      result = result.filter(log => log.level === filter.value.level)
    }

    if (filter.value.operation) {
      result = result.filter(log => log.operation === filter.value.operation)
    }

    if (filter.value.environment) {
      result = result.filter(log => log.environment === filter.value.environment)
    }

    if (filter.value.startDate) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(filter.value.startDate!))
    }

    if (filter.value.endDate) {
      result = result.filter(log => new Date(log.timestamp) <= new Date(filter.value.endDate!))
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  })

  async function loadLogs() {
    loading.value = true
    error.value = null
    try {
      logs.value = await window.electronAPI.getLogs(toPlainObject(filter.value))
    } catch (e) {
      error.value = (e as Error).message
      logs.value = []
    } finally {
      loading.value = false
    }
  }

  async function clearLogs() {
    loading.value = true
    error.value = null
    try {
      await window.electronAPI.clearLogs()
      logs.value = []
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  function setFilter(newFilter: LogFilter) {
    filter.value = newFilter
  }

  function addLog(log: LogEntry) {
    logs.value.unshift(log)
  }

  return {
    logs,
    loading,
    error,
    filter,
    filteredLogs,
    loadLogs,
    clearLogs,
    setFilter,
    addLog
  }
})
