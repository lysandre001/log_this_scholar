/**
 * 认证页面逻辑
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 检查是否已登录
  await checkAuthStatus();

  // Tab 切换
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // 更新 tab 样式
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 切换表单
      document.getElementById('loginForm').classList.remove('active');
      document.getElementById('registerForm').classList.remove('active');
      document.getElementById(`${tabName}Form`).classList.add('active');
      
      // 清除状态消息
      hideStatus();
    });
  });

  // 登录表单
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '登录中...';
    
    try {
      const { session, user, error } = await signIn(email, password);
      
      if (error) {
        showStatus(error, 'error');
        btn.disabled = false;
        btn.textContent = '登录';
        return;
      }
      
      showStatus('登录成功！', 'success');
      
      // 显示用户信息
      setTimeout(() => {
        showUserInfo(user);
      }, 1000);
      
    } catch (error) {
      showStatus('登录失败：' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = '登录';
    }
  });

  // 注册表单
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password.length < 6) {
      showStatus('密码至少需要 6 个字符', 'error');
      return;
    }
    
    if (password !== passwordConfirm) {
      showStatus('两次输入的密码不一致', 'error');
      return;
    }
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '注册中...';
    
    try {
      const { user, error } = await signUp(email, password);
      
      if (error) {
        showStatus(error, 'error');
        btn.disabled = false;
        btn.textContent = '注册';
        return;
      }
      
      showStatus('注册成功！请查收邮箱验证链接（如果需要），或直接登录。', 'success');
      
      // 切换到登录表单
      setTimeout(() => {
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('loginEmail').value = email;
      }, 2000);
      
    } catch (error) {
      showStatus('注册失败：' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = '注册';
    }
  });

  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await signOut();
    
    if (error) {
      showStatus('退出失败：' + error, 'error');
      return;
    }
    
    showStatus('已退出登录', 'info');
    
    setTimeout(() => {
      hideUserInfo();
    }, 1000);
  });

  // 返回主界面
  document.getElementById('goToMainBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'popup.html';
  });
});

/**
 * 检查认证状态
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
 * 显示用户信息
 */
function showUserInfo(user) {
  document.getElementById('authForms').style.display = 'none';
  document.getElementById('userInfo').style.display = 'block';
  
  document.getElementById('userEmail').textContent = user.email || '-';
  document.getElementById('userId').textContent = `ID: ${user.id || '-'}`;
}

/**
 * 隐藏用户信息
 */
function hideUserInfo() {
  document.getElementById('authForms').style.display = 'block';
  document.getElementById('userInfo').style.display = 'none';
}

/**
 * 显示状态消息
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // 自动隐藏成功/信息消息
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      hideStatus();
    }, 3000);
  }
}

/**
 * 隐藏状态消息
 */
function hideStatus() {
  document.getElementById('status').style.display = 'none';
}
