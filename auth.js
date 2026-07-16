function showToast(msg, type = 'default') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function showLogin() {
  document.getElementById('signup-box').style.display = 'none';
  document.getElementById('login-box').style.display = 'block';
}

function showSignup() {
  document.getElementById('signup-box').style.display = 'block';
  document.getElementById('login-box').style.display = 'none';
}

function signup() {
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!username || !password) {
    showToast('⚠ Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showToast('⚠ Password must be at least 6 characters.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.find(u => u.username === username)) {
    showToast('⚠ Username already taken.');
    return;
  }

  users.push({ username, password });
  localStorage.setItem('users', JSON.stringify(users));
  showToast('✓ Account created! Please login.');
  showLogin();
}

function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showToast('⚠ Please fill in all fields.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user  = users.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem('loggedInUser', username);
    window.location.href = 'expense.html';
  } else {
    showToast('⚠ Invalid username or password.');
  }
}

// Allow Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const loginVisible = document.getElementById('login-box').style.display !== 'none';
  loginVisible ? login() : signup();
});