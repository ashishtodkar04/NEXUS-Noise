import { useState, useCallback } from 'react';

// Pune city-centre fallback used when location is unavailable.
export const FALLBACK_COORDS = { latitude: 18.6279, longitude: 73.8009 };

// Wraps the navigator.geolocation permission flow so pages can require a real
// location before proceeding ("status" drives the permission gate).
// status: 'prompt' | 'granted' | 'denied' | 'unavailable'
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('prompt');
  const [error, setError] = useState('');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation is not supported by this browser/device.');
      return null;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setCoords(c);
        setStatus('granted');
        setError('');
      },
      (err) => {
        setCoords(null);
        setStatus('denied');
        setError('Location permission was denied. Please enable location access for this site and try again.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  return { coords, status, error, request };
}
