/**
 * API 调用封装
 * 
 * 提供学者记录相关的 API 调用函数
 */

// 从 config.js 获取 API 地址
const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'http://localhost:8000';

/**
 * 获取认证 Token
 */
async function getAuthToken() {
  if (typeof getSession === 'undefined') {
    throw new Error('Supabase 库未加载');
  }
  
  const { session, error } = await getSession();
  
  if (error || !session) {
    throw new Error('未登录，请先登录');
  }
  
  return session.access_token;
}

/**
 * 发送 API 请求
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail?.message || error.detail || '请求失败');
  }
  
  return await response.json();
}

/**
 * 检查学者是否已存在
 */
async function checkScholarExists(canonical) {
  return await apiRequest(`/api/v1/scholars/check?canonical=${encodeURIComponent(canonical)}`);
}

/**
 * 创建学者记录
 */
async function createScholar(scholarData) {
  return await apiRequest('/api/v1/scholars', {
    method: 'POST',
    body: JSON.stringify(scholarData)
  });
}

/**
 * 获取学者列表
 */
async function getScholars(page = 1, pageSize = 20, search = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return await apiRequest(`/api/v1/scholars?${params.toString()}`);
}

/**
 * 获取学者详情
 */
async function getScholar(scholarId) {
  return await apiRequest(`/api/v1/scholars/${scholarId}`);
}

/**
 * 更新学者记录
 */
async function updateScholar(scholarId, scholarData) {
  return await apiRequest(`/api/v1/scholars/${scholarId}`, {
    method: 'PUT',
    body: JSON.stringify(scholarData)
  });
}

/**
 * 删除学者记录
 */
async function deleteScholar(scholarId) {
  return await apiRequest(`/api/v1/scholars/${scholarId}`, {
    method: 'DELETE'
  });
}
