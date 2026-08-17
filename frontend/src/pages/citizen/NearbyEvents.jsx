import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Filter, Volume2, ShieldAlert, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import MapView from '../../components/MapView';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const NearbyEvents = () => {
  const [events, setEvents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, complaintsRes] = await Promise.all([
          api.get('/events/'),
          api.get('/complaints/')
        ]);
        setEvents(eventsRes.data);
        setComplaints(complaintsRes.data);
      } catch (error) {
        console.error("Failed to fetch map data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');

  const filteredEvents = events.filter(e => {
    const locStr = (e.location?.address || e.location || '').toLowerCase();
    return !locationFilter || locStr.includes(locationFilter.toLowerCase());
  });

  const handleSelectOnMap = (type, item) => {
    setSelectedItem({ type, data: item });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Nearby Events & Noise Map</h1>
            <p className="text-xs text-slate-400">Discover active events in Pimpri-Chinchwad and verify their permitted sound limits.</p>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Filter by location (e.g. Pune)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            {loading && (
              <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            <MapView
              events={filteredEvents}
              complaints={complaints}
              height="100%"
              onItemSelect={handleSelectOnMap}
            />
          </div>

          {/* Side Drawer Info */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 overflow-y-auto max-h-[500px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Event Details & Noise Limits
            </h3>

            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-blue-400 font-bold">{selectedItem.data.id}</span>
                  <StatusBadge status={selectedItem.data.status} />
                </div>
                <h4 className="font-extrabold text-lg text-white">{selectedItem.data.name || selectedItem.data.eventName}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> {selectedItem.data.location || selectedItem.data.locationName}
                </p>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Permitted Limit:</span>
                    <strong className="text-emerald-400 font-mono font-bold">{selectedItem.data.permittedNoise || selectedItem.data.permitted_db || 'N/A'} dB(A)</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Estimated Current:</span>
                    <strong className="text-red-400 font-mono font-bold">{selectedItem.data.currentEstimatedNoise || selectedItem.data.measuredMaxNoise || selectedItem.data.analysis?.predicted_source_db?.toFixed(1) || 'N/A'} dB(A)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Organizer:</span>
                    <span className="text-slate-200 font-semibold">{selectedItem.data.organizer || 'Registered Organizer'}</span>
                  </div>
                </div>

                {selectedItem.data.description && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedItem.data.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <MapPin className="w-8 h-8 mx-auto opacity-40 text-blue-400" />
                <p className="text-xs">Click any map marker to view event sound limits and status.</p>
              </div>
            )}
          </div>
        </div>

        {/* Events Cards Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">All Sanctioned Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-slate-500 text-xs">No active events found.</div>
            ) : filteredEvents.map((e) => (
              <div key={e._id || e.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-400">{e._id || e.id}</span>
                  <StatusBadge status={e.status} />
                </div>
                <h4 className="font-bold text-white text-sm">{e.name}</h4>
                <p className="text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /> {e.location?.address || e.location}</p>
                <div className="p-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                  <span className="text-emerald-400 font-bold block mb-1">Police Approved ✓</span>
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-400">Permitted Limit: <strong className="text-emerald-400">{e.permitted_db || e.permittedNoise} dB</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default NearbyEvents;
