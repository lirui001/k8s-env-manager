<template>
  <div class="terminal-page">
    <div class="page-header">
      <h1 class="page-title">远程终端</h1>
      <div class="actions">
        <el-select
          v-model="selectedEnvId"
          placeholder="选择环境"
          size="small"
          style="width: 180px"
          :disabled="connected"
        >
          <el-option
            v-for="env in environments"
            :key="env.id"
            :label="env.name"
            :value="env.id"
          />
        </el-select>
        <el-button
          v-if="!connected"
          type="primary"
          size="small"
          :loading="connecting"
          :disabled="!selectedEnvId"
          @click="connectTerminal"
        >
          连接
        </el-button>
        <el-button
          v-else
          type="danger"
          size="small"
          @click="disconnectTerminal"
        >
          断开
        </el-button>
        <el-tag v-if="connected" type="success" size="small">
          {{ connectedEnvName }}
        </el-tag>
      </div>
    </div>

    <div class="terminal-container" ref="terminalContainer">
      <div v-if="!connected" class="terminal-placeholder">
        <p>请选择环境并点击"连接"按钮</p>
      </div>
      <div ref="terminalEl" class="terminal-element"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import { ElMessage } from 'element-plus'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const envStore = useEnvironmentStore()

const connecting = ref(false)
const connected = ref(false)
const connectedEnvName = ref('')
const selectedEnvId = ref('')
const terminalContainer = ref<HTMLElement>()
const terminalEl = ref<HTMLElement>()
const environments = ref<any[]>([])

let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let resizeObserver: ResizeObserver | null = null

async function loadEnvironments() {
  await envStore.loadEnvironments()
  environments.value = envStore.environments
}

async function checkStatus() {
  const status = await window.electronAPI.terminalStatus()
  connected.value = status.connected && status.hasShell
  connectedEnvName.value = status.environment || ''
}

function initTerminal() {
  if (terminal) {
    terminal.dispose()
  }

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
    theme: {
      background: '#0c0c0c',
      foreground: '#cccccc',
      cursor: '#ffffff',
      cursorAccent: '#000000',
      selectionBackground: '#264f78',
      black: '#0c0c0c',
      red: '#ff6b6b',
      green: '#5fba7d',
      yellow: '#f1c40f',
      blue: '#6fb3d2',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#cccccc',
      brightBlack: '#666666',
      brightRed: '#ff6b6b',
      brightGreen: '#5fba7d',
      brightYellow: '#f1c40f',
      brightBlue: '#6fb3d2',
      brightMagenta: '#c678dd',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff'
    },
    allowProposedApi: true
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  if (terminalEl.value) {
    terminal.open(terminalEl.value)
    fitAddon.fit()
  }

  // Handle user input - send to SSH
  terminal.onData((data) => {
    if (connected.value) {
      window.electronAPI.terminalWrite(data)
    }
  })

  // Handle resize
  terminal.onResize(({ cols, rows }) => {
    if (connected.value) {
      window.electronAPI.terminalResize(cols, rows)
    }
  })

  // Setup resize observer
  if (terminalContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (fitAddon && terminal) {
        fitAddon.fit()
      }
    })
    resizeObserver.observe(terminalContainer.value)
  }

  // Listen for data from SSH
  window.electronAPI.onTerminalData((data: string) => {
    if (terminal) {
      terminal.write(data)
    }
  })
}

async function connectTerminal() {
  if (!selectedEnvId.value) return

  const env = environments.value.find(e => e.id === selectedEnvId.value)
  if (!env) return

  connecting.value = true

  try {
    // Initialize terminal if not already
    if (!terminal) {
      initTerminal()
      await nextTick()
    }

    // Clear terminal
    terminal?.clear()
    terminal?.write(`\r\n连接到 ${env.name} (${env.sshConfig.host})...\r\n`)

    // Get terminal size
    const cols = terminal?.cols || 80
    const rows = terminal?.rows || 24

    const result = await window.electronAPI.terminalConnect(
      JSON.parse(JSON.stringify(env)),
      cols,
      rows
    )

    if (result.success) {
      connected.value = true
      connectedEnvName.value = env.name
      terminal?.focus()
      ElMessage.success(`已连接到 ${env.name}`)
    } else {
      terminal?.write(`\r\n\x1b[31m连接失败: ${result.message}\x1b[0m\r\n`)
      ElMessage.error(`连接失败: ${result.message}`)
    }
  } catch (e) {
    terminal?.write(`\r\n\x1b[31m连接失败: ${(e as Error).message}\x1b[0m\r\n`)
    ElMessage.error(`连接失败: ${(e as Error).message}`)
  } finally {
    connecting.value = false
  }
}

async function disconnectTerminal() {
  await window.electronAPI.terminalDisconnect()
  connected.value = false
  terminal?.write('\r\n\x1b[33m连接已断开\x1b[0m\r\n')
  connectedEnvName.value = ''
}

function cleanup() {
  window.electronAPI.removeTerminalDataListener()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (terminal) {
    terminal.dispose()
    terminal = null
  }
  fitAddon = null
}

onMounted(async () => {
  await loadEnvironments()
  await checkStatus()

  // Initialize terminal
  await nextTick()
  initTerminal()

  // If already connected, just setup the listeners
  if (connected.value) {
    terminal?.write(`\r\n已恢复到 ${connectedEnvName.value} 的连接\r\n`)
    terminal?.focus()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.terminal-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-container {
  flex: 1;
  background-color: #0c0c0c;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 300px;
}

.terminal-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 14px;
  text-align: center;
}

.terminal-element {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* Override xterm styles */
:deep(.xterm) {
  height: 100%;
  padding: 4px;
}

:deep(.xterm-viewport) {
  overflow-y: auto !important;
}

:deep(.xterm-screen) {
  height: 100%;
}
</style>
