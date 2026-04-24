/**
 * Map & Routing Logic (Leaflet + OSRM)
 */

const mapManager = {
  map: null,
  routeLayer: null,
  markers: [],
  
  // Base coordinates (e.g., driver location in NY)
  driverLoc: [40.730610, -73.935242],

  init() {
    // Initialize Leaflet map
    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView(this.driverLoc, 13);

    // Use a premium dark tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);

    // Draw driver marker
    this.drawMarker(this.driverLoc, 'you');
  },

  drawMarker(coords, type, number = '') {
    let bgColor, borderColor;
    let label = '';
    
    if (type === 'you') {
      bgColor = '#1a73e8'; borderColor = '#6060ff'; label = '📍 You';
    } else if (type === 'dd-pickup' || type === 'dd-dropoff') {
      bgColor = '#ff3008'; borderColor = '#ff9040';
      label = type.includes('pickup') ? '🏪 DD' : '🏠 DD';
    } else if (type === 'ue-pickup' || type === 'ue-dropoff') {
      bgColor = '#06c167'; borderColor = '#40ff80';
      label = type.includes('pickup') ? '🏪 UE' : '🏠 UE';
    }

    const html = `
      <div style="background: #14141e; border: 2px solid ${borderColor}; color: ${bgColor}; padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px;">
        ${label}
        ${number ? `<span style="background: #f0c040; color: #000; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px;">${number}</span>` : ''}
      </div>
      <div style="width: 2px; height: 10px; background: ${borderColor}; margin: 0 auto;"></div>
      <div style="width: 6px; height: 6px; background: ${bgColor}; border-radius: 50%; margin: 0 auto;"></div>
    `;

    const icon = L.divIcon({
      className: 'custom-pin',
      html: html,
      iconSize: [60, 40],
      iconAnchor: [30, 40]
    });

    const marker = L.marker(coords, { icon }).addTo(this.map);
    this.markers.push(marker);
  },

  clearRoute() {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }
    // Remove all markers except driver (driver is index 0)
    if (this.markers.length > 1) {
      for (let i = 1; i < this.markers.length; i++) {
        this.map.removeLayer(this.markers[i]);
      }
      this.markers = [this.markers[0]];
    }
  },

  async calculateAndDrawRoute(stops) {
    this.clearRoute();
    
    if (stops.length === 0) return;

    // stops: [{coords: [lat, lng], type: 'dd-pickup'}]
    
    // Draw markers
    stops.forEach((stop, idx) => {
      this.drawMarker(stop.coords, stop.type, idx + 1);
    });

    // Build OSRM request string: lon,lat;lon,lat
    const coordsStr = [this.driverLoc, ...stops.map(s => s.coords)]
      .map(c => `${c[1]},${c[0]}`) // OSRM takes lon,lat
      .join(';');

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const geojson = data.routes[0].geometry;
        
        this.routeLayer = L.geoJSON(geojson, {
          style: {
            color: '#1a73e8',
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10'
          }
        }).addTo(this.map);

        // Adjust map bounds to fit route
        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [30, 30] });
      }
    } catch (e) {
      console.error("Routing error:", e);
      app.showToast("⚠️ Could not fetch actual route, using direct lines");
      // Fallback: draw straight lines
      const latlngs = [this.driverLoc, ...stops.map(s => s.coords)];
      this.routeLayer = L.polyline(latlngs, {color: '#1a73e8', weight: 4, dashArray: '5,10'}).addTo(this.map);
      this.map.fitBounds(this.routeLayer.getBounds(), { padding: [30, 30] });
    }
  }
};
