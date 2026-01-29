# K8s Manager Desktop

<div align="center">

一个跨平台的 Kubernetes 环境管理桌面应用程序，帮助你轻松管理多个远程 K8s 集群环境。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.0-blue.svg)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

[功能特性](#功能特性) • [安装](#安装) • [使用说明](#使用说明) • [从源码构建](#从源码构建) • [开发指南](#开发指南)

</div>

---

## 简介

K8s Manager Desktop 是一个专为 DevOps 工程师和运维人员设计的桌面应用，通过图形化界面简化了原本繁琐的 Kubernetes 环境管理和切换操作。

### 核心价值

- **简化操作**：将复杂的命令行操作转化为可视化界面操作
- **提升效率**：一键完成环境配置、测试、同步、切换
- **集中管理**：统一管理所有 K8s 环境的 SSH 连接和配置信息
- **降低门槛**：图形界面友好，无需记忆复杂命令
- **开箱即用**：双击安装，无需复杂配置

## 功能特性

### 环境管理
- **多环境支持**：管理多个 K8s 集群环境
- **可视化配置**：通过表单添加和编辑环境信息
- **分组管理**：支持环境分组（开发、测试、生产等）
- **快速搜索**：根据名称快速过滤环境

### SSH 连接
- **连接测试**：一键测试 SSH 连接可用性
- **密钥认证**：支持密码和 SSH 密钥两种认证方式
- **批量操作**：支持批量测试多个环境连接

### 配置同步
- **自动同步**：从远程服务器自动获取 kubeconfig 文件
- **智能合并**：自动合并多个环境配置到本地
- **配置预览**：同步前预览配置内容
- **版本管理**：保留配置历史记录

### 终端集成
- **内置终端**：集成 xterm.js 提供完整的终端体验
- **环境隔离**：每个环境可独立打开终端会话
- **命令执行**：直接在终端中执行 kubectl 命令

### 配置查看
- **YAML 预览**：查看当前环境的 kubeconfig 详细内容
- **语法高亮**：支持 YAML 语法高亮显示
- **一键复制**：快速复制配置内容

### 日志记录
- **操作日志**：记录所有关键操作和错误信息
- **实时更新**：日志实时更新，便于排查问题
- **日志过滤**：按类型、时间过滤日志

## 安装

### 快速下载

前往 [Releases 页面](https://github.com/lirui001/k8s-env-manager/releases/latest)下载适合你系统的安装包：

| 平台 | 架构 | 下载文件 | 大小 |
|------|------|----------|------|
| **macOS** | Apple Silicon (M1/M2/M3) | `K8s Manager-1.0.0-arm64.dmg` | ~106 MB |
| **macOS** | Intel | `K8s Manager-1.0.0-x64.dmg` | ~111 MB |
| **Windows** | x64 | `K8s Manager-Setup-1.0.0-x64.exe` | ~82 MB |
| **Windows** | ARM64 | `K8s Manager-Setup-1.0.0-arm64.exe` | ~84 MB |
| **Windows** | Universal | `K8s Manager-Setup-1.0.0.exe` | ~166 MB |
| **Linux** | x64 (AppImage) | `K8s Manager-1.0.0-x86_64.AppImage` | ~114 MB |
| **Linux** | ARM64 (AppImage) | `K8s Manager-1.0.0-arm64.AppImage` | ~114 MB |
| **Linux** | x64 (Debian/Ubuntu) | `K8s Manager-1.0.0-amd64.deb` | ~75 MB |
| **Linux** | ARM64 (Debian/Ubuntu) | `K8s Manager-1.0.0-arm64.deb` | ~70 MB |

---

### macOS 安装

#### 方式一：DMG 安装包（推荐）

1. 下载适合你 Mac 架构的 DMG 文件
2. 打开 DMG 文件
3. 将 `K8s Manager` 拖拽到 `Applications` 文件夹
4. 首次打开时，如果遇到安全提示：
   ```bash
   # 方法1：在系统偏好设置中允许
   # 打开 系统偏好设置 > 安全性与隐私 > 点击 "仍要打开"

   # 方法2：使用命令行移除隔离属性
   xattr -cr /Applications/K8s\ Manager.app
   ```

#### 方式二：Homebrew (即将支持)

```bash
brew install --cask k8s-manager
```

---

### Windows 安装

#### NSIS 安装包

1. 下载对应架构的 `.exe` 安装文件：
   - **推荐**：下载 `K8s Manager-Setup-1.0.0.exe`（包含所有架构）
   - 或根据你的系统选择 x64 或 ARM64 版本
2. 双击运行安装程序
3. 选择安装路径（可自定义）
4. 安装完成后，从开始菜单或桌面快捷方式启动

**注意事项**：
- 首次运行时，Windows Defender 可能会显示安全警告，点击"更多信息"然后"仍要运行"
- 如需卸载，可以通过"设置 > 应用 > 已安装的应用"进行卸载

---

### Linux 安装

#### 方式一：AppImage（通用，推荐）

AppImage 是独立可执行文件，无需安装，适用于所有 Linux 发行版。

```bash
# 1. 下载 AppImage 文件
wget https://github.com/lirui001/k8s-env-manager/releases/download/v1.0.0/K8s\ Manager-1.0.0-x86_64.AppImage

# 2. 添加执行权限
chmod +x K8s\ Manager-1.0.0-x86_64.AppImage

# 3. 运行应用
./K8s\ Manager-1.0.0-x86_64.AppImage
```

**可选：集成到系统**
```bash
# 安装 AppImageLauncher (推荐)
sudo apt install appimagelauncher  # Debian/Ubuntu
sudo dnf install appimagelauncher  # Fedora

# 或手动创建桌面快捷方式
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/k8s-manager.desktop <<EOF
[Desktop Entry]
Name=K8s Manager
Exec=/path/to/K8s Manager-1.0.0-x86_64.AppImage
Icon=k8s-manager
Type=Application
Categories=Development;
EOF
```

#### 方式二：Debian/Ubuntu (.deb)

```bash
# 1. 下载 .deb 文件
wget https://github.com/lirui001/k8s-env-manager/releases/download/v1.0.0/K8s\ Manager-1.0.0-amd64.deb

# 2. 安装
sudo dpkg -i K8s\ Manager-1.0.0-amd64.deb

# 3. 安装依赖（如果有缺失）
sudo apt-get install -f

# 4. 启动应用
k8s-manager
```

#### 方式三：Arch Linux (AUR)

```bash
# 即将支持
yay -S k8s-manager-bin
```

---

## 使用说明

### 首次使用

1. **启动应用**：双击打开 K8s Manager
2. **添加环境**：点击 "环境管理" 标签页，添加你的第一个 K8s 环境
3. **填写信息**：
   - 环境名称：如 `production-cluster`
   - SSH 主机：如 `192.168.1.100`
   - SSH 端口：默认 `22`
   - SSH 用户名：如 `admin`
   - 认证方式：选择密码或密钥
   - 远程配置路径：如 `/etc/rancher/k3s/k3s.yaml`
4. **测试连接**：点击 "测试连接" 确保配置正确
5. **同步配置**：点击 "同步配置" 获取远程 kubeconfig
6. **切换环境**：点击 "激活" 切换到该环境

### 环境管理

#### 添加环境

1. 点击右上角 "添加环境" 按钮
2. 填写环境信息（必填项已标注 *）
3. 点击 "保存" 完成添加

#### 编辑环境

1. 在环境列表中点击 "编辑" 按钮
2. 修改需要更新的信息
3. 点击 "保存" 保存修改

#### 删除环境

1. 在环境列表中点击 "删除" 按钮
2. 确认删除操作

#### 测试连接

点击 "测试连接" 按钮，系统会：
- 测试 SSH 连接是否可用
- 验证远程配置文件是否存在
- 显示测试结果

#### 同步配置

点击 "同步配置" 按钮，系统会：
- 通过 SSH 从远程服务器下载 kubeconfig
- 修改配置中的环境标识
- 合并到本地 `~/.kube/config`
- 自动备份原有配置

#### 激活环境

点击 "激活" 按钮，系统会：
- 将该环境设置为 kubectl 的当前上下文
- 更新 Dashboard 显示当前环境
- 后续的 kubectl 命令将作用于该环境

### 终端使用

1. 点击 "终端" 标签页
2. 选择要连接的环境
3. 点击 "连接" 打开 SSH 会话
4. 在终端中执行命令，如：
   ```bash
   kubectl get pods
   kubectl get services
   kubectl logs <pod-name>
   ```

### 配置查看

1. 点击 "配置查看" 标签页
2. 选择要查看的环境
3. 查看完整的 kubeconfig YAML 内容
4. 可以点击 "复制" 按钮复制配置

### 设置

在 "设置" 页面可以配置：
- **SSH 默认端口**：设置 SSH 连接的默认端口
- **配置文件路径**：自定义 kubeconfig 存储路径
- **主题设置**：切换深色/浅色主题
- **语言设置**：切换界面语言

## 从源码构建

### 前置要求

- Node.js 16.x 或更高版本
- npm 或 yarn
- Git

### 构建步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/lirui001/k8s-env-manager.git
cd k8s-env-manager
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 开发模式运行

```bash
npm run dev
```

#### 4. 构建应用

##### macOS

```bash
# 构建 macOS 版本（包含 x64 和 arm64）
npm run build:mac
```

构建完成后，安装包位于 `release` 目录：
- `K8s Manager-1.0.0-arm64.dmg` (Apple Silicon)
- `K8s Manager-1.0.0-x64.dmg` (Intel)

##### Windows

```bash
# 构建 Windows 版本
npm run build:win
```

##### Linux

```bash
# 构建 Linux 版本
npm run build:linux
```

## 开发指南

### 项目结构

```
k8s-env-manager/
├── build/                  # 构建资源（图标等）
├── dist/                   # Vue 构建输出
├── dist-electron/          # Electron 构建输出
├── electron/               # Electron 主进程代码
│   ├── main/              # 主进程
│   └── preload/           # 预加载脚本
├── release/               # 应用安装包输出
├── src/                   # Vue 源代码
│   ├── views/            # 页面组件
│   ├── stores/           # Pinia 状态管理
│   ├── router/           # Vue Router 配置
│   └── styles/           # 样式文件
├── electron-builder.json  # Electron Builder 配置
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
└── vite.config.ts        # Vite 配置
```

### 技术栈

**前端框架**
- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - 类型安全的 JavaScript 超集
- Vite - 下一代前端构建工具

**UI 框架**
- Element Plus - Vue 3 组件库
- Element Plus Icons - 图标库

**状态管理**
- Pinia - Vue 官方状态管理库

**路由**
- Vue Router - Vue 官方路由

**Electron**
- Electron 28 - 跨平台桌面应用框架
- electron-builder - 应用打包工具

**核心功能库**
- ssh2 - SSH 客户端
- js-yaml - YAML 解析器
- xterm - 终端模拟器
- xterm-addon-fit - 终端自适应插件

### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **进行开发**
   - 遵循 TypeScript 和 Vue 3 最佳实践
   - 使用 Composition API
   - 保持代码简洁和可维护性

3. **代码检查**
   ```bash
   npm run lint
   ```

4. **类型检查**
   ```bash
   npm run typecheck
   ```

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

### 调试

#### 主进程调试

1. 在 VS Code 中打开项目
2. 按 F5 启动调试
3. 在 `electron/main` 目录中设置断点

#### 渲染进程调试

1. 运行 `npm run dev`
2. 在应用中打开开发者工具（View > Toggle Developer Tools）
3. 使用浏览器调试工具

## 常见问题

### macOS 安全提示

如果打开应用时遇到 "无法验证开发者" 的提示：

1. 打开 `系统偏好设置` > `安全性与隐私`
2. 在 "通用" 标签页底部，点击 "仍要打开"
3. 或者在终端中运行：
   ```bash
   xattr -cr /Applications/K8s\ Manager.app
   ```

### SSH 连接失败

1. 检查 SSH 主机地址和端口是否正确
2. 确认用户名和密码/密钥是否正确
3. 检查防火墙是否允许 SSH 连接
4. 尝试使用系统终端手动连接测试

### 配置同步失败

1. 确认远程配置文件路径是否正确
2. 检查 SSH 用户是否有权限读取配置文件
3. 查看日志页面获取详细错误信息

## 路线图

- [x] macOS 支持（Intel 和 Apple Silicon）
- [x] Windows 平台支持（x64 和 ARM64）
- [x] Linux 平台支持（.deb 和 AppImage）
- [ ] 配置文件加密存储
- [ ] 多语言支持（英文、中文）
- [ ] kubectl 命令补全
- [ ] 资源监控面板（Pods、Services 等）
- [ ] 多个 kubeconfig 配置文件管理
- [ ] 主题定制功能
- [ ] Helm Charts 管理

## 贡献指南

欢迎贡献代码、提出建议或报告问题！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [xterm.js](https://xtermjs.org/) - 终端模拟器
- [ssh2](https://github.com/mscdex/ssh2) - SSH 客户端库

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues: [提交 Issue](https://github.com/lirui001/k8s-env-manager/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

</div>
