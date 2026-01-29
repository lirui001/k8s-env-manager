<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container" :class="{ 'dark': isDark }">
      <el-container class="main-container">
        <!-- Sidebar -->
        <el-aside width="200px" class="sidebar">
          <div class="logo">
            <el-icon :size="24"><Connection /></el-icon>
            <span>K8s Manager</span>
          </div>
          <el-menu
            :default-active="currentRoute"
            router
            class="sidebar-menu"
          >
            <el-menu-item index="/dashboard">
              <el-icon><Odometer /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="/environments">
              <el-icon><Box /></el-icon>
              <span>环境管理</span>
            </el-menu-item>
            <el-menu-item index="/config">
              <el-icon><Document /></el-icon>
              <span>配置查看</span>
            </el-menu-item>
            <el-menu-item index="/logs">
              <el-icon><Tickets /></el-icon>
              <span>操作日志</span>
            </el-menu-item>
            <el-menu-item index="/terminal">
              <el-icon><Monitor /></el-icon>
              <span>终端</span>
            </el-menu-item>
            <el-menu-item index="/settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- Main Content -->
        <el-container>
          <el-header class="app-header">
            <div class="header-left">
              <span class="current-env" v-if="currentContext">
                当前环境: <el-tag type="success">{{ currentContext }}</el-tag>
              </span>
            </div>
            <div class="header-right">
              <el-switch
                v-model="isDark"
                :active-icon="Moon"
                :inactive-icon="Sunny"
                @change="toggleTheme"
              />
            </div>
          </el-header>
          <el-main class="app-main">
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useK8sStore } from './stores/k8s'

const route = useRoute()
const k8sStore = useK8sStore()

const isDark = ref(false)
const currentRoute = computed(() => route.path)
const currentContext = computed(() => k8sStore.currentContext)

const toggleTheme = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(async () => {
  // Load current context on startup
  await k8sStore.loadCurrentContext()

  // Check system theme preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = prefersDark
  toggleTheme(prefersDark)
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
}

.main-container {
  height: 100%;
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
  -webkit-app-region: drag;
  padding-left: 70px; /* Space for traffic lights */
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  -webkit-app-region: no-drag;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
  -webkit-app-region: drag;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.header-right {
  -webkit-app-region: no-drag;
}

.current-env {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.app-main {
  background-color: var(--el-bg-color-page);
  padding: 20px;
  overflow-y: auto;
}
</style>
