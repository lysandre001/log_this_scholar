// popup.js - Handle popup interface interactions

document.addEventListener('DOMContentLoaded', async () => {
  // 检查认证状态
  const isAuthenticated = await checkAuthStatus();
  const logBtn = document.getElementById('logBtn');
  const statusDiv = document.getElementById('status');
  const infoDisplay = document.getElementById('infoDisplay');
  const authPrompt = document.getElementById('authPrompt');
  const btnText = logBtn.querySelector('.btn-text');
  const btnLoading = logBtn.querySelector('.btn-loading');
  
  // 根据认证状态显示/隐藏登录提示和功能按钮
  if (!isAuthenticated) {
    authPrompt.style.display = 'block';
    logBtn.style.display = 'none';
  } else {
    authPrompt.style.display = 'none';
    logBtn.style.display = 'block';
  }
  
  // 登录提示按钮点击事件
  document.getElementById('goToLoginBtn').addEventListener('click', () => {
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/extension-auth`, '_blank');
  });
  
  // 登录链接点击事件
  document.getElementById('authLink').addEventListener('click', (e) => {
    e.preventDefault();
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/extension-auth`, '_blank');
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
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      logBtn.disabled = false;
      btnText.style.display = 'inline';
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
      btn.style.background = '#4CAF50';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.textContent = 'Copy Full Output';
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    }).catch(() => {
      // Fallback
      document.execCommand('copy');
      const btn = document.getElementById('copyOutputBtn');
      btn.textContent = '✓ Copied';
      btn.style.background = '#4CAF50';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.textContent = 'Copy Full Output';
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    });
  });

  // Save to cloud button
  document.getElementById('saveToCloudBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveToCloudBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    // Check if there's extracted info
    if (!displayInfo.currentInfo) {
      showStatus('请先提取学者信息', 'error');
      return;
    }
    
    // Set button loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    
    try {
      // Prepare scholar data
      const info = displayInfo.currentInfo;
      const tagsInput = document.getElementById('info-tags').value || '';
      const memoInput = document.getElementById('info-memo').value || '';
      
      const scholarData = {
        name: info.name,
        affiliation: info.affiliation || null,
        cited_by: info.cited_by || null,
        canonical: info.canonical,
        homepage: info.homepage || null,
        topics: info.topics || null,
        tags: processTags(tagsInput) || null,
        memo: memoInput || null,
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
        showStatus('❌ 请先登录', 'error');
        // Optionally open auth page
        setTimeout(() => {
          const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
          window.open(`${webUrl}/extension-auth`, '_blank');
        }, 1500);
      } else {
        showStatus(`❌ 保存失败: ${error.message}`, 'error');
      }
    } finally {
      // Reset button state
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  });

  // Check if current page is Google Scholar
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && !tabs[0].url.includes('scholar.google.com/citations')) {
      logBtn.disabled = true;
      showStatus('Please use this on a Google Scholar profile page', 'info');
    }
  });
});

/**
 * 检查认证状态
 * @returns {Promise<boolean>} 是否已登录
 */
async function checkAuthStatus() {
  const authLink = document.getElementById('authLink');
  
  if (typeof getSession === 'undefined') {
    // Supabase 库未加载，跳过
    authLink.textContent = '登录';
    authLink.style.color = '#667eea';
    return false;
  }
  
  try {
    const { session, user, error } = await getSession();
    
    if (!error && user) {
      // 已登录
      authLink.textContent = user.email?.split('@')[0] || '已登录';
      authLink.style.color = '#4CAF50';
      return true;
    } else {
      // 未登录
      authLink.textContent = '登录';
      authLink.style.color = '#667eea';
      return false;
    }
  } catch (e) {
    console.log('Auth check failed:', e);
    authLink.textContent = '登录';
    authLink.style.color = '#667eea';
    return false;
  }
}
