/**
 * Authentication page logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if logged in
  await checkAuthStatus();

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tab styles
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Switch forms
      document.getElementById('loginForm').classList.remove('active');
      document.getElementById('registerForm').classList.remove('active');
      document.getElementById(`${tabName}Form`).classList.add('active');
      
      // Clear status message
      hideStatus();
    });
  });

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    
    try {
      const { session, user, error } = await signIn(email, password);
      
      if (error) {
        showStatus(error, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign in';
        return;
      }
      
      showStatus('Signed in successfully!', 'success');
      
      // Show user info
      setTimeout(() => {
        showUserInfo(user);
      }, 1000);
      
    } catch (error) {
      showStatus('Sign in failed: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password.length < 6) {
      showStatus('Password must be at least 6 characters', 'error');
      return;
    }
    
    if (password !== passwordConfirm) {
      showStatus('Passwords do not match', 'error');
      return;
    }
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Signing up...';
    
    try {
      const { user, error } = await signUp(email, password);
      
      if (error) {
        showStatus(error, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign up';
        return;
      }
      
      showStatus('Registration successful! Please check your email for verification link (if required), or sign in directly.', 'success');
      
      // Switch to login form
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('loginEmail').value = email;
      }, 2000);
      
    } catch (error) {
      showStatus('Registration failed: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign up';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await signOut();
    
    if (error) {
      showStatus('Sign out failed: ' + error, 'error');
      return;
    }
    
    showStatus('Signed out', 'info');
    
    setTimeout(() => {
      hideUserInfo();
    }, 1000);
  });

  // Back to main interface
  document.getElementById('goToMainBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'popup.html';
  });
  
  // Privacy Policy link
  const privacyLink = document.getElementById('privacyLink');
  if (privacyLink) {
    privacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      const webUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_URL : 'http://localhost:3000';
      window.open(`${webUrl}/privacy`, '_blank');
    });
  }
});

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  const { session, user, error } = await getSession();
  
  if (!error && user) {
    showUserInfo(user);
  } else {
    hideUserInfo();
  }
}

/**
 * Show user information
 */
function showUserInfo(user) {
  document.getElementById('authForms').style.display = 'none';
  document.getElementById('userInfo').style.display = 'block';
  
  document.getElementById('userEmail').textContent = user.email || '-';
  document.getElementById('userId').textContent = `ID: ${user.id || '-'}`;
}

/**
 * Hide user information
 */
function hideUserInfo() {
  document.getElementById('authForms').style.display = 'block';
  document.getElementById('userInfo').style.display = 'none';
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      hideStatus();
    }, 3000);
  }
}

/**
 * Hide status message
 */
function hideStatus() {
  document.getElementById('status').style.display = 'none';
}
