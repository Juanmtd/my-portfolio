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

    btn.classList.remove('active');

    if (btn.dataset.view === view) {

      btn.classList.add('active');

    }

  });

}

function renderLoading() {

  const app = document.getElementById('app');

  app.innerHTML = `

    <div class="loading-screen">

      <div class="loader"></div>

      <p>
        Loading Wallet 2.0...
      </p>

    </div>

  `;

}

function renderError() {

  const app = document.getElementById('app');

  app.innerHTML = `

    <div style="padding:20px;color:#ff5f7a;">

      ERROR:<br><br>

      ${STATE.error}

    </div>

  `;

}

function renderDashboard() {

  const app = document.getElementById('app');

  app.innerHTML = `

    <div style="color:white;">

      dashboard coming next step

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

  switch (STATE.view) {

    case 'dashboard':

      renderDashboard();

      break;

    default:

      renderDashboard();

  }

}
