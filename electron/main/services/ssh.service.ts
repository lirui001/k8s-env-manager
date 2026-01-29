import { Client, SFTPWrapper, ClientChannel } from 'ssh2'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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
}

interface SSHSettings {
  timeout: number
  retryCount: number
  defaultPort: number
}

const REMOTE_KUBECONFIG_PATH = '/etc/rancher/k3s/k3s.yaml'

// Default SSH key paths to try
const DEFAULT_KEY_PATHS = [
  '~/.ssh/id_rsa',
  '~/.ssh/id_ed25519',
  '~/.ssh/id_ecdsa',
  '~/.ssh/id_dsa'
]

export class SSHService {
  private client: Client
  private env: Environment
  private settings: SSHSettings
  private connected: boolean = false
  private shell: ClientChannel | null = null
  private onDataCallback: ((data: string) => void) | null = null

  constructor(env: Environment, settings: SSHSettings) {
    this.client = new Client()
    this.env = env
    this.settings = settings
  }

  private findDefaultKey(): string | null {
    for (const keyPath of DEFAULT_KEY_PATHS) {
      const fullPath = keyPath.replace('~', os.homedir())
      if (fs.existsSync(fullPath)) {
        return fullPath
      }
    }
    return null
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const config: any = {
        host: this.env.sshConfig.host,
        port: this.env.sshConfig.port || this.settings.defaultPort,
        username: this.env.sshConfig.username,
        readyTimeout: this.settings.timeout * 1000
      }

      const authType = this.env.sshConfig.authType

      if (authType === 'agent') {
        // Use SSH agent or default key for passwordless login
        const defaultKey = this.findDefaultKey()
        if (defaultKey) {
          config.privateKey = fs.readFileSync(defaultKey)
        } else {
          // Try SSH agent
          config.agent = process.env.SSH_AUTH_SOCK
        }
      } else if (authType === 'key') {
        // Use specified private key
        const keyPath = this.env.sshConfig.privateKeyPath?.replace('~', os.homedir())
        if (keyPath && fs.existsSync(keyPath)) {
          config.privateKey = fs.readFileSync(keyPath)
        } else {
          reject(new Error(`私钥文件不存在: ${this.env.sshConfig.privateKeyPath}`))
          return
        }
      } else if (authType === 'password') {
        // Use password authentication
        if (!this.env.sshConfig.password) {
          reject(new Error('请输入密码'))
          return
        }
        config.password = this.env.sshConfig.password
      }

      this.client.on('ready', () => {
        this.connected = true
        resolve()
      })

      this.client.on('error', (err) => {
        reject(err)
      })

      this.client.connect(config)
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect()

      // Test if we can execute a command
      const result = await this.exec('whoami')

      // Test if kubeconfig exists
      const configExists = await this.exec(`test -f ${REMOTE_KUBECONFIG_PATH} && echo "exists" || echo "not found"`)

      this.disconnect()

      if (configExists.trim() !== 'exists') {
        return {
          success: false,
          message: `kubeconfig 文件不存在: ${REMOTE_KUBECONFIG_PATH}`
        }
      }

      return {
        success: true,
        message: `连接成功，用户: ${result.trim()}`
      }
    } catch (error) {
      this.disconnect()
      return {
        success: false,
        message: (error as Error).message
      }
    }
  }

  private async exec(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        let output = ''
        let errorOutput = ''

        stream.on('data', (data: Buffer) => {
          output += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString()
        })

        stream.on('close', (code: number) => {
          if (code === 0) {
            resolve(output)
          } else {
            reject(new Error(errorOutput || `Command failed with code ${code}`))
          }
        })
      })
    })
  }

  async executeCommand(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      this.client.exec(command, (err, stream) => {
        if (err) {
          resolve({ stdout: '', stderr: err.message, code: 1 })
          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })

        stream.on('close', (code: number) => {
          resolve({ stdout, stderr, code: code || 0 })
        })
      })
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  async getCompletions(partial: string, cwd: string): Promise<string[]> {
    try {
      // Get command and file completions
      const command = `
        cd ${cwd} 2>/dev/null
        PARTIAL="${partial}"
        LAST_WORD="\${PARTIAL##* }"

        # If it's the first word, complete commands
        if [[ "$PARTIAL" != *" "* ]]; then
          compgen -c "$PARTIAL" 2>/dev/null | head -20
        else
          # Complete files/directories
          compgen -f "$LAST_WORD" 2>/dev/null | head -20
        fi
      `
      const result = await this.executeCommand(command)
      if (result.stdout) {
        return result.stdout.trim().split('\n').filter(s => s.length > 0)
      }
      return []
    } catch {
      return []
    }
  }

  async getCwd(): Promise<string> {
    try {
      const result = await this.executeCommand('pwd')
      return result.stdout.trim() || '~'
    } catch {
      return '~'
    }
  }

  async startShell(onData: (data: string) => void, cols: number = 80, rows: number = 24): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onDataCallback = onData

      this.client.shell({ term: 'xterm-256color', cols, rows }, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        this.shell = stream

        stream.on('data', (data: Buffer) => {
          if (this.onDataCallback) {
            this.onDataCallback(data.toString())
          }
        })

        stream.stderr.on('data', (data: Buffer) => {
          if (this.onDataCallback) {
            this.onDataCallback(data.toString())
          }
        })

        stream.on('close', () => {
          this.shell = null
        })

        resolve()
      })
    })
  }

  writeToShell(data: string): void {
    if (this.shell) {
      this.shell.write(data)
    }
  }

  resizeShell(cols: number, rows: number): void {
    if (this.shell) {
      this.shell.setWindow(rows, cols, 0, 0)
    }
  }

  hasShell(): boolean {
    return this.shell !== null
  }

  async downloadKubeConfig(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp: SFTPWrapper) => {
        if (err) {
          reject(err)
          return
        }

        const tempDir = path.join(os.tmpdir(), 'k8s-manager')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        const localPath = path.join(tempDir, `${this.env.identifier}-${Date.now()}.yaml`)

        sftp.fastGet(REMOTE_KUBECONFIG_PATH, localPath, (err) => {
          if (err) {
            reject(new Error(`下载配置文件失败: ${err.message}`))
            return
          }

          resolve(localPath)
        })
      })
    })
  }

  disconnect(): void {
    if (this.connected) {
      this.client.end()
      this.connected = false
    }
  }
}
