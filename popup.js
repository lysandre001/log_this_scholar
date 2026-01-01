// popup.js - Handle popup interface interactions

document.addEventListener('DOMContentLoaded', async () => {
  // 首先等待配置加载完成（如果 config-loader 存在）
  if (typeof initConfig !== 'undefined') {
    try {
      await initConfig();
      console.log('[Popup] 配置已加载完成');
    } catch (error) {
      console.error('[Popup] 配置加载失败，使用默认配置:', error);
    }
  }
  
  // 初始化 UI 元素
  const logBtn = document.getElementById('logBtn');
  const statusDiv = document.getElementById('status');
  const infoDisplay = document.getElementById('infoDisplay');
  const btnIcon = logBtn.querySelector('.btn-icon');
  const btnText = logBtn.querySelector('.btn-text');
  const btnLoading = logBtn.querySelector('.btn-loading');
  
  // 账户相关元素
  const loginLink = document.getElementById('loginLink');
  const accountInfo = document.getElementById('accountInfo');
  const userEmail = document.getElementById('userEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const goToRegister = document.getElementById('goToRegister');
  const websiteBtn = document.getElementById('websiteBtn');
  const websiteBtnText = document.getElementById('websiteBtnText');
  
  // 检查并更新认证状态（尝试从官网同步）
  await syncAuthFromWebsite();
  const isLoggedIn = await updateAuthUI();
  
  // 更新官网按钮文字
  updateWebsiteButton(isLoggedIn);
  
  // 官网跳转按钮
  websiteBtn.addEventListener('click', async () => {
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    const isLoggedIn = await checkAuthStatus();
    
    if (isLoggedIn) {
      // 已登录，跳转到学者列表
      window.open(`${webUrl}/scholars`, '_blank');
    } else {
      // 未登录，跳转到官网首页
      window.open(webUrl, '_blank');
    }
  });
  
  // 登录链接点击 - 显示登录模态框
  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginModal();
  });
  
  // 退出登录
  logoutBtn.addEventListener('click', async () => {
    if (typeof signOut !== 'undefined') {
      await signOut();
    }
    await updateAuthUI();
    updateWebsiteButton(false);
    showStatus('已退出登录', 'info');
  });
  
  // 登录表单提交
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '登录中...';
    loginError.classList.add('hidden');
    
    try {
      if (typeof signIn === 'undefined') {
        throw new Error('认证服务未加载');
      }
      
      const { session, user, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error);
      }
      
      // 登录成功
      hideLoginModal();
      await updateAuthUI();
      updateWebsiteButton(true);
      showStatus('✓ 登录成功', 'success');
      
    } catch (error) {
      loginError.textContent = error.message || '登录失败，请检查邮箱和密码';
      loginError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '登录';
    }
  });
  
  // 去官网注册
  goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/register`, '_blank');
  });
  
  // 点击模态框外部关闭
  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      hideLoginModal();
    }
  });

  // Show status message
  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success/info messages after 3 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  // Hide status message
  function hideStatus() {
    statusDiv.style.display = 'none';
  }

  // Set button loading state
  function setLoading(loading) {
    if (loading) {
      logBtn.disabled = true;
      btnIcon.style.display = 'none';
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      logBtn.disabled = false;
      btnIcon.style.display = 'block';
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
    }
  }

  // Escape CSV field (handle commas, quotes, and newlines)
  function escapeCSVField(field) {
    if (!field) return '';
    
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Process tags: convert comma-separated input to pipe-separated output
  function processTags(tagsInput) {
    if (!tagsInput) return '';
    // Split by comma, trim each tag, filter empty, join with |
    return tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join('|');
  }

  // Update output based on current input values
  function updateOutput(info) {
    const tagsInput = document.getElementById('info-tags').value || '';
    const memoInput = document.getElementById('info-memo').value || '';
    
    const tags = processTags(tagsInput);
    
    // Format full output with CSV escaping
    const output = [
      info.name || '',
      info.affiliation || '',
      info.cited_by || '',
      info.canonical || '',
      info.homepage || '',
      info.topics || '',
      tags,
      escapeCSVField(memoInput)
    ].join(',');
    
    document.getElementById('info-output').value = output;
  }

  // Display extracted information
  function displayInfo(info) {
    document.getElementById('info-name').textContent = info.name || '-';
    document.getElementById('info-affiliation').textContent = info.affiliation || '-';
    document.getElementById('info-cited_by').textContent = info.cited_by || '-';
    document.getElementById('info-canonical').textContent = info.canonical || '-';
    document.getElementById('info-homepage').textContent = info.homepage || '-';
    document.getElementById('info-topics').textContent = info.topics || '-';
    
    // Clear tags and memo inputs
    document.getElementById('info-tags').value = '';
    document.getElementById('info-memo').value = '';
    
    // Store info for later use in updateOutput
    displayInfo.currentInfo = info;
    
    // Initial output update
    updateOutput(info);
    
    // Show information area
    infoDisplay.style.display = 'block';
  }

  // Log this scholar button click event
  logBtn.addEventListener('click', async () => {
    try {
      // Check if current tab is a Google Scholar page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('scholar.google.com/citations')) {
        showStatus('Please use this on a Google Scholar profile page', 'error');
        return;
      }

      // Show loading state
      setLoading(true);
      hideStatus();

      // Communicate with content script to extract information
      try {
        // Try to inject content script first (if not already injected)
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          // Wait a bit for content script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (injectError) {
          // If already injected, this error can be ignored
          console.log('Content script may already exist:', injectError);
        }

        // Send message with retry mechanism
        let response = null;
        let retries = 3;
        let lastError = null;

        while (retries > 0) {
          try {
            response = await chrome.tabs.sendMessage(tab.id, {
              action: 'extractScholarInfo'
            });
            break; // Exit loop on success
          } catch (error) {
            lastError = error;
            retries--;
            if (retries > 0) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }

        setLoading(false);

        if (response && response.success) {
          displayInfo(response.info);
          showStatus('✓ Extraction successful!', 'success');
        } else if (lastError) {
          showStatus(`Extraction failed: ${lastError.message}. Please refresh the page and try again.`, 'error');
        } else {
          showStatus(`Extraction failed: ${response?.error || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        setLoading(false);
        showStatus(`Extraction failed: ${error.message}. Please ensure you're on a Google Scholar profile page.`, 'error');
      }

    } catch (error) {
      setLoading(false);
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Listen to tags and memo input changes
  const tagsInput = document.getElementById('info-tags');
  const memoInput = document.getElementById('info-memo');
  
  tagsInput.addEventListener('input', () => {
    if (displayInfo.currentInfo) {
      updateOutput(displayInfo.currentInfo);
    }
  });
  
  memoInput.addEventListener('input', () => {
    if (displayInfo.currentInfo) {
      updateOutput(displayInfo.currentInfo);
    }
  });

  // Copy full output button
  document.getElementById('copyOutputBtn').addEventListener('click', () => {
    const textarea = document.getElementById('info-output');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      const btn = document.getElementById('copyOutputBtn');
      btn.textContent = '✓ Copied';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    }).catch(() => {
      // Fallback
      document.execCommand('copy');
      const btn = document.getElementById('copyOutputBtn');
      btn.textContent = '✓ Copied';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    });
  });

  // Save to cloud button
  document.getElementById('saveToCloudBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveToCloudBtn');
    const saveBtnText = btn.querySelector('.btn-text');
    const saveBtnLoading = btn.querySelector('.btn-loading');
    
    // Check if there's extracted info
    if (!displayInfo.currentInfo) {
      showStatus('请先提取学者信息', 'error');
      return;
    }
    
    // 检查是否已登录
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      // 显示登录模态框
      showLoginModal();
      showStatus('请先登录后再保存', 'info');
      return;
    }
    
    // Set button loading state
    btn.disabled = true;
    saveBtnText.style.display = 'none';
    saveBtnLoading.style.display = 'inline-flex';
    
    try {
      // Prepare scholar data
      const info = displayInfo.currentInfo;
      const tagsInputVal = document.getElementById('info-tags').value || '';
      const memoInputVal = document.getElementById('info-memo').value || '';
      
      const scholarData = {
        name: info.name,
        affiliation: info.affiliation || null,
        cited_by: info.cited_by || null,
        canonical: info.canonical,
        homepage: info.homepage || null,
        topics: info.topics || null,
        tags: processTags(tagsInputVal) || null,
        memo: memoInputVal || null,
        source_url: info.source_url || null
      };
      
      // Check if already exists
      const checkResult = await checkScholarExists(info.canonical);
      
      if (checkResult.exists) {
        // Ask user if they want to update
        const confirm = window.confirm(
          `学者 "${checkResult.name}" 已存在。\n是否要更新记录？`
        );
        
        if (confirm) {
          // Update existing record
          await updateScholar(checkResult.scholar_id, scholarData);
          showStatus('✓ 学者信息已更新', 'success');
        } else {
          showStatus('取消保存', 'info');
        }
      } else {
        // Create new record
        await createScholar(scholarData);
        showStatus('✓ 学者信息已保存到云端', 'success');
      }
      
    } catch (error) {
      console.error('Save to cloud error:', error);
      
      if (error.message.includes('未登录')) {
        showLoginModal();
        showStatus('请先登录', 'info');
      } else {
        showStatus(`❌ 保存失败: ${error.message}`, 'error');
      }
    } finally {
      // Reset button state
      btn.disabled = false;
      saveBtnText.style.display = 'inline';
      saveBtnLoading.style.display = 'none';
    }
  });

  // Check if current page is Google Scholar
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && !tabs[0].url.includes('scholar.google.com/citations')) {
      logBtn.disabled = true;
      showStatus('Please use this on a Google Scholar profile page', 'info');
    }
  });
  
  // ========== 认证相关函数 ==========
  
  /**
   * 更新认证 UI 状态
   * @returns {Promise<boolean>} 是否已登录
   */
  async function updateAuthUI() {
    const isLoggedIn = await checkAuthStatus();
    
    if (isLoggedIn) {
      loginLink.classList.add('hidden');
      accountInfo.classList.remove('hidden');
    } else {
      loginLink.classList.remove('hidden');
      accountInfo.classList.add('hidden');
    }
    
    return isLoggedIn;
  }
  
  /**
   * 更新官网按钮文字
   */
  function updateWebsiteButton(isLoggedIn) {
    if (isLoggedIn) {
      websiteBtnText.textContent = 'My Scholars';
    } else {
      websiteBtnText.textContent = 'Go to Website';
    }
  }
  
  /**
   * 显示登录模态框
   */
  function showLoginModal() {
    loginModal.classList.remove('hidden');
    document.getElementById('loginEmail').focus();
  }
  
  /**
   * 隐藏登录模态框
   */
  function hideLoginModal() {
    loginModal.classList.add('hidden');
    loginForm.reset();
    loginError.classList.add('hidden');
  }
});

