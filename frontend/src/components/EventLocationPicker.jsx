import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
      });
    },
  });
  return null;
};

// Interactive map that lets the applicant place a pin for the exact event location.
const EventLocationPicker = ({ value, onChange, center }) => {
  const [marker, setMarker] = useState(value || null);
  const [centerC] = useState(center || [18.6279, 73.8009]);

  const pick = (c) => {
    setMarker(c);
    if (onChange) onChange(c);
  };

  return (
    <div className="space-y-2">
      <div className="h-52 rounded-2xl overflow-hidden border border-slate-800">
        <MapContainer center={centerC} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          {marker && <Marker position={[marker.latitude, marker.longitude]} />}
        </MapContainer>
      </div>
      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <MapPin className="w-3 h-3 text-blue-400" />
        Click the map to pin the exact event location.
        {marker ? (
          <span className="font-mono text-blue-400">
            Lat {marker.latitude}, Lng {marker.longitude}
          </span>
        ) : (
          ' No pin set yet.'
        )}
      </p>
    </div>
  );
};

export default EventLocationPicker;