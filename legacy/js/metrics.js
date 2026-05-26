/**
 * metrics.js
 * Modul untuk update kartu metrik utama pada dashboard.
 * Menampilkan Total Menunggu, Akumulasi Masuk, Akumulasi Keluar.
 */

const Metrics = (() => {
  let _currentValues = {
    totalMenunggu: 0,
    totalMasuk: 0,
    totalKeluar: 0
  };

  // Elemen DOM
  let _els = {};

  function init() {
    _els = {
      totalMenunggu: document.getElementById('metric-menunggu'),
      totalMasuk: document.getElementById('metric-masuk'),
      totalKeluar: document.getElementById('metric-keluar'),
      labelMenunggu: document.getElementById('metric-menunggu-label'),
      labelMasuk: document.getElementById('metric-masuk-label'),
      labelKeluar: document.getElementById('metric-keluar-label'),
      lastUpdate: document.getElementById('last-update-time'),
    };
  }

  /**
   * Animasi count-up dari nilai lama ke nilai baru
   */
  function _animateValue(element, start, end, duration = 600) {
    if (!element) return;
    if (start === end) {
      element.textContent = end.toLocaleString('id-ID');
      return;
    }

    const range = end - start;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      
      element.textContent = current.toLocaleString('id-ID');
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Tambahkan pulse animation ke card saat data berubah
   */
  function _pulseCard(element) {
    if (!element) return;
    const card = element.closest('.metric-card');
    if (!card) return;
    
    card.classList.remove('pulse');
    // Force reflow
    void card.offsetWidth;
    card.classList.add('pulse');
    
    setTimeout(() => card.classList.remove('pulse'), 700);
  }

  /**
   * Update semua metrik dari data aggregat
   */
  function update(selectedHalteId) {
    let data;

    if (selectedHalteId && selectedHalteId !== 'all') {
      // Data untuk halte spesifik
      const state = HalteData.getState(selectedHalteId);
      if (!state) return;
      data = {
        masuk: state.masuk,
        keluar: state.keluar,
        total_saat_ini: state.total_saat_ini
      };
    } else {
      // Data aggregat semua halte
      data = HalteData.getAggregated();
    }

    const newValues = {
      totalMenunggu: data.total_saat_ini,
      totalMasuk: data.masuk,
      totalKeluar: data.keluar
    };

    // Animate jika berubah
    if (newValues.totalMenunggu !== _currentValues.totalMenunggu) {
      _animateValue(_els.totalMenunggu, _currentValues.totalMenunggu, newValues.totalMenunggu);
      _pulseCard(_els.totalMenunggu);
    }
    if (newValues.totalMasuk !== _currentValues.totalMasuk) {
      _animateValue(_els.totalMasuk, _currentValues.totalMasuk, newValues.totalMasuk);
      _pulseCard(_els.totalMasuk);
    }
    if (newValues.totalKeluar !== _currentValues.totalKeluar) {
      _animateValue(_els.totalKeluar, _currentValues.totalKeluar, newValues.totalKeluar);
      _pulseCard(_els.totalKeluar);
    }

    _currentValues = newValues;

    // Update timestamp
    if (_els.lastUpdate) {
      const now = new Date();
      _els.lastUpdate.textContent = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  function reset() {
    _currentValues = { totalMenunggu: 0, totalMasuk: 0, totalKeluar: 0 };
    if (_els.totalMenunggu) _els.totalMenunggu.textContent = '0';
    if (_els.totalMasuk) _els.totalMasuk.textContent = '0';
    if (_els.totalKeluar) _els.totalKeluar.textContent = '0';
  }

  return { init, update, reset };
})();
