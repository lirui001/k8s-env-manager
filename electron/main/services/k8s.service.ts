import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as yaml from 'js-yaml'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface KubeConfig {
  apiVersion: string
  kind: string
  clusters: Array<{
    name: string
    cluster: {
      server: string
      'certificate-authority-data'?: string
    }
  }>
  contexts: Array<{
    name: string
    context: {
      cluster: string
      user: string
      namespace?: string
    }
  }>
  'current-context': string
  users: Array<{
    name: string
    user: {
      'client-certificate-data'?: string
      'client-key-data'?: string
      token?: string
    }
  }>
}

interface K8sContext {
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

export class K8sService {
  private configPath: string
  private backupDir: string

  constructor() {
    this.configPath = path.join(os.homedir(), '.kube', 'config')
    this.backupDir = path.join(os.homedir(), '.k8s-manager', 'backups')
  }

  private ensureKubeDir(): void {
    const kubeDir = path.dirname(this.configPath)
    if (!fs.existsSync(kubeDir)) {
      fs.mkdirSync(kubeDir, { recursive: true })
    }
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  private readConfig(): KubeConfig | null {
    if (!fs.existsSync(this.configPath)) {
      return null
    }
    try {
      const content = fs.readFileSync(this.configPath, 'utf-8')
      return yaml.load(content) as KubeConfig
    } catch {
      return null
    }
  }

  private writeConfig(config: KubeConfig): void {
    this.ensureKubeDir()
    fs.writeFileSync(this.configPath, yaml.dump(config))
  }

  private createBackup(): void {
    this.ensureBackupDir()
    if (fs.existsSync(this.configPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(this.backupDir, `config-${timestamp}`)
      fs.copyFileSync(this.configPath, backupPath)

      // Clean old backups (keep last 5)
      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('config-'))
        .sort()
        .reverse()

      backups.slice(5).forEach(backup => {
        fs.unlinkSync(path.join(this.backupDir, backup))
      })
    }
  }

  async mergeConfig(newConfigPath: string, identifier: string, serverHost: string): Promise<void> {
    // Read the new config
    const newContent = fs.readFileSync(newConfigPath, 'utf-8')
    const newConfig = yaml.load(newContent) as KubeConfig

    // Modify the server address to use the actual host IP
    newConfig.clusters = newConfig.clusters.map(cluster => ({
      ...cluster,
      name: identifier,
      cluster: {
        ...cluster.cluster,
        server: cluster.cluster.server.replace('127.0.0.1', serverHost).replace('localhost', serverHost)
      }
    }))

    // Rename contexts and users with identifier prefix
    newConfig.contexts = newConfig.contexts.map(ctx => ({
      ...ctx,
      name: identifier,
      context: {
        ...ctx.context,
        cluster: identifier,
        user: identifier
      }
    }))

    newConfig.users = newConfig.users.map(user => ({
      ...user,
      name: identifier
    }))

    // Read existing config or create new
    let existingConfig = this.readConfig()

    if (!existingConfig) {
      // No existing config, use new config directly
      newConfig['current-context'] = identifier
      this.createBackup()
      this.writeConfig(newConfig)
      // Clean up temp file
      fs.unlinkSync(newConfigPath)
      return
    }

    // Backup existing config
    this.createBackup()

    // Merge clusters (replace if same name exists)
    const existingClusterNames = new Set(existingConfig.clusters.map(c => c.name))
    newConfig.clusters.forEach(cluster => {
      if (existingClusterNames.has(cluster.name)) {
        const index = existingConfig!.clusters.findIndex(c => c.name === cluster.name)
        existingConfig!.clusters[index] = cluster
      } else {
        existingConfig!.clusters.push(cluster)
      }
    })

    // Merge contexts
    const existingContextNames = new Set(existingConfig.contexts.map(c => c.name))
    newConfig.contexts.forEach(ctx => {
      if (existingContextNames.has(ctx.name)) {
        const index = existingConfig!.contexts.findIndex(c => c.name === ctx.name)
        existingConfig!.contexts[index] = ctx
      } else {
        existingConfig!.contexts.push(ctx)
      }
    })

    // Merge users
    const existingUserNames = new Set(existingConfig.users.map(u => u.name))
    newConfig.users.forEach(user => {
      if (existingUserNames.has(user.name)) {
        const index = existingConfig!.users.findIndex(u => u.name === user.name)
        existingConfig!.users[index] = user
      } else {
        existingConfig!.users.push(user)
      }
    })

    this.writeConfig(existingConfig)

    // Clean up temp file
    fs.unlinkSync(newConfigPath)
  }

  async getCurrentContext(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('kubectl config current-context')
      return stdout.trim()
    } catch {
      // No current context or kubectl not available
      const config = this.readConfig()
      return config?.['current-context'] || null
    }
  }

  async listContexts(): Promise<K8sContext[]> {
    const config = this.readConfig()
    if (!config) return []

    const currentContext = config['current-context']

    return config.contexts.map(ctx => ({
      name: ctx.name,
      cluster: ctx.context.cluster,
      user: ctx.context.user,
      namespace: ctx.context.namespace,
      isCurrent: ctx.name === currentContext
    }))
  }

  async switchContext(contextName: string): Promise<void> {
    try {
      await execAsync(`kubectl config use-context ${contextName}`)
    } catch (error) {
      // If kubectl fails, update config directly
      const config = this.readConfig()
      if (!config) {
        throw new Error('kubeconfig not found')
      }

      const contextExists = config.contexts.some(ctx => ctx.name === contextName)
      if (!contextExists) {
        throw new Error(`Context not found: ${contextName}`)
      }

      config['current-context'] = contextName
      this.writeConfig(config)
    }
  }

  async getKubeConfig(): Promise<string> {
    if (!fs.existsSync(this.configPath)) {
      return ''
    }
    return fs.readFileSync(this.configPath, 'utf-8')
  }

  async deleteContext(contextName: string): Promise<void> {
    const config = this.readConfig()
    if (!config) {
      throw new Error('kubeconfig not found')
    }

    // Find the context
    const context = config.contexts.find(ctx => ctx.name === contextName)
    if (!context) {
      throw new Error(`Context not found: ${contextName}`)
    }

    // Remove context
    config.contexts = config.contexts.filter(ctx => ctx.name !== contextName)

    // Remove associated cluster and user
    config.clusters = config.clusters.filter(c => c.name !== context.context.cluster)
    config.users = config.users.filter(u => u.name !== context.context.user)

    // Update current context if needed
    if (config['current-context'] === contextName) {
      config['current-context'] = config.contexts[0]?.name || ''
    }

    this.createBackup()
    this.writeConfig(config)
  }
}
