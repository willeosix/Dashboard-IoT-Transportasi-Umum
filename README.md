# TransUm Bandung — IoT Passenger Counter Dashboard

> **Koridor 5:** UNPAD Dipatiukur → UNPAD Jatinangor

Dashboard berbasis web untuk memvisualisasikan data real-time dari sistem IoT penghitung penumpang halte angkutan umum di Bandung. Sistem menggunakan microcontroller dan sensor ultrasonik yang mengirimkan data via protokol MQTT.

![Dashboard Preview](docs/preview.png)

---

## 🚀 Fitur Utama

- **Visualisasi Real-Time** — Data penumpang masuk, keluar, dan total menunggu diperbarui secara instan via MQTT over WebSockets
- **Peta Interaktif** — 13 halte Koridor 5 ditampilkan di peta Bandung–Jatinangor dengan indikator kepadatan berwarna
- **Grafik Live** — Tren kepadatan dalam bentuk line chart yang terus diperbarui
- **Mode Simulasi** — Demo tanpa perangkat IoT, data dummy dihasilkan secara otomatis
- **Sistem Login** — Akses terlindungi dengan autentikasi (siap migrasi ke Cloudflare Workers)
- **Dark Mode** — Estetika akademis dengan desain gelap yang elegan

## 📋 Daftar Halte Koridor 5

| # | Halte | Device ID |
|---|-------|-----------|
| 1 | UNPAD Dipatiukur | `HALTE_UNPAD_DIPATIUKUR` |
| 2 | Simpang Dago | `HALTE_SIMPANG_DAGO` |
| 3 | BIP / Tegalega | `HALTE_BIP` |
| 4 | Tegallega | `HALTE_TEGALLEGA` |
| 5 | Leuwipanjang | `HALTE_LEUWIPANJANG` |
| 6 | Buah Batu | `HALTE_BUAH_BATU` |
| 7 | Bypass Soekarno-Hatta | `HALTE_BYPASS` |
| 8 | Cibiru | `HALTE_CIBIRU` |
| 9 | Cileunyi | `HALTE_CILEUNYI` |
| 10 | Rancaekek | `HALTE_RANCAEKEK` |
| 11 | Tanjungsari | `HALTE_TANJUNGSARI` |
| 12 | Cikeruh | `HALTE_CIKERUH` |
| 13 | UNPAD Jatinangor | `HALTE_UNPAD_JATINANGOR` |

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| Peta | [Leaflet.js](https://leafletjs.com/) + CartoDB Dark Matter |
| Grafik | [Chart.js](https://www.chartjs.org/) |
| MQTT | [mqtt.js](https://github.com/mqttjs/MQTT.js) via WebSocket |
| Broker | [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) |
| Hosting | Cloudflare Workers (planned) |

## 📁 Struktur Proyek

```
WebsiteTransum/
├── index.html              # Entry point (SPA)
├── css/
│   └── style.css           # Design system & semua styling
├── js/
│   ├── app.js              # Main controller & routing
│   ├── auth.js             # Login/session (CF Workers ready)
│   ├── mqtt-client.js      # Koneksi MQTT WebSocket
│   ├── simulator.js        # Generator data demo
│   ├── map.js              # Modul peta Leaflet
│   ├── chart.js            # Modul grafik Chart.js
│   ├── metrics.js          # Update kartu metrik
│   └── halte-data.js       # Definisi halte & state
├── assets/
│   └── favicon.svg         # Favicon
├── docs/
│   └── preview.png         # Screenshot untuk README
├── .gitignore
├── LICENSE
└── README.md
```

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/WebsiteTransum.git
cd WebsiteTransum
```

### 2. Konfigurasi MQTT (Opsional)

Edit `js/mqtt-client.js` untuk mengatur koneksi MQTT broker:

```javascript
const MQTT_CONFIG = {
  broker: 'wss://YOUR_BROKER.s1.eu.hivemq.cloud:8884/mqtt',
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD',
  topic: 'transumbdg/koridor5/halte/#'
};
```

### 3. Jalankan

Cukup buka `index.html` di browser, atau gunakan live server:

```bash
# Menggunakan VS Code Live Server extension
# Atau menggunakan Python
python -m http.server 8080

# Atau menggunakan Node.js
npx serve .
```

### 4. Login

- **Username:** `admin`
- **Password:** `transumbandung2026`

> Mode simulasi akan aktif otomatis jika MQTT broker tidak tersedia.

## 📡 Format Data MQTT

### Topic Pattern

```
transumbdg/koridor5/halte/{device_id}
```

### Payload (JSON)

```json
{
  "device_id": "HALTE_UNPAD_DIPATIUKUR",
  "timestamp": "2026-05-26T09:00:00Z",
  "data": {
    "masuk": 45,
    "keluar": 30,
    "total_saat_ini": 15
  }
}
```

### Topic Bus (Future)

```
transumbdg/koridor5/bus/{bus_id}
```

```json
{
  "bus_id": "BUS_K5_01",
  "timestamp": "2026-05-26T09:00:00Z",
  "data": {
    "penumpang_dalam": 25,
    "kapasitas_max": 40
  },
  "location": {
    "lat": -6.9175,
    "lng": 107.6191
  }
}
```

## 🚧 Roadmap

- [x] Dashboard dengan metrik real-time
- [x] Peta interaktif Koridor 5
- [x] Live chart kepadatan
- [x] Mode simulasi
- [x] Sistem login
- [ ] Migrasi autentikasi ke Cloudflare Workers
- [ ] Tracking bus real-time (jumlah penumpang + GPS)
- [ ] Notifikasi kepadatan tinggi
- [ ] Riwayat data historis dengan database
- [ ] Multi-koridor support

## 📄 Lisensi

[MIT License](LICENSE)

## 👥 Tim

Dikembangkan sebagai Proof of Concept untuk sistem transportasi umum cerdas Kota Bandung.
