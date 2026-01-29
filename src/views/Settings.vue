<template>
  <div class="settings">
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
      <div class="actions">
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="primary" @click="saveSettings" :loading="settingsStore.loading">保存</el-button>
      </div>
    </div>

    <el-card v-loading="settingsStore.loading">
      <div class="settings-section">
        <h3>通用设置</h3>
        <el-form label-width="150px" label-position="left">
          <el-form-item label="主题">
            <el-select v-model="localSettings.general.theme" style="width: 200px">
              <el-option label="跟随系统" value="system" />
              <el-option label="亮色" value="light" />
              <el-option label="暗色" value="dark" />
            </el-select>
          </el-form-item>
          <el-form-item label="最小化到系统托盘">
            <el-switch v-model="localSettings.general.minimizeToTray" />
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-section">
        <h3>K8s 配置</h3>
        <el-form label-width="150px" label-position="left">
          <el-form-item label="本地配置文件">
            <el-input v-model="localSettings.k8s.localConfigPath" style="width: 300px" disabled />
          </el-form-item>
          <el-form-item label="配置备份">
            <el-switch v-model="localSettings.k8s.enableBackup" />
          </el-form-item>
          <el-form-item label="备份保留数量" v-if="localSettings.k8s.enableBackup">
            <el-input-number v-model="localSettings.k8s.backupRetention" :min="1" :max="10" />
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-section">
        <h3>SSH 配置</h3>
        <el-form label-width="150px" label-position="left">
          <el-form-item label="连接超时">
            <el-input-number v-model="localSettings.ssh.timeout" :min="10" :max="120" />
            <span class="unit">秒</span>
          </el-form-item>
          <el-form-item label="重试次数">
            <el-input-number v-model="localSettings.ssh.retryCount" :min="1" :max="5" />
          </el-form-item>
          <el-form-item label="默认端口">
            <el-input-number v-model="localSettings.ssh.defaultPort" :min="1" :max="65535" />
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-section">
        <h3>日志设置</h3>
        <el-form label-width="150px" label-position="left">
          <el-form-item label="日志级别">
            <el-select v-model="localSettings.logging.level" style="width: 200px">
              <el-option label="DEBUG" value="DEBUG" />
              <el-option label="INFO" value="INFO" />
              <el-option label="WARNING" value="WARNING" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
          </el-form-item>
          <el-form-item label="日志保留天数">
            <el-select v-model="localSettings.logging.retentionDays" style="width: 200px">
              <el-option label="7 天" :value="7" />
              <el-option label="15 天" :value="15" />
              <el-option label="30 天" :value="30" />
              <el-option label="60 天" :value="60" />
              <el-option label="90 天" :value="90" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-section">
        <h3>关于</h3>
        <div class="about-info">
          <div class="app-logo">
            <el-icon :size="48" color="var(--el-color-primary)"><Connection /></el-icon>
          </div>
          <div class="app-info">
            <h4>K8s Manager Desktop</h4>
            <p>版本: v1.0.0</p>
            <p>Kubernetes 环境管理工具</p>
            <p class="license">开源许可证: MIT License</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { ElMessage } from 'element-plus'

const settingsStore = useSettingsStore()

const localSettings = reactive<Settings>({
  general: {
    language: 'zh-CN',
    theme: 'system',
    minimizeToTray: false
  },
  k8s: {
    localConfigPath: '~/.kube/config',
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
})

function syncFromStore() {
  Object.assign(localSettings.general, settingsStore.settings.general)
  Object.assign(localSettings.k8s, settingsStore.settings.k8s)
  Object.assign(localSettings.ssh, settingsStore.settings.ssh)
  Object.assign(localSettings.logging, settingsStore.settings.logging)
}

async function saveSettings() {
  try {
    await settingsStore.updateSettings(localSettings)
    ElMessage.success('设置已保存')
  } catch (e) {
    ElMessage.error(`保存失败: ${(e as Error).message}`)
  }
}

function resetSettings() {
  settingsStore.resetSettings()
  syncFromStore()
  ElMessage.info('设置已重置')
}

watch(() => settingsStore.settings, () => {
  syncFromStore()
}, { deep: true })

onMounted(async () => {
  await settingsStore.loadSettings()
  syncFromStore()
})
</script>

<style scoped>
.settings-section {
  margin-bottom: 32px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.about-info {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.app-logo {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  border-radius: 12px;
}

.app-info h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.app-info p {
  margin-bottom: 4px;
  color: var(--el-text-color-regular);
}

.app-info .license {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
