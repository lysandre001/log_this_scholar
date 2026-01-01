/**
 * Supabase Auth for Chrome Extension
 * 
 * 注意：由于 Chrome 插件环境的限制，我们使用 Supabase REST API 而非完整的 JS SDK
 */

// Supabase 配置（从 config.js 读取）
const SUPABASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_ANON_KEY : 'YOUR_SUPABASE_ANON_KEY';

/**
 * 登录
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{session, user, error}>}
 */
async function signIn(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { session: null, user: null, error: data.error || data.msg };
    }

    // 保存 session 到 Chrome Storage
    await chrome.storage.local.set({
      supabase_session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: data.expires_at,
      },
    });

    return { session: data, user: data.user, error: null };
  } catch (error) {
    return { session: null, user: null, error: error.message };
  }
}

/**
 * 注册
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user, error}>}
 */
async function signUp(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { user: null, error: data.error || data.msg };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

/**
 * 登出
 * @returns {Promise<{error}>}
 */
async function signOut() {
  try {
    // 清除本地 session
    await chrome.storage.local.remove('supabase_session');
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 获取当前 session
 * @returns {Promise<{session, user, error}>}
 */
async function getSession() {
  try {
    const result = await chrome.storage.local.get('supabase_session');
    const session = result.supabase_session;

    if (!session) {
      return { session: null, user: null, error: 'No session found' };
    }

    // 检查 token 是否过期
    const expiresAt = new Date(session.expires_at * 1000);
    if (expiresAt < new Date()) {
      // Token 过期，尝试刷新
      return await refreshSession(session.refresh_token);
    }

    return { session, user: session.user, error: null };
  } catch (error) {
    return { session: null, user: null, error: error.message };
  }
}

/**
 * 刷新 session
 * @param {string} refreshToken 
 * @returns {Promise<{session, user, error}>}
 */
async function refreshSession(refreshToken) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 刷新失败，清除 session
      await signOut();
      return { session: null, user: null, error: data.error || 'Refresh failed' };
    }

    // 保存新的 session
    await chrome.storage.local.set({
      supabase_session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: data.expires_at,
      },
    });

    return { session: data, user: data.user, error: null };
  } catch (error) {
    await signOut();
    return { session: null, user: null, error: error.message };
  }
}

/**
 * 获取 access token（用于 API 调用）
 * @returns {Promise<string|null>}
 */
async function getAccessToken() {
  const { session, error } = await getSession();
  if (error || !session) {
    return null;
  }
  return session.access_token;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    signIn,
    signUp,
    signOut,
    getSession,
    refreshSession,
    getAccessToken,
  };
}
