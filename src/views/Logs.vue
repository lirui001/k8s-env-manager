<template>
  <div class="logs">
    <div class="page-header">
      <h1 class="page-title">操作日志</h1>
      <div class="actions">
        <el-popconfirm title="确定要清空所有日志吗？" @confirm="clearLogs">
          <template #reference>
            <el-button type="danger">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select v-model="filter.level" placeholder="日志级别" clearable style="width: 100%">
            <el-option label="INFO" value="INFO" />
            <el-option label="WARNING" value="WARNING" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filter.operation" placeholder="操作类型" clearable style="width: 100%">
            <el-option label="添加环境" value="add_environment" />
            <el-option label="删除环境" value="delete_environment" />
            <el-option label="同步配置" value="sync_config" />
            <el-option label="切换环境" value="switch_context" />
            <el-option label="连接测试" value="test_connection" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filter.environment" placeholder="环境" clearable style="width: 100%">
            <el-option
              v-for="env in environments"
              :key="env.id"
              :label="env.name"
              :value="env.name"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            @change="handleDateChange"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- Logs Table -->
    <el-card>
      <el-table :data="paginatedLogs" style="width: 100%" v-loading="logsStore.loading">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="environment" label="环境" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            {{ getOperationText(row.operation) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="详情" min-width="200" show-overflow-tooltip />
      </el-table>

      <el-empty v-if="logsStore.filteredLogs.length === 0 && !logsStore.loading" description="暂无日志记录" />

      <!-- Pagination -->
      <div class="pagination" v-if="logsStore.filteredLogs.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="logsStore.filteredLogs.length"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useLogsStore } from '@/stores/logs'
import { useEnvironmentStore } from '@/stores/environment'
import { ElMessage } from 'element-plus'

const logsStore = useLogsStore()
const environmentStore = useEnvironmentStore()

const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref<[Date, Date] | null>(null)

const filter = reactive({
  level: '',
  operation: '',
  environment: ''
})

const environments = computed(() => environmentStore.environments)

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return logsStore.filteredLogs.slice(start, end)
})

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function getLevelType(level: string) {
  switch (level) {
    case 'ERROR': return 'danger'
    case 'WARNING': return 'warning'
    default: return 'info'
  }
}

function getOperationText(operation: string) {
  const map: Record<string, string> = {
    add_environment: '添加环境',
    delete_environment: '删除环境',
    sync_config: '同步配置',
    switch_context: '切换环境',
    test_connection: '连接测试'
  }
  return map[operation] || operation
}

function handleDateChange(dates: [Date, Date] | null) {
  if (dates) {
    filter.startDate = dates[0].toISOString()
    filter.endDate = dates[1].toISOString()
  } else {
    filter.startDate = undefined
    filter.endDate = undefined
  }
}

async function clearLogs() {
  try {
    await logsStore.clearLogs()
    ElMessage.success('日志已清空')
  } catch (e) {
    ElMessage.error(`清空失败: ${(e as Error).message}`)
  }
}


watch(filter, () => {
  logsStore.setFilter({ ...filter })
  currentPage.value = 1
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    logsStore.loadLogs(),
    environmentStore.loadEnvironments()
  ])
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
