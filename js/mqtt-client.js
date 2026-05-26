/**
 * mqtt-client.js
 * Modul koneksi MQTT over WebSocket ke HiveMQ Cloud.
 * 
 * Konfigurasi broker disimpan di MQTT_CONFIG.
 * Untuk produksi, pindahkan kredensial ke Cloudflare Workers
 * environment variables.
 */

const MqttClient = (() => {
  // Konfigurasi menggunakan config.js
  const config = (typeof CONFIG !== 'undefined') ? CONFIG.MQTT : {
    BROKER_URL: 'wss://broker.hivemq.com:8884/mqtt',
    USERNAME: '',
    PASSWORD: '',
    TOPIC: 'transumbdg/koridor5/halte/#',
    CLIENT_ID_PREFIX: 'transum_dashboard_',
    RECONNECT_PERIOD: 5000,
    CONNECT_TIMEOUT: 8000,
  };

  let _client = null;
  let _connected = false;
  let _callbacks = {
    onConnect: null,
    onMessage: null,
    onError: null,
    onDisconnect: null,
    onReconnect: null,
  };

  function connect(callbacks = {}) {
    _callbacks = { ..._callbacks, ...callbacks };

    // Check if mqtt.js is loaded
    if (typeof mqtt === 'undefined') {
      console.error('[MQTT] mqtt.js library tidak ditemukan');
      if (_callbacks.onError) _callbacks.onError(new Error('mqtt.js not loaded'));
      return;
    }

    const clientId = config.CLIENT_ID_PREFIX + Math.random().toString(16).substr(2, 8);
    
    const options = {
      clientId,
      clean: true,
      connectTimeout: config.CONNECT_TIMEOUT,
      reconnectPeriod: config.RECONNECT_PERIOD,
      protocolVersion: 4, // MQTT 3.1.1
    };

    // Add auth if credentials are set
    if (config.USERNAME && config.PASSWORD) {
      options.username = config.USERNAME;
      options.password = config.PASSWORD;
    }

    try {
      _client = mqtt.connect(config.BROKER_URL, options);
    } catch (err) {
      console.error('[MQTT] Gagal membuat koneksi:', err);
      if (_callbacks.onError) _callbacks.onError(err);
      return;
    }

    _client.on('connect', () => {
      console.log('[MQTT] Terhubung ke broker');
      _connected = true;

      _client.subscribe(config.TOPIC, { qos: 0 }, (err) => {
        if (err) {
          console.error('[MQTT] Gagal subscribe:', err);
        } else {
          console.log('[MQTT] Subscribed ke:', config.TOPIC);
        }
      });

      if (_callbacks.onConnect) _callbacks.onConnect();
    });

    _client.on('message', (topic, payload) => {
      try {
        const raw = payload.toString();
        const data = JSON.parse(raw);
        
        // Validasi format payload sesuai PRD
        if (data.device_id && data.data) {
          console.log(`[MQTT] Data dari ${data.device_id}:`, data.data);
          if (_callbacks.onMessage) _callbacks.onMessage(data);
        } else {
          console.warn('[MQTT] Format payload tidak dikenal:', data);
        }
      } catch (e) {
        console.warn('[MQTT] Pesan non-JSON:', payload.toString());
      }
    });

    _client.on('error', (err) => {
      console.error('[MQTT] Error:', err.message);
      if (_callbacks.onError) _callbacks.onError(err);
    });

    _client.on('reconnect', () => {
      console.log('[MQTT] Reconnecting...');
      if (_callbacks.onReconnect) _callbacks.onReconnect();
    });

    _client.on('close', () => {
      _connected = false;
      console.log('[MQTT] Koneksi ditutup');
      if (_callbacks.onDisconnect) _callbacks.onDisconnect();
    });

    _client.on('offline', () => {
      _connected = false;
      console.log('[MQTT] Offline');
    });
  }

  function disconnect() {
    if (_client) {
      _client.end(true);
      _client = null;
      _connected = false;
    }
  }

  function isConnected() {
    return _connected;
  }

  /**
   * Publish data ke broker (untuk testing/simulasi dari dashboard)
   */
  function publish(topic, payload) {
    if (_client && _connected) {
      _client.publish(topic, JSON.stringify(payload));
    }
  }

  function getConfig() {
    return { ...config, PASSWORD: '***' }; // Jangan expose password
  }

  return {
    connect,
    disconnect,
    isConnected,
    publish,
    getConfig
  };
})();
