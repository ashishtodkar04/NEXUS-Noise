import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Layers, ShieldAlert, Calendar, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/MapView';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const Map = () => {
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

  const [showEvents, setShowEvents] = useState(true);
  const [showComplaints, setShowComplaints] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSelectOnMap = (type, item) => {
    setSelectedItem({ type, data: item });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">GIS Noise Command Map</h1>
              <p className="text-xs text-slate-400">Interactive GIS mapping of active events, verified complaints, and high-decibel alert zones.</p>
            </div>

            {/* Map Layers Toggles */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
              <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEvents}
                  onChange={(e) => setShowEvents(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-200">Show Events</span>
              </label>
              <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showComplaints}
                  onChange={(e) => setShowComplaints(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-slate-200">Show Complaints</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[600px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
              {loading && (
                <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}
              <MapView
                events={showEvents ? events : []}
                complaints={showComplaints ? complaints : []}
                height="100%"
                onItemSelect={handleSelectOnMap}
              />
            </div>

            {/* Side Drawer Inspection Panel */}
            <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 overflow-y-auto max-h-[600px]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Map Element Inspection
              </h3>

              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-blue-400 font-bold">{selectedItem.data.id || selectedItem.data._id}</span>
                    <StatusBadge status={selectedItem.data.status} />
                  </div>

                  <h4 className="font-extrabold text-lg text-white">
                    {selectedItem.data.name || selectedItem.data.eventName || selectedItem.data.event_name || 'Noise Complaint Marker'}
                  </h4>

                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> {selectedItem.data.location?.address || selectedItem.data.locationName || selectedItem.data.location}
                  </p>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Peak Decibel:</span>
                      <strong className="text-red-400 font-bold">
                        {selectedItem.data.currentEstimatedNoise || selectedItem.data.measuredMaxNoise || selectedItem.data.analysis?.predicted_source_db?.toFixed(1) || 'N/A'} dB(A)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Permitted Limit:</span>
                      <strong className="text-emerald-400 font-bold">
                        {selectedItem.data.permittedNoise || selectedItem.data.permitted_db || 65} dB(A)
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const id = selectedItem.data.id || selectedItem.data._id;
                      if (selectedItem.type === 'complaint') {
                        window.location.href = `/police/complaints/${id}`;
                      } else {
                        window.location.href = `/police/events/${id}`;
                      }
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    Open Full Inspection File →
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 space-y-2">
                  <MapPin className="w-8 h-8 mx-auto opacity-40 text-blue-400" />
                  <p className="text-xs">Click any marker pin on the map to view full telemetry & evidence details.</p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Map;
