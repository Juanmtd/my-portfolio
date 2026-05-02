function initOwnerSelect() {
  const select = document.getElementById('owner-select');

  select.innerHTML = '';

  CONFIG.OWNERS.forEach(owner => {
    const option = document.createElement('option');
    option.value = owner;
    option.textContent = owner;
    select.appendChild(option);
  });

  select.value = STATE.owner;

  select.addEventListener('change', (e) => {
    STATE.owner = e.target.value;
    render();
  });
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function money(value) {
  const n = Number(value || 0);
  return '$' + n.toLocaleString('es-ES', {
    maximumFractionDigits: 0
  });
}

function percent(value) {
  const n = Number(value || 0);
  const v = Math.abs(n) <= 3 ? n * 100 : n;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function getDashboardOwner(owner) {
  const rows = STATE.data?.data?.dashboard_global || [];
  return rows.find(row => row.owner === owner) || null;
}

function renderLoading() {
  document.getElementById('app').innerHTML = `
    <div class="loading-screen">
      <div class="loader"></div>
      <p>Loading Wallet 2.0...</p>
    </div>
  `;
}

function renderError() {
  document.getElementById('app').innerHTML = `
    <div style="padding:20px;color:#ff5f7a;">
      ERROR:<br><br>${STATE.error}
    </div>
  `;
}

function renderDashboard() {
  const app = document.getElementById('app');
  const ownerData = getDashboardOwner(STATE.owner);

  if (!ownerData) {
    app.innerHTML = `
      <div style="color:#ff5f7a;">
        No hay datos de dashboard_global para ${STATE.owner}
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card">
        <span>Total Value</span>
        <strong>${money(ownerData.total_value)}</strong>
        <small>valor actual portfolio</small>
      </div>

      <div class="metric-card">
        <span>Net Profit</span>
        <strong class="${Number(ownerData.net_profit) >= 0 ? 'positive' : 'negative'}">
          ${money(ownerData.net_profit)}
        </strong>
        <small>ganancia / pérdida neta</small>
      </div>

      <div class="metric-card">
        <span>ROI Total</span>
        <strong class="${Number(ownerData.roi_total) >= 0 ? 'positive' : 'negative'}">
          ${percent(ownerData.roi_total)}
        </strong>
        <small>retorno total</small>
      </div>

      <div class="metric-card">
        <span>Buy USD</span>
        <strong>${money(ownerData.buy_usd)}</strong>
        <small>invertido histórico</small>
      </div>

      <div class="metric-card">
        <span>Sell USD</span>
        <strong>${money(ownerData.sell_usd)}</strong>
        <small>vendido histórico</small>
      </div>

      <div class="metric-card">
        <span>Current Investment</span>
        <strong>${money(ownerData.current_investment)}</strong>
        <small>buy - sell</small>
      </div>
    </section>
  `;
}

function renderPlaceholder(title) {
  document.getElementById('app').innerHTML = `
    <div style="color:white;font-size:18px;font-weight:600;">
      ${title} coming next step
    </div>
  `;
}

function render() {
  if (STATE.loading) {
    renderLoading();
    return;
  }

  if (STATE.error) {
    renderError();
    return;
  }

  if (!STATE.data) {
    renderLoading();
    return;
  }

  switch (STATE.view) {
    case 'dashboard':
      renderDashboard();
      break;

    case 'portfolio':
      renderPlaceholder('Portfolio');
      break;

    case 'performance':
      renderPlaceholder('Performance');
      break;

    case 'global':
      renderPlaceholder('Global');
      break;

    case 'prices':
      renderPlaceholder('Prices');
      break;

    default:
      renderDashboard();
  }
}
