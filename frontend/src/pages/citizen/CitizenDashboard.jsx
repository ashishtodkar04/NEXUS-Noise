import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileCheck, MapPin, Calendar, Volume2, Clock, ChevronRight, Activity, Bell, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const CitizenDashboard = () => {
  const [events, setEvents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, complaintsRes] = await Promise.all([
          api.get('/events/'),
          api.get('/complaints/')
        ]);
        setEvents(eventsRes.data);
        setComplaints(complaintsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const nearbyEvents = events.slice(0, 3);
  const myRecentComplaints = complaints.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location: Pimpri-Chinchwad, Pune</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Citizen Compliance Hub</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Monitor ambient noise decibels, view nearby events, and submit timestamped noise complaints.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              to="/citizen/complaint"
              className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xs shadow-xl shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Noise Now</span>
            </Link>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/citizen/complaint"
              className="p-5 bg-gradient-to-br from-red-950/40 to-slate-900 hover:from-red-900/50 hover:to-slate-800 border border-red-900/40 rounded-2xl flex flex-col justify-between group transition-all"
            >
              <div className="p-3 rounded-xl bg-red-600 text-white w-fit group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="font-bold text-sm text-white block">Report Excessive Noise</span>
                <span className="text-[11px] text-slate-400">Submit microphone evidence</span>
              </div>
            </Link>

            <Link
              to="/citizen/apply"
              className="p-5 bg-gradient-to-br from-blue-950/40 to-slate-900 hover:from-blue-900/50 hover:to-slate-800 border border-blue-900/40 rounded-2xl flex flex-col justify-between group transition-all"
            >
              <div className="p-3 rounded-xl bg-blue-600 text-white w-fit group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="font-bold text-sm text-white block">Apply for Event Approval</span>
                <span className="text-[11px] text-slate-400">Get official noise permit</span>
              </div>
            </Link>

            <Link
              to="/citizen/events"
              className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex flex-col justify-between group transition-all"
            >
              <div className="p-3 rounded-xl bg-indigo-600 text-white w-fit group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="font-bold text-sm text-white block">View Nearby Events</span>
                <span className="text-[11px] text-slate-400">Interactive GIS map</span>
              </div>
            </Link>

            <Link
              to="/citizen/complaints"
              className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex flex-col justify-between group transition-all"
            >
              <div className="p-3 rounded-xl bg-slate-800 text-slate-200 w-fit group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <span className="font-bold text-sm text-white block">View My Complaints</span>
                <span className="text-[11px] text-slate-400">Track status timeline</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Grid: Nearby Events List */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Nearby Events & Active Permits */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Nearby Sanctioned Events</h2>
              <Link to="/citizen/events" className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1">
                View All Events <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : nearbyEvents.length === 0 ? (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                  No active events nearby.
                </div>
              ) : nearbyEvents.map((evt) => (
                <div key={evt.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={evt.status} />
                      <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">{evt.category}</span>
                    </div>
                    <h3 className="font-bold text-base text-white">{evt.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {evt.location?.address || evt.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400" /> {evt.startTime || evt.time} - {evt.endTime || "Late"}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Permitted Limit</span>
                    <strong className="text-emerald-400 text-base font-mono font-extrabold">{evt.permittedNoise || evt.permitted_db} dB(A)</strong>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Estimated: {evt.currentEstimatedNoise || "--"} dB</span>
                  </div>
                </div>
              ))}
            </div>

            {/* My Complaints Preview */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Filed Complaints</h2>
                <Link to="/citizen/complaints" className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1">
                  Track All Complaints <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="h-16 bg-slate-900/50 animate-pulse rounded-xl border border-slate-800"></div>
                ) : myRecentComplaints.length === 0 ? (
                  <div className="p-6 bg-slate-900/80 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    You haven't filed any complaints yet.
                  </div>
                ) : myRecentComplaints.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-white">{c.id}</span>
                        <StatusBadge status={c.status} priority={c.priority} />
                      </div>
                      <p className="text-slate-400">{c.locationName || c.location?.address || "Unknown location"} • Max Noise: <strong className="text-red-400">{c.measuredMaxNoise || c.analysis?.predicted_source_db?.toFixed(1) || "--"} dB(A)</strong></p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">{c.time || new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default CitizenDashboard;
