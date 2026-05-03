let portfolioChart = null;

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

  const labels = sorted.map(row => row.snapshot_date);

  const values = sorted.map(row =>
    toNumber(row.current_value)
  );

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

          pointHoverRadius: 6
        }
      ]
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {
        x: {
          ticks: {
            color: '#8f96b2'
          },

          grid: {
            color: 'rgba(255,255,255,0.04)'
          }
        },

        y: {
          ticks: {
            color: '#8f96b2',

            callback: function(value) {
              return '$' + Number(value).toLocaleString('en-US');
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