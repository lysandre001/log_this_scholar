/**
 * Auth Listener Content Script
 * 这个脚本在官网上运行，用于同步登录状态到插件
 */

// 获取 Supabase storage key
function getSupabaseStorageKey() {
  // 从页面中查找 Supabase URL 或使用默认值
  // Supabase 的 localStorage key 格式是 sb-{project-ref}-auth-token
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const match = script.textContent?.match(/supabase\.co/) || 
                  script.src?.match(/supabase\.co/);
    if (match) break;
  }
  
  // 尝试查找 localStorage 中的 Supabase key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      return key;
    }
  }
  
  return null;
}

// 同步 session 到插件
async function syncSessionToExtension() {
  const storageKey = getSupabaseStorageKey();
  if (!storageKey) {
    console.log('[Scholar Cat] No Supabase session key found');
    return;
  }
  
  const sessionData = localStorage.getItem(storageKey);
  if (!sessionData) {
    console.log('[Scholar Cat] No session data found');
    return;
  }
  
  try {
    const session = JSON.parse(sessionData);
    
    if (session && session.access_token && session.user) {
      // 保存到 chrome.storage.local
      await chrome.storage.local.set({
        supabase_session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          expires_at: session.expires_at,
        },
      });
      
      console.log('[Scholar Cat] Session synced to extension:', session.user.email);
      
      // 通知 background script
      chrome.runtime.sendMessage({
        action: 'authSuccess',
        session: session
      }).catch(() => {
        // 忽略错误（background 可能未准备好）
      });
    }
  } catch (error) {
    console.error('[Scholar Cat] Failed to sync session:', error);
  }
}

// 检测 session 变化并同步
function watchSessionChanges() {
  const storageKey = getSupabaseStorageKey();
  if (!storageKey) return;
  
  // 监听 storage 变化
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
      if (event.newValue) {
        // 新的 session
        syncSessionToExtension();
      } else {
        // Session 被清除（登出）
        chrome.storage.local.remove('supabase_session').catch(() => {});
        console.log('[Scholar Cat] Session cleared (user logged out)');
      }
    }
  });
  
  // 也监听自定义事件（用于同页面的 session 更新）
  window.addEventListener('supabase.auth.signin', () => {
    setTimeout(syncSessionToExtension, 500);
  });
}

// 监听来自网页的 postMessage（保持向后兼容）
window.addEventListener('message', async (event) => {
  // 检查消息来源和类型
  if (event.data.type === 'SCHOLAR_CAT_AUTH' && event.data.session) {
    console.log('[Scholar Cat] Received auth message from web app');
    
    const session = event.data.session;
    
    try {
      // 保存到 chrome.storage.local
      await chrome.storage.local.set({
        supabase_session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          expires_at: session.expires_at,
        },
      });
      
      console.log('[Scholar Cat] Session saved successfully');
      
      // 通知 background script
      chrome.runtime.sendMessage({
        action: 'authSuccess',
        session: session
      }).catch(() => {});
      
    } catch (error) {
      console.error('[Scholar Cat] Failed to save session:', error);
    }
  }
});

// 初始化
console.log('[Scholar Cat] Auth listener initialized');

// 页面加载完成后同步 session
if (document.readyState === 'complete') {
  syncSessionToExtension();
  watchSessionChanges();
} else {
  window.addEventListener('load', () => {
    syncSessionToExtension();
    watchSessionChanges();
  });
}

// 定期检查 session（每 30 秒）
setInterval(syncSessionToExtension, 30000);
