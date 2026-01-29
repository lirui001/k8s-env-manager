import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useK8sStore = defineStore('k8s', () => {
  const currentContext = ref<string | null>(null)
  const contexts = ref<K8sContext[]>([])
  const kubeConfig = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadCurrentContext() {
    try {
      currentContext.value = await window.electronAPI.getCurrentContext()
    } catch (e) {
      console.error('Failed to load current context:', e)
      currentContext.value = null
    }
  }

  async function loadContexts() {
    loading.value = true
    error.value = null
    try {
      contexts.value = await window.electronAPI.listContexts()
    } catch (e) {
      error.value = (e as Error).message
      contexts.value = []
    } finally {
      loading.value = false
    }
  }

  async function switchContext(contextName: string) {
    loading.value = true
    error.value = null
    try {
      await window.electronAPI.switchContext(contextName)
      currentContext.value = contextName
      // Update contexts list to reflect current
      contexts.value = contexts.value.map(ctx => ({
        ...ctx,
        isCurrent: ctx.name === contextName
      }))
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loadKubeConfig() {
    loading.value = true
    error.value = null
    try {
      kubeConfig.value = await window.electronAPI.getKubeConfig()
    } catch (e) {
      error.value = (e as Error).message
      kubeConfig.value = ''
    } finally {
      loading.value = false
    }
  }

  async function deleteContext(contextName: string) {
    loading.value = true
    error.value = null
    try {
      await window.electronAPI.deleteContext(contextName)
      contexts.value = contexts.value.filter(ctx => ctx.name !== contextName)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    currentContext,
    contexts,
    kubeConfig,
    loading,
    error,
    loadCurrentContext,
    loadContexts,
    switchContext,
    loadKubeConfig,
    deleteContext
  }
})
