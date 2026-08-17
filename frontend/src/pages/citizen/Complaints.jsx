import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, MapPin, Clock, ShieldCheck, ChevronRight, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        // Assume API returns only this citizen's complaints based on token, or we filter locally
        const res = await api.get('/complaints/');
        setComplaints(res.data);
      } catch (err) {
        console.error('Failed to fetch complaints', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const filtered = filterStatus === 'All'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Filed Noise Complaints</h1>
            <p className="text-xs text-slate-400">Track police investigation status, evidence package hashes, and officer review notes.</p>
          </div>
          <Link
            to="/citizen/complaint"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 w-fit"
          >
            <AlertTriangle className="w-4 h-4" /> Report New Noise Disturbance
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['All', 'Submitted', 'Under Review', 'Potential Violation', 'Evidence Verified', 'Investigation', 'Resolved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Complaints Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
             [1, 2, 3, 4].map(i => (
               <div key={i} className="h-48 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
             ))
          ) : filtered.length === 0 ? (
             <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-500 text-sm">
                No complaints found matching this status.
             </div>
          ) : filtered.map((c) => (
            <div
              key={c.id || c._id}
              className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 cursor-pointer"
              onClick={() => setSelectedComplaint(c)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-blue-400">{c.id || c._id}</span>
                <StatusBadge status={c.status} priority={c.priority} />
              </div>

              <div>
                <h3 className="font-bold text-base text-white">{c.eventName || 'Unspecified Disturbance'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> {c.locationName || c.location?.address || "Unknown"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900 rounded-xl text-center text-xs font-mono border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Max Noise</span>
                  <strong className="text-red-400 font-bold">{c.measuredMaxNoise || c.analysis?.predicted_source_db?.toFixed(1) || "--"} dB(A)</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Permitted</span>
                  <strong className="text-emerald-400 font-bold">{c.permittedNoise || 65} dB(A)</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                  <strong className="text-slate-200 font-bold">{c.durationAboveLimit || "--"}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
                <span>Filed: {c.date || new Date(c.created_at).toLocaleDateString()} at {c.time || new Date(c.created_at).toLocaleTimeString()}</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  View Timeline <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Complaint Detail Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs text-blue-400 font-bold">{selectedComplaint.id || selectedComplaint._id}</span>
                  <h3 className="text-lg font-bold text-white">{selectedComplaint.eventName || 'Unspecified Disturbance'}</h3>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Current Status:</span>
                  <StatusBadge status={selectedComplaint.status} priority={selectedComplaint.priority} />
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Assigned Authority:</span>
                  <span className="font-bold text-white">{selectedComplaint.assignedAuthority}</span>
                </div>

                {/* Timeline */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Timeline Log</h4>
                  <div className="space-y-2">
                    {(selectedComplaint.timeline || [{status: selectedComplaint.status, note: "Status updated", time: new Date(selectedComplaint.created_at || Date.now()).toLocaleString()}]).map((t, idx) => (
                      <div key={idx} className="flex items-start gap-2 border-l-2 border-blue-500 pl-3">
                        <div className="flex-1">
                          <span className="font-bold text-white">{t.status}</span> — <span className="text-slate-400">{t.note}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedComplaint.officer_notes && (
                  <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl">
                    <span className="font-bold text-red-300 block mb-1">Police Officer Notes:</span>
                    <p className="text-slate-300">{selectedComplaint.officer_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default Complaints;
