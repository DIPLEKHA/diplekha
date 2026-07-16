// ===== AUTH CHECK =====
const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "auth.html";

// ===== STATE =====
let selectedMonth = new Date().getMonth();
let initialBalance = 0;
let expenses = [];
let chart = null;
let currentChartType = 'pie';

const COLORS = ['#e8ff47','#4af0c4','#ff6b6b','#7eb3ff','#ff9f47','#c47eff','#ff7eb3'];
const expensesKey = `spendex_expenses_${user}`;
const balanceKey  = `spendex_balance_${user}`;

// ===== DOM REFS =====
const btn   = document.getElementById('btn1');
const list  = document.getElementById('expense-list');
const toast = document.getElementById('toast');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set monthSelect to current month
  document.getElementById('monthSelect').value = selectedMonth;

  loadFromStorage();
  setTodayDate();
  populateMonthFilter();
  renderAll();
});

// ===== DATE =====
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ===== STORAGE =====
function saveToStorage() {
  localStorage.setItem(expensesKey, JSON.stringify(expenses));
  localStorage.setItem(balanceKey, initialBalance);
}

function loadFromStorage() {
  const saved = localStorage.getItem(expensesKey);
  const bal   = localStorage.getItem(balanceKey);
  if (saved) expenses = JSON.parse(saved);
  if (bal && parseFloat(bal) > 0) {
    initialBalance = parseFloat(bal);
    document.getElementById('balance').value = initialBalance;
  }
}

// ===== MONTH SELECT (sidebar) =====
document.getElementById('monthSelect').addEventListener('change', (e) => {
  selectedMonth = parseInt(e.target.value);
  renderAll();
});

// ===== FILTER HELPERS =====
function getFilteredExpenses() {
  return expenses.filter(exp => new Date(exp.date).getMonth() === selectedMonth);
}

function getPreviousMonthExpenses() {
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  return expenses.filter(exp => new Date(exp.date).getMonth() === prevMonth);
}

// ===== ADD EXPENSE =====
btn.addEventListener('click', () => {
  const balInput = parseFloat(document.getElementById('balance').value);
  if (initialBalance === 0 && !isNaN(balInput) && balInput > 0) {
    initialBalance = balInput;
  }

  const date     = document.getElementById('date').value;
  const desc     = document.getElementById('desc').value.trim();
  const category = document.getElementById('category').value;
  const amount   = parseFloat(document.getElementById('amount').value);

  if (!date || !desc || !category || isNaN(amount) || amount <= 0) {
    showToast('⚠ Please fill all fields correctly.');
    return;
  }

  expenses.push({ id: Date.now(), date, desc, category, amount });
  saveToStorage();
  populateMonthFilter();
  renderAll();
  clearInputs();
  showToast('✓ Expense added');
});

// ===== RENDER ALL =====
function renderAll() {
  renderExpenses();
  renderHistory();
  updateBalance();
  updateMonthly();
  renderChart();

  const filtered = getFilteredExpenses();
  document.getElementById('expense-count').textContent =
    `${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`;
}

// ===== RENDER DASHBOARD TABLE =====
function renderExpenses() {
  const tbody = document.getElementById('expense-list');
  const empty = document.getElementById('empty-state');
  tbody.innerHTML = '';

  const recent = [...getFilteredExpenses()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (recent.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  recent.forEach(exp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${exp.desc}</td>
      <td><span class="cat-badge">${exp.category}</span></td>
      <td class="amount-cell">₹${exp.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td>
        <button class="action-btn" onclick="editExpense(${exp.id})">✏</button>
        <button class="action-btn del" onclick="deleteExpense(${exp.id})">✕</button>
      </td>`;
    tbody.appendChild(row);
  });
}

// ===== RENDER HISTORY TABLE =====
function renderHistory() {
  const tbody = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const month = document.getElementById('filter-month').value;
  const cat   = document.getElementById('filter-category').value;

  tbody.innerHTML = '';

  let filtered = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (month) filtered = filtered.filter(e => e.date.startsWith(month));
  if (cat)   filtered = filtered.filter(e => e.category === cat);

  if (filtered.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  filtered.forEach(exp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${exp.desc}</td>
      <td><span class="cat-badge">${exp.category}</span></td>
      <td class="amount-cell">₹${exp.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td>
        <button class="action-btn" onclick="editExpense(${exp.id})">✏</button>
        <button class="action-btn del" onclick="deleteExpense(${exp.id})">✕</button>
      </td>`;
    tbody.appendChild(row);
  });
}

// ===== DELETE =====
function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  populateMonthFilter();
  renderAll();
  showToast('✓ Expense deleted');
}

// ===== EDIT =====
function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('date').value     = exp.date;
  document.getElementById('desc').value     = exp.desc;
  document.getElementById('category').value = exp.category;
  document.getElementById('amount').value   = exp.amount;

  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  renderAll();
  showSection('dashboard');
  showToast('✏ Edit mode — update and re-add');
}

