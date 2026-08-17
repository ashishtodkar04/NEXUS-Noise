import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Calendar, Clock, Download, CheckCircle, ShieldAlert, PlusCircle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications/');
        setApplications(res.data);
      } catch (err) {
        console.error("Failed to fetch applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">My Event Approval Applications</h1>
            <p className="text-xs text-slate-400">Track permission applications, approved noise ceilings, and legal permit vouchers.</p>
          </div>
          <Link
            to="/citizen/apply"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 w-fit"
          >
            <PlusCircle className="w-4 h-4" /> Apply for New Event Permit
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800 text-slate-500 text-sm">
              You haven't submitted any event applications yet.
            </div>
          ) : applications.map((app) => (
            <div key={app.id || app._id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-400">{app.id || app._id}</span>
                  <h3 className="font-extrabold text-lg text-white">{app.eventName || app.event_name}</h3>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Applicant:</span>
                  <strong className="text-white">{app.applicant_name || app.applicantName || 'Citizen User'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Venue:</span>
                  <strong className="text-white">{app.venue || app.location_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Event Schedule:</span>
                  <strong className="text-white">{app.eventDate || app.date} ({app.startTime || app.start_time} - {app.endTime || app.end_time})</strong>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Approval Workflow Timeline</span>
                <div className="flex items-center justify-between text-xs font-semibold relative max-w-xl">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Application Submitted
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2" />
                  <div className={`flex items-center gap-1 ${app.status !== 'Pending Review' && app.status !== 'Pending' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle className="w-4 h-4" /> Document Verification
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2" />
                  <div className={`flex items-center gap-1 ${app.status === 'Approved' ? 'text-emerald-400' : (app.status === 'Rejected' ? 'text-red-400' : 'text-amber-400')}`}>
                    <CheckCircle className="w-4 h-4" /> {app.status === 'Pending' ? 'Pending Review' : app.status}
                  </div>
                </div>
              </div>

              {/* Approved Voucher Section */}
              {app.status === 'Approved' && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-emerald-300 block">Official Permit Issued — Ref #{app.approvalRefNo || app.approval_ref_no || 'N/A'}</span>
                    <span className="text-emerald-400/80">Approved Noise Limit: <strong>{app.approvedLimitDb || app.approved_limit_db || 75} dB(A)</strong> • Allowed Hours: {app.allowedHours || `${app.start_time || ''} - ${app.end_time || ''}`}</span>
                    {(app.special_conditions || app.specialConditions) && (
                      <p className="text-[11px] text-slate-300 mt-1">Conditions: {app.special_conditions || app.specialConditions}</p>
                    )}
                  </div>
                  <button
                    onClick={() => alert(`Downloading Official Permit Voucher PDF for ${app.id || app._id}`)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download Official Permit
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Applications;
