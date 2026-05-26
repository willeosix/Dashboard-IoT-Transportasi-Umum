/**
 * map.js
 * Modul peta Leaflet.js untuk visualisasi halte Koridor 5.
 * Basemap: CartoDB Dark Matter (sesuai dark theme).
 */

const MapModule = (() => {
  let _map = null;
  let _markers = {};     // { halteId: L.circleMarker }
  let _routeLine = null; // Polyline rute
  let _selectedHalteId = null;

  // Konfigurasi peta
  const MAP_CONFIG = {
    center: [-6.9150, 107.6800], // Tengah antara Bandung & Jatinangor
    zoom: 12,
    minZoom: 10,
    maxZoom: 18,
  };

  // Tile layer CartoDB Dark Matter
  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

  function init(containerId) {
    if (_map) return; // Already initialized

    _map = L.map(containerId, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: MAP_CONFIG.maxZoom,
      subdomains: 'abcd',
    }).addTo(_map);

    // Tambahkan semua markers halte
    _addHalteMarkers();

    // Gambar route line
    _drawRouteLine();

    // Fix render issue saat container di-show
    setTimeout(() => _map.invalidateSize(), 200);
  }

  function _addHalteMarkers() {
    const halteList = HalteData.getHalteList();
    
    halteList.forEach(halte => {
      const marker = L.circleMarker([halte.lat, halte.lng], {
        radius: 8,
        fillColor: '#6c757d',
        color: '#495057',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
        className: 'halte-marker'
      }).addTo(_map);

      // Popup content
      marker.bindPopup(_createPopupContent(halte, null), {
        className: 'dark-popup',
        maxWidth: 250,
      });

      // Click handler
      marker.on('click', () => {
        _selectedHalteId = halte.id;
        document.dispatchEvent(new CustomEvent('halte-selected', { detail: { halteId: halte.id } }));
      });

      // Tooltip on hover
      marker.bindTooltip(halte.name, {
        permanent: false,
        direction: 'top',
        className: 'dark-tooltip',
        offset: [0, -10]
      });

      _markers[halte.id] = marker;
    });
  }

  function _createPopupContent(halte, state) {
    const level = state ? HalteData.getDensityLevel(state.total_saat_ini) : 'unknown';
    const label = state ? HalteData.getDensityLabel(level) : 'Menunggu data...';
    const colors = HalteData.getDensityColor(level);
    
    return `
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-order">#${halte.order}</span>
          <strong>${halte.name}</strong>
        </div>
        <div class="popup-status" style="color: ${colors.fill}">
          <span class="popup-dot" style="background: ${colors.fill}"></span>
          ${label}
        </div>
        ${state ? `
          <div class="popup-metrics">
            <div class="popup-metric">
              <span class="popup-metric-label">Menunggu</span>
              <span class="popup-metric-value">${state.total_saat_ini}</span>
            </div>
            <div class="popup-metric">
              <span class="popup-metric-label">Masuk</span>
              <span class="popup-metric-value">${state.masuk}</span>
            </div>
            <div class="popup-metric">
              <span class="popup-metric-label">Keluar</span>
              <span class="popup-metric-value">${state.keluar}</span>
            </div>
          </div>
          <div class="popup-time">Update: ${new Date(state.last_update).toLocaleTimeString('id-ID')}</div>
        ` : '<div class="popup-waiting">Belum ada data</div>'}
      </div>
    `;
  }

  function _drawRouteLine() {
    const halteList = HalteData.getHalteList();
    const coords = halteList.map(h => [h.lat, h.lng]);

    _routeLine = L.polyline(coords, {
      color: '#40916c',
      weight: 3,
      opacity: 0.4,
      dashArray: '10, 8',
      smoothFactor: 1.5,
    }).addTo(_map);
  }

  /**
   * Update warna marker berdasarkan data terbaru
   */
  function updateMarker(halteId) {
    const marker = _markers[halteId];
    if (!marker) return;

    const halte = HalteData.getHalteById(halteId);
    const state = HalteData.getState(halteId);
    if (!halte || !state) return;

    const level = HalteData.getDensityLevel(state.total_saat_ini);
    const colors = HalteData.getDensityColor(level);

    marker.setStyle({
      fillColor: colors.fill,
      color: colors.stroke,
    });

    // Update popup content
    marker.setPopupContent(_createPopupContent(halte, state));

    // Pulse effect on marker
    const markerEl = marker.getElement();
    if (markerEl) {
      markerEl.classList.remove('marker-pulse');
      void markerEl.offsetWidth;
      markerEl.classList.add('marker-pulse');
    }
  }

  /**
   * Update semua markers
   */
  function updateAllMarkers() {
    const halteList = HalteData.getHalteList();
    halteList.forEach(halte => updateMarker(halte.id));
  }

  /**
   * Focus peta ke halte tertentu
   */
  function focusHalte(halteId) {
    const halte = HalteData.getHalteById(halteId);
    if (!halte) return;

    _map.setView([halte.lat, halte.lng], 15, { animate: true });
    
    const marker = _markers[halteId];
    if (marker) marker.openPopup();
  }

  /**
   * Reset view ke seluruh rute
   */
  function fitRoute() {
    if (_routeLine) {
      _map.fitBounds(_routeLine.getBounds(), { padding: [30, 30] });
    }
  }

  function invalidateSize() {
    if (_map) {
      setTimeout(() => _map.invalidateSize(), 100);
    }
  }

  function getSelectedHalte() {
    return _selectedHalteId;
  }

  return {
    init,
    updateMarker,
    updateAllMarkers,
    focusHalte,
    fitRoute,
    invalidateSize,
    getSelectedHalte
  };
})();
