import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

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

interface Config {
  environments: Environment[]
  settings: Settings
}

const ENCRYPTION_KEY = 'k8s-manager-secret-key-32bytes!!' // Should use keytar in production
const IV_LENGTH = 16

const defaultSettings: Settings = {
  general: {
    language: 'zh-CN',
    theme: 'system',
    minimizeToTray: false
  },
  k8s: {
    localConfigPath: path.join(app.getPath('home'), '.kube', 'config'),
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

export class ConfigService {
  private configDir: string
  private configFile: string
  private config: Config

  constructor() {
    this.configDir = path.join(app.getPath('home'), '.k8s-manager')
    this.configFile = path.join(this.configDir, 'config.json')
    this.config = {
      environments: [],
      settings: defaultSettings
    }
  }

  async init(): Promise<void> {
    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true })
    }

    await this.load()
  }

  private async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf-8')
        this.config = JSON.parse(data)

        // Ensure settings have all required fields
        this.config.settings = {
          ...defaultSettings,
          ...this.config.settings,
          general: { ...defaultSettings.general, ...this.config.settings?.general },
          k8s: { ...defaultSettings.k8s, ...this.config.settings?.k8s },
          ssh: { ...defaultSettings.ssh, ...this.config.settings?.ssh },
          logging: { ...defaultSettings.logging, ...this.config.settings?.logging }
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.config = {
        environments: [],
        settings: defaultSettings
      }
    }
  }

  private async save(): Promise<void> {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
      throw error
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  private decrypt(text: string): string {
    try {
      const parts = text.split(':')
      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = Buffer.from(parts[1], 'hex')
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
      let decrypted = decipher.update(encryptedText)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      return decrypted.toString()
    } catch {
      return text // Return as-is if not encrypted
    }
  }

  getEnvironments(): Environment[] {
    return this.config.environments.map(env => ({
      ...env,
      sshConfig: {
        ...env.sshConfig,
        password: env.sshConfig.password ? this.decrypt(env.sshConfig.password) : undefined
      }
    }))
  }

  async addEnvironment(env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Environment> {
    const now = new Date().toISOString()
    const newEnv: Environment = {
      ...env,
      id: uuidv4(),
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
      sshConfig: {
        ...env.sshConfig,
        password: env.sshConfig.password ? this.encrypt(env.sshConfig.password) : undefined
      }
    }

    this.config.environments.push(newEnv)
    await this.save()

    return {
      ...newEnv,
      sshConfig: {
        ...newEnv.sshConfig,
        password: env.sshConfig.password
      }
    }
  }

  async updateEnvironment(id: string, updates: Partial<Environment>): Promise<Environment> {
    const index = this.config.environments.findIndex(e => e.id === id)
    if (index === -1) {
      throw new Error(`Environment not found: ${id}`)
    }

    const env = this.config.environments[index]
    const updatedEnv: Environment = {
      ...env,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Encrypt password if updated
    if (updates.sshConfig?.password) {
      updatedEnv.sshConfig.password = this.encrypt(updates.sshConfig.password)
    }

    this.config.environments[index] = updatedEnv
    await this.save()

    return {
      ...updatedEnv,
      sshConfig: {
        ...updatedEnv.sshConfig,
        password: updates.sshConfig?.password || (env.sshConfig.password ? this.decrypt(env.sshConfig.password) : undefined)
      }
    }
  }

  async deleteEnvironment(id: string): Promise<void> {
    this.config.environments = this.config.environments.filter(e => e.id !== id)
    await this.save()
  }

  getSettings(): Settings {
    return this.config.settings
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    this.config.settings = {
      ...this.config.settings,
      ...updates,
      general: { ...this.config.settings.general, ...updates.general },
      k8s: { ...this.config.settings.k8s, ...updates.k8s },
      ssh: { ...this.config.settings.ssh, ...updates.ssh },
      logging: { ...this.config.settings.logging, ...updates.logging }
    }
    await this.save()
    return this.config.settings
  }
}
