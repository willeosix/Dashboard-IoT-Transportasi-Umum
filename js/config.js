/**
 * config.js
 * ============================================
 * FILE INI BERISI KREDENSIAL SENSITIF.
 * JANGAN COMMIT KE REPOSITORY PUBLIK.
 * File ini sudah ada di .gitignore.
 * ============================================
 * 
 * Salin dari config.example.js dan isi dengan nilai sebenarnya.
 */

const CONFIG = Object.freeze({
  // MQTT Broker
  MQTT: Object.freeze({
    BROKER_URL: 'wss://9576a285a49641c9aa3331ebdb1eab9b.s1.eu.hivemq.cloud:8884/mqtt',
    USERNAME: 'wilfredo',
    PASSWORD: 'GH9DwybrUR!FmLc',
    TOPIC: 'transumbdg/koridor5/halte/#',
    CLIENT_ID_PREFIX: 'transum_dashboard_',
    RECONNECT_PERIOD: 5000,
    CONNECT_TIMEOUT: 8000,
  }),

  // Autentikasi Dashboard
  // TODO: Migrasi ke Cloudflare Workers environment variables
  AUTH: Object.freeze({
    USERNAME: 'admin',
    PASSWORD: 'transumbandung2026',
    SESSION_DURATION_MS: 8 * 60 * 60 * 1000,  // 8 jam
    INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,    // 30 menit tanpa aktivitas
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 5 * 60 * 1000,        // 5 menit lockout
  }),

  // Session signing secret (client-side, ganti untuk produksi)
  SESSION_SECRET: 'tUm_BdG_k5_2026_s3cr3t',
});
