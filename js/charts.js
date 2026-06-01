let portfolioChart = null;

function formatChartDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function renderPortfolioHistoryChart(canvasId, rows, investmentLine = 0) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (portfolioChart) {
    portfolioChart.destroy();
    portfolioChart = null;
  }

  const sorted = rows.slice().sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));
  const labels = sorted.map(row => formatChartDate(row.snapshot_date));
  const values = sorted.map(row => toNumber(row.current_value));

  const datasets = [
    {
      label: 'Portfolio Value',
      data: values,
      borderColor: '#7c5cfc',
      backgroundColor: 'rgba(124,92,252,0.12)',
      fill: true,
      tension: 0.35,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHitRadius: 18,
      pointHoverBackgroundColor: '#7c5cfc',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }
  ];

  // Línea de inversión si existe
  if (investmentLine > 0) {
    datasets.push({
      label: 'Investment',
      data: values.map(() => investmentLine),
      borderColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderDash: [6, 4],
      fill: false,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointHitRadius: 0,
    });
  }

  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#111118',
          titleColor: '#8f96b2',
          bodyColor: '#f5f7ff',
          borderColor: '#262633',
          borderWidth: 1,
          padding: 14,
          displayColors: false,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => {
              if (context.datasetIndex === 0) {
                const prev = context.dataIndex > 0 ? context.dataset.data[context.dataIndex - 1] : null;
                const curr = context.parsed.y;
                const diff = prev !== null ? curr - prev : null;
                const diffStr = diff !== null
                  ? `  ${diff >= 0 ? '▲' : '▼'} ${money(Math.abs(diff), 0)}`
                  : '';
                return `Portfolio: ${money(curr, 0)}${diffStr}`;
              }
              if (context.datasetIndex === 1) {
                return `Invested: ${money(context.parsed.y, 0)}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#8f96b2', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: {
            color: '#8f96b2',
            callback: (value) => '$' + Number(value).toLocaleString('es-ES')
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}
