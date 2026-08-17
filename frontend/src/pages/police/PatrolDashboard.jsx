import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mic, MapPin, AlertTriangle, List, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

const PatrolDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/');
        // Mock filtering to just high-priority or nearby ones for patrol
        const activeComplaints = res.data.filter(c => c.status !== 'resolved' && c.status !== 'rejected');
        setComplaints(activeComplaints);
      } catch (err) {
        console.error("Failed to fetch patrol complaints", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      <Navbar mode="police" />

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-md mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Patrol Officer Unit</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">ID: P-9082 • ON DUTY</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/patrol/meter')}
            className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-700/50 rounded-3xl flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform shadow-xl"
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
              <Mic className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-indigo-100">Live Decibel Meter</span>
          </button>

          <button 
            onClick={() => navigate('/police/map')}
            className="p-4 bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-700/50 rounded-3xl flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform shadow-xl"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-blue-100">Patrol Map</span>
          </button>
        </div>

        {/* Active Dispatch / Complaints nearby */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Dispatch Queue
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-500">Syncing with HQ...</div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                No active complaints in your patrol zone.
              </div>
            ) : complaints.map((c) => (
              <div key={c._id || c.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden">
                {c.analysis?.is_valid && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                )}
                <div className="flex justify-between items-start mb-2 pl-2">
                  <span className="text-[10px] font-mono text-blue-400 font-bold">{c._id || c.id}</span>
                  <span className="text-[10px] text-slate-500">{new Date(c.created_at || Date.now()).toLocaleTimeString()}</span>
                </div>
                
                <div className="pl-2 space-y-1">
                  <h3 className="font-bold text-white text-sm">Noise Disturbance</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> 
                    {c.event_location?.address || c.complaint_giver_location?.address || 'Pimpri Chowk'}
                  </p>
                </div>
                
                <div className="pl-2 mt-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500">Reported DB:</span>{' '}
                    <strong className="text-red-400">{c.analysis?.predicted_source_db?.toFixed(1) || '--'} dB</strong>
                  </div>
                  <button 
                    onClick={() => navigate(`/police/complaints/${c._id || c.id}`)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default PatrolDashboard;
