/**
 * simulator.js
 * Generator data demo untuk mode simulasi.
 * Menghasilkan data penumpang realistis untuk 13 halte Koridor 5.
 * Auto-aktif jika MQTT broker tidak tersedia.
 */

const Simulator = (() => {
  let _intervalId = null;
  let _running = false;
  let _onData = null;
  let _speed = 3000; // ms antara update

  // State simulasi per halte
  const _simState = {};

  function _initSimState() {
    const halteList = HalteData.getHalteList();
    halteList.forEach(halte => {
      // Buat kondisi awal yang bervariasi per halte
      const baseTraffic = Math.random();
      let initialTotal;
      if (baseTraffic < 0.3) {
        initialTotal = Math.floor(Math.random() * 5); // sepi
      } else if (baseTraffic < 0.7) {
        initialTotal = 5 + Math.floor(Math.random() * 10); // normal
      } else {
        initialTotal = 15 + Math.floor(Math.random() * 10); // ramai
      }

      _simState[halte.id] = {
        masuk: initialTotal + Math.floor(Math.random() * 20),
        keluar: Math.floor(Math.random() * 15),
        total_saat_ini: initialTotal
      };
    });
  }

  function _generateUpdate() {
    const halteList = HalteData.getHalteList();
    
    // Pilih 1-3 halte random untuk diupdate tiap siklus
    const numUpdates = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...halteList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numUpdates);

    selected.forEach(halte => {
      const state = _simState[halte.id];
      
      // Simulasi perubahan realistis
      const hour = new Date().getHours();
      const isRushHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
      
      // Lebih banyak aktivitas saat rush hour
      const maxChange = isRushHour ? 5 : 3;
      
      const newMasuk = Math.floor(Math.random() * maxChange);
      const maxKeluar = Math.min(Math.floor(Math.random() * maxChange), state.total_saat_ini);
      const newKeluar = Math.floor(Math.random() * (maxKeluar + 1));

      state.masuk += newMasuk;
      state.keluar += newKeluar;
      state.total_saat_ini = Math.max(0, state.total_saat_ini + newMasuk - newKeluar);

      // Cap total agar realistis (max 30 orang per halte)
      if (state.total_saat_ini > 30) {
        const overflow = state.total_saat_ini - 30;
        state.keluar += overflow;
        state.total_saat_ini = 30;
      }

      // Buat payload sesuai format PRD
      const payload = {
        device_id: halte.id,
        timestamp: new Date().toISOString(),
        data: {
          masuk: state.masuk,
          keluar: state.keluar,
          total_saat_ini: state.total_saat_ini
        }
      };

      if (_onData) _onData(payload);
    });
  }

  function start(onDataCallback, speed) {
    if (_running) return;
    
    _onData = onDataCallback;
    if (speed) _speed = speed;
    
    _initSimState();
    _running = true;

    // Kirim data awal untuk semua halte
    const halteList = HalteData.getHalteList();
    halteList.forEach(halte => {
      const state = _simState[halte.id];
      const payload = {
        device_id: halte.id,
        timestamp: new Date().toISOString(),
        data: {
          masuk: state.masuk,
          keluar: state.keluar,
          total_saat_ini: state.total_saat_ini
        }
      };
      if (_onData) _onData(payload);
    });

    // Update periodik
    _intervalId = setInterval(_generateUpdate, _speed);
    console.log('[Simulator] Dimulai — interval', _speed, 'ms');
  }

  function stop() {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    _running = false;
    console.log('[Simulator] Dihentikan');
  }

  function isRunning() {
    return _running;
  }

  function setSpeed(ms) {
    _speed = ms;
    if (_running) {
      stop();
      start(_onData, _speed);
    }
  }

  return { start, stop, isRunning, setSpeed };
})();
