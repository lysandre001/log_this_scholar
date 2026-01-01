/**
 * Chrome 插件配置
 * 
 * 使用说明：
 * 1. 复制 config.local.example.js 为 config.local.js
 * 2. 在 config.local.js 中填写实际的配置信息
 * 3. config.local.js 已在 .gitignore 中，不会被提交到 git
 * 
 * 注意：config.local.js 必须在 config.js 之前通过 <script> 标签加载
 */

const CONFIG = {
  // Supabase 配置
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here',
  
  // API 配置（不包含 /api/v1，由 api.js 添加）
  API_URL: 'http://localhost:8000',
  
  // 官网配置
  WEB_URL: 'http://localhost:3000',
};

// 合并本地配置（如果存在）
// config.local.js 必须在 config.js 之前加载
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}
