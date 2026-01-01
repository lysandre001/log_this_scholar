/**
 * 配置加载器
 * 
 * 自动从官网获取配置，如果失败则使用默认配置
 */

// 默认配置（开发环境）
const DEFAULT_CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here',
  API_URL: 'http://localhost:8000',
  WEB_URL: 'http://localhost:3000',
};

/**
 * 尝试从官网获取配置
 * @param {string} webUrl 官网地址（如果已知）
 * @returns {Promise<object|null>} 配置对象或 null
 */
async function fetchConfigFromWebsite(webUrl = null) {
  try {
    // 如果没有提供 webUrl，尝试从已知的常见地址获取
    const urlsToTry = [];
    
    if (webUrl) {
      urlsToTry.push(webUrl);
    }
    
    // 尝试从 Chrome Storage 获取之前保存的 WEB_URL
    const stored = await chrome.storage.local.get(['extension_config', 'web_url']);
    if (stored.web_url) {
      urlsToTry.push(stored.web_url);
    }
    
    // 添加一些常见的生产环境地址（根据实际情况修改）
    // urlsToTry.push('https://scholar-cat.vercel.app');
    // urlsToTry.push('https://scholarcat.com');
    
    // 如果都没有，使用默认值
    if (urlsToTry.length === 0) {
      urlsToTry.push(DEFAULT_CONFIG.WEB_URL);
    }

    // 尝试从每个 URL 获取配置
    for (const url of urlsToTry) {
      try {
        const configUrl = `${url}/api/config`;
        console.log('[Config Loader] 尝试从获取配置:', configUrl);
        
        const response = await fetch(configUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.log(`[Config Loader] ${url} 返回状态码: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.success && data.config) {
          console.log('[Config Loader] ✅ 成功获取配置:', data.config);
          
          // 保存配置到 Chrome Storage
          await chrome.storage.local.set({
            extension_config: data.config,
            web_url: url, // 保存成功的 URL
            config_fetched_at: Date.now(),
          });
          
          return data.config;
        }
      } catch (error) {
        console.log(`[Config Loader] 从 ${url} 获取配置失败:`, error.message);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Config Loader] 获取配置时出错:', error);
    return null;
  }
}

/**
 * 加载配置
 * 
 * 优先级：
 * 1. config.local.js（用户手动配置）
 * 2. Chrome Storage 中保存的配置（从官网获取的）
 * 3. 从官网自动获取
 * 4. config.js（默认配置）
 * 
 * @returns {Promise<object>} 配置对象
 */
async function loadConfig() {
  // 1. 检查是否有用户手动配置（config.local.js）
  if (typeof CONFIG_LOCAL !== 'undefined' && CONFIG_LOCAL) {
    console.log('[Config Loader] 使用用户手动配置 (config.local.js)');
    return CONFIG_LOCAL;
  }

  // 2. 检查 Chrome Storage 中是否有保存的配置
  const stored = await chrome.storage.local.get(['extension_config', 'config_fetched_at']);
  
  if (stored.extension_config) {
    // 检查配置是否过期（24小时）
    const fetchedAt = stored.config_fetched_at || 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - fetchedAt > oneDay;
    
    if (!isExpired) {
      console.log('[Config Loader] 使用保存的配置');
      return stored.extension_config;
    } else {
      console.log('[Config Loader] 保存的配置已过期，重新获取');
    }
  }

  // 3. 尝试从官网获取配置
  const fetchedConfig = await fetchConfigFromWebsite();
  if (fetchedConfig) {
    return fetchedConfig;
  }

  // 4. 使用默认配置
  console.warn('[Config Loader] ⚠️ 无法从官网获取配置，使用默认配置');
  console.warn('[Config Loader] 请确保官网已上线，或手动配置 config.local.js');
  
  return DEFAULT_CONFIG;
}

/**
 * 初始化配置
 * 
 * 在插件启动时调用，自动加载配置并合并到全局 CONFIG
 */
async function initConfig() {
  try {
    const config = await loadConfig();
    
    // 合并到全局 CONFIG（如果存在）
    if (typeof CONFIG !== 'undefined') {
      Object.assign(CONFIG, config);
      console.log('[Config Loader] ✅ 配置已加载:', CONFIG);
    } else {
      // 如果 CONFIG 不存在，创建它
      window.CONFIG = config;
      console.log('[Config Loader] ✅ 配置已创建:', window.CONFIG);
    }
    
    return config;
  } catch (error) {
    console.error('[Config Loader] ❌ 配置加载失败:', error);
    
    // 使用默认配置
    if (typeof CONFIG !== 'undefined') {
      Object.assign(CONFIG, DEFAULT_CONFIG);
    } else {
      window.CONFIG = DEFAULT_CONFIG;
    }
    
    return DEFAULT_CONFIG;
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadConfig,
    fetchConfigFromWebsite,
    initConfig,
    DEFAULT_CONFIG,
  };
}

// 注意：不在浏览器环境中自动初始化
// 由 popup.js 在 DOMContentLoaded 时手动调用 initConfig()
// 这样可以确保配置加载完成后再初始化其他功能

