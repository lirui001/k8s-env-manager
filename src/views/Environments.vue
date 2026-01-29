<template>
  <div class="environments">
    <div class="page-header">
      <h1 class="page-title">环境管理</h1>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索环境..."
          :prefix-icon="Search"
          clearable
          style="width: 200px"
        />
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加环境
        </el-button>
      </div>
    </div>

    <!-- Environment Grid -->
    <div class="env-grid" v-loading="environmentStore.loading">
      <el-card
        v-for="env in filteredEnvironments"
        :key="env.id"
        class="env-card"
      >
        <div class="header">
          <div>
            <div class="title">{{ env.name }}</div>
            <el-tag size="small" type="info">{{ env.identifier }}</el-tag>
          </div>
          <el-tag :type="getStatusType(env.status)" size="small">
            {{ getStatusText(env.status) }}
          </el-tag>
        </div>

        <div class="info">
          <p><el-icon><Monitor /></el-icon> {{ env.sshConfig.host }}:{{ env.sshConfig.port }}</p>
          <p><el-icon><User /></el-icon> {{ env.sshConfig.username }}</p>
          <p><el-icon><Clock /></el-icon> {{ formatTime(env.lastSync) }}</p>
          <p v-if="env.description"><el-icon><Document /></el-icon> {{ env.description }}</p>
        </div>

        <div class="actions">
          <el-button size="small" @click="testConnection(env)" :loading="testingId === env.id">
            测试连接
          </el-button>
          <el-button size="small" type="primary" @click="syncEnvironment(env)" :loading="syncingId === env.id">
            同步配置
          </el-button>
          <el-button size="small" type="success" @click="switchToEnv(env)" :disabled="env.status !== 'active'">
            切换环境
          </el-button>
          <el-button size="small" @click="showEditDialog(env)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="confirmDelete(env)">
            删除
          </el-button>
        </div>
      </el-card>

      <!-- Empty State -->
      <el-empty v-if="filteredEnvironments.length === 0 && !environmentStore.loading" description="暂无环境配置">
        <el-button type="primary" @click="showAddDialog">添加环境</el-button>
      </el-empty>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑环境' : '添加环境'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="left"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="环境名称" prop="name">
          <el-input v-model="form.name" placeholder="如：生产环境" />
        </el-form-item>

        <el-form-item label="环境标识" prop="identifier">
          <el-input v-model="form.identifier" placeholder="如：prod-127" :disabled="isEditing" />
          <div class="form-tip">用于 kubectl context 名称，仅支持字母、数字、连字符</div>
        </el-form-item>

        <el-divider content-position="left">SSH 配置</el-divider>

        <el-form-item label="主机地址" prop="sshConfig.host">
          <el-input v-model="form.sshConfig.host" placeholder="如：192.168.1.100" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="端口" prop="sshConfig.port">
              <el-input-number v-model="form.sshConfig.port" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名" prop="sshConfig.username">
              <el-input v-model="form.sshConfig.username" placeholder="如：admin" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="认证方式" prop="sshConfig.authType">
          <el-radio-group v-model="form.sshConfig.authType">
            <el-radio value="agent">免密登录</el-radio>
            <el-radio value="key">指定密钥</el-radio>
            <el-radio value="password">密码</el-radio>
          </el-radio-group>
          <div class="form-tip" v-if="form.sshConfig.authType === 'agent'">使用本地 ~/.ssh/id_rsa 等默认密钥</div>
        </el-form-item>

        <el-form-item label="密码" prop="sshConfig.password" v-if="form.sshConfig.authType === 'password'">
          <el-input v-model="form.sshConfig.password" type="password" show-password placeholder="输入 SSH 密码" />
        </el-form-item>

        <el-form-item label="私钥路径" prop="sshConfig.privateKeyPath" v-if="form.sshConfig.authType === 'key'">
          <el-input v-model="form.sshConfig.privateKeyPath" placeholder="如：~/.ssh/id_rsa" />
        </el-form-item>

        <el-divider content-position="left">其他</el-divider>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选的环境描述" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="testConnectionForm" :loading="testing">测试连接</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- Sync Progress Dialog -->
    <el-dialog
      v-model="syncDialogVisible"
      title="同步进度"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="sync-progress">
        <div v-for="(step, index) in syncSteps" :key="index" class="sync-step">
          <el-icon v-if="index < currentSyncStep" class="step-done"><CircleCheck /></el-icon>
          <el-icon v-else-if="index === currentSyncStep" class="step-loading"><Loading /></el-icon>
          <el-icon v-else class="step-pending"><Clock /></el-icon>
          <span>{{ step }}</span>
        </div>
        <el-progress :percentage="syncProgress" :status="syncStatus" style="margin-top: 20px" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useEnvironmentStore } from '@/stores/environment'
import { useK8sStore } from '@/stores/k8s'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const environmentStore = useEnvironmentStore()
const k8sStore = useK8sStore()

const searchQuery = ref('')
const dialogVisible = ref(false)
const syncDialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const testingId = ref<string | null>(null)
const syncingId = ref<string | null>(null)
const testing = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const syncSteps = ['连接远程服务器', '下载配置文件', '解析配置', '合并到本地']
const currentSyncStep = ref(0)
const syncProgress = ref(0)
const syncStatus = ref<'' | 'success' | 'exception'>('')

