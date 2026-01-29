# K8s 环境管理桌面应用程序 - 完整需求文档

**项目名称**: K8s Manager Desktop  
**文档版本**: v1.0  
**创建日期**: 2026-01-28  
**项目类型**: 开源桌面应用程序（自用）  
**目标平台**: macOS, Windows, Linux  

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目背景](#2-项目背景)
3. [项目目标](#3-项目目标)
4. [技术方案](#4-技术方案)
5. [功能需求](#5-功能需求)
6. [界面设计](#6-界面设计)
7. [技术架构](#7-技术架构)
8. [开发计划](#8-开发计划)
9. [部署方案](#9-部署方案)
10. [未来规划](#10-未来规划)

---

## 1. 项目概述

### 1.1 产品定位

K8s Manager Desktop 是一个**跨平台的桌面应用程序**，用于管理多个远程 Kubernetes 环境的配置和切换。通过**图形化界面**简化原本繁琐的命令行操作，让用户能够轻松管理多个 K8s 集群环境。

### 1.2 核心价值

- 🎯 **简化操作**：将复杂的命令行操作转化为可视化界面操作
- 🚀 **提升效率**：一键完成环境配置、测试、同步、切换
- 🔒 **集中管理**：统一管理所有 K8s 环境的 SSH 连接和配置信息
- 💡 **降低门槛**：图形界面友好，无需记忆复杂命令
- 📦 **开箱即用**：双击安装，无需复杂配置

### 1.3 目标用户

- DevOps 工程师
- 运维人员
- 后端开发工程师
- 需要频繁切换多个 K8s 环境的技术人员

---

## 2. 项目背景

### 2.1 当前痛点

目前管理多个远程 Kubernetes 环境需要通过以下手动步骤：

```bash
# 1. SSH 登录到远程服务器
ssh admin@192.168.1.100

# 2. 复制 kubeconfig 文件到本地
scp admin@192.168.1.100:/etc/rancher/k3s/k3s.yaml .kube/config ~/127-config

# 3. 修改配置文件中的环境标识
vim ~/127-config

修改后yaml：
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJlRENDQVIrZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWpNU0V3SHdZRFZRUUREQmhyTTNNdGMyVnkKZG1WeUxXTmhRREUzTmpVeU5qVXhOVGd3SUJjTk1qVXhNakE1TURjeU5UVTRXaGdQTWpFeU5URXhNVFV3TnpJMQpOVGhhTUNNeElUQWZCZ05WQkFNTUdHc3pjeTF6WlhKMlpYSXRZMkZBTVRjMk5USTJOVEUxT0RCWk1CTUdCeXFHClNNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJQdjd6d25kQnR5R0cxQ203SDNzeUtHVTdSak5VbnVwdVIwZkdaZ2cKT1JaRGlSVXBvMWNlaC9yVDVwTHFUK3VrSit4cHNhOXc5Z1FheE1hTFhyWnpTbWlqUWpCQU1BNEdBMVVkRHdFQgovd1FFQXdJQ3BEQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01CMEdBMVVkRGdRV0JCU2NxdlNidjNEYm1VYm1uNnNnCnlYL1h6NHNOU1RBS0JnZ3Foa2pPUFFRREFnTkhBREJFQWlCMnVyQlNkRlQ3eGlXdlhCdnI1WU1hdkI3NGQzRG0KVm8rMkNXMUhITTN6dFFJZ0pvd21vYkVYUGRkMXB2ekhSUTlZeWxuY1J5YlBkZDdmVUpQY0VraDM2STA9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
    server: https://172.16.16.127:6443
  name: ids-127
contexts:
- context:
    cluster: ids-127
    user: ids-127
  name: ids-127
current-context: ids-127
kind: Config
preferences: {}
users:
- name: ids-127
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJsRENDQVRtZ0F3SUJBZ0lJR0R5R0t5Q1I2WHN3Q2dZSUtvWkl6ajBFQXdJd0l6RWhNQjhHQTFVRUF3d1kKYXpOekxXTnNhV1Z1ZEMxallVQXhOelkxTWpZMU1UVTRNQ0FYRFRJMU1USXdPVEEzTWpVMU9Gb1lEekl4TWpVeApNVEUxTURjeU5qQTJXakF3TVJjd0ZRWURWUVFLRXc1emVYTjBaVzA2YldGemRHVnljekVWTUJNR0ExVUVBeE1NCmMzbHpkR1Z0T21Ga2JXbHVNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVZcEoxTHQxNHN1SjQKaXRBL0hacVdaTTZPNlN4MlBXaFMvaW44N2hWRUtkUmhIZ2RrN2hSRGlWYWM4dVREZ0ozQ21UdW9Gc0JtUXdEdgpmODcrOXJMY1dLTklNRVl3RGdZRFZSMFBBUUgvQkFRREFnV2dNQk1HQTFVZEpRUU1NQW9HQ0NzR0FRVUZCd01DCk1COEdBMVVkSXdRWU1CYUFGSE9uSDZFbDlxZXQ1RkNyazR6WnVoNmNBKytkTUFvR0NDcUdTTTQ5QkFNQ0Ewa0EKTUVZQ0lRRDdOeUJyQ1YyTUNIOUpKREpldDU2NGRVakg5WlRjUUlid1gyY2FnQ0lFQlFJaEFQcFluZTJmSUVJOApSY20yWE9sWnpFWDhRK3JvVHpnREx3bUFGR2M4MjI3TgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCi0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLQpNSUlCZWpDQ0FSK2dBd0lCQWdJQkFEQUtCZ2dxaGtqT1BRUURBakFqTVNFd0h3WURWUVFEREJock0zTXRZMnhwClpXNTBMV05oUURFM05qVXlOalV4TlRnd0lCY05NalV4TWpBNU1EY3lOVFU0V2hnUE1qRXlOVEV4TVRVd056STEKTlRoYU1DTXhJVEFmQmdOVkJBTU1HR3N6Y3kxamJHbGxiblF0WTJGQU1UYzJOVEkyTlRFMU9EQlpNQk1HQnlxRwpTTTQ5QWdFR0NDcUdTTTQ5QXdFSEEwSUFCS1p2RU9BWURpZzBpZUswcFMzaHcxV3B5bm51dG9HeW1PSnM3bWMwCmtPcUxBN3BrN1lid0hYUzduRWh0bDlzU1RDMmFZTkl6b3pxdGdQSmlmMm5MYndhalFqQkFNQTRHQTFVZER3RUIKL3dRRUF3SUNwREFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVdCQlJ6cHgraEpmYW5yZVJRcTVPTQoyYm9lbkFQdm5UQUtCZ2dxaGtqT1BRUURBZ05KQURCR0FpRUF0SUREYm5UYTJvR2xBeFV0UlJtUFRYQnFMMVFvCmk4ZldoVFJ6amcwdGM5MENJUURDUWc3d0RBUGxkWU40b1RmVUpEaG5NOFo5bTFndkZnT1h4WWdXeWxwUjN3PT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    client-key-data: LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0tCk1IY0NBUUVFSUVrUjR0ZUp4dWZpeWYyc0ttM3FLWUwwWVYvSW1uRmE4SVI0bFQydlZuSlhvQW9HQ0NxR1NNNDkKQXdFSG9VUURRZ0FFWXBKMUx0MTRzdUo0aXRBL0hacVdaTTZPNlN4MlBXaFMvaW44N2hWRUtkUmhIZ2RrN2hSRAppVmFjOHVURGdKM0NtVHVvRnNCbVF3RHZmODcrOXJMY1dBPT0KLS0tLS1FTkQgRUMgUFJJVkFURSBLRVktLS0tLQo=

# 4. 合并多个配置文件
KUBECONFIG=127-config:40-config:dev-config kubectl config view --flatten > $HOME/.kube/config

# 5. 查看所有环境
kubectl config get-contexts

# 6. 切换环境
kubectl config use-context ids-127
```

**存在的问题**：
- ❌ 操作步骤繁琐，容易出错
- ❌ 需要记忆大量命令和参数
- ❌ 环境配置分散，难以统一管理
- ❌ 缺乏可视化界面，不够直观
- ❌ 新增环境时需要重复大量操作
- ❌ 无法快速进行连通性测试
- ❌ 切换环境时容易误操作

### 2.2 解决方案

开发一个**桌面应用程序**，通过图形化界面提供：
- 环境配置的可视化管理
- SSH 连接的自动化处理
- kubeconfig 的自动同步和合并
- 一键环境切换
- 实时连接状态监控

---

## 3. 项目目标

### 3.1 核心目标

1. **简化操作流程**
   - 将多步骤的命令行操作简化为界面点击
   - 自动化 SSH 连接和文件传输
   - 自动化 kubeconfig 合并和管理

2. **提供友好界面**
   - 清晰的视觉设计
   - 直观的操作流程
   - 实时的状态反馈

3. **跨平台支持**
   - macOS（Intel + Apple Silicon）
   - Windows 10/11
   - Linux（主流发行版）

4. **开源自用**
   - MIT 许可证
   - GitHub 开源
   - 不考虑代码签名（初期）

### 3.2 非功能性目标

- **性能**：应用启动时间 < 3秒，操作响应 < 1秒
- **稳定性**：核心功能异常捕获率 100%
- **易用性**：新用户上手时间 < 5分钟
- **可维护性**：代码注释覆盖率 > 60%

---

## 4. 技术方案

### 4.1 技术选型

#### 整体架构

```
┌─────────────────────────────────────────┐
│         Electron 桌面应用               │
├─────────────────────────────────────────┤
│  渲染进程 (Renderer)    │  主进程 (Main) │
│  ┌──────────────────┐  │  ┌───────────┐ │
│  │  Vue 3 + UI      │  │  │  Node.js  │ │
│  │  Element Plus    │◄─┼─►│  业务逻辑 │ │
│  │  Pinia Store     │  │  │  SSH/K8s  │ │
│  └──────────────────┘  │  └───────────┘ │
└─────────────────────────────────────────┘
           │                      │
           ▼                      ▼
    ┌──────────────┐      ┌──────────────┐
    │  用户界面    │      │ 本地文件系统 │
    │  (Web View)  │      │  SSH 连接    │
    └──────────────┘      └──────────────┘
```

#### 技术栈详情

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Electron | 28.x | 桌面应用框架 |
| **前端框架** | Vue 3 | 3.3.x | 界面开发 |
| **UI 库** | Element Plus | 2.5.x | UI 组件 |
| **状态管理** | Pinia | 2.1.x | 全局状态 |
| **构建工具** | Vite | 5.0.x | 前端构建 |
| **打包工具** | electron-builder | 24.x | 应用打包 |
| **SSH 客户端** | ssh2 | 1.15.x | SSH 连接 |
| **YAML 处理** | js-yaml | 4.1.x | 配置文件解析 |
| **进程通信** | Electron IPC | 内置 | 主进程/渲染进程通信 |

### 4.2 为什么选择 Electron？

**优势**：
- ✅ 使用 Web 技术栈（HTML/CSS/JavaScript），开发效率高
- ✅ 跨平台支持完善（macOS/Windows/Linux）
- ✅ 生态成熟，大量组件和工具可用
- ✅ 可以直接访问 Node.js API 和系统功能
- ✅ 打包简单，一键生成安装包
- ✅ 成功案例众多（VS Code、Slack、Postman）

**劣势及应对**：
- ⚠️ 应用体积较大（~100MB）
  - 对策：对于桌面应用可接受
- ⚠️ 内存占用较高
  - 对策：本项目功能简单，影响不大

### 4.3 技术架构图

```
┌────────────────────────────────────────────────────────────┐
│                        应用层 (Renderer)                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Dashboard│ 环境管理  │ 配置查看  │ 操作日志  │ 系统设置 │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Vue 3 + Element Plus + Pinia            │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
                            │ IPC
                            ▼
┌────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Main)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ SSH      │ K8s      │ Config   │ Menu     │ Tray     │  │
│  │ Service  │ Service  │ Service  │ Manager  │ Manager  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                      数据访问层                             │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ 本地配置  │ SSH      │ 文件系统  │ kubectl   │            │
│  │ (JSON)   │ 连接     │ 操作     │ 命令     │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. 功能需求

### 5.1 核心功能模块

#### 5.1.1 环境配置管理

##### 功能描述
管理所有远程 Kubernetes 环境的配置信息，包括 SSH 连接参数和 K8s 配置路径。

##### 详细需求

**1. 添加环境**

**界面要素**：
- 环境标识输入框（必填，如：prod-127）
- SSH 配置区域：
  - 主机地址（必填）
  - 端口号（默认 22）
  - 用户名（必填）
  - 认证方式选择（密码/密钥）
  - 密码输入框（密码认证时显示）
  - 私钥文件选择器（密钥认证时显示）
- 环境描述（可选）
- 保存按钮
- 取消按钮

**交互流程**：
```
用户点击"添加环境" 
  ↓
弹出表单对话框
  ↓
用户填写信息
  ↓
点击"保存"
  ↓
验证表单（必填项、格式检查）
  ↓
保存到本地配置文件
  ↓
显示成功提示
  ↓
刷新环境列表
```

**验证规则**：
- 环境名称：不能为空，最长 50 字符
- 环境标识：不能为空，最长 20 字符，只能包含字母、数字、连字符
- 主机地址：不能为空，需要是有效的 IP 或域名
- 端口号：1-65535
- 用户名：不能为空
- 密码/私钥：二选一必填

**2. 编辑环境**

**界面要素**：
- 与添加环境相同的表单
- 预填充现有配置数据
- 保存按钮
- 取消按钮

**交互流程**：
```
用户点击环境卡片上的"编辑"按钮
  ↓
弹出表单对话框，显示现有数据
  ↓
用户修改信息
  ↓
点击"保存"
  ↓
验证表单
  ↓
更新配置文件
  ↓
显示成功提示
  ↓
刷新环境列表
```

**3. 删除环境**

**界面要素**：
- 删除按钮（危险操作，红色）
- 确认对话框

**交互流程**：
```
用户点击"删除"按钮
  ↓
弹出确认对话框："确定要删除环境 'XXX' 吗？此操作不可恢复。"
  ↓
用户点击"确定"
  ↓
从配置文件中删除
  ↓
（可选）清理本地对应的 kubeconfig context
  ↓
显示成功提示
  ↓
刷新环境列表
```

**4. 环境列表展示**

**界面要素**：
- 卡片式布局（推荐）或表格式布局
- 每个环境显示：
  - 环境名称（大号字体）
  - 环境标识（标签）
  - SSH 主机地址
  - 连接状态指示器（绿色/红色/灰色）
  - 最后同步时间
  - 操作按钮组：
    - 测试连接
    - 同步配置
    - 切换环境
    - 编辑
    - 删除
- 搜索框（按名称或标识搜索）
- 排序选项（按名称、创建时间、最后使用时间）

**状态说明**：
- 🟢 绿色：已同步且可用
- 🔴 红色：连接失败
- ⚪ 灰色：未同步或未知状态

**5. 连通性测试**

**界面要素**：
- 测试按钮
- 加载动画
- 结果提示

**交互流程**：
```
用户点击"测试连接"
  ↓
显示加载动画
  ↓
执行 SSH 连接测试
  ↓
成功：
  - 显示绿色对勾 ✓
  - 提示："连接成功"
  - 更新状态指示器为绿色
失败：
  - 显示红色叉号 ✗
  - 提示："连接失败：[错误信息]"
  - 更新状态指示器为红色
```

**测试内容**：
1. SSH 连接测试（能否建立连接）
2. 权限测试（能否执行命令）
3. 配置文件检查（远程 kubeconfig 文件是否存在）

#### 5.1.2 K8s 环境初始化（同步）

##### 功能描述
自动从远程服务器获取 kubeconfig 配置文件，并合并到本地 Kubernetes 配置中。

##### 详细需求

**1. 单个环境同步**

**界面要素**：
- 同步按钮
- 进度指示器
- 步骤说明
- 结果提示

**交互流程**：
```
用户点击"同步配置"
  ↓
弹出进度对话框
  ↓
显示同步步骤：
  [进行中] 1. 连接远程服务器...
  [等待] 2. 下载配置文件...
  [等待] 3. 解析配置...
  [等待] 4. 合并到本地...
  ↓
步骤 1 完成
  [完成 ✓] 1. 连接远程服务器
  [进行中] 2. 下载配置文件...
  ↓
... (依次完成各步骤)
  ↓
全部成功：
  - 显示："同步完成！"
  - 更新环境状态
  - 记录同步时间
  - 记录操作日志
某步骤失败：
  - 显示："同步失败：[错误信息]"
  - 保持原有配置不变
  - 记录错误日志
```

**同步步骤详解**：

1. **连接远程服务器**
   ```
   使用配置的 SSH 参数建立连接
   超时时间：30秒
   失败重试：3次
   ```

2. **下载配置文件**
   ```
   使用 SFTP 协议下载远程 kubeconfig
   目标路径：/tmp/k8s-manager-[identifier]-[timestamp]
   ```

3. **解析配置**
   ```
   读取 YAML 文件
   验证格式是否正确
   修改 context/cluster/user 名称（添加环境标识前缀）
   例如：default → prod-127-default
   ```

4. **合并到本地**
   ```
   读取本地 ~/.kube/config
   合并 clusters、contexts、users
   去重（如果存在同名配置）
   写入本地配置文件
   备份原配置（~/.kube/config.backup）
   ```

**2. 批量同步**

**界面要素**：
- 批量同步按钮（在环境列表页面顶部）
- 环境选择器（多选）
- 进度对话框（显示所有环境的同步状态）

**交互流程**：
```
用户点击"批量同步"
  ↓
弹出环境选择对话框
  ↓
用户选择要同步的环境（支持全选）
  ↓
点击"开始同步"
  ↓
显示批量进度对话框：
  ┌─────────────────────────────┐
  │ 生产环境    [进行中] 50%     │
  │ 测试环境    [等待]           │
  │ 开发环境    [等待]           │
  └─────────────────────────────┘
  ↓
依次或并发（配置项）执行同步
  ↓
显示最终结果：
  - 成功 X 个
  - 失败 Y 个
  - 查看详情按钮
```

**3. 自动同步（可选功能）**

**配置项**：
- 启用自动同步：是/否
- 同步间隔：每小时/每天/每周
- 自动同步的环境：选择特定环境

#### 5.1.3 环境切换

##### 功能描述
快速切换当前活动的 Kubernetes 环境（context）。

##### 详细需求

**1. 切换环境**

**界面要素**：
- 切换按钮（每个环境卡片上）
- 当前环境高亮显示
- 确认对话框（可选）

**交互流程**：
```
用户点击"切换环境"
  ↓
（可选）弹出确认："确定切换到 'XXX' 环境吗？"
  ↓
执行切换命令：kubectl config use-context [context-name]
  ↓
成功：
  - 显示："已切换到 'XXX' 环境"
  - 更新顶部当前环境显示
  - 高亮当前环境卡片
  - 记录操作日志
失败：
  - 显示："切换失败：[错误信息]"
  - 保持原环境不变
```

**2. 快速切换**

**界面要素**：
- 顶部导航栏的环境下拉菜单
- 显示所有已同步的环境
- 当前环境带 ✓ 标记

**交互流程**：
```
用户点击顶部环境下拉菜单
  ↓
显示环境列表：
  ✓ 生产环境 (prod-127)
    测试环境 (test-40)
    开发环境 (dev-local)
  ↓
用户选择目标环境
  ↓
立即切换
  ↓
更新界面显示
```

**3. 当前环境显示**

**界面要素**：
- 顶部导航栏显示：
  ```
  当前环境: 生产环境 (prod-127-default)
  ```
- 应用标题栏显示：
  ```
  K8s Manager - 生产环境
  ```

**状态同步**：
- 应用启动时自动检测当前 context
- 切换后实时更新显示
- 定期（如每 30 秒）检查是否有外部切换

#### 5.1.4 配置查看

##### 功能描述
查看本地 Kubernetes 配置文件的详细内容。

##### 详细需求

**1. Context 列表**

**界面要素**：
- 表格展示所有 context
- 列：
  - Context 名称
  - 集群
  - 用户
  - 命名空间
  - 当前激活（✓ 标记）
- 操作按钮：
  - 切换到此 context
  - 删除 context

**2. 完整配置查看**

**界面要素**：
- 代码编辑器风格展示
- YAML 语法高亮
- 行号显示
- 只读模式
- 复制按钮
- 导出按钮

**示例**：
```yaml
apiVersion: v1
kind: Config
clusters:
- name: prod-127-cluster
  cluster:
    server: https://192.168.1.100:6443
    certificate-authority-data: ...
contexts:
- name: prod-127-default
  context:
    cluster: prod-127-cluster
    user: prod-127-admin
    namespace: default
current-context: prod-127-default
users:
- name: prod-127-admin
  user:
    client-certificate-data: ...
    client-key-data: ...
```

**3. 配置导出**

**界面要素**：
- 导出按钮
- 导出选项：
  - 导出完整配置
  - 导出当前环境配置
- 文件保存对话框

**交互流程**：
```
用户点击"导出"
  ↓
选择导出范围
  ↓
选择保存位置和文件名
  ↓
保存文件
  ↓
显示："配置已导出到 [path]"
```

#### 5.1.5 操作日志

##### 功能描述
记录和展示所有关键操作的历史记录。

##### 详细需求

**1. 日志记录**

**记录内容**：
- 操作类型（添加环境、删除环境、同步配置、切换环境等）
- 操作时间（精确到秒）
- 操作对象（环境名称）
- 操作结果（成功/失败）
- 详细信息（成功消息或错误信息）
- 用户（如果支持多用户）

**日志级别**：
- INFO：一般操作
- WARNING：警告
- ERROR：错误

**2. 日志展示**

**界面要素**：
- 表格展示
- 列：
  - 时间
  - 类型
  - 环境
  - 操作
  - 状态
  - 详情
- 筛选器：
  - 时间范围
  - 操作类型
  - 环境
  - 状态（成功/失败）
- 搜索框
- 清空日志按钮
- 导出日志按钮

**3. 日志管理**

**功能**：
- 自动清理：保留最近 N 天的日志（配置项）
- 日志导出：导出为 CSV 或 JSON 格式
- 日志搜索：全文搜索

#### 5.1.6 系统设置

##### 功能描述
配置应用的全局设置和偏好。

##### 详细需求

**1. 通用设置**

- **语言**：中文/English
- **主题**：亮色/暗色/跟随系统
- **启动时自动运行**：是/否
- **最小化到系统托盘**：是/否

**2. K8s 配置**

- **本地配置文件路径**：~/.kube/config（可修改）
- **配置备份**：启用/禁用
- **备份保留数量**：1-10

**3. SSH 配置**

- **连接超时时间**：10-60 秒
- **重试次数**：1-5 次
- **默认端口**：22（可修改）

**4. 同步设置**

- **自动同步**：启用/禁用
- **同步间隔**：1 小时/6 小时/12 小时/24 小时
- **同步策略**：覆盖/合并

**5. 日志设置**

- **日志级别**：DEBUG/INFO/WARNING/ERROR
- **日志保留天数**：7/15/30/60/90
- **日志文件位置**：显示并可打开

**6. 关于**

- 应用名称和图标
- 版本号
- 开源许可证
- GitHub 链接
- 检查更新按钮

### 5.2 辅助功能

#### 5.2.1 系统托盘

**功能**：
- 最小化到托盘（可选）
- 托盘菜单：
  - 显示主窗口
  - 快速切换环境
  - 退出应用

#### 5.2.2 快捷键

**常用快捷键**：
- `Cmd/Ctrl + N`：添加新环境
- `Cmd/Ctrl + R`：刷新环境列表
- `Cmd/Ctrl + ,`：打开设置
- `Cmd/Ctrl + Q`：退出应用

#### 5.2.3 通知

**通知场景**：
- 同步完成
- 同步失败
- 环境切换成功
- 连接测试失败
- 有新版本可用

---

## 6. 界面设计

### 6.1 整体布局

```
┌────────────────────────────────────────────────────────────┐
│  K8s Manager          当前: 生产环境 ▼      [−] [□] [×]    │
├────────────┬───────────────────────────────────────────────┤
│            │                                                │
│  🏠 仪表盘  │                                                │
│            │              主内容区域                        │
│  📦 环境管理│                                                │
│            │                                                │
│  🔍 配置查看│                                                │
│            │                                                │
│  📝 操作日志│                                                │
│            │                                                │
│  ⚙️ 系统设置│                                                │
│            │                                                │
│            │                                                │
└────────────┴───────────────────────────────────────────────┘
```

**布局说明**：
- 顶部：应用标题 + 当前环境显示 + 窗口控制按钮
- 左侧：导航菜单（侧边栏）
- 右侧：主内容区域（根据选中的菜单项显示不同内容）

### 6.2 仪表盘页面

```
┌────────────────────────────────────────────────────────────┐
│  仪表盘                                                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  📊 统计    │  │  🔗 连接状态 │  │  ⏱️ 最近操作 │        │
│  │             │  │             │  │             │        │
│  │  环境总数   │  │  已连接: 2  │  │  同步配置   │        │
│  │     5       │  │  未连接: 1  │  │  2分钟前    │        │
│  │             │  │  未知: 2    │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  快速操作                                                   │
│  ┌──────────────────────────────────────────────────┐     │
│  │  [+ 添加环境]  [🔄 批量同步]  [🔍 查看配置]      │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  当前环境详情                                               │
│  ┌──────────────────────────────────────────────────┐     │
│  │  环境：生产环境 (prod-127)                         │     │
│  │  集群：https://192.168.1.100:6443                 │     │
│  │  命名空间：default                                 │     │
│  │  状态：✓ 已连接                                    │     │
│  │  [切换环境] [同步配置]                             │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.3 环境管理页面

```
┌────────────────────────────────────────────────────────────┐
│  环境管理                    [🔍 搜索]  [+ 添加环境]        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  生产环境                             ✓ 已连接       │  │
│  │  prod-127                                            │  │
│  │  192.168.1.100:22                                    │  │
│  │  最后同步: 2小时前                                    │  │
│  │                                                       │  │
│  │  [测试连接] [同步配置] [切换环境] [编辑] [删除]      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  测试环境                             ⚪ 未同步      │  │
│  │  test-40                                             │  │
│  │  192.168.1.40:22                                     │  │
│  │  未同步                                               │  │
│  │                                                       │  │
│  │  [测试连接] [同步配置] [切换环境] [编辑] [删除]      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  开发环境                             🔴 连接失败    │  │
│  │  dev-local                                           │  │
│  │  192.168.1.200:22                                    │  │
│  │  连接超时                                             │  │
│  │                                                       │  │
│  │  [测试连接] [同步配置] [切换环境] [编辑] [删除]      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.4 添加/编辑环境对话框

```
┌──────────────────────────────────────────────┐
│  添加环境                           [×]       │
├──────────────────────────────────────────────┤
│                                               │
│  基本信息                                     │
│  ┌──────────────────────────────────────┐   │
│  │ 环境名称 *                            │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ 生产环境                          │ │   │
│  │ └──────────────────────────────────┘ │   │
│  │                                       │   │
│  │ 环境标识 *                            │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ prod-127                          │ │   │
│  │ └──────────────────────────────────┘ │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  SSH 配置                                     │
│  ┌──────────────────────────────────────┐   │
│  │ 主机地址 *                            │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ 192.168.1.100                     │ │   │
│  │ └──────────────────────────────────┘ │   │
│  │                                       │   │
│  │ 端口         用户名 *                 │   │
│  │ ┌───────┐    ┌──────────────────┐   │   │
│  │ │  22   │    │  admin           │   │   │
│  │ └───────┘    └──────────────────┘   │   │
│  │                                       │   │
│  │ 认证方式                              │   │
│  │ ◉ 密码   ○ SSH 密钥                  │   │
│  │                                       │   │
│  │ 密码 *                                │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ ••••••••••                        │ │   │
│  │ └──────────────────────────────────┘ │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  K8s 配置                                     │
│  ┌──────────────────────────────────────┐   │
│  │ 配置文件路径                          │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ ~/.kube/config                    │ │   │
│  │ └──────────────────────────────────┘ │   │
│  │                                       │   │
│  │ 描述（可选）                          │   │
│  │ ┌──────────────────────────────────┐ │   │
│  │ │ 生产环境 Kubernetes 集群          │ │   │
│  │ └──────────────────────────────────┘ │   │
│  └──────────────────────────────────────┘   │
│                                               │
│            [测试连接]  [取消]  [保存]        │
└──────────────────────────────────────────────┘
```

### 6.5 同步进度对话框

```
┌──────────────────────────────────────────────┐
│  同步环境: 生产环境                [×]       │
├──────────────────────────────────────────────┤
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ [✓] 1. 连接远程服务器                 │   │
│  │     已完成                            │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ [⏳] 2. 下载配置文件                  │   │
│  │     正在下载... 45%                   │   │
│  │     ████████████░░░░░░░░░░░░         │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ [  ] 3. 解析配置                      │   │
│  │     等待中...                         │   │
│  └──────────────────────────────────────┘   │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │ [  ] 4. 合并到本地                    │   │
│  │     等待中...                         │   │
│  └──────────────────────────────────────┘   │
│                                               │
│                        [取消]                │
└──────────────────────────────────────────────┘
```

### 6.6 配置查看页面

```
┌────────────────────────────────────────────────────────────┐
│  配置查看                         [导出] [复制]             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  标签页: [Contexts] [完整配置]                              │
│                                                             │
│  Contexts 列表                                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Context              集群            用户    命名空间  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ✓ prod-127-default   prod-cluster   admin   default  │ │
│  │   test-40-default    test-cluster   admin   default  │ │
│  │   dev-local-default  dev-cluster    admin   default  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  操作: [切换] [删除]                                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.7 操作日志页面

```
┌────────────────────────────────────────────────────────────┐
│  操作日志                                                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  筛选: [全部 ▼] [最近7天 ▼] [所有环境 ▼]  [🔍]  [清空]    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │时间          类型    环境        操作       状态 详情 │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │10:23:45  同步    生产环境    同步配置    ✓    查看   │ │
│  │10:20:12  切换    测试环境    切换环境    ✓    查看   │ │
│  │10:15:33  测试    开发环境    连接测试    ✗    查看   │ │
│  │09:45:22  添加    测试环境    添加环境    ✓    查看   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  [上一页] 1 / 5 [下一页]                    [导出日志]    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.8 系统设置页面

```
┌────────────────────────────────────────────────────────────┐
│  系统设置                                                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  通用设置                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 语言              [中文 ▼]                            │ │
│  │ 主题              [跟随系统 ▼]                        │ │
│  │ 启动时自动运行     [✓]                                │ │
│  │ 最小化到系统托盘   [✓]                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  K8s 配置                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 本地配置文件       ~/.kube/config   [浏览]           │ │
│  │ 配置备份          [✓]                                 │ │
│  │ 备份保留数量       [5 ▼]                              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  SSH 配置                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 连接超时          [30 秒 ▼]                           │ │
│  │ 重试次数          [3 次 ▼]                            │ │
│  │ 默认端口          [22]                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  日志设置                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 日志级别          [INFO ▼]                            │ │
│  │ 日志保留天数       [30 天 ▼]                          │ │
│  │ 日志文件位置       ~/.k8s-manager/logs   [打开]      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│                              [重置] [保存]                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.9 关于页面

```
┌──────────────────────────────────────────────┐
│  关于 K8s Manager                  [×]       │
├──────────────────────────────────────────────┤
│                                               │
│              ┌───────────┐                   │
│              │           │                   │
│              │   Logo    │                   │
│              │           │                   │
│              └───────────┘                   │
│                                               │
│         K8s Manager Desktop                  │
│              v1.0.0                           │
│                                               │
│      Kubernetes 环境管理工具                  │
│                                               │
│  ───────────────────────────────────────     │
│                                               │
│  开源许可证: MIT License                      │
│                                               │
│  GitHub:                                      │
│  github.com/yourname/k8s-manager             │
│                                               │
│  技术栈:                                      │
│  • Electron 28.x                             │
│  • Vue 3.3.x                                 │
│  • Element Plus 2.5.x                        │
│                                               │
│            [检查更新] [关闭]                  │
│                                               │
└──────────────────────────────────────────────┘
```

### 6.10 色彩方案

#### 亮色主题

| 元素 | 颜色 | 说明 |
|------|------|------|
| 主色 | #409EFF | 蓝色，Element Plus 默认主色 |
| 成功 | #67C23A | 绿色，表示成功、已连接 |
| 警告 | #E6A23C | 橙色，表示警告 |
| 危险 | #F56C6C | 红色，表示错误、失败 |
| 信息 | #909399 | 灰色，表示提示信息 |
| 背景 | #FFFFFF | 白色，主背景 |
| 边框 | #DCDFE6 | 浅灰色，边框和分割线 |
| 文字 | #303133 | 深灰色，主要文字 |

#### 暗色主题

| 元素 | 颜色 | 说明 |
|------|------|------|
| 主色 | #409EFF | 蓝色 |
| 成功 | #67C23A | 绿色 |
| 警告 | #E6A23C | 橙色 |
| 危险 | #F56C6C | 红色 |
| 信息 | #909399 | 灰色 |
| 背景 | #1E1E1E | 深灰色，主背景 |
| 边框 | #414243 | 中灰色，边框 |
| 文字 | #E5EAF3 | 浅色，主要文字 |

---

## 7. 技术架构

### 7.1 项目目录结构

```
k8s-manager-desktop/
├── build/                          # 构建资源
│   ├── icon.icns                  # macOS 图标
│   ├── icon.ico                   # Windows 图标
│   ├── icon.png                   # Linux 图标
│   └── icons/                     # 多尺寸图标
│       ├── 16x16.png
│       ├── 32x32.png
│       ├── 48x48.png
│       ├── 64x64.png
│       ├── 128x128.png
│       ├── 256x256.png
│       └── 512x512.png
│
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── index.js              # 主进程入口
│   │   ├── ipc/                  # IPC 通信处理
│   │   │   ├── environment.js    # 环境管理 IPC
│   │   │   ├── k8s.js           # K8s 操作 IPC
│   │   │   └── system.js        # 系统设置 IPC
│   │   ├── services/             # 业务逻辑服务
│   │   │   ├── ssh.service.js   # SSH 连接服务
│   │   │   ├── k8s.service.js   # K8s 配置管理
│   │   │   ├── config.service.js # 配置文件管理
│   │   │   └── logger.service.js # 日志服务
│   │   ├── utils/                # 工具函数
│   │   │   ├── crypto.js        # 加密/解密
│   │   │   ├── validator.js     # 验证器
│   │   │   └── file.js          # 文件操作
│   │   ├── menu.js              # 应用菜单
│   │   └── tray.js              # 系统托盘
│   │
│   ├── preload/                  # 预加载脚本
│   │   └── index.js             # 预加载入口
│   │
│   └── renderer/                 # 渲染进程（前端）
│       ├── index.html           # HTML 入口
│       ├── src/
│       │   ├── main.js          # Vue 入口
│       │   ├── App.vue          # 根组件
│       │   ├── router/          # 路由配置
│       │   │   └── index.js
│       │   ├── store/           # 状态管理
│       │   │   ├── index.js    # Pinia store
│       │   │   ├── environment.js
│       │   │   ├── k8s.js
│       │   │   └── system.js
│       │   ├── views/           # 页面组件
│       │   │   ├── Dashboard.vue
│       │   │   ├── Environments.vue
│       │   │   ├── ConfigView.vue
│       │   │   ├── Logs.vue
│       │   │   └── Settings.vue
│       │   ├── components/      # 通用组件
│       │   │   ├── EnvironmentCard.vue
│       │   │   ├── EnvironmentForm.vue
│       │   │   ├── SyncProgress.vue
│       │   │   ├── ConnectionTest.vue
│       │   │   └── StatusIndicator.vue
│       │   ├── api/            # API 调用（IPC 封装）
│       │   │   ├── environment.js
│       │   │   ├── k8s.js
│       │   │   └── system.js
│       │   ├── styles/         # 样式文件
│       │   │   ├── index.css
│       │   │   ├── variables.css
│       │   │   └── dark.css
│       │   └── utils/          # 前端工具函数
│       │       ├── format.js
│       │       └── validate.js
│       └── assets/             # 静态资源
│           ├── images/
│           └── fonts/
│
├── .github/
│   └── workflows/
│       └── build.yml            # GitHub Actions 构建流程
│
├── scripts/                     # 脚本文件
│   ├── dev.js                  # 开发启动脚本
│   └── build.js                # 构建脚本
│
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── electron-builder.json        # Electron Builder 配置
├── vite.config.js              # Vite 配置
├── README.md
├── CHANGELOG.md
└── LICENSE
```

### 7.2 数据流架构

```
┌─────────────────────────────────────────────────────┐
│                   用户界面 (UI)                      │
│                  Vue 3 Components                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ User Actions
                   ▼
┌─────────────────────────────────────────────────────┐
│                   Pinia Store                        │
│              (State Management)                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ IPC Invoke
                   ▼
┌─────────────────────────────────────────────────────┐
│              Electron Main Process                   │
│                   IPC Handlers                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├──────────┬──────────┬────────────┐
                   ▼          ▼          ▼            ▼
            ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
            │   SSH    │ │  K8s   │ │ Config │ │ Logger │
            │ Service  │ │Service │ │Service │ │Service │
            └──────────┘ └────────┘ └────────┘ └────────┘
                   │          │          │            │
                   ▼          ▼          ▼            ▼
            ┌──────────────────────────────────────────┐
            │         External Resources               │
            │  • Remote SSH Servers                    │
            │  • Local File System                     │
            │  • kubectl Commands                      │
            └──────────────────────────────────────────┘
```

### 7.3 核心模块设计

#### 7.3.1 SSH 服务（ssh.service.js）

```javascript
/**
 * SSH 连接服务
 * 负责与远程服务器的 SSH 连接和文件传输
 */
class SSHService {
  constructor(environment) {
    this.env = environment;
    this.client = null;
  }

  /**
   * 建立 SSH 连接
   * @returns {Promise<void>}
   */
  async connect() {
    // 实现 SSH 连接逻辑
  }

  /**
   * 测试连接
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    // 测试 SSH 连接、权限、文件存在性
  }

  /**
   * 下载 kubeconfig 文件
   * @returns {Promise<string>} 本地临时文件路径
   */
  async downloadKubeConfig() {
    // 使用 SFTP 下载远程 kubeconfig
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 关闭 SSH 连接
  }
}
```

#### 7.3.2 K8s 服务（k8s.service.js）

```javascript
/**
 * Kubernetes 配置管理服务
 * 负责本地 kubeconfig 的合并、切换等操作
 */
class K8sService {
  constructor() {
    this.configPath = path.join(os.homedir(), '.kube', 'config');
  }

  /**
   * 合并配置文件
   * @param {string} newConfigPath - 新配置文件路径
   * @param {string} identifier - 环境标识
   * @returns {Promise<void>}
   */
  async mergeConfig(newConfigPath, identifier) {
    // 1. 读取新配置
    // 2. 读取现有配置
    // 3. 修改 context/cluster/user 名称（添加前缀）
    // 4. 合并
    // 5. 写入
    // 6. 备份原配置
  }

  /**
   * 切换 context
   * @param {string} contextName - Context 名称
   * @returns {Promise<void>}
   */
  async switchContext(contextName) {
    // 执行 kubectl config use-context
  }

  /**
   * 获取当前 context
   * @returns {Promise<string>}
   */
  async getCurrentContext() {
    // 执行 kubectl config current-context
  }

  /**
   * 列出所有 contexts
   * @returns {Promise<Array<{name: string, cluster: string, user: string}>>}
   */
  async listContexts() {
    // 解析 kubeconfig，返回所有 contexts
  }

  /**
   * 删除 context
   * @param {string} contextName - Context 名称
   * @returns {Promise<void>}
   */
  async deleteContext(contextName) {
    // 从 kubeconfig 中删除指定 context
  }
}
```

#### 7.3.3 配置服务（config.service.js）

```javascript
/**
 * 应用配置管理服务
 * 负责环境配置、应用设置的存储和读取
 */
class ConfigService {
  constructor() {
    this.configDir = path.join(os.homedir(), '.k8s-manager');
    this.configFile = path.join(this.configDir, 'config.json');
    this.config = null;
  }

  /**
   * 加载配置
   * @returns {Promise<Object>}
   */
  async load() {
    // 从 JSON 文件加载配置
  }

  /**
   * 保存配置
   * @returns {Promise<void>}
   */
  async save() {
    // 保存配置到 JSON 文件
  }

  /**
   * 获取所有环境
   * @returns {Array<Environment>}
   */
  getEnvironments() {
    return this.config.environments || [];
  }

  /**
   * 添加环境
   * @param {Environment} environment
   * @returns {Promise<void>}
   */
  async addEnvironment(environment) {
    // 验证
    // 加密密码
    // 添加到配置
    // 保存
  }

  /**
   * 更新环境
   * @param {string} id - 环境 ID
   * @param {Environment} environment
   * @returns {Promise<void>}
   */
  async updateEnvironment(id, environment) {
    // 查找并更新
    // 保存
  }

  /**
   * 删除环境
   * @param {string} id - 环境 ID
   * @returns {Promise<void>}
   */
  async deleteEnvironment(id) {
    // 从配置中删除
    // 保存
  }

  /**
   * 获取系统设置
   * @returns {Object}
   */
  getSettings() {
    return this.config.settings || {};
  }

  /**
   * 更新系统设置
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async updateSettings(settings) {
    // 更新设置
    // 保存
  }
}
```

#### 7.3.4 日志服务（logger.service.js）

```javascript
/**
 * 日志服务
 * 负责记录和管理应用操作日志
 */
class LoggerService {
  constructor() {
    this.logDir = path.join(os.homedir(), '.k8s-manager', 'logs');
    this.logFile = path.join(this.logDir, 'app.log');
  }

  /**
   * 记录信息日志
   * @param {string} message
   * @param {Object} meta - 附加信息
   */
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  /**
   * 记录警告日志
   * @param {string} message
   * @param {Object} meta
   */
  warn(message, meta = {}) {
    this.log('WARNING', message, meta);
  }

  /**
   * 记录错误日志
   * @param {string} message
   * @param {Object} meta
   */
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  /**
   * 记录日志
   * @private
   */
  log(level, message, meta) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
    // 写入文件
    // 同时发送到渲染进程（用于操作日志界面显示）
  }

  /**
   * 获取日志
   * @param {Object} filter - 筛选条件
   * @returns {Promise<Array<Object>>}
   */
  async getLogs(filter = {}) {
    // 读取日志文件
    // 根据 filter 筛选
    // 返回日志数组
  }

  /**
   * 清空日志
   * @returns {Promise<void>}
   */
  async clearLogs() {
    // 删除日志文件
  }

  /**
   * 清理过期日志
   * @param {number} days - 保留天数
   * @returns {Promise<void>}
   */
  async cleanupLogs(days) {
    // 删除 N 天前的日志
  }
}
```

### 7.4 数据模型

#### 7.4.1 Environment（环境配置）

```typescript
interface Environment {
  id: string;                    // UUID
  name: string;                  // 环境名称
  identifier: string;            // 环境标识（如 prod-127）
  sshConfig: {
    host: string;                // SSH 主机地址
    port: number;                // SSH 端口
    username: string;            // SSH 用户名
    authType: 'password' | 'key'; // 认证方式
    password?: string;           // 密码（加密存储）
    privateKeyPath?: string;     // 私钥路径
  };
  kubeconfigPath: string;        // 远程 kubeconfig 路径
  description?: string;          // 描述
  status: 'active' | 'inactive' | 'error'; // 状态
  lastSync?: string;             // 最后同步时间（ISO 8601）
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
}
```

#### 7.4.2 Settings（系统设置）

```typescript
interface Settings {
  general: {
    language: 'zh-CN' | 'en-US';
    theme: 'light' | 'dark' | 'system';
    autoLaunch: boolean;
    minimizeToTray: boolean;
  };
  k8s: {
    localConfigPath: string;
    enableBackup: boolean;
    backupRetention: number;
  };
  ssh: {
    timeout: number;              // 秒
    retryCount: number;
    defaultPort: number;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;         // 小时
    syncStrategy: 'overwrite' | 'merge';
  };
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
    retentionDays: number;
  };
}
```

#### 7.4.3 LogEntry（日志条目）

```typescript
interface LogEntry {
  id: string;
  timestamp: string;              // ISO 8601
  level: 'INFO' | 'WARNING' | 'ERROR';
  operation: string;              // 操作类型
  environment?: string;           // 环境名称
  status: 'success' | 'failure';
  message: string;                // 详细信息
  error?: string;                 // 错误堆栈（如果有）
}
```

### 7.5 IPC 通信接口

#### 主进程 → 渲染进程（事件）

```javascript
// 同步进度更新
mainWindow.webContents.send('sync-progress', {
  step: 2,
  progress: 45,
  message: '正在下载配置文件...'
});

// 连接状态变更
mainWindow.webContents.send('connection-status-changed', {
  environmentId: 'xxx',
  status: 'connected'
});

// 新日志产生
mainWindow.webContents.send('new-log', logEntry);
```

#### 渲染进程 → 主进程（调用）

```javascript
// 环境管理
ipcRenderer.invoke('get-environments');
ipcRenderer.invoke('add-environment', environment);
ipcRenderer.invoke('update-environment', id, environment);
ipcRenderer.invoke('delete-environment', id);
ipcRenderer.invoke('test-connection', environment);

// K8s 操作
ipcRenderer.invoke('sync-environment', environment);
ipcRenderer.invoke('switch-context', contextName);
ipcRenderer.invoke('get-current-context');
ipcRenderer.invoke('list-contexts');
ipcRenderer.invoke('delete-context', contextName);
ipcRenderer.invoke('get-kubeconfig');

// 系统设置
ipcRenderer.invoke('get-settings');
ipcRenderer.invoke('update-settings', settings);

// 日志
ipcRenderer.invoke('get-logs', filter);
ipcRenderer.invoke('clear-logs');
ipcRenderer.invoke('export-logs', format);
```

---

## 8. 开发计划

### 8.1 开发阶段

#### 阶段一：项目搭建（1 周）

**时间**：第 1 周

**任务**：
- [ ] 初始化 Electron + Vue 3 项目
- [ ] 配置开发环境（ESLint、Prettier、Vite）
- [ ] 配置 electron-builder
- [ ] 准备应用图标
- [ ] 搭建基本的界面框架（布局、导航）
- [ ] 配置 Pinia 状态管理
- [ ] 配置路由
- [ ] 完成本地构建测试

**交付物**：
- 可运行的空白应用
- 基础界面布局
- 开发环境配置文档

#### 阶段二：核心功能开发（3 周）

**第 2 周：环境配置管理**

**任务**：
- [ ] 实现 ConfigService（配置文件读写）
- [ ] 实现环境列表展示
- [ ] 实现添加环境功能（表单 + 验证）
- [ ] 实现编辑环境功能
- [ ] 实现删除环境功能
- [ ] 实现环境搜索和排序
- [ ] 密码加密存储

**测试**：
- 添加、编辑、删除环境
- 配置文件正确保存和读取
- 表单验证正常工作

**第 3 周：SSH 和 K8s 集成**

**任务**：
- [ ] 实现 SSHService（SSH 连接、文件下载）
- [ ] 实现连接测试功能
- [ ] 实现 K8sService（配置合并、context 切换）
- [ ] 实现单个环境同步功能
- [ ] 实现批量同步功能
- [ ] 实现同步进度显示
- [ ] 实现环境切换功能

**测试**：
- SSH 连接各种认证方式（密码、密钥）
- kubeconfig 下载和合并
- context 切换
- 错误处理

**第 4 周：辅助功能开发**

**任务**：
- [ ] 实现配置查看页面
- [ ] 实现 LoggerService（日志记录）
- [ ] 实现操作日志页面
- [ ] 实现系统设置页面
- [ ] 实现系统托盘（可选）
- [ ] 实现应用菜单
- [ ] 实现快捷键
- [ ] 实现通知

**测试**：
- 日志正确记录和展示
- 设置保存和应用
- 快捷键工作正常

#### 阶段三：界面优化和测试（1 周）

**时间**：第 5 周

**任务**：
- [ ] 界面美化和细节调整
- [ ] 暗色主题支持
- [ ] 响应式布局优化
- [ ] 加载动画和过渡效果
- [ ] 错误提示优化
- [ ] 功能测试（全流程）
- [ ] 性能优化
- [ ] Bug 修复

**测试**：
- 完整功能流程测试
- 各种异常情况测试
- 多环境压力测试
- 界面响应速度测试

#### 阶段四：打包和发布（1 周）

**时间**：第 6 周

**任务**：
- [ ] 配置 electron-builder
- [ ] 配置 GitHub Actions
- [ ] 构建 macOS 安装包（.dmg）
- [ ] 构建 Windows 安装包（.exe）
- [ ] 构建 Linux 安装包（.AppImage, .deb）
- [ ] 编写 README 文档
- [ ] 编写用户手册
- [ ] 编写 CHANGELOG
- [ ] 准备开源许可证
- [ ] 发布到 GitHub Releases

**交付物**：
- macOS 安装包
- Windows 安装包
- Linux 安装包
- 完整文档
- GitHub Release

### 8.2 里程碑

| 里程碑 | 时间 | 目标 |
|--------|------|------|
| M0 | 第 1 周 | 项目搭建完成，可运行空白应用 |
| M1 | 第 2 周 | 环境配置管理功能完成 |
| M2 | 第 3 周 | SSH 和 K8s 核心功能完成 |
| M3 | 第 4 周 | 所有功能开发完成 |
| M4 | 第 5 周 | 测试通过，界面优化完成 |
| M5 | 第 6 周 | 打包发布，v1.0.0 正式版 |

### 8.3 人员配置

**单人开发**（预计）：

- **全栈开发工程师** × 1
  - 负责所有开发任务
  - 预计工作量：6 周（全职）或 12 周（兼职）

**如果团队开发**：

- **前端开发** × 1：负责界面开发
- **后端开发** × 1：负责主进程逻辑和服务
- 预计工作量：3-4 周

---

## 9. 部署方案

### 9.1 打包配置

#### 9.1.1 electron-builder 配置

文件：`electron-builder.json`

```json
{
  "appId": "com.yourname.k8s-manager",
  "productName": "K8s Manager",
  "copyright": "Copyright © 2026 Your Name",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "dist-electron/**/*",
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      },
      {
        "target": "zip",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "build/icon.icns",
    "category": "public.app-category.developer-tools",
    "darkModeSupport": true
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ],
    "window": {
      "width": 540,
      "height": 380
    }
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "perMachine": false,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "linux": {
    "target": [
      "AppImage",
      "deb",
      "rpm"
    ],
    "icon": "build/icons",
    "category": "Development"
  },
  "publish": {
    "provider": "github",
    "owner": "yourname",
    "repo": "k8s-manager"
  }
}
```

#### 9.1.2 构建脚本

`package.json` 脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build:renderer": "vite build",
    "build:main": "tsc -p src/main",
    "build": "npm run build:renderer && npm run build:main && electron-builder",
    "build:mac": "npm run build:renderer && npm run build:main && electron-builder --mac",
    "build:win": "npm run build:renderer && npm run build:main && electron-builder --win",
    "build:linux": "npm run build:renderer && npm run build:main && electron-builder --linux",
    "build:all": "npm run build:renderer && npm run build:main && electron-builder --mac --win --linux"
  }
}
```

### 9.2 GitHub Actions 自动化构建

文件：`.github/workflows/build.yml`

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build macOS
        if: runner.os == 'macOS'
        run: npm run build:mac
      
      - name: Build Windows
        if: runner.os == 'Windows'
        run: npm run build:win
      
      - name: Build Linux
        if: runner.os == 'Linux'
        run: npm run build:linux
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}
          path: |
            dist/*.dmg
            dist/*.exe
            dist/*.AppImage
            dist/*.deb
            dist/*.rpm
  
  release:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            **/*.dmg
            **/*.exe
            **/*.AppImage
            **/*.deb
            **/*.rpm
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 9.3 发布流程

#### 9.3.1 本地构建（测试）

```bash
# 1. 安装依赖
npm install

# 2. 构建当前平台
npm run build

# 3. 测试安装包
# macOS: 双击 dist/*.dmg
# Windows: 运行 dist/*.exe
# Linux: 运行 dist/*.AppImage
```

#### 9.3.2 正式发布（自动化）

```bash
# 1. 更新版本号
npm version 1.0.0

# 2. 更新 CHANGELOG.md
# 添加新版本的更新内容

# 3. 提交代码
git add .
git commit -m "Release v1.0.0"

# 4. 创建标签
git tag v1.0.0

# 5. 推送到 GitHub（触发自动构建）
git push origin main
git push origin v1.0.0

# 6. GitHub Actions 会自动：
#    - 在 macOS、Windows、Linux 上构建
#    - 创建 GitHub Release
#    - 上传所有安装包
```

### 9.4 用户安装方式

#### 9.4.1 macOS 用户

**方式一：DMG 安装（推荐）**
```
1. 访问 GitHub Releases 页面
2. 下载 K8s-Manager-1.0.0.dmg
3. 双击打开 DMG
4. 拖拽 K8s Manager.app 到 Applications
5. 双击应用图标启动
```

**首次运行提示**：
```
由于应用未签名，首次打开会提示：
"无法打开 K8s Manager.app，因为无法验证开发者"

解决方法：
1. 右键点击应用 → 打开
2. 点击"打开"确认

或者在终端执行：
xattr -d com.apple.quarantine /Applications/K8s\ Manager.app
```

#### 9.4.2 Windows 用户

**方式一：安装程序（推荐）**
```
1. 下载 K8s-Manager-Setup-1.0.0.exe
2. 双击运行安装向导
3. 选择安装位置
4. 完成安装
5. 从开始菜单启动
```

**方式二：便携版**
```
1. 下载 K8s-Manager-1.0.0.exe
2. 双击运行（无需安装）
```

**首次运行提示**：
```
SmartScreen 可能会提示：
"Windows 已保护你的电脑"

解决方法：
点击"更多信息" → "仍要运行"
```

#### 9.4.3 Linux 用户

**方式一：AppImage（推荐）**
```bash
chmod +x K8s-Manager-1.0.0.AppImage
./K8s-Manager-1.0.0.AppImage
```

**方式二：Debian/Ubuntu**
```bash
sudo dpkg -i k8s-manager_1.0.0_amd64.deb
k8s-manager
```

**方式三：RHEL/CentOS**
```bash
sudo rpm -i k8s-manager-1.0.0.x86_64.rpm
k8s-manager
```

### 9.5 更新机制（可选）

如果要实现自动更新功能：

```javascript
// src/main/index.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  // 启动后检查更新
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  // 通知用户有新版本
});

autoUpdater.on('update-downloaded', () => {
  // 通知用户可以更新了
});
```

---

## 10. 未来规划

### 10.1 v1.1 计划（短期）

**时间**：v1.0 发布后 2-3 个月

**新增功能**：
- [ ] 支持多用户配置隔离
- [ ] 环境分组功能
- [ ] 配置模板（预设常用配置）
- [ ] 导入/导出环境配置
- [ ] 更详细的连接诊断
- [ ] kubectl 命令快捷执行面板

**优化改进**：
- [ ] 同步性能优化（并发）
- [ ] 界面响应速度优化
- [ ] 错误提示更友好
- [ ] 添加更多快捷键

### 10.2 v1.2 计划（中期）

**时间**：v1.1 发布后 3-6 个月

**新增功能**：
- [ ] 集群资源可视化查看
  - Pods 列表和状态
  - Deployments 管理
  - Services 查看
- [ ] Pod 日志实时查看
- [ ] 简单的资源编辑（YAML）
- [ ] Namespace 切换
- [ ] 资源搜索

### 10.3 v2.0 计划（长期）

**时间**：v1.2 发布后 6-12 个月

**重大功能**：
- [ ] 多集群统一管理面板
- [ ] 资源监控和告警
- [ ] CI/CD 流水线集成
- [ ] GitOps 支持
- [ ] Helm Charts 管理
- [ ] 自定义插件系统
- [ ] 团队协作功能

---

## 附录

### 附录 A：技术选型对比

| 方案 | 优势 | 劣势 | 最终选择 |
|------|------|------|----------|
| Electron | 开发效率高、生态成熟 | 体积大 | ✅ 选择 |
| Tauri | 体积小、性能好 | 生态较新 | ❌ |
| Wails | Go 后端、体积小 | 生态较新 | ❌ |

### 附录 B：依赖清单

**核心依赖**：
```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "element-plus": "^2.5.0",
    "pinia": "^2.1.0",
    "ssh2": "^1.15.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0"
  }
}
```

### 附录 C：开源许可证

**推荐使用 MIT License**：

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 附录 D：参考资料

**Electron 相关**：
- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [Electron Vite 模板](https://github.com/electron-vite/electron-vite-vue)

**Vue 相关**：
- [Vue 3 官方文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

**SSH 和 K8s**：
- [ssh2 文档](https://github.com/mscdex/ssh2)
- [js-yaml 文档](https://github.com/nodeca/js-yaml)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)

---

## 变更记录

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-01-28 | Claude | 初始版本，完整需求文档 |

---

**文档结束**
