const CACHE_KEY = 'wallet2_cache_v1';
const CACHE_TIME_KEY = 'wallet2_cache_time_v1';

const CACHE_DURATION_MS = 60 * 1000; // 60 segundos

async function loadData(forceRefresh = false) {
  try {
    const hasExistingData = !!STATE.data;

    STATE.error = null;

    if (!hasExistingData) {
      STATE.loading = true;
      render();
    }

    // =========================
    // CACHE
    // =========================

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const cacheStillValid =
      cachedData &&
      cachedTime &&
      (Date.now() - Number(cachedTime)) < CACHE_DURATION_MS;

    if (!forceRefresh && cacheStillValid) {
      STATE.data = JSON.parse(cachedData);

      STATE.loading = false;

      console.log('Loaded from cache');

      render();

      return;
    }

    // =========================
    // REFRESH BUTTON STATE
    // =========================

    const refreshBtn = document.getElementById('refresh-btn');

    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }

    // =========================
    // API FETCH
    // =========================

    const response = await fetch(
      `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'API Error');
    }

    // =========================
    // SAVE CACHE
    // =========================

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(json.data)
    );

    localStorage.setItem(
      CACHE_TIME_KEY,
      Date.now().toString()
    );

    STATE.data = json.data;

    STATE.loading = false;

    console.log('Loaded from API');

    render();

  } catch (err) {
    STATE.loading = false;
    STATE.error = err.message;

    render();

  } finally {

    const refreshBtn = document.getElementById('refresh-btn');

    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  }
}