// popup.js - Handle popup interface interactions

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for config to load
  if (typeof initConfig !== 'undefined') {
    try {
      await initConfig();
      console.log('[Popup] Config loaded successfully');
    } catch (error) {
      console.error('[Popup] Config loading failed, using defaults:', error);
    }
  }
  
  // Initialize UI elements
  const logBtn = document.getElementById('logBtn');
  const statusDiv = document.getElementById('status');
  const infoDisplay = document.getElementById('infoDisplay');
  const btnIcon = logBtn.querySelector('.btn-icon');
  const btnText = logBtn.querySelector('.btn-text');
  const btnLoading = logBtn.querySelector('.btn-loading');
  
  // Auth elements
  const authStatus = document.getElementById('authStatus');
  const authEmoji = document.getElementById('authEmoji');
  const accountMenu = document.getElementById('accountMenu');
  const menuUserName = document.getElementById('menuUserName');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const goToRegister = document.getElementById('goToRegister');
  
  // Footer elements
  const websiteBtn = document.getElementById('websiteBtn');
  const websiteBtnText = document.getElementById('websiteBtnText');
  const moreBtn = document.getElementById('moreBtn');
  const moreMenu = document.getElementById('moreMenu');
  const privacyLink = document.getElementById('privacyLink');
  const helpLink = document.getElementById('helpLink');
  
  // Check and update auth status
  await syncAuthFromWebsite();
  const isLoggedIn = await updateAuthUI();
  updateWebsiteButton(isLoggedIn);
  
  // Auth status click - show login modal or account menu
  authStatus.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isLoggedIn = await checkAuthStatus();
    
    if (isLoggedIn) {
      // Toggle account menu
      accountMenu.classList.toggle('hidden');
    } else {
      // Show login modal
      showLoginModal();
    }
  });
  
  // Logout
  logoutBtn.addEventListener('click', async () => {
    if (typeof signOut !== 'undefined') {
      await signOut();
    }
    accountMenu.classList.add('hidden');
    await updateAuthUI();
    updateWebsiteButton(false);
    showStatus('Signed out', 'info');
  });
  
  // Close menus when clicking outside
  document.addEventListener('click', () => {
    accountMenu.classList.add('hidden');
    moreMenu.classList.add('hidden');
  });
  
  // More dropdown toggle
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moreMenu.classList.toggle('hidden');
  });
  
  // Website button
  websiteBtn.addEventListener('click', async () => {
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    const isLoggedIn = await checkAuthStatus();
    
    if (isLoggedIn) {
      window.open(`${webUrl}/scholars`, '_blank');
    } else {
      window.open(webUrl, '_blank');
    }
  });
  
  // Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    loginError.classList.add('hidden');
    
    try {
      if (typeof signIn === 'undefined') {
        throw new Error('Authentication service not loaded');
      }
      
      const { session, user, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error);
      }
      
      hideLoginModal();
      await updateAuthUI();
      updateWebsiteButton(true);
      showStatus('✓ Signed in successfully', 'success');
      
    } catch (error) {
      loginError.textContent = error.message || 'Sign in failed';
      loginError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });
  
  // Go to website registration
  goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/register`, '_blank');
  });
  
  // Privacy Policy link
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/privacy`, '_blank');
  });
  
  // Help link
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    window.open(`${webUrl}/help`, '_blank');
  });
  
  // Click outside modal to close
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

  // Escape CSV field
  function escapeCSVField(field) {
    if (!field) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Process tags
  function processTags(tagsInput) {
    if (!tagsInput) return '';
    return tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join('|');
  }

  // Update output
  function updateOutput(info) {
    const tagsInput = document.getElementById('info-tags').value || '';
    const memoInput = document.getElementById('info-memo').value || '';
    const tags = processTags(tagsInput);
    
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
    
    document.getElementById('info-tags').value = '';
    document.getElementById('info-memo').value = '';
    
    displayInfo.currentInfo = info;
    updateOutput(info);
    infoDisplay.style.display = 'block';
  }

  // Log this scholar button click
  logBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('scholar.google.com/citations')) {
        showStatus('Please use this on a Google Scholar profile page', 'error');
        return;
      }

      setLoading(true);
      hideStatus();

      try {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (injectError) {
          console.log('Content script may already exist:', injectError);
        }

        let response = null;
        let retries = 3;
        let lastError = null;

        while (retries > 0) {
          try {
            response = await chrome.tabs.sendMessage(tab.id, {
              action: 'extractScholarInfo'
            });
            break;
          } catch (error) {
            lastError = error;
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }

        setLoading(false);

        if (response && response.success) {
          displayInfo(response.info);
          showStatus('✓ Extraction successful!', 'success');
        } else if (lastError) {
          showStatus(`Extraction failed: ${lastError.message}. Please refresh and try again.`, 'error');
        } else {
          showStatus(`Extraction failed: ${response?.error || 'Unknown error'}`, 'error');
        }
      } catch (error) {
        setLoading(false);
        showStatus(`Extraction failed: ${error.message}`, 'error');
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

  // Copy output button
  document.getElementById('copyOutputBtn').addEventListener('click', () => {
    const textarea = document.getElementById('info-output');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      const btn = document.getElementById('copyOutputBtn');
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    }).catch(() => {
      document.execCommand('copy');
      const btn = document.getElementById('copyOutputBtn');
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
  });

  // Save to cloud button
  document.getElementById('saveToCloudBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveToCloudBtn');
    const saveBtnText = btn.querySelector('.btn-text');
    const saveBtnLoading = btn.querySelector('.btn-loading');
    
    if (!displayInfo.currentInfo) {
      showStatus('Please extract scholar information first', 'error');
      return;
    }
    
    const isLoggedIn = await checkAuthStatus();
    if (!isLoggedIn) {
      showLoginModal();
      showStatus('Please sign in first to save', 'info');
      return;
    }
    
    btn.disabled = true;
    saveBtnText.style.display = 'none';
    saveBtnLoading.style.display = 'inline-flex';
    
    try {
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
      
      const checkResult = await checkScholarExists(info.canonical);
      
      if (checkResult.exists) {
        const confirm = window.confirm(
          `Scholar "${checkResult.name}" already exists.\nDo you want to update the record?`
        );
        
        if (confirm) {
          await updateScholar(checkResult.scholar_id, scholarData);
          showStatus('✓ Scholar information updated', 'success');
        } else {
          showStatus('Save cancelled', 'info');
        }
      } else {
        await createScholar(scholarData);
        showStatus('✓ Scholar information saved to cloud', 'success');
      }
      
    } catch (error) {
      console.error('Save to cloud error:', error);
      
      if (error.message.includes('未登录') || error.message.includes('not logged in') || error.message.includes('unauthorized')) {
        showLoginModal();
        showStatus('Please sign in first', 'info');
      } else {
        showStatus(`❌ Save failed: ${error.message}`, 'error');
      }
    } finally {
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
  
  // ========== Auth functions ==========
  
  async function updateAuthUI() {
    const isLoggedIn = await checkAuthStatus();
    
    if (isLoggedIn) {
      // Logged in - show happy emoji
      authEmoji.textContent = '😸';
      authStatus.title = 'Click to see account options';
    } else {
      // Not logged in - show ghost emoji
      authEmoji.textContent = '👻';
      authStatus.title = 'Click to log in';
    }
    
    return isLoggedIn;
  }
  
  function updateWebsiteButton(isLoggedIn) {
    websiteBtnText.textContent = isLoggedIn ? 'My Scholars' : 'Go to Website';
  }
  
  function showLoginModal() {
    loginModal.classList.remove('hidden');
    document.getElementById('loginEmail').focus();
  }
  
  function hideLoginModal() {
    loginModal.classList.add('hidden');
    loginForm.reset();
    loginError.classList.add('hidden');
  }
});

// Sync auth from website
async function syncAuthFromWebsite() {
  try {
    const existingSession = await chrome.storage.local.get('supabase_session');
    if (existingSession.supabase_session) {
      const expiresAt = existingSession.supabase_session.expires_at;
      if (expiresAt && new Date(expiresAt * 1000) > new Date()) {
        return;
      }
    }
    
    const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
    const supabaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '';
    
    if (!supabaseUrl) return;
    
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) return;
    
    const projectRef = match[1];
    const storageKey = `sb-${projectRef}-auth-token`;
    
    const tabs = await chrome.tabs.query({ url: `${webUrl}/*` });
    
    if (tabs.length > 0) {
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
        console.log('[Scholar Cat] Could not sync from website tab:', e);
      }
    }
  } catch (e) {
    console.log('[Scholar Cat] Sync auth failed:', e);
  }
}

// Check auth status
async function checkAuthStatus() {
  if (typeof getSession === 'undefined') {
    return false;
  }
  
  try {
    const { session, user, error } = await getSession();
    
    if (!error && user) {
      const menuUserName = document.getElementById('menuUserName');
      if (menuUserName) {
        menuUserName.textContent = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      }
      return true;
    }
    return false;
  } catch (e) {
    console.log('Auth check failed:', e);
    return false;
  }
}
