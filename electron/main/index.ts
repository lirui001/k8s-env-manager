import { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import { ConfigService } from './services/config.service'
import { SSHService } from './services/ssh.service'
import { K8sService } from './services/k8s.service'
import { LoggerService } from './services/logger.service'

// Services
const configService = new ConfigService()
const k8sService = new K8sService()
const loggerService = new LoggerService()

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Terminal SSH connection
let terminalSSH: SSHService | null = null
let terminalEnvName: string | null = null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('close', (event) => {
    const settings = configService.getSettings()
    if (settings.general.minimizeToTray && tray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray() {
  const iconPath = path.join(__dirname, '../../build/icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '退出', click: () => {
      tray?.destroy()
      app.quit()
    }}
  ])

  tray.setToolTip('K8s Manager')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow?.show()
  })
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// IPC Handlers - Environment
ipcMain.handle('get-environments', async () => {
  return configService.getEnvironments()
})

ipcMain.handle('add-environment', async (_, env) => {
  const result = await configService.addEnvironment(env)
  loggerService.info('添加环境', { operation: 'add_environment', environment: env.name, status: 'success' })
  return result
})

ipcMain.handle('update-environment', async (_, id, env) => {
  const result = await configService.updateEnvironment(id, env)
  loggerService.info('更新环境', { operation: 'update_environment', environment: env.name, status: 'success' })
  return result
})

ipcMain.handle('delete-environment', async (_, id) => {
  const env = configService.getEnvironments().find(e => e.id === id)
  await configService.deleteEnvironment(id)
  if (env) {
    loggerService.info('删除环境', { operation: 'delete_environment', environment: env.name, status: 'success' })
  }
})

ipcMain.handle('test-connection', async (_, env) => {
  const sshService = new SSHService(env, configService.getSettings().ssh)
  try {
    const result = await sshService.testConnection()
    loggerService.info('连接测试', {
      operation: 'test_connection',
      environment: env.name,
      status: result.success ? 'success' : 'failure',
      message: result.message
    })
    return result
  } catch (error) {
    const message = (error as Error).message
    loggerService.error('连接测试失败', {
      operation: 'test_connection',
      environment: env.name,
      status: 'failure',
      message
    })
    return { success: false, message }
  }
})

// IPC Handlers - K8s
ipcMain.handle('sync-environment', async (_, env) => {
  const sshService = new SSHService(env, configService.getSettings().ssh)

  try {
    // Step 1: Connect
    mainWindow?.webContents.send('sync-progress', { step: 0, totalSteps: 4, message: '连接远程服务器...' })
    await sshService.connect()

    // Step 2: Download
    mainWindow?.webContents.send('sync-progress', { step: 1, totalSteps: 4, message: '下载配置文件...' })
    const tempPath = await sshService.downloadKubeConfig()

    // Step 3: Parse and modify
    mainWindow?.webContents.send('sync-progress', { step: 2, totalSteps: 4, message: '解析配置...' })

    // Step 4: Merge
    mainWindow?.webContents.send('sync-progress', { step: 3, totalSteps: 4, message: '合并到本地...' })
    await k8sService.mergeConfig(tempPath, env.identifier, env.sshConfig.host)

    // Update environment status
    await configService.updateEnvironment(env.id, {
      status: 'active',
      lastSync: new Date().toISOString()
    })

    sshService.disconnect()

    loggerService.info('同步配置成功', {
      operation: 'sync_config',
      environment: env.name,
      status: 'success'
    })

    return { success: true }
  } catch (error) {
    sshService.disconnect()
    const message = (error as Error).message

    await configService.updateEnvironment(env.id, { status: 'error' })

    loggerService.error('同步配置失败', {
      operation: 'sync_config',
      environment: env.name,
      status: 'failure',
      message
    })

    throw error
  }
})

ipcMain.handle('get-current-context', async () => {
  return k8sService.getCurrentContext()
})

ipcMain.handle('list-contexts', async () => {
  return k8sService.listContexts()
})

ipcMain.handle('switch-context', async (_, contextName) => {
  await k8sService.switchContext(contextName)
  loggerService.info('切换环境', {
    operation: 'switch_context',
    environment: contextName,
    status: 'success'
  })
})

ipcMain.handle('get-kubeconfig', async () => {
  return k8sService.getKubeConfig()
})

ipcMain.handle('delete-context', async (_, contextName) => {
  await k8sService.deleteContext(contextName)
  loggerService.info('删除 Context', {
    operation: 'delete_context',
    environment: contextName,
    status: 'success'
  })
})

// IPC Handlers - Settings
ipcMain.handle('get-settings', async () => {
  return configService.getSettings()
})

ipcMain.handle('update-settings', async (_, settings) => {
  return configService.updateSettings(settings)
})

// IPC Handlers - Logs
ipcMain.handle('get-logs', async (_, filter) => {
  return loggerService.getLogs(filter)
})

ipcMain.handle('clear-logs', async () => {
  await loggerService.clearLogs()
})

ipcMain.handle('export-logs', async (_, format) => {
  return loggerService.exportLogs(format)
})

// IPC Handlers - Terminal
ipcMain.handle('terminal-connect', async (_, env, cols: number, rows: number) => {
  try {
    // Disconnect existing connection
    if (terminalSSH) {
      terminalSSH.disconnect()
      terminalSSH = null
      terminalEnvName = null
    }

    terminalSSH = new SSHService(env, configService.getSettings().ssh)
    await terminalSSH.connect()

    // Start shell with PTY
    await terminalSSH.startShell((data) => {
      // Send data to renderer
      mainWindow?.webContents.send('terminal-data', data)
    }, cols, rows)

    terminalEnvName = env.name

    loggerService.info('终端连接成功', {
      operation: 'terminal_connect',
      environment: env.name,
      status: 'success'
    })

    return { success: true, message: `已连接到 ${env.name}` }
  } catch (error) {
    terminalSSH = null
    terminalEnvName = null
    const message = (error as Error).message

    loggerService.error('终端连接失败', {
      operation: 'terminal_connect',
      environment: env.name,
      status: 'failure',
      message
    })

    return { success: false, message }
  }
})

ipcMain.handle('terminal-disconnect', async () => {
  if (terminalSSH) {
    const envName = terminalEnvName
    terminalSSH.disconnect()
    terminalSSH = null
    terminalEnvName = null

    if (envName) {
      loggerService.info('终端断开连接', {
        operation: 'terminal_disconnect',
        environment: envName,
        status: 'success'
      })
    }
  }
  return { success: true }
})

ipcMain.handle('terminal-status', async () => {
  return {
    connected: terminalSSH?.isConnected() || false,
    hasShell: terminalSSH?.hasShell() || false,
    environment: terminalEnvName
  }
})

ipcMain.handle('terminal-write', async (_, data: string) => {
  if (terminalSSH && terminalSSH.hasShell()) {
    terminalSSH.writeToShell(data)
  }
})

ipcMain.handle('terminal-resize', async (_, cols: number, rows: number) => {
  if (terminalSSH && terminalSSH.hasShell()) {
    terminalSSH.resizeShell(cols, rows)
  }
})

// App lifecycle
app.whenReady().then(async () => {
  await configService.init()
  await loggerService.init()

  createWindow()
  createMenu()

  const settings = configService.getSettings()
  if (settings.general.minimizeToTray) {
    createTray()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle external links
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
})
