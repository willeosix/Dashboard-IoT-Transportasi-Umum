/**
 * halte-data.js
 * Definisi halte Metro Jabar Trans (MJT) Koridor 5 
 * Rute: UNPAD Dipatiukur → UNPAD Jatinangor
 * 
 * Data halte berdasarkan update terbaru (Januari 2026).
 * Koridor ini sebelumnya dikenal sebagai Trans Metro Pasundan (TMP) K5.
 */

const HalteData = (() => {
  // Definisi semua halte MJT Koridor 5 (arah Jatinangor)
  const HALTE_LIST = [
    { id: 'HALTE_UNPAD_DIPATIUKUR', name: 'UNPAD Dipatiukur',         lat: -6.8945, lng: 107.6167, order: 1  },
    { id: 'HALTE_ITB_GANESHA',      name: 'ITB Ganesha',              lat: -6.8899, lng: 107.6105, order: 2  },
    { id: 'HALTE_DISPORA',          name: 'Dispora Kota Bandung',     lat: -6.8965, lng: 107.6085, order: 3  },
    { id: 'HALTE_GASIBU',           name: 'Lapangan Gasibu',          lat: -6.9015, lng: 107.6190, order: 4  },
    { id: 'HALTE_PUSDAI',           name: 'PUSDAI Jabar',             lat: -6.9025, lng: 107.6250, order: 5  },
    { id: 'HALTE_SUPRATMAN',        name: 'Lap. Supratman',           lat: -6.9070, lng: 107.6296, order: 6  },
    { id: 'HALTE_TAMAN_PRAMUKA',    name: 'Taman Pramuka',            lat: -6.9098, lng: 107.6263, order: 7  },
    { id: 'HALTE_GRAND_TEBU',       name: 'Hotel Grand Tebu',         lat: -6.9104, lng: 107.6321, order: 8  },
    { id: 'HALTE_BCH',              name: 'Bandung Creative Hub',     lat: -6.9070, lng: 107.6257, order: 9  },
    { id: 'HALTE_HORISON',          name: 'Hotel Horison',            lat: -6.9365, lng: 107.6323, order: 10 },
    { id: 'HALTE_PT_INTI',          name: 'PT INTI',                  lat: -6.9386, lng: 107.6118, order: 11 },
    { id: 'HALTE_BYPASS',           name: 'Simpang Bypass Soekarno-Hatta', lat: -6.9445, lng: 107.6405, order: 12 },
    { id: 'HALTE_CILEUNYI',         name: 'Cileunyi',                 lat: -6.9389, lng: 107.7528, order: 13 },
    { id: 'HALTE_IPDN',             name: 'IPDN Jatinangor',          lat: -6.9350, lng: 107.7680, order: 14 },
    { id: 'HALTE_ITB_JATINANGOR',   name: 'ITB Jatinangor',           lat: -6.9315, lng: 107.7645, order: 15 },
    { id: 'HALTE_UNPAD_JATINANGOR', name: 'UNPAD Jatinangor',         lat: -6.9261, lng: 107.7747, order: 16 },
  ];

  // State: data penumpang per halte
  const _state = {};

  // Threshold kepadatan
  const DENSITY_THRESHOLDS = {
    SEPI:   5,   // <= 5 orang: hijau
    NORMAL: 15,  // <= 15 orang: kuning
    // > 15 orang: merah (penuh)
  };

  function init() {
    HALTE_LIST.forEach(halte => {
      _state[halte.id] = {
        masuk: 0,
        keluar: 0,
        total_saat_ini: 0,
        last_update: null,
        history: [] // { timestamp, total_saat_ini, masuk, keluar }
      };
    });
  }

  function getHalteList() {
    return [...HALTE_LIST];
  }

  function getHalteById(id) {
    return HALTE_LIST.find(h => h.id === id) || null;
  }

  function getState(halteId) {
    return _state[halteId] || null;
  }

  function getAllStates() {
    return { ..._state };
  }

  function updateState(halteId, data) {
    if (!_state[halteId]) {
      _state[halteId] = {
        masuk: 0,
        keluar: 0,
        total_saat_ini: 0,
        last_update: null,
        history: []
      };
    }

    _state[halteId].masuk = data.masuk;
    _state[halteId].keluar = data.keluar;
    _state[halteId].total_saat_ini = data.total_saat_ini;
    _state[halteId].last_update = data.timestamp || new Date().toISOString();

    // Simpan history (max 50 entries per halte)
    _state[halteId].history.push({
      timestamp: _state[halteId].last_update,
      total_saat_ini: data.total_saat_ini,
      masuk: data.masuk,
      keluar: data.keluar
    });
    if (_state[halteId].history.length > 50) {
      _state[halteId].history.shift();
    }
  }

  function getDensityLevel(totalSaatIni) {
    if (totalSaatIni <= DENSITY_THRESHOLDS.SEPI) return 'sepi';
    if (totalSaatIni <= DENSITY_THRESHOLDS.NORMAL) return 'normal';
    return 'penuh';
  }

  function getDensityColor(level) {
    switch (level) {
      case 'sepi':   return { fill: '#40916c', stroke: '#2d6a4f', glow: 'rgba(64, 145, 108, 0.5)' };
      case 'normal': return { fill: '#e9c46a', stroke: '#b08968', glow: 'rgba(233, 196, 106, 0.5)' };
      case 'penuh':  return { fill: '#e76f51', stroke: '#c1553d', glow: 'rgba(231, 111, 81, 0.5)' };
      default:       return { fill: '#6c757d', stroke: '#495057', glow: 'rgba(108, 117, 125, 0.5)' };
    }
  }

  function getDensityLabel(level) {
    switch (level) {
      case 'sepi':   return 'Sepi';
      case 'normal': return 'Normal';
      case 'penuh':  return 'Penuh';
      default:       return 'N/A';
    }
  }

  function getAggregated() {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalMenunggu = 0;

    Object.values(_state).forEach(s => {
      totalMasuk += s.masuk;
      totalKeluar += s.keluar;
      totalMenunggu += s.total_saat_ini;
    });

    return { masuk: totalMasuk, keluar: totalKeluar, total_saat_ini: totalMenunggu };
  }

  // Initialize on load
  init();

  return {
    HALTE_LIST,
    DENSITY_THRESHOLDS,
    init,
    getHalteList,
    getHalteById,
    getState,
    getAllStates,
    updateState,
    getDensityLevel,
    getDensityColor,
    getDensityLabel,
    getAggregated
  };
})();
