# Scholar Cat Extension

Chrome 浏览器插件，用于从 Google Scholar 提取学者信息并保存到云端。

## ✨ 核心功能

### 1. 信息提取
- ✅ **一键提取**：从 Google Scholar 研究者页面提取标准化学者信息
- ✅ **提取字段**：姓名、机构、引用数、Canonical URL、主页、研究主题
- ✅ **自定义标签**：支持添加自定义标签（逗号分隔输入，自动转换为管道分隔输出）
- ✅ **备注功能**：支持添加备注信息，自动处理 CSV 转义（支持逗号、引号等特殊字符）

### 2. 云端同步
- ✅ **保存到云端**：将提取的学者信息保存到个人账户
- ✅ **重复检测**：自动检测学者是否已存在，支持更新已有记录
- ✅ **数据同步**：与官网（web）端数据完全同步

### 3. 用户认证
- ✅ **统一认证**：与官网使用相同的 Supabase 认证体系
- ✅ **自动同步**：在官网登录后，插件自动同步登录状态
- ✅ **状态同步**：插件和官网任意一端登录，另一端自动同步状态
- ✅ **无需登录使用**：提取和复制功能无需登录，只有保存到云端时才需要

### 4. 交互方式
- ✅ **右键菜单**：在 Google Scholar 页面右键选择 "Copy Scholar Info"
- ✅ **弹出窗口**：点击插件图标，使用可视化界面
- ✅ **状态反馈**：优雅的错误处理和状态通知

## 🚀 安装

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extension/` 目录
5. 插件安装完成！

## 📖 使用方法

### 方法 1：右键菜单（快速）

1. 打开任意 Google Scholar 研究者页面（URL 格式：`https://scholar.google.com/citations?user=...`）
2. 在页面上右键点击
3. 选择 "Copy Scholar Info"
4. 信息已复制到剪贴板

### 方法 2：插件弹出窗口（推荐）

1. 打开任意 Google Scholar 研究者页面
2. 点击浏览器工具栏中的插件图标
3. 点击圆形 "log this" 按钮提取信息
4. 在弹出窗口中查看和编辑提取的信息：
   - 查看所有自动提取的字段
   - **添加标签**：在 "Tags" 输入框中输入标签，用逗号分隔（如 `tag1, tag2, tag3`）
   - **添加备注**：在 "Memo" 文本框中输入备注，支持多行和特殊字符
5. 在 "Full Output" 区域查看完整的 CSV 格式输出
6. 点击 "Copy" 按钮复制完整信息到剪贴板
7. （可选）点击 "Save it" 按钮保存到云端账户

### 登录和云端保存

**首次使用云端功能：**
1. 点击 "Save it" 按钮时会提示登录
2. 点击 "log in" 链接打开登录窗口
3. 输入邮箱和密码登录
4. 登录后即可保存数据到云端

**或通过官网登录：**
1. 在官网（web）登录后
2. 插件会自动同步登录状态
3. 无需在插件中再次登录

## 📋 输出格式

复制的信息格式为逗号分隔的单行 CSV：

```
姓名,机构,引用数,Canonical URL,主页,研究主题,标签(管道分隔),备注
```

示例：
```
John Doe,Stanford University,1234,https://scholar.google.com/...,https://johndoe.com,Machine Learning|AI,tag1|tag2,"Memo with ""quotes"", commas"
```

## 🔧 配置

### 本地配置

1. 复制 `config.local.example.js` 为 `config.local.js`
2. 填写实际配置信息：

```javascript
const CONFIG_LOCAL = {
  // Supabase 配置（从 Supabase Dashboard > Project Settings > API 获取）
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...',
  
  // API 配置（不包含 /api/v1，由 api.js 添加）
  API_URL: 'http://localhost:8000',  // 开发环境
  
  // 官网配置
  WEB_URL: 'http://localhost:3000',  // 开发环境
};
```

**注意**：`config.local.js` 已在 `.gitignore` 中，不会被提交到 Git。

## 🏗️ 架构说明

### 组件结构

- **manifest.json** - 插件配置和权限声明
- **popup.html/js/css** - 插件主界面（弹出窗口）
- **content.js** - 内容脚本（注入到 Google Scholar 页面）
- **background.js** - 后台服务工作者（处理右键菜单等）
- **auth-listener.js** - 认证监听脚本（在官网页面运行）
- **lib/supabase.js** - Supabase 认证封装
- **lib/api.js** - 后端 API 调用封装

### 数据交互流程

```
┌─────────────────────────────────────────────────────────┐
│                    数据交互架构                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. 信息提取                                              │
│     Google Scholar 页面 → content.js → popup.js          │
│                                                           │
│  2. 认证同步                                              │
│     官网页面 → auth-listener.js → chrome.storage.local   │
│     插件打开 → popup.js → syncAuthFromWebsite()          │
│                                                           │
│  3. 云端保存                                              │
│     popup.js → lib/api.js → Backend API                  │
│     (Bearer Token 认证)                                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 认证机制

**登录状态同步：**

1. **官网 → 插件**：
   - 官网登录后，`auth-listener.js` 自动检测 localStorage 中的 session
   - 通过 `postMessage` 或直接读取 localStorage 同步到 `chrome.storage.local`
   - 插件打开时自动同步状态

2. **插件 → 官网**：
   - 插件内登录使用 Supabase REST API
   - Session 存储在 `chrome.storage.local`
   - 官网通过 `auth-listener.js` 定期检查并同步

3. **双向同步**：
   - 插件打开时尝试从官网 tab 同步
   - 官网页面监听 session 变化并通知插件
   - 任意一端登录，另一端自动同步

### API 调用

插件通过以下端点与后端交互：

- `GET /api/v1/scholars/check?canonical=...` - 检查学者是否存在
- `POST /api/v1/scholars` - 创建学者记录
- `PUT /api/v1/scholars/:id` - 更新学者记录
- `GET /api/v1/scholars` - 获取学者列表（未在插件中使用）
- `GET /api/v1/scholars/:id` - 获取学者详情（未在插件中使用）
- `DELETE /api/v1/scholars/:id` - 删除学者（未在插件中使用）

所有 API 调用都需要 Bearer Token 认证（从 Supabase session 获取）。

## 🐛 故障排除

### 问题：无法提取信息

- 确保在 Google Scholar 研究者页面（URL 包含 `/citations?user=`）
- 刷新页面后重试
- 检查浏览器控制台是否有错误信息

### 问题：保存失败，提示"未登录"

- 点击 "log in" 链接登录
- 或在官网登录后再回到插件
- 确保 Supabase 配置正确

### 问题：登录状态不同步

- 确保 `WEB_URL` 配置正确
- 刷新插件 popup
- 检查浏览器控制台的错误信息

## 📝 开发说明

### 开发环境

1. 确保后端服务运行在 `http://localhost:8000`
2. 确保前端服务运行在 `http://localhost:3000`
3. 配置 `config.local.js` 中的 URL
4. 在 Chrome 中加载插件（开发者模式）

### 调试

- 右键点击插件图标 → "检查弹出窗口" → 查看控制台
- 在 Google Scholar 页面按 F12 → 查看 content script 日志
- 在 `chrome://extensions/` → 插件详情 → "检查视图 service worker" → 查看 background script 日志

## 📄 许可证

本项目为私有项目。
