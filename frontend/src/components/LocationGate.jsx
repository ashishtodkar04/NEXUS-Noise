import React from 'react';
import { MapPin, ShieldAlert } from 'lucide-react';

// Blocks the feature until the user grants location permission.
// status: 'prompt' | 'granted' | 'denied' | 'unavailable'
const LocationGate = ({ status, onRequest, children }) => {
  if (status === 'granted') return children;

  const msg =
    status === 'denied'
      ? 'You denied location access. This app needs your real location so reports and permits are filed from the correct place.'
      : status === 'unavailable'
        ? 'Your browser/device does not support geolocation. Please use a supported browser.'
        : status === 'prompt'
          ? 'This feature needs your location to work correctly. Please allow access to continue.'
          : 'Location access is required.';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center space-y-5">
        <div
          className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
            status === 'denied' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'
          }`}
        >
          {status === 'prompt' ? <MapPin className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">Location Required</h2>
          <p className="text-xs text-slate-400 mt-1">{msg}</p>
        </div>
        <button
          onClick={onRequest}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {status === 'prompt'
            ? 'Share My Location'
            : status === 'unavailable'
              ? 'Try Again'
              : 'Enable Location & Retry'}
        </button>
        {status === 'denied' && (
          <p className="text-[10px] text-slate-500">
            Tip: click the padlock / site-preference icon in your browser's address bar, allow location for this site, then press retry.
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationGate;