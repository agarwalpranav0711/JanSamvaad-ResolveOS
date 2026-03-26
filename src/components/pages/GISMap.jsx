import { useEffect, useRef, useState, useMemo } from 'react';

const WARD_COORDS = [
  { ward: 1, name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { ward: 2, name: 'Karol Bagh', lat: 28.6514, lng: 77.1907 },
  { ward: 3, name: 'Lajpat Nagar', lat: 28.5677, lng: 77.2433 },
  { ward: 4, name: 'Dwarka', lat: 28.5921, lng: 77.0460 },
  { ward: 5, name: 'Rohini', lat: 28.7495, lng: 77.0680 },
  { ward: 6, name: 'Janakpuri', lat: 28.6219, lng: 77.0878 },
  { ward: 7, name: 'Saket', lat: 28.5244, lng: 77.2090 },
  { ward: 8, name: 'Mayur Vihar', lat: 28.6080, lng: 77.2921 },
  { ward: 9, name: 'Pitampura', lat: 28.7042, lng: 77.1314 },
  { ward: 10, name: 'Nehru Place', lat: 28.5491, lng: 77.2519 },
];

const SEV_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const SEV_LABELS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function getWardCoord(wardId) {
  const id = Number(wardId);
  return WARD_COORDS.find(w => w.ward === id) || WARD_COORDS[Math.abs(id - 1) % WARD_COORDS.length];
}

export default function GISMap({ tickets = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [filter, setFilter] = useState('ALL');
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => setLeafletReady(true);
    document.head.appendChild(js);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [leafletReady]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return tickets;
    return tickets.filter(t => (t.severity || '').toUpperCase() === filter);
  }, [tickets, filter]);

  // Render markers
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    const L = window.L;
    const map = mapInstance.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    filtered.forEach(ticket => {
      const coord = getWardCoord(ticket.ward_id);
      const sev = (ticket.severity || 'MEDIUM').toUpperCase();
      const color = SEV_COLORS[sev] || SEV_COLORS.MEDIUM;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #112240;box-shadow:0 0 6px ${color}80;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([coord.lat + (Math.random() - 0.5) * 0.01, coord.lng + (Math.random() - 0.5) * 0.01], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;color:white;background:#1A2F4A;padding:12px;border-radius:8px;min-width:200px;">
            <p style="font-weight:700;font-size:14px;color:#FF9933;margin:0 0 6px;">${ticket.ref || '—'}</p>
            <p style="font-size:12px;margin:2px 0;"><b>Category:</b> ${ticket.category || '—'}</p>
            <p style="font-size:12px;margin:2px 0;"><b>Severity:</b> <span style="color:${color}">${sev}</span></p>
            <p style="font-size:12px;margin:2px 0;"><b>Status:</b> ${ticket.status || '—'}</p>
            <p style="font-size:12px;margin:2px 0;"><b>Ward:</b> ${coord.name}</p>
            <p style="font-size:11px;font-style:italic;color:#8A9BB5;margin:6px 0 0;">${ticket.summary || ticket.ai_summary || 'No summary'}</p>
          </div>
        `, { className: 'leaflet-dark-popup' });

      markersRef.current.push(marker);
    });
  }, [filtered, leafletReady]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[white]">GIS Complaint Map</h2>
          <p className="text-xs text-[#8A9BB5]/50">Live complaint pins across Delhi wards</p>
        </div>
        <div className="flex gap-1.5">
          {SEV_LABELS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === s
                  ? 'bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30'
                  : 'bg-white/[0.03] text-[#8A9BB5]/50 border border-white/5 hover:bg-white/[0.06]'
              }`}
            >
              {s === 'ALL' ? `ALL (${tickets.length})` : s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl border border-white/10 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {!leafletReady && (
          <div className="absolute inset-0 bg-[#112240] flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#8A9BB5]/50">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-[#112240]/90 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
          <p className="text-xs font-semibold text-[white] mb-2">Legend</p>
          {Object.entries(SEV_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2 text-xs text-[#8A9BB5]/60 mb-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .leaflet-dark-popup .leaflet-popup-content-wrapper { background: #1A2F4A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
        .leaflet-dark-popup .leaflet-popup-content { margin: 0; }
        .leaflet-dark-popup .leaflet-popup-tip { background: #1A2F4A; }
        .leaflet-dark-popup .leaflet-popup-close-button { color: #8A9BB5; }
      `}</style>
    </div>
  );
}
