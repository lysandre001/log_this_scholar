/**
 * 本地配置模板
 * 
 * 使用方法：
 * 1. 复制此文件为 config.local.js
 * 2. 填写实际的配置信息
 * 3. config.local.js 不会被提交到 git
 */

const CONFIG_LOCAL = {
  // Supabase 配置（从 Supabase Dashboard > Project Settings > API 获取）
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // API 配置
  API_URL: 'http://localhost:8000/api/v1',  // 开发环境
  // API_URL: 'https://your-domain.com/api/v1',  // 生产环境
  
  // 官网配置
  WEB_URL: 'http://localhost:3000',  // 开发环境
  // WEB_URL: 'https://your-domain.com',  // 生产环境
};
