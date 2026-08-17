import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RefreshCw, Radio, MapPin, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import NoiseMeter from '../../components/NoiseMeter';
import api, { WS_URL } from '../../services/api';

const Monitoring = () => {
  const [zones, setZones] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Build monitoring zones from real backend data: each sanctioned event is a zone.
  // The live dB reading is the average of verified complaints logged near that event.
  const buildZones = (events, complaints) => {
    if (!events || !events.length) return [];
    return events.map(e => {
      const elat = e.location?.latitude;
      const elon = e.location?.longitude;
      let near = [];
      if (elat != null && elon != null) {
        near = complaints.filter(c =>
          c.event_location?.latitude != null &&
          Math.abs(c.event_location.latitude - elat) < 0.08 &&
          Math.abs(c.event_location.longitude - elon) < 0.08
        );
      }
      const avg = near.length
        ? Math.round(near.reduce((s, c) => s + (c.analysis?.predicted_source_db || c.measuredMaxNoise || 0), 0) / near.length)
        : null;
      const limitDb = e.permitted_db ?? e.permittedNoise ?? 65;
      const currentDb = avg ?? limitDb;
      return {
        id: e._id || e.id,
        name: e.name || 'Unnamed Monitoring Zone',
        location: e.location?.address || e.location_name || '—',
        currentDb,
        limitDb,
        breached: currentDb > limitDb
      };
    });
  };

  const fetchZones = useCallback(async () => {
    try {
      const [eventsRes, compRes] = await Promise.all([
        api.get('/events/'),
        api.get('/complaints/')
      ]);
      const z = buildZones(eventsRes.data, compRes.data);
      setZones(z);
      setSelectedId(prev => prev || z[0]?.id || null);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(false);
    } catch (err) {
      console.error('Failed to load monitoring telemetry', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // Live stream via WebSocket — re-sync whenever a new valid complaint is broadcast.
  useEffect(() => {
    let ws = null;
    if (isStreaming) {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_valid_complaint') {
            fetchZones();
          }
        } catch (e) { /* ignore malformed frames */ }
      };
    }
    return () => { if (ws) ws.close(); };
  }, [isStreaming, fetchZones]);

  const selectedZone = zones.find(z => z.id === selectedId) || zones[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-ping" />
                <h1 className="text-3xl font-extrabold text-white">Live Acoustic Stream Telemetry</h1>
              </div>
              <p className="text-xs text-slate-400">Live IoT sound sensor telemetry across sanctioned event zones and verified complaint locations.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow ${isStreaming ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
              >
                {isStreaming ? <><Pause className="w-4 h-4" /> Pause Stream Feed</> : <><Play className="w-4 h-4" /> Resume Stream Feed</>}
              </button>
              <button
                onClick={fetchZones}
                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow"
              >
                <RefreshCw className="w-4 h-4 text-blue-400" /> Sync Data
              </button>
            </div>
          </div>

          {error ? (
            <div className="glass-panel p-10 rounded-3xl border border-red-500/40 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Telemetry feed unavailable</h3>
                <p className="text-xs text-slate-400 mt-1">Unable to reach the backend. Ensure the API server is running, then press "Sync Data".</p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              <div className="h-72 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800"></div>
              <div className="h-40 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800"></div>
            </div>
          ) : zones.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
              <MapPin className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-extrabold text-lg text-white">No active monitoring zones</h3>
              <p className="text-xs text-slate-400">Sanctioned events or verified complaints will appear here once recorded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Active Selected Zone Stream Telemetry Gauge */}
              <div className="lg:col-span-1 space-y-4">
                {selectedZone && (
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-blue-400 font-bold">{selectedZone.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedZone.breached ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {selectedZone.breached ? 'THRESHOLD EXCEEDED' : 'COMPLIANT STREAM'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-xl text-white">{selectedZone.name}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" /> {selectedZone.location}
                    </p>

                    <NoiseMeter
                      currentDb={selectedZone.currentDb}
                      permittedDb={selectedZone.limitDb}
                      isLive={isStreaming}
                      duration={lastUpdate ? `LAST SYNC ${lastUpdate}` : 'LIVE FEED'}
                    />

                    <button
                      onClick={() => alert(`Patrol squad dispatched to ${selectedZone.name}`)}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-red-600/30"
                    >
                      Dispatch Patrol Squad to Sector
                    </button>
                  </div>
                )}
              </div>

              {/* Grid of All Municipal Sensor Zones */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">All Active IoT Sector Sensors</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      onClick={() => setSelectedId(z.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedZone?.id === z.id ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-slate-400">{z.id}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${z.breached ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-950 text-emerald-400'}`}>
                          {z.breached ? 'BREACH' : 'NORMAL'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white">{z.name}</h4>

                      <div className="flex items-center justify-between mt-3 font-mono">
                        <span className="text-xs text-slate-400">Reading:</span>
                        <strong className={`text-lg font-black ${z.breached ? 'text-red-400' : 'text-emerald-400'}`}>{z.currentDb} dB(A)</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Monitoring;