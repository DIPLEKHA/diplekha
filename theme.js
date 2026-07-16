// ===== THEME SYSTEM =====
// Shared across auth.html and expense.html

(function () {
  const stored = localStorage.getItem('spendex_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function getTheme() {
  return document.documentElement.getAttribute('data-theme');
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('spendex_theme', theme);
  updateToggleIcon();
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function updateToggleIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = getTheme() === 'dark' ? '☀' : '☾';
  btn.title = getTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

// Auto-follow system preference if user hasn't manually set it
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('spendex_theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

document.addEventListener('DOMContentLoaded', updateToggleIcon);