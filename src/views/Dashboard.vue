<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>

    <!-- Statistics Cards -->
    <div class="stat-cards">
      <el-card class="stat-card">
        <div class="icon" style="background-color: var(--el-color-primary-light-9); color: var(--el-color-primary);">
          <el-icon :size="24"><Box /></el-icon>
        </div>
        <div class="info">
          <h3>{{ environmentStore.environments.length }}</h3>
          <p>环境总数</p>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="icon" style="background-color: var(--el-color-success-light-9); color: var(--el-color-success);">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="info">
          <h3>{{ environmentStore.activeEnvironments.length }}</h3>
          <p>已连接</p>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="icon" style="background-color: var(--el-color-danger-light-9); color: var(--el-color-danger);">
          <el-icon :size="24"><CircleClose /></el-icon>
        </div>
        <div class="info">
          <h3>{{ environmentStore.errorEnvironments.length }}</h3>
          <p>连接失败</p>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="icon" style="background-color: var(--el-color-info-light-9); color: var(--el-color-info);">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="info">
          <h3>{{ recentLogCount }}</h3>
          <p>今日操作</p>
        </div>
      </el-card>
    </div>

    <!-- Quick Actions -->
    <el-card class="quick-actions">
      <template #header>
        <span>快速操作</span>
      </template>
      <div class="action-buttons">
        <el-button type="primary" @click="$router.push('/environments')">
          <el-icon><Plus /></el-icon>
          添加环境
        </el-button>
        <el-button @click="batchSync" :loading="syncing">
          <el-icon><Refresh /></el-icon>
          批量同步
        </el-button>
        <el-button @click="$router.push('/config')">
          <el-icon><Document /></el-icon>
          查看配置
        </el-button>
      </div>
    </el-card>

    <!-- Current Environment -->
    <el-card class="current-env-card" v-if="k8sStore.currentContext">
      <template #header>
        <span>当前环境</span>
      </template>
      <div class="env-detail">
        <div class="env-info">
          <p><strong>Context:</strong> {{ k8sStore.currentContext }}</p>
          <p v-if="currentEnv"><strong>描述:</strong> {{ currentEnv.description || '无' }}</p>
          <p v-if="currentEnv"><strong>主机:</strong> {{ currentEnv.sshConfig.host }}:{{ currentEnv.sshConfig.port }}</p>
          <p v-if="currentEnv"><strong>最后同步:</strong> {{ formatTime(currentEnv.lastSync) }}</p>
        </div>
        <div class="env-actions">
          <el-button size="small" @click="$router.push('/environments')">切换环境</el-button>
          <el-button size="small" type="primary" @click="syncCurrent" :loading="syncing" v-if="currentEnv">
            同步配置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Recent Environments -->
    <el-card class="recent-envs" v-if="recentEnvironments.length > 0">
      <template #header>
        <span>最近使用</span>
      </template>
      <el-table :data="recentEnvironments" style="width: 100%">
        <el-table-column prop="name" label="环境名称" />
        <el-table-column prop="identifier" label="标识" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后同步" width="180">
          <template #default="{ row }">
            {{ formatTime(row.lastSync) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="switchToEnv(row)">
              切换
            </el-button>
            <el-button size="small" link @click="syncEnv(row)">
              同步
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEnvironmentStore } from '@/stores/environment'
import { useK8sStore } from '@/stores/k8s'
import { useLogsStore } from '@/stores/logs'
import { ElMessage } from 'element-plus'

const environmentStore = useEnvironmentStore()
const k8sStore = useK8sStore()
const logsStore = useLogsStore()

const syncing = ref(false)

const currentEnv = computed(() => {
  if (!k8sStore.currentContext) return null
  return environmentStore.environments.find(env =>
    k8sStore.currentContext?.includes(env.identifier)
  )
})

const recentEnvironments = computed(() => {
  return [...environmentStore.environments]
    .filter(env => env.lastSync)
    .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())
    .slice(0, 5)
})

const recentLogCount = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return logsStore.logs.filter(log =>
    new Date(log.timestamp) >= today
  ).length
})

function formatTime(time?: string) {
  if (!time) return '从未同步'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  switch (status) {
    case 'active': return 'success'
    case 'error': return 'danger'
    default: return 'info'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active': return '已连接'
    case 'error': return '连接失败'
    default: return '未同步'
  }
}

async function switchToEnv(env: Environment) {
  try {
    await k8sStore.switchContext(env.identifier)
    ElMessage.success(`已切换到 ${env.name}`)
  } catch (e) {
    ElMessage.error(`切换失败: ${(e as Error).message}`)
  }
}

async function syncEnv(env: Environment) {
  syncing.value = true
  try {
    await environmentStore.syncEnvironment(env)
    ElMessage.success(`${env.name} 同步成功`)
  } catch (e) {
    ElMessage.error(`同步失败: ${(e as Error).message}`)
  } finally {
    syncing.value = false
  }
}

async function syncCurrent() {
  if (currentEnv.value) {
    await syncEnv(currentEnv.value)
  }
}

async function batchSync() {
  syncing.value = true
  const envs = environmentStore.environments
  let success = 0
  let failed = 0

  for (const env of envs) {
    try {
      await environmentStore.syncEnvironment(env)
      success++
    } catch {
      failed++
    }
  }

  syncing.value = false
  ElMessage.info(`同步完成: ${success} 成功, ${failed} 失败`)
}

onMounted(async () => {
  await Promise.all([
    environmentStore.loadEnvironments(),
    k8sStore.loadCurrentContext(),
    logsStore.loadLogs()
  ])
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.current-env-card {
  margin-bottom: 20px;
}

.env-detail {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.env-info p {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
}

.env-info strong {
  color: var(--el-text-color-primary);
}

.env-actions {
  display: flex;
  gap: 8px;
}

.recent-envs {
  margin-bottom: 20px;
}
</style>
