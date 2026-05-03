let portfolioChart = null;

function formatChartDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

function renderPortfolioHistoryChart(canvasId, rows) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (portfolioChart) {
    portfolioChart.destroy();
  }

  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));

  const labels = sorted.map(row => formatChartDate(row.snapshot_date));

  const values = sorted.map(row => toNumber(row.current_value));

  portfolioChart = new Chart(ctx, {
    type: 'line',

    data: {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: values,
          borderColor: '#7c5cfc',
          backgroundColor: 'rgba(124,92,252,0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 18
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: '#111118',
          titleColor: '#f5f7ff',
          bodyColor: '#f5f7ff',
          borderColor: '#262633',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return 'Portfolio: ' + money(context.parsed.y, 2);
            }
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: '#8f96b2',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6
          },
          grid: {
            color: 'rgba(255,255,255,0.04)'
          }
        },

        y: {
          ticks: {
            color: '#8f96b2',
            callback: function(value) {
              return '$' + Number(value).toLocaleString('es-ES');
            }
          },
          grid: {
            color: 'rgba(255,255,255,0.04)'
          }
        }
      }
    }
  });
}