/**
 * 尝试从官网同步登录状态
 * 通过在官网页面执行脚本来读取 localStorage 中的 session
 */
async function syncAuthFromWebsite() {
  try {
    // 先检查插件是否已有 session
    const existingSession = await chrome.storage.local.get('supabase_session');
    if (existingSession.supabase_session) {
      // 检查是否过期
      const expiresAt = existingSession.supabase_session.expires_at;
      if (expiresAt && new Date(expiresAt * 1000) > new Date()) {
        // 还没过期，不需要同步
        return;
      }
    }
    
    // 尝试从官网页面获取 session
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    const supabaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '';
    
    if (!supabaseUrl) return;
    
    // 提取 Supabase project ref (用于构建 storage key)
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) return;
    
    const projectRef = match[1];
    const storageKey = `sb-${projectRef}-auth-token`;
    
    // 查找是否有官网的 tab 打开
    const tabs = await chrome.tabs.query({ url: `${webUrl}/*` });
    
    if (tabs.length > 0) {
      // 有官网 tab，尝试从中读取 session
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          },
          args: [storageKey]
        });
        
        if (results && results[0] && results[0].result) {
          const webSession = results[0].result;
          
          // 保存到 chrome.storage.local
          await chrome.storage.local.set({
            supabase_session: {
              access_token: webSession.access_token,
              refresh_token: webSession.refresh_token,
              user: webSession.user,
              expires_at: webSession.expires_at,
            },
          });
          
          console.log('[Scholar Cat] Session synced from website');
        }
      } catch (e) {
        // 可能没有权限，忽略
        console.log('[Scholar Cat] Could not sync from website tab:', e);
      }
    }
  } catch (e) {
    console.log('[Scholar Cat] Sync auth failed:', e);
  }
}

/**
 * 检查认证状态
 * @returns {Promise<boolean>} 是否已登录
 */
async function checkAuthStatus() {
  if (typeof getSession === 'undefined') {
    return false;
  }
  
  try {
    const { session, user, error } = await getSession();
    
    if (!error && user) {
      // 更新显示的用户邮箱
      const userEmailEl = document.getElementById('userEmail');
      if (userEmailEl) {
        userEmailEl.textContent = user.email?.split('@')[0] || user.email || '已登录';
      }
      return true;
    }
    return false;
  } catch (e) {
    console.log('Auth check failed:', e);
    return false;
  }
}
