import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, XCircle, Eye, Download, ShieldCheck, Clock, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const documentUrl = (url) => url ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${url}` : '#';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [permittedLimit, setPermittedLimit] = useState('');
  const [specialConditions, setSpecialConditions] = useState('');

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

  const handleApprove = async (id) => {
    const approvedLimit = Number(permittedLimit) || 75;
    try {
      await api.put(`/applications/${id}/status`, {
        status: 'Approved',
        approved_limit_db: approvedLimit,
        special_conditions: specialConditions
      });
      alert(`Application APPROVED with limit ${approvedLimit} dB(A)!`);
      setSelectedApp(null);
      setApplications(applications.map(a => (a.id || a._id) === id ? { ...a, status: 'Approved', approved_limit_db: approvedLimit, special_conditions: specialConditions } : a));
    } catch (err) {
      console.error(err);
      alert("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/applications/${id}/status`, {
        status: 'Rejected',
        special_conditions: 'Rejected due to proximity to hospital silence zone.'
      });
      alert(`Application REJECTED.`);
      setSelectedApp(null);
      setApplications(applications.map(a => (a.id || a._id) === id ? { ...a, status: 'Rejected' } : a));
    } catch (err) {
      console.error(err);
      alert("Failed to reject");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Event Approval Applications Review</h1>
              <p className="text-xs text-slate-400">Review sound system permits, set decibel ceilings, and issue official approvals.</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">APPLICATION ID</th>
                    <th className="p-4">APPLICANT</th>
                    <th className="p-4">EVENT NAME</th>
                    <th className="p-4">VENUE</th>
                    <th className="p-4">EVENT DATE</th>
                    <th className="p-4">CROWD & SPEAKERS</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500 text-sm">
                        No applications pending review.
                      </td>
                    </tr>
                  ) : applications.map((app) => (
                    <tr key={app.id || app._id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-400">{app.id || app._id}</td>
                      <td className="p-4 font-semibold text-white">
                        {app.applicant_name || app.applicantName || 'Citizen User'} <span className="text-[10px] text-slate-400 block">{app.applicant_phone || app.applicantPhone || 'Unknown'}</span>
                      </td>
                      <td className="p-4 font-bold text-white max-w-[180px] truncate">{app.eventName || app.event_name}</td>
                      <td className="p-4 text-slate-300 max-w-[160px] truncate">{app.venue || app.location_name}</td>
                      <td className="p-4 font-mono text-slate-300">
                        {app.eventDate || app.date} <span className="text-[10px] text-slate-500 block">{app.startTime || app.start_time} - {app.endTime || app.end_time}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {app.expectedCrowd || app.expected_attendees} people <span className="text-[10px] text-blue-400 block">{app.sound_equipment || app.speakerCount}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setPermittedLimit(app.approvedLimitDb || app.approved_limit_db || 75);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Application
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

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs text-blue-400 font-bold">{selectedApp.id || selectedApp._id}</span>
                <h3 className="text-lg font-extrabold text-white">{selectedApp.eventName || selectedApp.event_name}</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">APPLICANT:</span>
                <strong className="text-white">{selectedApp.applicant_name || selectedApp.applicantName || 'Citizen User'}</strong> ({selectedApp.applicant_phone || selectedApp.applicantPhone || 'Unknown'})
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">VENUE ADDRESS:</span>
                <strong className="text-white">{selectedApp.venue || selectedApp.location_name}</strong>
              </div>
            </div>

            {/* Document checklist */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Submitted Documents Verification</h4>
              <div className="space-y-1">
                {(selectedApp.documents || []).map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-emerald-400 font-mono text-[11px]">
                    <span>{doc.name}</span>
                    <a href={documentUrl(doc.url)} target="_blank" rel="noreferrer" className="underline hover:text-emerald-200">View</a>
                  </div>
                ))}
                {(!selectedApp.documents || selectedApp.documents.length === 0) && <span className="text-slate-500">No supporting documents were submitted.</span>}
              </div>
            </div>

            {/* Configure Permitted Noise Ceiling */}
            <div className="p-4 bg-slate-950 rounded-xl border border-blue-900/40 space-y-4 text-xs">
              <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">Configure Permitted Noise Ceiling</h4>
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Set Max Approved Noise Limit: <strong className="text-emerald-400 text-sm font-mono">{permittedLimit} dB(A)</strong></label>
                <input
                  type="range"
                  min={55}
                  max={90}
                  value={permittedLimit}
                  onChange={(e) => setPermittedLimit(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Special Permit Conditions / Instructions</label>
                <textarea
                  rows={2}
                  value={specialConditions}
                  onChange={(e) => setSpecialConditions(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleReject(selectedApp.id || selectedApp._id)}
                className="px-5 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button
                onClick={() => handleApprove(selectedApp.id || selectedApp._id)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle className="w-4 h-4" /> Approve Event Permit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Applications;
