/**
 * app.js
 * Main controller — routing, data flow coordination,
 * dan inisialisasi semua modul.
 */

const App = (() => {
  let _selectedHalteId = 'all';
  let _mqttConnected = false;
  let _simulatorActive = false;
  let _mqttTimeout = null;

  /* ── DOM Elements ── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ── Initialization ── */
  function init() {
    // Check auth
    if (Auth.isAuthenticated()) {
      showDashboard();
    } else {
      showLogin();
    }

    // Bind login form
    const loginForm = $('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Bind logout
    const logoutBtn = $('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Bind simulator toggle
    const simToggle = $('#sim-toggle');
    if (simToggle) {
      simToggle.addEventListener('click', toggleSimulator);
    }

    // Listen for halte selection from map
    document.addEventListener('halte-selected', (e) => {
      selectHalte(e.detail.halteId);
    });
  }

  /* ── Auth Handlers ── */
  async function handleLogin(e) {
    e.preventDefault();

    const username = $('#input-username').value.trim();
    const password = $('#input-password').value;
    const btn = $('#btn-login');
    const errorEl = $('#login-error');

    if (!username || !password) {
      showLoginError('Masukkan username dan password');
      return;
    }

    btn.classList.add('loading');
    btn.disabled = true;
    errorEl.classList.remove('show');

    try {
      await Auth.login(username, password);
      showDashboard();
    } catch (err) {
      showLoginError(err.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  function handleLogout() {
    // Cleanup
    Simulator.stop();
    MqttClient.disconnect();
    ChartModule.clear();
    HalteData.init();
    if (typeof Security !== 'undefined') Security.stopInactivityMonitor();

    Auth.logout();
    showLogin();
  }

  function showLoginError(message) {
    const errorEl = $('#login-error');
    if (errorEl) {
      errorEl.textContent = '⚠ ' + message;
      errorEl.classList.add('show');
    }

    // Shake inputs
    $$('.form-group input').forEach(input => {
      input.classList.add('error');
      setTimeout(() => input.classList.remove('error'), 1500);
    });
  }

  /* ── Screen Routing ── */
  function showLogin() {
    const login = $('#login-screen');
    const dash = $('#dashboard-screen');

    if (login) login.classList.remove('hidden');
    if (dash) dash.classList.remove('active');

    // Clear form
    const usernameInput = $('#input-username');
    const passwordInput = $('#input-password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    const errorEl = $('#login-error');
    if (errorEl) errorEl.classList.remove('show');
  }

  function showDashboard() {
    const login = $('#login-screen');
    const dash = $('#dashboard-screen');

    if (login) login.classList.add('hidden');
    if (dash) dash.classList.add('active');

    // Initialize dashboard modules
    initDashboard();

    // Start inactivity monitor for auto-logout
    if (typeof Security !== 'undefined') {
      Security.startInactivityMonitor(() => {
        handleLogout();
        // Optional: show a small alert or custom modal instead of built-in alert
        console.warn('Auto-logout karena inactivity');
      });
    }
  }

  /* ── Dashboard Init ── */
  function initDashboard() {
    // Init metrics
    Metrics.init();

    // Init map
    MapModule.init('map-container');

    // Init chart
    ChartModule.init('live-chart');

    // Build halte selector
    buildHalteSelector();

    // Try MQTT first
    connectMqtt();

    // If MQTT doesn't connect within 5 seconds, auto-start simulator
    _mqttTimeout = setTimeout(() => {
      if (!_mqttConnected) {
        console.log('[App] MQTT timeout — memulai mode simulasi');
        startSimulator();
      }
    }, 5000);
  }

  /* ── Halte Selector ── */
  function buildHalteSelector() {
    const bar = $('#halte-selector');
    if (!bar) return;

    // Clear existing
    bar.innerHTML = '';

    // "Semua" tab
    const allTab = document.createElement('button');
    allTab.className = 'halte-tab active';
    allTab.dataset.halteId = 'all';
    allTab.innerHTML = '<span class="tab-dot"></span>Semua Halte';
    allTab.addEventListener('click', () => selectHalte('all'));
    bar.appendChild(allTab);

    // Per-halte tabs
    HalteData.getHalteList().forEach(halte => {
      const tab = document.createElement('button');
      tab.className = 'halte-tab';
      tab.dataset.halteId = halte.id;
      tab.innerHTML = `<span class="tab-dot"></span>${halte.name.replace('Halte ', '')}`;
      tab.addEventListener('click', () => selectHalte(halte.id));
      bar.appendChild(tab);
    });
  }

  function selectHalte(halteId) {
    _selectedHalteId = halteId;

    // Update tab active state
    $$('.halte-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.halteId === halteId);
    });

    // Update metrics for selected halte
    Metrics.update(_selectedHalteId);

    // Focus map if specific halte
    if (halteId !== 'all') {
      MapModule.focusHalte(halteId);
    } else {
      MapModule.fitRoute();
    }
  }

  /* ── MQTT ── */
  function connectMqtt() {
    updateConnectionStatus('connecting');

    MqttClient.connect({
      onConnect: () => {
        _mqttConnected = true;
        if (_mqttTimeout) clearTimeout(_mqttTimeout);
        updateConnectionStatus('connected');

        // Stop simulator if running
        if (_simulatorActive) {
          Simulator.stop();
          _simulatorActive = false;
          updateSimToggle();
        }
      },
      onMessage: (payload) => {
        handleDataUpdate(payload);
      },
      onError: (err) => {
        console.warn('[App] MQTT error:', err.message);
      },
      onDisconnect: () => {
        _mqttConnected = false;
        updateConnectionStatus('disconnected');
      },
      onReconnect: () => {
        updateConnectionStatus('connecting');
      }
    });
  }

  /* ── Simulator ── */
  function startSimulator() {
    _simulatorActive = true;
    updateSimToggle();
    updateConnectionStatus('simulating');

    Simulator.start((payload) => {
      handleDataUpdate(payload);
    }, 3000);
  }

  function stopSimulator() {
    Simulator.stop();
    _simulatorActive = false;
    updateSimToggle();

    if (!_mqttConnected) {
      updateConnectionStatus('disconnected');
    }
  }

  function toggleSimulator() {
    if (_simulatorActive) {
      stopSimulator();
    } else {
      startSimulator();
    }
  }

  function updateSimToggle() {
    const toggle = $('#sim-toggle');
    if (toggle) {
      toggle.classList.toggle('active', _simulatorActive);
    }
  }

  /* ── Data Handler ── */
  function handleDataUpdate(payload) {
    const { device_id, timestamp, data } = payload;

    // Update state
    HalteData.updateState(device_id, {
      masuk: data.masuk,
      keluar: data.keluar,
      total_saat_ini: data.total_saat_ini,
      timestamp: timestamp
    });

    // Update map marker for this halte
    MapModule.updateMarker(device_id);

    // Update halte tab dot color
    updateTabDot(device_id);

    // Update metrics (aggregated or per-halte)
    Metrics.update(_selectedHalteId);

    // Update chart with aggregated data
    const agg = HalteData.getAggregated();
    ChartModule.addDataPoint(
      timestamp || new Date().toISOString(),
      agg.total_saat_ini,
      agg.masuk,
      agg.keluar
    );

    // Update footer timestamp
    updateLastUpdate();
  }

  function updateTabDot(halteId) {
    const tab = $(`.halte-tab[data-halte-id="${halteId}"]`);
    if (!tab) return;

    const state = HalteData.getState(halteId);
    if (!state) return;

    const level = HalteData.getDensityLevel(state.total_saat_ini);
    const colors = HalteData.getDensityColor(level);
    const dot = tab.querySelector('.tab-dot');
    if (dot) {
      dot.style.background = colors.fill;
    }
  }

  /* ── UI Updates ── */
  function updateConnectionStatus(status) {
    const dot = $('#connection-dot');
    const text = $('#connection-text');

    if (dot) {
      dot.className = 'status-dot';
      if (status === 'connected') dot.classList.add('connected');
      else if (status === 'simulating') dot.classList.add('simulating');
      else if (status === 'disconnected') dot.classList.add('disconnected');
    }

    if (text) {
      switch (status) {
        case 'connected':   text.textContent = 'MQTT Terhubung'; break;
        case 'simulating':  text.textContent = 'Mode Simulasi'; break;
        case 'connecting':  text.textContent = 'Menghubungkan...'; break;
        case 'disconnected': text.textContent = 'Terputus'; break;
      }
    }
  }

  function updateLastUpdate() {
    const el = $('#last-update-time');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    // Update active halte count in footer
    const activeCount = $('#active-halte-count');
    if (activeCount) {
      const states = HalteData.getAllStates();
      const active = Object.values(states).filter(s => s.last_update !== null).length;
      activeCount.textContent = active;
    }
  }

  return { init };
})();

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
