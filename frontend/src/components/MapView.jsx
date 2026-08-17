import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Calendar, MapPin, Volume2, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';

// Heatmap Layer Component
const HeatmapLayer = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !data || data.length === 0) return;
    
    const points = data.map(c => {
      const lat = c.event_location?.latitude || c.complaint_giver_location?.latitude || c.location?.latitude || c.lat || 18.6279;
      const lng = c.event_location?.longitude || c.complaint_giver_location?.longitude || c.location?.longitude || c.lng || 73.8009;
      const noise = c.analysis?.predicted_source_db || c.measuredMaxNoise || 80;
      const intensity = Math.min(noise / 100, 1.0);
      return [lat, lng, intensity];
    });
    
    const heat = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 16,
      gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}
    }).addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, data]);
  
  return null;
};

// Helper component to center map when selected item changes
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom colored SVG marker icons for Leaflet
const createCustomIcon = (colorHex, typeLabel) => {
  const svgHtml = `
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.163 24.837 0 16 0Z" fill="${colorHex}" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="16" cy="16" r="7" fill="#0F172A"/>
      <circle cx="16" cy="16" r="4" fill="${colorHex}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  });
};

const iconApproved = createCustomIcon('#22c55e', 'Approved');
const iconWarning = createCustomIcon('#f59e0b', 'Warning');
const iconViolation = createCustomIcon('#ef4444', 'Violation');
const iconComplaint = createCustomIcon('#3b82f6', 'Complaint');

const MapView = ({
  events = [],
  complaints = [],
  height = "450px",
  selectedCenter = [18.6279, 73.8009],
  zoom = 13,
  onItemSelect
}) => {
  const defaultCenter = selectedCenter || [18.6279, 73.8009];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={defaultCenter} zoom={zoom} />
        
        {/* Render Heatmap using complaints data */}
        <HeatmapLayer data={complaints} />

        {/* Event Markers */}
        {events.map((evt) => {
          let icon = iconApproved;
          if (evt.currentEstimatedNoise > evt.permittedNoise + 5) icon = iconViolation;
          else if (evt.currentEstimatedNoise > evt.permittedNoise) icon = iconWarning;

          return (
            <Marker
              key={evt.id || evt._id}
              position={[evt.location?.latitude || evt.lat || 18.6279, evt.location?.longitude || evt.lng || 73.8009]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">EVENT</span>
                    <StatusBadge status={evt.status} />
                  </div>
                  <h4 className="font-bold text-sm text-gray-100 mb-1">{evt.name}</h4>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> {evt.location}
                  </p>
                  <div className="grid grid-cols-2 gap-1 bg-gray-900/80 p-2 rounded text-xs mb-2">
                    <div>
                      <span className="text-gray-400 text-[10px]">Permitted:</span>
                      <div className="font-bold text-emerald-400">{evt.permittedNoise} dB</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px]">Current:</span>
                      <div className={`font-bold ${evt.currentEstimatedNoise > evt.permittedNoise ? 'text-red-400' : 'text-gray-200'}`}>
                        {evt.currentEstimatedNoise || 'N/A'} dB
                      </div>
                    </div>
                  </div>
                  {onItemSelect && (
                    <button
                      onClick={() => onItemSelect('event', evt)}
                      className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Complaint Markers */}
        {complaints.map((comp) => {
          const cLat = comp.complaint_giver_location?.latitude || comp.location?.latitude || comp.lat || 18.6279;
          const cLng = comp.complaint_giver_location?.longitude || comp.location?.longitude || comp.lng || 73.8009;
          
          return (
          <Marker
            key={comp.id || comp._id}
            position={[cLat, cLng]}
            icon={comp.analysis?.is_valid ? iconViolation : iconComplaint}
          >
            <Popup>
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">COMPLAINT</span>
                  <StatusBadge status={comp.status} />
                </div>
                <h4 className="font-bold text-xs text-gray-100 mb-1">{comp.id || comp._id}</h4>
                <p className="text-xs text-gray-400 mb-2">{comp.description}</p>
                <div className="p-2 bg-red-950/40 border border-red-900/40 rounded text-xs mb-2">
                  <span className="text-gray-400">Predicted DB:</span>{' '}
                  <strong className="text-red-400 font-mono font-bold">{comp.analysis?.predicted_source_db?.toFixed(1) || '--'} dB(A)</strong> 
                  <br/>
                  <span className="text-gray-400">Area Limit: {comp.analysis?.area_limit_applied || '--'} dB</span>
                </div>
                {onItemSelect && (
                  <button
                    onClick={() => onItemSelect('complaint', comp)}
                    className="w-full py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
                  >
                    Examine Evidence
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
