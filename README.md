# Scholar Cat Extension

A Chrome browser extension for extracting scholar information from Google Scholar and saving to the cloud.

## ✨ Core Features

### 1. Information Extraction
- ✅ **One-Click Extraction**: Extract standardized scholar information from Google Scholar researcher pages
- ✅ **Extracted Fields**: Name, affiliation, citations, canonical URL, homepage, research topics
- ✅ **Custom Tags**: Support for adding custom tags (comma-separated input, automatically converted to pipe-separated output)
- ✅ **Memo Function**: Support for adding memo information with automatic CSV escaping (supports commas, quotes, and other special characters)

### 2. Cloud Synchronization
- ✅ **Save to Cloud**: Save extracted scholar information to personal account
- ✅ **Duplicate Detection**: Automatically detect if scholar already exists, support updating existing records
- ✅ **Data Sync**: Complete data synchronization with the web platform

### 3. User Authentication
- ✅ **Unified Authentication**: Uses the same Supabase authentication system as the website
- ✅ **Auto Sync**: Extension automatically syncs login status after logging in on the website
- ✅ **Status Sync**: Login on either extension or website automatically syncs to the other
- ✅ **No Login Required for Basic Use**: Extract and copy functions work without login, only cloud saving requires authentication

### 4. Interaction Methods
- ✅ **Context Menu**: Right-click on Google Scholar pages and select "Copy Scholar Info"
- ✅ **Popup Interface**: Click extension icon for visual interface
- ✅ **Status Feedback**: Elegant error handling and status notifications

## 🚀 Installation

1. Open Chrome browser and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `extension/` directory
5. Extension installed successfully!

## 📖 Usage

### Method 1: Context Menu (Quick)

1. Open any Google Scholar researcher page (URL format: `https://scholar.google.com/citations?user=...`)
2. Right-click anywhere on the page
3. Select "Copy Scholar Info"
4. Information is copied to clipboard

### Method 2: Extension Popup (Recommended)

1. Open any Google Scholar researcher page
2. Click the extension icon in the browser toolbar
3. Click the circular "log this" button to extract information
4. View and edit extracted information in the popup window:
   - View all automatically extracted fields
   - **Add Tags**: Enter tags in the "Tags" input field, separated by commas (e.g., `tag1, tag2, tag3`)
   - **Add Memo**: Enter memo in the "Memo" text area, supports multi-line and special characters
5. View complete CSV format output in the "Full Output" area
6. Click "Copy" button to copy complete information to clipboard
7. (Optional) Click "Save it" button to save to cloud account

### Login and Cloud Saving

**First time using cloud features:**
1. Click "Save it" button and you'll be prompted to log in
2. Click "log in" link to open login window
3. Enter email and password to log in
4. After login, you can save data to the cloud

**Or login through website:**
1. After logging in on the website
2. Extension automatically syncs login status
3. No need to log in again in the extension

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