const form = reactive({
  name: '',
  identifier: '',
  sshConfig: {
    host: '',
    port: 22,
    username: '',
    authType: 'agent' as 'password' | 'key' | 'agent',
    password: '',
    privateKeyPath: ''
  },
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { max: 50, message: '最长 50 个字符', trigger: 'blur' }
  ],
  identifier: [
    { required: true, message: '请输入环境标识', trigger: 'blur' },
    { max: 20, message: '最长 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '仅支持字母、数字、连字符', trigger: 'blur' }
  ],
  'sshConfig.host': [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  'sshConfig.port': [
    { required: true, message: '请输入端口号', trigger: 'blur' }
  ],
  'sshConfig.username': [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  'sshConfig.password': [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  'sshConfig.privateKeyPath': [
    { required: true, message: '请输入私钥路径', trigger: 'blur' }
  ]
}

const filteredEnvironments = computed(() => {
  if (!searchQuery.value) return environmentStore.environments
  const query = searchQuery.value.toLowerCase()
  return environmentStore.environments.filter(env =>
    env.name.toLowerCase().includes(query) ||
    env.identifier.toLowerCase().includes(query) ||
    env.sshConfig.host.includes(query)
  )
})

function formatTime(time?: string) {
  if (!time) return '从未同步'
  return new Date(time).toLocaleString('zh-CN')
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

function showAddDialog() {
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function showEditDialog(env: Environment) {
  isEditing.value = true
  editingId.value = env.id
  form.name = env.name
  form.identifier = env.identifier
  form.sshConfig.host = env.sshConfig.host
  form.sshConfig.port = env.sshConfig.port
  form.sshConfig.username = env.sshConfig.username
  form.sshConfig.authType = env.sshConfig.authType
  form.sshConfig.password = env.sshConfig.password || ''
  form.sshConfig.privateKeyPath = env.sshConfig.privateKeyPath || ''
  form.description = env.description || ''
  dialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.identifier = ''
  form.sshConfig.host = ''
  form.sshConfig.port = 22
  form.sshConfig.username = ''
  form.sshConfig.authType = 'agent'
  form.sshConfig.password = ''
  form.sshConfig.privateKeyPath = ''
  form.description = ''
  formRef.value?.resetFields()
}

async function testConnectionForm() {
  testing.value = true
  try {
    const result = await window.electronAPI.testConnection({
      id: '',
      name: form.name,
      identifier: form.identifier,
      sshConfig: { ...form.sshConfig },
      status: 'inactive',
      createdAt: '',
      updatedAt: ''
    })
    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(`连接失败: ${result.message}`)
    }
  } catch (e) {
    ElMessage.error(`连接失败: ${(e as Error).message}`)
  } finally {
    testing.value = false
  }
}

async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEditing.value && editingId.value) {
        await environmentStore.updateEnvironment(editingId.value, {
          name: form.name,
          sshConfig: { ...form.sshConfig },
          description: form.description
        })
        ElMessage.success('环境更新成功')
      } else {
        await environmentStore.addEnvironment({
          name: form.name,
          identifier: form.identifier,
          sshConfig: { ...form.sshConfig },
          description: form.description
        })
        ElMessage.success('环境添加成功')
      }
      dialogVisible.value = false
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      submitting.value = false
    }
  })
}

async function testConnection(env: Environment) {
  testingId.value = env.id
  try {
    const result = await environmentStore.testConnection(env)
    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(`连接失败: ${result.message}`)
    }
  } finally {
    testingId.value = null
  }
}

async function syncEnvironment(env: Environment) {
  syncingId.value = env.id
  syncDialogVisible.value = true
  currentSyncStep.value = 0
  syncProgress.value = 0
  syncStatus.value = ''

  try {
    // Simulate sync steps with progress
    for (let i = 0; i < syncSteps.length; i++) {
      currentSyncStep.value = i
      syncProgress.value = (i + 1) * 25

      // Actual sync happens on last step
      if (i === syncSteps.length - 1) {
        await environmentStore.syncEnvironment(env)
      } else {
        // Simulate delay for other steps
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    syncStatus.value = 'success'
    syncProgress.value = 100
    ElMessage.success(`${env.name} 同步成功`)

    setTimeout(() => {
      syncDialogVisible.value = false
    }, 1000)
  } catch (e) {
    syncStatus.value = 'exception'
    ElMessage.error(`同步失败: ${(e as Error).message}`)

    setTimeout(() => {
      syncDialogVisible.value = false
    }, 2000)
  } finally {
    syncingId.value = null
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

async function confirmDelete(env: Environment) {
  try {
    await ElMessageBox.confirm(
      `确定要删除环境 "${env.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await environmentStore.deleteEnvironment(env.id)
    ElMessage.success('环境已删除')
  } catch {
    // User cancelled
  }
}

onMounted(async () => {
  await environmentStore.loadEnvironments()
})
</script>

<style scoped>
.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.env-card .header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.env-card .title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.env-card .info {
  margin-bottom: 16px;
}

.env-card .info p {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}

.env-card .actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.sync-progress {
  padding: 20px 0;
}

.sync-step {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}

.step-done {
  color: var(--el-color-success);
}

.step-loading {
  color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

.step-pending {
  color: var(--el-text-color-placeholder);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
