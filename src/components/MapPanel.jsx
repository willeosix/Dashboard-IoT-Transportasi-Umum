'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup, useMap } from 'react-leaflet';
import { HALTE_LIST, getDensityColor, getDensityLevel, getDensityLabel } from '@/utils/halte-data';

// Helper component to handle map programmatic focus
function MapController({ selectedHalteId, routeLineRef, markersRef }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size after a short delay to fix render issues
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedHalteId && selectedHalteId !== 'all') {
      const halte = HALTE_LIST.find(h => h.id === selectedHalteId);
      if (halte) {
        map.setView([halte.lat, halte.lng], 15, { animate: true });
        // Optionally open popup
        const marker = markersRef.current[halte.id];
        if (marker) {
          marker.openPopup();
        }
      }
    } else if (selectedHalteId === 'all') {
      if (routeLineRef.current) {
        map.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
      }
    }
  }, [selectedHalteId, map, markersRef, routeLineRef]);

  return null;
}

export default function MapPanel({ selectedHalteId, onHalteSelect, halteStates }) {
  const routeLineRef = useRef(null);
  const markersRef = useRef({});

  const MAP_CONFIG = {
    center: [-6.9150, 107.6800], // Tengah antara Bandung & Jatinangor
    zoom: 12,
    minZoom: 10,
    maxZoom: 18,
  };

  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

  const routeCoords = HALTE_LIST.map(h => [h.lat, h.lng]);

  return (
    <MapContainer
      center={MAP_CONFIG.center}
      zoom={MAP_CONFIG.zoom}
      minZoom={MAP_CONFIG.minZoom}
      maxZoom={MAP_CONFIG.maxZoom}
      zoomControl={true}
      className="w-full h-full rounded-xl z-0"
    >
      <TileLayer
        attribution={TILE_ATTR}
        url={TILE_URL}
        subdomains="abcd"
      />
      
      <MapController 
        selectedHalteId={selectedHalteId} 
        routeLineRef={routeLineRef}
        markersRef={markersRef}
      />

      <Polyline
        ref={routeLineRef}
        positions={routeCoords}
        pathOptions={{
          color: '#40916c',
          weight: 3,
          opacity: 0.4,
          dashArray: '10, 8'
        }}
      />

      {HALTE_LIST.map((halte) => {
        const state = halteStates[halte.id];
        const level = state ? getDensityLevel(state.total_saat_ini) : 'unknown';
        const label = state ? getDensityLabel(level) : 'Menunggu data...';
        const colors = getDensityColor(level);

        return (
          <CircleMarker
            key={halte.id}
            center={[halte.lat, halte.lng]}
            pathOptions={{
              fillColor: colors.fill,
              color: colors.stroke,
              weight: 2,
              opacity: 1,
              fillOpacity: 0.85
            }}
            radius={8}
            eventHandlers={{
              click: () => onHalteSelect(halte.id),
            }}
            ref={(ref) => {
              if (ref) markersRef.current[halte.id] = ref;
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              className="dark-tooltip"
            >
              {halte.name}
            </Tooltip>
            <Popup className="dark-popup" maxWidth={250}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.1)] pb-2 mb-1">
                  <span className="bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    #{halte.order}
                  </span>
                  <strong className="text-[var(--color-text-primary)] font-serif text-lg">{halte.name}</strong>
                </div>
                
                <div className="flex items-center gap-2 text-sm" style={{ color: colors.fill }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.fill }}></span>
                  {label}
                </div>

                {state ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Menunggu</span>
                        <span className="text-lg text-[var(--color-text-primary)] font-medium">{state.total_saat_ini}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Masuk</span>
                        <span className="text-lg text-[var(--color-text-primary)] font-medium">{state.masuk}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Keluar</span>
                        <span className="text-lg text-[var(--color-text-primary)] font-medium">{state.keluar}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-2 text-right italic">
                      Update: {new Date(state.last_update).toLocaleTimeString('id-ID')}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-[var(--color-text-muted)] mt-2 italic">Belum ada data</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
