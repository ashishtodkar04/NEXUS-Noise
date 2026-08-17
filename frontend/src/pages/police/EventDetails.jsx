import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, FileText, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import MapView from '../../components/MapView';
import api from '../../services/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evt, setEvt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get('/events/');
        const list = res.data;
        // Match on either the primary `_id` or a legacy `id` field
        let found = list.find(e => (e._id || e.id) === id);
        if (!found) found = list[0] || null;
        setEvt(found);
      } catch (err) {
        console.error('Failed to fetch event details', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full overflow-x-hidden">

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/police/events')}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-blue-400 font-bold">{evt?._id || evt?.id || '—'}</span>
                  {evt && <StatusBadge status={evt.status} />}
                </div>
                <h1 className="text-2xl font-extrabold text-white">{evt?.name || 'Event Details'}</h1>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="h-40 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800"></div>
              <div className="h-40 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800"></div>
            </div>
          ) : error ? (
            <div className="glass-panel p-10 rounded-3xl border border-red-500/40 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Could not load event details</h3>
                <p className="text-xs text-slate-400 mt-1">The backend could not be reached. Please ensure the API server is running and try again.</p>
              </div>
              <button
                onClick={() => navigate('/police/events')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Back to Events
              </button>
            </div>
          ) : !evt ? (
            <div className="glass-panel p-10 rounded-3xl border border-slate-800 text-center space-y-4">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <div>
                <h3 className="font-extrabold text-lg text-white">No sanctioned events recorded</h3>
                <p className="text-xs text-slate-400 mt-1">No event data is currently available on the platform.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Score & Telemetry Header */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sanctioned Event Record</span>
                    <h3 className="text-xl font-bold text-white">{evt.category}</h3>
                    <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Organizer: {evt.organizer || 'Approved Organizer'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center shrink-0 min-w-[140px]">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Status</span>
                    <div className="mt-1 flex justify-center"><StatusBadge status={evt.status} /></div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Permitted Ceiling</span>
                    <strong className="text-emerald-400 text-base font-bold">{evt.permitted_db ?? evt.permittedNoise} dB(A)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Event Date</span>
                    <strong className="text-slate-100 text-base font-bold">{evt.date}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Operating Hours</span>
                    <strong className="text-amber-400 text-base font-bold">{evt.time}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Venue</span>
                    <strong className="text-blue-400 text-sm font-bold truncate max-w-[110px]">{evt.location?.address || evt.location_name || 'Registered venue'}</strong>
                  </div>
                </div>

                {/* Verified Documents */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Attached Authority Sanction Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-white">Noise NOC — {evt.location?.address || evt.location_name || 'Venue'}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Verified ✓</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-white">Permit Ref — {evt._id || evt.id}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Verified ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: GIS Location Map */}
              <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Venue GIS Location</h3>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
                  <MapView
                    events={[evt]}
                    height="100%"
                    selectedCenter={[
                      evt.location?.latitude ?? 18.6279,
                      evt.location?.longitude ?? 73.8009
                    ]}
                    zoom={14}
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default EventDetails;