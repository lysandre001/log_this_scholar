/**
 * Auth Listener Content Script
 * 这个脚本在官网的授权页面上监听认证消息
 */

// 监听来自网页的 postMessage
window.addEventListener('message', async (event) => {
  // 检查消息来源和类型
  if (event.data.type === 'SCHOLAR_CAT_AUTH' && event.data.session) {
    console.log('[Scholar Cat] Received auth message from web app')
    
    const session = event.data.session
    
    try {
      // 保存到 chrome.storage.local
      await chrome.storage.local.set({
        supabase_session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          expires_at: session.expires_at,
        },
      })
      
      console.log('[Scholar Cat] Session saved successfully')
      
      // 通知 background script
      chrome.runtime.sendMessage({
        action: 'authSuccess',
        session: session
      })
      
      // 在页面上显示成功消息（可选）
      console.log('[Scholar Cat] ✓ Extension authorized!')
      
    } catch (error) {
      console.error('[Scholar Cat] Failed to save session:', error)
    }
  }
})

console.log('[Scholar Cat] Auth listener initialized')



