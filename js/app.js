const AppState = {
  view: CONFIG.DEFAULT_VIEW,
  loading: false,
  error: null,
  data: null,
  chart: null
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  document.getElementById('refreshBtn').addEventListener('click', loadAppData);
  loadAppData();
});

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
      AppState.view = button.dataset.view;

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      button.classList.add('active');
      render();
    });
  });
}

async function loadAppData() {
  if (AppState.loading) return;

  AppState.loading = true;
  AppState.error = null;
  setRefreshState(true);
  renderLoading();

  try {
    AppState.data = await fetchWalletData();
    document.getElementById('lastUpdate').textContent =
      `Actualizado ${new Date().toLocaleTimeString('es-ES')}`;
  } catch (error) {
    AppState.error = error.message;
  } finally {
    AppState.loading = false;
    setRefreshState(false);
    render();
  }
}

function setRefreshState(isLoading) {
  const button = document.getElementById('refreshBtn');
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Actualizando...' : 'Actualizar';
}

function renderLoading() {
  document.getElementById('appContent').innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
  `;
}

function render() {
  const container = document.getElementById('appContent');

  if (AppState.error) {
    container.innerHTML = `
      <div class="error-box">
        <strong>Error:</strong><br>
        ${AppState.error}
      </div>
    `;
    return;
  }

  if (!AppState.data) {
    renderLoading();
    return;
  }

  if (AppState.view === 'dashboard') {
    renderDashboard(container);
  }

  if (AppState.view === 'portfolio') {
    renderPortfolio(container);
  }

  if (AppState.view === 'performance') {
    renderPerformance(container);
  }

  if (AppState.view === 'prices') {
    renderPrices(container);
  }
}

function renderDashboard(container) {
  const owners = AppState.data.dashboardGlobal;
  const totals = calculateGlobalTotals(owners);

  container.innerHTML = `
    <section class="kpi-grid">
      ${kpiCard('Total Value', money(totals.totalValue), 'Patrimonio actual', '')}
      ${kpiCard('Net Profit', money(totals.netProfit), 'Ganancia / pérdida neta', totals.netProfit >= 0 ? 'positive' : 'negative')}
      ${kpiCard('ROI Global', percent(totals.roiTotal), 'ROI consolidado', totals.roiTotal >= 0 ? 'positive' : 'negative')}
      ${kpiCard('Buy USD', money(totals.buyUsd), 'Compras históricas', 'blue')}
      ${kpiCard('Sell USD', money(totals.sellUsd), 'Ventas históricas', '')}
      ${kpiCard('Owners', String(owners.length), 'Carteras activas', '')}
    </section>

    <section class="chart-card">
      <div class="section-title">Distribución por owner</div>
      <div class="chart-box">
        <canvas id="ownersChart"></canvas>
      </div>
    </section>

    <section>
      <div class="section-title">Resumen por owner</div>
      <div class="owner-grid">
        ${owners
          .sort((a, b) => b.totalValue - a.totalValue)
          .map(ownerCard)
          .join('')}
      </div>
    </section>
  `;

  drawOwnersChart(owners);
}

function renderPortfolio(container) {
  const rows = AppState.data.portfolioSummary;

  container.innerHTML = `
    <div class="section-title">Holdings actuales</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Owner</th>
            <th>Asset</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Value</th>
            <th class="num">Net Profit</th>
            <th class="num">ROI</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>${row.owner || ''}</td>
              <td><strong>${row.symbol || ''}</strong></td>
              <td class="num">${formatQty(row.total_qty)}</td>
              <td class="num">${money(row.current_price)}</td>
              <td class="num">${money(row.current_value)}</td>
              <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit)}</td>
              <td class="num ${toNumber(row.roi_total) >= 0 ? 'positive' : 'negative'}">${percent(row.roi_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPerformance(container) {
  const rows = AppState.data.portfolioHistory;

  container.innerHTML = `
    <div class="section-title">Histórico mensual</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Owner</th>
            <th class="num">Current Value</th>
            <th class="num">Invested USD</th>
            <th class="num">Net Profit</th>
            <th class="num">ROI</th>
          </tr>
        </thead>
        <tbody>
          ${rows.slice().reverse().map(row => `
            <tr>
              <td>${row.snapshot_date || ''}</td>
              <td>${row.owner || ''}</td>
              <td class="num">${money(row.current_value)}</td>
              <td class="num">${money(row.invested_usd)}</td>
              <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit)}</td>
              <td class="num ${toNumber(row.roi_total) >= 0 ? 'positive' : 'negative'}">${percent(row.roi_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPrices(container) {
  const rows = AppState.data.walletPrices;

  container.innerHTML = `
    <div class="section-title">Precios actuales</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Name</th>
            <th class="num">Price USD</th>
            <th>Source</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td><strong>${row.symbol || ''}</strong></td>
              <td>${row.name || ''}</td>
              <td class="num">${money(row.price_usd)}</td>
              <td>${row.source || ''}</td>
              <td>${row.last_update || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function calculateGlobalTotals(owners) {
  const totalValue = owners.reduce((sum, o) => sum + toNumber(o.totalValue), 0);
  const buyUsd = owners.reduce((sum, o) => sum + toNumber(o.buyUsd), 0);
  const sellUsd = owners.reduce((sum, o) => sum + toNumber(o.sellUsd), 0);
  const currentInvestment = owners.reduce((sum, o) => sum + toNumber(o.currentInvestment), 0);
  const netProfit = owners.reduce((sum, o) => sum + toNumber(o.netProfit), 0);
  const roiTotal = buyUsd > 0 ? netProfit / buyUsd : 0;

  return {
    totalValue,
    buyUsd,
    sellUsd,
    currentInvestment,
    netProfit,
    roiTotal
  };
}

function kpiCard(label, value, sub, className) {
  return `
    <div class="card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${className}">${value}</div>
      <div class="kpi-sub">${sub}</div>
    </div>
  `;
}

function ownerCard(owner) {
  return `
    <div class="owner-card">
      <div class="owner-name">${owner.owner}</div>
      <div class="owner-row"><span>Total Value</span><strong>${money(owner.totalValue)}</strong></div>
      <div class="owner-row"><span>Buy USD</span><strong>${money(owner.buyUsd)}</strong></div>
      <div class="owner-row"><span>Sell USD</span><strong>${money(owner.sellUsd)}</strong></div>
      <div class="owner-row"><span>Net Profit</span><strong class="${toNumber(owner.netProfit) >= 0 ? 'positive' : 'negative'}">${money(owner.netProfit)}</strong></div>
      <div class="owner-row"><span>ROI</span><strong class="${toNumber(owner.roiTotal) >= 0 ? 'positive' : 'negative'}">${percent(owner.roiTotal)}</strong></div>
    </div>
  `;
}

function drawOwnersChart(owners) {
  const canvas = document.getElementById('ownersChart');
  if (!canvas) return;

  if (AppState.chart) {
    AppState.chart.destroy();
  }

  const sorted = owners
    .slice()
    .sort((a, b) => b.totalValue - a.totalValue);

  AppState.chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: sorted.map(o => o.owner),
      datasets: [{
        data: sorted.map(o => toNumber(o.totalValue)),
        backgroundColor: [
          '#7c5cfc',
          '#5b8df0',
          '#00e5a0',
          '#ffb020',
          '#ff5c6b',
          '#c084fc',
          '#34d399',
          '#fb923c',
          '#38bdf8',
          '#a78bfa'
        ],
        borderColor: '#111118',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9090b0',
            boxWidth: 12,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${money(context.parsed)}`
          }
        }
      }
    }
  });
}

function money(value) {
  const number = toNumber(value);

  return '$' + number.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function percent(value) {
  const number = toNumber(value);

  const pct = Math.abs(number) <= 3 ? number * 100 : number;

  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

function formatQty(value) {
  const number = toNumber(value);

  if (number === 0) return '0';
  if (number < 0.00001) return number.toFixed(10);
  if (number < 0.001) return number.toFixed(8);
  if (number < 1) return number.toFixed(6);

  return number.toLocaleString('es-ES', {
    maximumFractionDigits: 6
  });
}
