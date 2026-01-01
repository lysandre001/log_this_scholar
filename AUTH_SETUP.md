# Chrome 插件认证配置指南

## 步骤 1：配置 Supabase 凭证

1. 复制配置文件模板：
```bash
cp config.local.example.js config.local.js
```

2. 编辑 `config.local.js`，填写你的 Supabase 配置：
```javascript
const CONFIG_LOCAL = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',  // 从 Supabase Dashboard 获取
  SUPABASE_ANON_KEY: 'eyJhbGci...',          // 从 Supabase Dashboard 获取
  API_URL: 'http://localhost:8000/api/v1',    // 后端 API 地址
};
```

> 注意：`config.local.js` 已在 `.gitignore` 中，不会被提交到 git

## 步骤 2：加载插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `code/` 目录

## 步骤 3：测试认证功能

### 3.1 注册/登录

1. 点击 Chrome 工具栏中的插件图标
2. 点击"登录"链接
3. 在弹出的页面中选择"注册"或"登录"
4. 输入邮箱和密码

### 3.2 验证登录状态

登录成功后：
- 主界面会显示你的邮箱（用户名部分）
- 颜色会变成绿色

### 3.3 使用认证后的功能

未来版本中，插件会使用登录凭证来：
- 保存学者记录到云端
- 从云端读取已保存的学者
- 同步标签和笔记

## 文件说明

- `auth.html`：登录/注册页面
- `auth.js`：登录/注册逻辑
- `lib/supabase.js`：Supabase 认证库（简化版）
- `config.js`：默认配置（会被 config.local.js 覆盖）
- `config.local.js`：本地配置（需要手动创建，不会提交到 git）

## 常见问题

### Q1: 登录失败，提示"fetch failed"

**原因**：Supabase URL 或 ANON_KEY 配置错误

**解决**：
1. 检查 `config.local.js` 中的配置
2. 确保从 Supabase Dashboard 复制了正确的值
3. 重新加载插件（在 `chrome://extensions/` 点击刷新图标）

### Q2: 登录成功但无法调用后端 API

**原因**：后端未启动或 CORS 配置错误

**解决**：
1. 确保后端已启动：`cd backend && uvicorn app.main:app --reload`
2. 检查后端 `.env` 中的 `CORS_ORIGINS` 包含 `chrome-extension://*`
3. 检查 manifest.json 中的 `host_permissions` 包含后端地址

### Q3: 如何退出登录？

1. 点击插件图标
2. 点击用户名（绿色）
3. 在弹出页面点击"退出登录"

## 开发提示

### 调试认证流程

1. 打开 Chrome DevTools（在插件弹窗上右键 > 检查）
2. 查看 Console 中的日志
3. 在 Application > Storage > Local Storage 查看存储的 session

### 手动清除认证状态

如果遇到问题，可以手动清除认证状态：

1. 在插件弹窗上右键 > 检查
2. 在 Console 中执行：
```javascript
chrome.storage.local.remove('supabase_session')
```

## 下一步

配置完成后，可以开始开发以下功能：

- [ ] 保存学者记录到云端（需要认证）
- [ ] 从云端读取学者列表
- [ ] 同步标签和笔记
- [ ] 处理 Token 过期和自动刷新

参考文档：
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
