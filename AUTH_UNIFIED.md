# 插件认证统一说明

## 概述

插件的登录认证已统一到官网，使用相同的 Supabase 认证服务和 UI 设计。

## 变更内容

### 1. 配置变更

**extension/config.js** 和 **extension/config.local.example.js**:
- 新增 `WEB_URL` 配置项，用于指定官网地址
- 开发环境默认：`http://localhost:3000`
- 生产环境需修改为实际域名

### 2. 插件端变更

#### popup.html
- 新增登录提示区域 `#authPrompt`
- 修改认证状态显示为 `#authStatus`

#### popup.css
- 新增 `.auth-prompt` 和 `.auth-btn` 样式
- 更新 `.auth-status` 样式，显示在右下角

#### popup.js
- 修改 `checkAuthStatus()` 返回布尔值
- 未登录时显示登录提示，引导用户到官网授权页面
- 登录按钮打开 `/extension-auth` 页面而非独立登录页

#### manifest.json
- 新增 `notifications` 权限（用于登录成功通知）
- 新增对 `localhost:3000` 的 host_permissions
- 新增 content script `auth-listener.js`，监听授权页面的消息

#### auth-listener.js (新增)
- 在授权页面监听 `postMessage` 事件
- 接收 session 数据并保存到 `chrome.storage.local`
- 通知 background script 授权成功

#### background.js
- 新增 `authSuccess` 消息处理
- 授权成功时显示通知

### 3. 网页端变更

#### web/app/extension-auth/page.tsx (新增)
专门的插件授权页面，提供两种授权方式：
1. **自动授权（推荐）**：通过 `postMessage` 自动发送认证信息给插件
2. **手动复制 Token**：显示 access_token，用户手动复制

页面功能：
- 检查用户登录状态
- 未登录时引导到登录页面
- 已登录时显示用户邮箱
- 提供授权按钮和 token 复制功能
- 显示使用说明

## 使用流程

### 用户角度

1. 用户安装插件后，首次点击插件图标
2. 看到登录提示："Please login to use Scholar Cat"
3. 点击 "Go to Login" 按钮
4. 浏览器打开官网的 `/extension-auth` 页面
5. 如果未登录，会被引导到登录页面
6. 登录成功后，回到 `/extension-auth` 页面
7. 点击 "Authorize Extension" 按钮
8. 看到成功提示和系统通知
9. 关闭授权页面，返回插件使用

### 技术流程

1. 插件检查 `chrome.storage.local` 中的 session
2. 如果没有 session，显示登录提示
3. 用户点击登录按钮，打开官网授权页面
4. 授权页面调用 `supabase.auth.getSession()` 获取当前 session
5. 通过 `window.postMessage()` 发送 session 给 content script
6. content script (`auth-listener.js`) 接收消息
7. 保存 session 到 `chrome.storage.local`
8. 通知 background script 授权成功
9. background script 显示系统通知
10. 用户刷新或重新打开插件 popup，看到已登录状态

## 安全考虑

1. **消息验证**：auth-listener.js 检查消息类型为 `SCHOLAR_CAT_AUTH`
2. **同源策略**：content script 只在指定的授权页面注入
3. **Token 存储**：使用 `chrome.storage.local`，与浏览器其他数据隔离
4. **Token 刷新**：lib/supabase.js 中的 `refreshSession()` 函数自动处理过期 token

## 配置说明

### 开发环境

**extension/config.local.js**:
```javascript
const CONFIG_LOCAL = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...',
  API_URL: 'http://localhost:8000/api/v1',
  WEB_URL: 'http://localhost:3000',
};
```

### 生产环境

修改 `WEB_URL` 和 `API_URL` 为实际域名，并在 manifest.json 中添加对应的 host_permissions。

## 已删除的文件

以下文件不再需要，可以考虑删除或移至 archive：
- ~~extension/auth.html~~ - 独立的登录页面
- ~~extension/auth.js~~ - 独立的登录逻辑

但为了向后兼容，暂时保留这些文件。

## 测试清单

- [ ] 用户首次使用插件，看到登录提示
- [ ] 点击 "Go to Login"，正确打开授权页面
- [ ] 授权页面正确检测登录状态
- [ ] 未登录时引导到登录页面
- [ ] 登录成功后，授权页面显示用户信息
- [ ] 点击 "Authorize Extension" 成功授权
- [ ] 插件 popup 刷新后显示已登录状态
- [ ] 插件可以成功调用 API（保存学者信息等）
- [ ] Token 过期后自动刷新
- [ ] 退出登录后，插件显示未登录状态

## 故障排查

### 插件无法获取授权

1. 检查 manifest.json 中的 content_scripts 配置
2. 检查 console 中是否有 auth-listener.js 的日志
3. 确认 WEB_URL 配置正确
4. 检查 chrome.storage.local 中是否有 supabase_session

### API 调用失败

1. 检查 chrome.storage.local 中的 token 是否有效
2. 检查 API_URL 配置是否正确
3. 检查 backend 是否正常运行
4. 检查 Supabase 配置是否一致（URL 和 ANON_KEY）

## 未来改进

1. 支持自动静默刷新 token
2. 添加"退出登录"按钮在插件 popup 中
3. 优化授权流程的 UX
4. 添加更详细的错误提示
5. 支持生产环境域名的动态配置




