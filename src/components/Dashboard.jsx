'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useMqtt } from '@/hooks/useMqtt';
import { useSimulator } from '@/hooks/useSimulator';
import { createInitialState, getAggregated } from '@/utils/halte-data';
import MetricCard from './MetricCard';
import HalteSelector from './HalteSelector';
import LiveChart from './LiveChart';

// Dynamically import MapPanel with SSR disabled
const MapPanel = dynamic(() => import('./MapPanel'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[var(--color-bg-elevated)] rounded-xl flex items-center justify-center animate-pulse">Memuat Peta...</div>
});

export default function Dashboard({ onLogout }) {
  const [selectedHalteId, setSelectedHalteId] = useState('all');
  const [halteStates, setHalteStates] = useState(createInitialState());
  const [chartDataPoints, setChartDataPoints] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Memoize aggregated data
  const aggregatedData = useMemo(() => getAggregated(halteStates), [halteStates]);

  const activeHalteCount = useMemo(() => {
    return Object.values(halteStates).filter(s => s.last_update !== null).length;
  }, [halteStates]);

  const handleDataUpdate = useCallback((payload) => {
    const { device_id, timestamp, data } = payload;
    const nowStr = timestamp || new Date().toISOString();
    
    setHalteStates(prev => {
      const newState = { ...prev };
      if (!newState[device_id]) {
        newState[device_id] = { history: [] };
      }
      
      const updatedHalte = {
        ...newState[device_id],
        masuk: data.masuk,
        keluar: data.keluar,
        total_saat_ini: data.total_saat_ini,
        last_update: nowStr,
      };
      
      updatedHalte.history = [...updatedHalte.history, {
        timestamp: nowStr,
        total_saat_ini: data.total_saat_ini,
        masuk: data.masuk,
        keluar: data.keluar
      }].slice(-50); // Keep last 50
      
      newState[device_id] = updatedHalte;
      return newState;
    });

    setLastUpdateTime(nowStr);
  }, []);

  const { status: mqttStatus, connect: connectMqtt, disconnect: disconnectMqtt } = useMqtt(handleDataUpdate);
  const { isRunning: isSimulating, start: startSim, stop: stopSim } = useSimulator(handleDataUpdate);

  // Effect to update chart data whenever halteStates change
  useEffect(() => {
    if (lastUpdateTime) {
      setChartDataPoints(prev => {
        const timeLabel = new Date(lastUpdateTime).toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        
        const newPoint = {
          timeLabel,
          menunggu: aggregatedData.total_saat_ini,
          masuk: aggregatedData.masuk,
          keluar: aggregatedData.keluar
        };
        
        const newArray = [...prev, newPoint];
        if (newArray.length > 25) newArray.shift();
        return newArray;
      });
    }
  }, [lastUpdateTime, aggregatedData]);

  // Initial connection logic
  useEffect(() => {
    connectMqtt();
    
    // Auto start simulator if MQTT fails to connect within 5s
    const timeout = setTimeout(() => {
      if (mqttStatus !== 'connected' && !isSimulating) {
        console.log('[Dashboard] MQTT timeout — memulai mode simulasi');
        startSim();
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      disconnectMqtt();
      stopSim();
    };
  }, []); // Empty dep array for mount/unmount

  // Handle MQTT connected -> stop sim
  useEffect(() => {
    if (mqttStatus === 'connected' && isSimulating) {
      stopSim();
    }
  }, [mqttStatus, isSimulating, stopSim]);

  const toggleSimulator = () => {
    if (isSimulating) {
      stopSim();
      if (mqttStatus !== 'connected') {
         // Do nothing or try reconnect
      }
    } else {
      startSim();
      disconnectMqtt(); // Disconnect MQTT when manually starting simulator
    }
  };

  // Determine displayed metrics based on selection
  const displayedMetrics = selectedHalteId === 'all' 
    ? aggregatedData 
    : (halteStates[selectedHalteId] || { total_saat_ini: 0, masuk: 0, keluar: 0 });

  return (
    <div className="min-h-screen bg-[var(--color-bg-deepest)] flex flex-col font-sans animate-fade-in text-[var(--color-text-primary)]">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl shadow-lg border border-blue-400/30">
            🚍
          </div>
          <div>
            <h2 className="text-xl font-serif font-semibold tracking-wide m-0 text-white leading-tight">TransUm Bandung</h2>
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-medium">Koridor 5 — UNPAD Dipatiukur ↔ UNPAD Jatinangor</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.05)]">
            <span className={`w-2.5 h-2.5 rounded-full ${
              mqttStatus === 'connected' ? 'bg-green-500 animate-pulse-dot shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
              isSimulating ? 'bg-yellow-500 animate-pulse-dot shadow-[0_0_8px_rgba(250,204,21,0.6)]' :
              'bg-red-500'
            }`}></span>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {mqttStatus === 'connected' ? 'MQTT Terhubung' : isSimulating ? 'Mode Simulasi' : mqttStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
            </span>
          </div>

          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={toggleSimulator}
            title="Toggle Mode Simulasi"
          >
            <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-white transition-colors">Simulasi</span>
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isSimulating ? 'bg-blue-600' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${isSimulating ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
            title="Keluar"
          >
            <span>↩</span>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        <HalteSelector 
          selectedHalteId={selectedHalteId} 
          onSelect={setSelectedHalteId} 
          halteStates={halteStates} 
        />

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Menunggu" 
            value={displayedMetrics.total_saat_ini} 
            icon="🧑‍🤝‍🧑" 
            variant="green" 
          />
          <MetricCard 
            title="Akumulasi Masuk" 
            value={displayedMetrics.masuk} 
            icon="📥" 
            variant="yellow" 
          />
          <MetricCard 
            title="Akumulasi Keluar" 
            value={displayedMetrics.keluar} 
            icon="📤" 
            variant="red" 
          />
        </section>

        {/* Panels */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
          {/* Map Panel */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[rgba(255,255,255,0.06)] flex flex-col shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <h3 className="text-lg font-serif m-0 flex items-center gap-2">
                <span>🗺️</span> Peta Koridor 5
              </h3>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                Live
              </span>
            </div>
            <div className="flex-1 relative">
              <MapPanel 
                selectedHalteId={selectedHalteId} 
                onHalteSelect={setSelectedHalteId} 
                halteStates={halteStates} 
              />
            </div>
          </div>

          {/* Chart Panel */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[rgba(255,255,255,0.06)] flex flex-col shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <h3 className="text-lg font-serif m-0 flex items-center gap-2">
                <span>📊</span> Tren Kepadatan
              </h3>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                Real-time
              </span>
            </div>
            <div className="flex-1 p-4 relative min-h-[300px]">
               <LiveChart dataPoints={chartDataPoints} />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[rgba(255,255,255,0.06)] py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-base)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>📡</span>
            <span>Halte aktif: <strong className="text-[var(--color-text-secondary)]">{activeHalteCount}</strong> / 16</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🕐</span>
            <span>Update terakhir: <strong className="text-[var(--color-text-secondary)]">
              {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
            </strong></span>
          </div>
        </div>
        <div className="text-center md:text-right">
          <span>TransUm Bandung PoC — Metro Jabar Trans Koridor 5</span>
        </div>
      </footer>

    </div>
  );
}