// ===== BALANCE =====
function updateBalance() {
  const total     = getFilteredExpenses().reduce((s, e) => s + e.amount, 0);
  const remaining = initialBalance - total;

  document.getElementById('display-balance').textContent =
    `₹${remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  document.getElementById('display-spent').textContent =
    `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  document.getElementById('display-left').textContent =
    `₹${Math.max(remaining, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

  if (initialBalance > 0) {
    document.getElementById('balance').value = remaining.toFixed(2);
  }
}

// ===== MONTHLY + COMPARISON =====
function updateMonthly() {
  const filtered  = getFilteredExpenses();
  const total     = filtered.reduce((s, e) => s + e.amount, 0);
  const prevTotal = getPreviousMonthExpenses().reduce((s, e) => s + e.amount, 0);

  document.getElementById('monthly-total').textContent =
    `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
  document.getElementById('monthly-sub-text').textContent =
    `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;

  const pct = initialBalance > 0 ? Math.min((total / initialBalance) * 100, 100) : 0;
  document.getElementById('monthly-bar').style.width = `${pct}%`;

  // ✅ Comparison with proper ₹ formatting
  const el   = document.getElementById('comparison');
  const diff = total - prevTotal;

  if (prevTotal === 0 && total === 0) {
    el.textContent = '';
    el.className = 'comparison-row';
  } else if (prevTotal === 0) {
    el.textContent = '— No previous month data';
    el.className = 'comparison-row neutral';
  } else if (diff > 0) {
    el.textContent = `⬆ ₹${diff.toLocaleString('en-IN', {minimumFractionDigits: 2})} more than last month`;
    el.className = 'comparison-row up';
  } else if (diff < 0) {
    el.textContent = `⬇ ₹${Math.abs(diff).toLocaleString('en-IN', {minimumFractionDigits: 2})} less than last month`;
    el.className = 'comparison-row down';
  } else {
    el.textContent = `↔ Same as last month`;
    el.className = 'comparison-row neutral';
  }
}

// ===== CHART =====
function renderChart() {
  const categoryTotals = {};
  // Chart always shows selected month data
  getFilteredExpenses().forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data   = Object.values(categoryTotals);
  const total  = data.reduce((s, v) => s + v, 0);

  // Stats panel
  const statsEl = document.getElementById('category-stats');
  statsEl.innerHTML = '';
  if (labels.length === 0) {
    statsEl.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No data for this month.</p>';
  }
  labels.forEach((label, i) => {
    const pct   = total > 0 ? ((data[i] / total) * 100).toFixed(1) : 0;
    const color = COLORS[i % COLORS.length];
    statsEl.innerHTML += `
      <div class="stat-row">
        <div class="stat-row-top">
          <span class="stat-label">${label}</span>
          <span class="stat-amount">₹${data[i].toLocaleString('en-IN')}</span>
        </div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  });

  if (labels.length === 0) {
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  const ctx = document.getElementById('myChart').getContext('2d');
  if (chart) chart.destroy();

  Chart.defaults.color = '#6b7289';
  Chart.defaults.font.family = "'DM Mono', monospace";

  chart = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: '#151820',
        borderWidth: currentChartType === 'pie' ? 3 : 0,
        borderRadius: currentChartType === 'bar' ? 6 : 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const label = chart.data.labels[elements[0].index];
          filterByCategory(label);
        }
      },
      plugins: {
        legend: {
          display: currentChartType === 'pie',
          position: 'bottom',
          labels: { padding: 16, boxWidth: 12, boxHeight: 12, color: '#6b7289', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1c2030',
          borderColor: '#252a3a',
          borderWidth: 1,
          titleColor: '#eef0f8',
          bodyColor: '#6b7289',
          padding: 12,
          callbacks: {
            label: ctx => {
              const value = typeof ctx.parsed === 'object' ? ctx.parsed.y : ctx.parsed;
              return ` ₹${value.toLocaleString('en-IN')}`;
            }
          }
        }
      },
      scales: currentChartType === 'bar' ? {
        x: { grid: { color: '#252a3a' }, ticks: { color: '#6b7289' } },
        y: {
          grid: { color: '#252a3a' },
          ticks: { color: '#6b7289', callback: v => `₹${v.toLocaleString('en-IN')}` }
        }
      } : {}
    }
  });
}

// ===== FILTER BY CATEGORY (chart click) =====
// ✅ Fixed: no longer calls undefined updateChart()
function filterByCategory(category) {
  const filtered = getFilteredExpenses().filter(e =>
    e.category.toLowerCase() === category.toLowerCase()
  );

  const tbody = document.getElementById('expense-list');
  const empty = document.getElementById('empty-state');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.add('visible');
    return;
  }
  empty.classList.remove('visible');

  filtered.forEach(exp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${exp.desc}</td>
      <td><span class="cat-badge">${exp.category}</span></td>
      <td class="amount-cell">₹${exp.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td>
        <button class="action-btn" onclick="editExpense(${exp.id})">✏</button>
        <button class="action-btn del" onclick="deleteExpense(${exp.id})">✕</button>
      </td>`;
    tbody.appendChild(row);
  });

  showSection('dashboard');
  showToast(`Showing: ${category}`);
}

// ===== SWITCH CHART =====
function switchChart(type) {
  currentChartType = type;
  document.getElementById('pie-btn').classList.toggle('active', type === 'pie');
  document.getElementById('bar-btn').classList.toggle('active', type === 'bar');
  renderChart();
}

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  const map = { dashboard: 0, history: 1, analytics: 2 };
  document.querySelectorAll('.nav-btn')[map[name]].classList.add('active');
  if (name === 'analytics') renderChart();
}

// ===== POPULATE HISTORY MONTH FILTER =====
function populateMonthFilter() {
  const months  = [...new Set(expenses.map(e => e.date.substring(0, 7)))].sort().reverse();
  const sel     = document.getElementById('filter-month');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Months</option>';
  months.forEach(m => {
    const [y, mo] = m.split('-');
    const label = new Date(y, mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    sel.innerHTML += `<option value="${m}" ${m === current ? 'selected' : ''}>${label}</option>`;
  });
}

// ===== CLEAR INPUTS =====
function clearInputs() {
  document.getElementById('desc').value     = '';
  document.getElementById('category').value = '';
  document.getElementById('amount').value   = '';
  setTodayDate();
}

// ===== TOAST =====
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== FORMAT DATE =====
function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'auth.html';
}