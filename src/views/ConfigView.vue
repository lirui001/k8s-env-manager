<template>
  <div class="config-view">
    <div class="page-header">
      <h1 class="page-title">配置查看</h1>
      <div class="actions">
        <el-button @click="copyConfig">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button @click="exportConfig">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="refreshConfig" :loading="k8sStore.loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Contexts 列表" name="contexts">
        <el-table :data="k8sStore.contexts" style="width: 100%" v-loading="k8sStore.loading">
          <el-table-column label="当前" width="60">
            <template #default="{ row }">
              <el-icon v-if="row.isCurrent" color="var(--el-color-success)"><Check /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="Context 名称" min-width="200" />
          <el-table-column prop="cluster" label="集群" min-width="180" />
          <el-table-column prop="user" label="用户" min-width="150" />
          <el-table-column prop="namespace" label="命名空间" width="120">
            <template #default="{ row }">
              {{ row.namespace || 'default' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                link
                type="primary"
                :disabled="row.isCurrent"
                @click="switchContext(row.name)"
              >
                切换
              </el-button>
              <el-popconfirm
                title="确定要删除此 Context 吗？"
                @confirm="deleteContext(row.name)"
              >
                <template #reference>
                  <el-button size="small" link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="k8sStore.contexts.length === 0 && !k8sStore.loading" description="暂无 Context 配置" />
      </el-tab-pane>

      <el-tab-pane label="完整配置" name="full">
        <div class="config-container">
          <div class="config-header">
            <span class="config-path">{{ configPath }}</span>
          </div>
          <div class="code-block" v-loading="k8sStore.loading">
            <pre>{{ k8sStore.kubeConfig || '配置文件为空或不存在' }}</pre>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useK8sStore } from '@/stores/k8s'
import { ElMessage } from 'element-plus'

const k8sStore = useK8sStore()

const activeTab = ref('contexts')
const configPath = ref('~/.kube/config')

async function refreshConfig() {
  await Promise.all([
    k8sStore.loadContexts(),
    k8sStore.loadKubeConfig()
  ])
}

async function switchContext(contextName: string) {
  try {
    await k8sStore.switchContext(contextName)
    ElMessage.success(`已切换到 ${contextName}`)
  } catch (e) {
    ElMessage.error(`切换失败: ${(e as Error).message}`)
  }
}

async function deleteContext(contextName: string) {
  try {
    await k8sStore.deleteContext(contextName)
    ElMessage.success('Context 已删除')
  } catch (e) {
    ElMessage.error(`删除失败: ${(e as Error).message}`)
  }
}

function copyConfig() {
  if (k8sStore.kubeConfig) {
    navigator.clipboard.writeText(k8sStore.kubeConfig)
    ElMessage.success('已复制到剪贴板')
  }
}

function exportConfig() {
  if (!k8sStore.kubeConfig) {
    ElMessage.warning('没有可导出的配置')
    return
  }

  const blob = new Blob([k8sStore.kubeConfig], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kubeconfig.yaml'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出')
}

onMounted(async () => {
  await refreshConfig()
})
</script>

<style scoped>
.config-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.config-header {
  background-color: var(--el-fill-color-light);
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.config-path {
  font-family: monospace;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.code-block {
  max-height: 600px;
  overflow: auto;
  background-color: var(--el-fill-color-lighter);
}

.code-block pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
  color: var(--el-text-color-primary);
}
</style>
