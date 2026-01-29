import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

export class LoggerService {
  private logDir: string
  private logFile: string
  private logs: LogEntry[] = []

  constructor() {
    this.logDir = path.join(app.getPath('home'), '.k8s-manager', 'logs')
    this.logFile = path.join(this.logDir, 'app.log')
  }

  async init(): Promise<void> {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
    await this.load()
  }

  private async load(): Promise<void> {
    try {
      if (fs.existsSync(this.logFile)) {
        const content = fs.readFileSync(this.logFile, 'utf-8')
        this.logs = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line)
            } catch {
              return null
            }
          })
          .filter(log => log !== null) as LogEntry[]
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
      this.logs = []
    }
  }

  private async save(): Promise<void> {
    try {
      const content = this.logs.map(log => JSON.stringify(log)).join('\n')
      fs.writeFileSync(this.logFile, content)
    } catch (error) {
      console.error('Failed to save logs:', error)
    }
  }

  private addLog(level: 'INFO' | 'WARNING' | 'ERROR', message: string, meta: Partial<LogEntry> = {}): void {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      operation: meta.operation || 'unknown',
      environment: meta.environment,
      status: meta.status || 'success',
      error: meta.error
    }

    this.logs.push(entry)
    this.save()
  }

  info(message: string, meta: Partial<LogEntry> = {}): void {
    this.addLog('INFO', message, meta)
  }

  warn(message: string, meta: Partial<LogEntry> = {}): void {
    this.addLog('WARNING', message, meta)
  }

  error(message: string, meta: Partial<LogEntry> = {}): void {
    this.addLog('ERROR', message, { ...meta, status: 'failure' })
  }

  async getLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    // Reload from file to ensure we have latest logs
    await this.load()
    let result = [...this.logs]

    if (filter.level) {
      result = result.filter(log => log.level === filter.level)
    }

    if (filter.operation) {
      result = result.filter(log => log.operation === filter.operation)
    }

    if (filter.environment) {
      result = result.filter(log => log.environment === filter.environment)
    }

    if (filter.startDate) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(filter.startDate!))
    }

    if (filter.endDate) {
      result = result.filter(log => new Date(log.timestamp) <= new Date(filter.endDate!))
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async clearLogs(): Promise<void> {
    this.logs = []
    await this.save()
  }

  async exportLogs(format: 'json' | 'csv'): Promise<string> {
    const exportDir = path.join(app.getPath('downloads'))
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `k8s-manager-logs-${timestamp}.${format}`
    const filePath = path.join(exportDir, fileName)

    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify(this.logs, null, 2))
    } else {
      const headers = ['时间', '级别', '环境', '操作', '状态', '详情']
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.environment || '',
        log.operation,
        log.status,
        log.message
      ])
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      fs.writeFileSync(filePath, csv)
    }

    return filePath
  }

  async cleanupOldLogs(retentionDays: number): Promise<void> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)

    this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoff)
    await this.save()
  }
}
