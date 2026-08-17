import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Eye, Volume2, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/');
        setEvents(res.data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Event Compliance Management</h1>
              <p className="text-xs text-slate-400">Monitor active sanctioned public events, compliance scores, and sound system permits.</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">EVENT ID</th>
                    <th className="p-4">EVENT NAME</th>
                    <th className="p-4">ORGANIZER</th>
                    <th className="p-4">LOCATION</th>
                    <th className="p-4">DATE & TIME</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">PERMITTED</th>
                    <th className="p-4">CURRENT</th>
                    <th className="p-4">COMPLIANCE SCORE</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="p-12 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-slate-500 text-sm">
                        No events found.
                      </td>
                    </tr>
                  ) : events.map((evt) => (
                    <tr key={evt._id || evt.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-400">{evt._id || evt.id}</td>
                      <td className="p-4 font-bold text-white max-w-[200px] truncate">{evt.name}</td>
                      <td className="p-4 text-slate-300">{evt.organizer || 'N/A'}</td>
                      <td className="p-4 text-slate-400">{evt.location?.address || evt.location || 'N/A'}</td>
                      <td className="p-4 font-mono text-slate-300">
                        {evt.date} <span className="text-[10px] text-slate-500 block">{evt.time || `${evt.start_time} - ${evt.end_time}`}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={evt.status} />
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{evt.permitted_db || evt.permittedNoise || 65} dB</td>
                      <td className="p-4 font-mono font-bold text-red-400">{evt.currentEstimatedNoise || 'N/A'} dB</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (evt.complianceScore || 100) > 80 ? 'bg-emerald-500' : (evt.complianceScore || 100) > 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${evt.complianceScore || 100}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs">{evt.complianceScore || 100}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/police/events/${evt._id || evt.id}`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Events;
