import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search, Filter, Eye, MapPin, Calendar, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const Complaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/');
        setComplaints(res.data);
      } catch (err) {
        console.error("Failed to fetch complaints", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const handleApprove = async (cacheId) => {
    try {
      await api.post(`/complaints/approve/${cacheId}`);
      alert('Complaint approved and moved to database!');
      setComplaints(complaints.filter(c => c._cache_id !== cacheId));
    } catch (err) {
      console.error(err);
      alert('Failed to approve complaint');
    }
  };

  const handleReject = async (cacheId) => {
    try {
      await api.post(`/complaints/reject/${cacheId}`);
      alert('Complaint rejected and removed from cache');
      setComplaints(complaints.filter(c => c._cache_id !== cacheId));
    } catch (err) {
      console.error(err);
      alert('Failed to reject complaint');
    }
  };

  const filtered = complaints.filter(c => {
    const id = c.id || c._id;
    const locationName = c.locationName || c.location?.address || '';
    const eventName = c.eventName || c.event_name || '';

    const matchesSearch = id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eventName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // API returns 'pending' etc. Match logic:
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter || (statusFilter === 'Potential Violation' && (c.status === 'Pending' || c.status === 'pending'));
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Complaint & Evidence Management</h1>
              <p className="text-xs text-slate-400">Review logged decibel complaints, examine evidence payloads, and trigger actions.</p>
            </div>
          </div>

          {/* Search & Filters Controls */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Complaint ID, Event, Location..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Potential Violation">Potential Violation</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Evidence Verified">Evidence Verified</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Police Data Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">COMPLAINT ID</th>
                    <th className="p-4">DATE & TIME</th>
                    <th className="p-4">LOCATION</th>
                    <th className="p-4">EVENT / SOURCE</th>
                    <th className="p-4">MEASURED PEAK</th>
                    <th className="p-4">PERMITTED</th>
                    <th className="p-4">EVIDENCE</th>
                    <th className="p-4">STATUS & PRIORITY</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-12 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-500 text-sm">
                        No complaints found matching criteria.
                      </td>
                    </tr>
                  ) : filtered.map((c) => (
                    <tr key={c.id || c._id} className={`hover:bg-slate-900/60 transition-colors ${c._is_cached ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''}`}>
                      <td className="p-4 font-mono font-bold text-blue-400">
                        {c.id || c._id}
                        {c._is_cached && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">PENDING APPROVAL</span>}
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {c.date || new Date(c.created_at).toLocaleDateString()} <span className="text-slate-500 text-[10px] block">{c.time || new Date(c.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 font-semibold text-white max-w-[160px] truncate">{c.locationName || c.location?.address || c.complaint_giver_location?.address || 'N/A'}</td>
                      <td className="p-4 text-slate-300 font-medium">{c.eventName || c.event_name || 'Unregistered Source'}</td>
                      <td className="p-4 font-mono font-extrabold text-red-400">{c.measuredMaxNoise || c.analysis?.predicted_source_db?.toFixed(1) || 'N/A'} dB(A)</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">{c.permittedNoise || c.permitted_db || 65} dB(A)</td>
                      <td className="p-4 text-[11px] text-slate-400 font-mono">
                        {c.video_url ? 'Video Evidence ✓' : 'Legacy: location only'}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={c._is_cached ? 'pending_approval' : c.status} priority={c.priority} />
                      </td>
                      <td className="p-4 text-right">
                        {c._is_cached ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(c._cache_id)}
                              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(c._cache_id)}
                              className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/police/complaints/${c.id || c._id}`)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        )}
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

export default Complaints;
