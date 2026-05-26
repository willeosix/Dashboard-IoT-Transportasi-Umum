/**
 * config.example.js
 * ============================================
 * TEMPLATE KONFIGURASI — Salin file ini menjadi config.js
 * dan isi dengan nilai kredensial sebenarnya.
 * 
 * cp config.example.js config.js
 * ============================================
 */

const CONFIG = Object.freeze({
  // MQTT Broker
  MQTT: Object.freeze({
    BROKER_URL: 'wss://YOUR_CLUSTER.s1.eu.hivemq.cloud:8884/mqtt',
    USERNAME: 'YOUR_MQTT_USERNAME',
    PASSWORD: 'YOUR_MQTT_PASSWORD',
    TOPIC: 'transumbdg/koridor5/halte/#',
    CLIENT_ID_PREFIX: 'transum_dashboard_',
    RECONNECT_PERIOD: 5000,
    CONNECT_TIMEOUT: 8000,
  }),

  // Autentikasi Dashboard
  AUTH: Object.freeze({
    USERNAME: 'admin',
    PASSWORD: 'CHANGE_THIS_PASSWORD',
    SESSION_DURATION_MS: 8 * 60 * 60 * 1000,
    INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 5 * 60 * 1000,
  }),

  // Session signing secret (ganti dengan string acak)
  SESSION_SECRET: 'CHANGE_THIS_TO_A_RANDOM_STRING',
});
