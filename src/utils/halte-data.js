/**
 * halte-data.js
 * Data halte Metro Jabar Trans (MJT) Koridor 5
 * Rute: UNPAD Dipatiukur → UNPAD Jatinangor
 */

export const HALTE_LIST = [
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

// Density thresholds
export const DENSITY_THRESHOLDS = {
  SEPI: 5,     // ≤ 5 = hijau
  NORMAL: 15,  // ≤ 15 = kuning
  // > 15 = merah (penuh)
};

export function getDensityLevel(totalSaatIni) {
  if (totalSaatIni <= DENSITY_THRESHOLDS.SEPI) return 'sepi';
  if (totalSaatIni <= DENSITY_THRESHOLDS.NORMAL) return 'normal';
  return 'penuh';
}

export function getDensityColor(level) {
  switch (level) {
    case 'sepi':   return { fill: '#22c55e', stroke: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)', tw: 'text-green-400' };
    case 'normal': return { fill: '#facc15', stroke: '#ca8a04', glow: 'rgba(250, 204, 21, 0.5)', tw: 'text-yellow-400' };
    case 'penuh':  return { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)', tw: 'text-red-400' };
    default:       return { fill: '#6b7280', stroke: '#4b5563', glow: 'rgba(107, 114, 128, 0.5)', tw: 'text-gray-400' };
  }
}

export function getDensityLabel(level) {
  switch (level) {
    case 'sepi':   return 'Sepi';
    case 'normal': return 'Normal';
    case 'penuh':  return 'Penuh';
    default:       return 'N/A';
  }
}

// Creates initial state map for all halte
export function createInitialState() {
  const state = {};
  HALTE_LIST.forEach(halte => {
    state[halte.id] = {
      masuk: 0,
      keluar: 0,
      total_saat_ini: 0,
      last_update: null,
      history: [],
    };
  });
  return state;
}

export function getAggregated(halteStates) {
  let totalMasuk = 0;
  let totalKeluar = 0;
  let totalMenunggu = 0;

  Object.values(halteStates).forEach(s => {
    totalMasuk += s.masuk;
    totalKeluar += s.keluar;
    totalMenunggu += s.total_saat_ini;
  });

  return { masuk: totalMasuk, keluar: totalKeluar, total_saat_ini: totalMenunggu };
}
