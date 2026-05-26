'use client';
import { useRef, useCallback, useEffect, useState } from 'react';
import { HALTE_LIST } from '@/utils/halte-data';

/**
 * useMqtt hook — connects to HiveMQ Cloud via WebSocket
 * Returns connection status and provides onMessage callback.
 */
export function useMqtt(onMessage) {
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const clientRef = useRef(null);
  const callbackRef = useRef(onMessage);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(async () => {
    // Dynamic import mqtt to avoid SSR issues
    const mqtt = (await import('mqtt')).default;

    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD;
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC || 'transumbdg/koridor5/halte/#';
    const prefix = process.env.NEXT_PUBLIC_MQTT_CLIENT_PREFIX || 'transum_dashboard_';
    const reconnectPeriod = parseInt(process.env.NEXT_PUBLIC_MQTT_RECONNECT_PERIOD || '5000');
    const connectTimeout = parseInt(process.env.NEXT_PUBLIC_MQTT_CONNECT_TIMEOUT || '8000');

    if (!brokerUrl) {
      console.warn('[MQTT] No broker URL configured');
      return;
    }

    setStatus('connecting');

    const clientId = prefix + Math.random().toString(16).substr(2, 8);
    const options = {
      clientId,
      clean: true,
      connectTimeout,
      reconnectPeriod,
      protocolVersion: 4,
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    try {
      const client = mqtt.connect(brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        setStatus('connected');
        client.subscribe(topic, { qos: 0 });
      });

      client.on('message', (_topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data.device_id && data.data) {
            if (callbackRef.current) callbackRef.current(data);
          }
        } catch (e) {
          // non-JSON message
        }
      });

      client.on('error', () => {
        // errors handled silently
      });

      client.on('close', () => {
        setStatus('disconnected');
      });

      client.on('reconnect', () => {
        setStatus('connecting');
      });
    } catch (err) {
      console.error('[MQTT] Connection failed:', err);
      setStatus('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  return { status, connect, disconnect };
}
