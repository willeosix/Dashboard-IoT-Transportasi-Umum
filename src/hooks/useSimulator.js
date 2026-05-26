'use client';
import { useRef, useCallback, useState } from 'react';
import { HALTE_LIST } from '@/utils/halte-data';

/**
 * useSimulator hook — generates realistic demo data
 * when MQTT is unavailable.
 */
export function useSimulator(onData) {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const simStateRef = useRef({});
  const onDataRef = useRef(onData);

  // Keep callback ref updated
  onDataRef.current = onData;

  const initSimState = useCallback(() => {
    const state = {};
    HALTE_LIST.forEach(halte => {
      const baseTraffic = Math.random();
      let initialTotal;
      if (baseTraffic < 0.3) {
        initialTotal = Math.floor(Math.random() * 5);
      } else if (baseTraffic < 0.7) {
        initialTotal = 5 + Math.floor(Math.random() * 10);
      } else {
        initialTotal = 15 + Math.floor(Math.random() * 10);
      }
      state[halte.id] = {
        masuk: initialTotal + Math.floor(Math.random() * 20),
        keluar: Math.floor(Math.random() * 15),
        total_saat_ini: initialTotal,
      };
    });
    simStateRef.current = state;
    return state;
  }, []);

  const generateUpdate = useCallback(() => {
    const numUpdates = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...HALTE_LIST].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numUpdates);

    selected.forEach(halte => {
      const state = simStateRef.current[halte.id];
      if (!state) return;

      const hour = new Date().getHours();
      const isRushHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
      const maxChange = isRushHour ? 5 : 3;

      const newMasuk = Math.floor(Math.random() * maxChange);
      const maxKeluar = Math.min(Math.floor(Math.random() * maxChange), state.total_saat_ini);
      const newKeluar = Math.floor(Math.random() * (maxKeluar + 1));

      state.masuk += newMasuk;
      state.keluar += newKeluar;
      state.total_saat_ini = Math.max(0, state.total_saat_ini + newMasuk - newKeluar);

      if (state.total_saat_ini > 30) {
        const overflow = state.total_saat_ini - 30;
        state.keluar += overflow;
        state.total_saat_ini = 30;
      }

      const payload = {
        device_id: halte.id,
        timestamp: new Date().toISOString(),
        data: {
          masuk: state.masuk,
          keluar: state.keluar,
          total_saat_ini: state.total_saat_ini,
        },
      };

      if (onDataRef.current) onDataRef.current(payload);
    });
  }, []);

  const start = useCallback((speed = 3000) => {
    if (intervalRef.current) return;

    const state = initSimState();
    setIsRunning(true);

    // Send initial data for all halte
    HALTE_LIST.forEach(halte => {
      const s = state[halte.id];
      const payload = {
        device_id: halte.id,
        timestamp: new Date().toISOString(),
        data: {
          masuk: s.masuk,
          keluar: s.keluar,
          total_saat_ini: s.total_saat_ini,
        },
      };
      if (onDataRef.current) onDataRef.current(payload);
    });

    intervalRef.current = setInterval(generateUpdate, speed);
  }, [initSimState, generateUpdate]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  return { isRunning, start, stop };
}
