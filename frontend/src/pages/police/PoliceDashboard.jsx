import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Calendar,
  FileCheck,
  ShieldAlert,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { NoiseTimeChart, ViolationsBarChart } from '../../components/NoiseChart';
import api, { WS_URL } from '../../services/api';

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rules, setRules] = useState({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, complaintsRes, appsRes, rulesRes] = await Promise.all([
          api.get('/events/'),
          api.get('/complaints/'),
          api.get('/applications/'),
          api.get('/rules/')
        ]);
        setEvents(eventsRes.data);
        setComplaints(complaintsRes.data);
        setApplications(appsRes.data);
        setRules(rulesRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter high priority / potential violation items
  const potentialViolations = complaints.filter(c => c.status === 'Potential Violation' || c.status === 'Under Review' || c.status === 'pending');
  const pendingApps = applications.filter(a => a.status === 'Pending Review' || a.status === 'Pending' || a.status === 'Document Verification');

  // Chart data formatting — derived live from the complaints fetched from MongoDB.
  // Aggregates each complaint into its hour-of-day bucket by created_at, computing
  // the average measured decibel level (measured) and the total logged count (violations).
  const hourlyAgg = Array.from({ length: 24 }, (_, i) => {
    const inHour = complaints.filter(c => {
      const d = c.created_at ? new Date(c.created_at) : null;
      return d && d.getHours() === i;
    });
    const avg = inHour.length
      ? Math.round(inHour.reduce((sum, c) => sum + (c.analysis?.predicted_source_db || c.measuredMaxNoise || 0), 0) / inHour.length)
      : 0;
    return { time: String(i).padStart(2, '0') + ':00', measured: avg, violations: inHour.length };
  });
  const timeSeriesData = hourlyAgg;

  const [toastMessage, setToastMessage] = useState(null);

  React.useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_valid_complaint') {
          setToastMessage(`Critical Alert: ${data.message} (ID: ${data.complaint_id})`);
          setTimeout(() => setToastMessage(null), 8000);
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };
    
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 p-4 bg-red-600 text-white rounded-xl shadow-2xl border border-red-500 flex items-center gap-3 animate-bounce">
          <AlertTriangle className="w-6 h-6" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          {/* Top Bar Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" /> Law Enforcement Command Center
              </div>
              <h1 className="text-3xl font-extrabold text-white">Authority Operations Dashboard</h1>
              <p className="text-xs text-slate-400">Pimpri-Chinchwad Police Division • Real-time Noise Audit & Compliance Monitoring</p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">SYSTEM TIME (NIST)</span>
                <span className="text-blue-400 font-bold">2026-08-15 21:50:09</span>
              </div>
            </div>
          </div>

          {/* Statistics KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Active Events"
              value={loading ? "..." : events.length.toString()}
              icon={Calendar}
              trend="+12%"
              trendType="up"
              color="indigo"
            />
            <StatCard
              title="Pending Apps"
              value={loading ? "..." : pendingApps.length.toString()}
              icon={FileCheck}
              trend="+3 new"
              trendType="up"
              color="blue"
            />
            <StatCard
              title="Complaints Today"
              value={loading ? "..." : complaints.length.toString()}
              icon={ShieldAlert}
              trend="+5 high priority"
              trendType="up"
              color="amber"
            />
            <StatCard
              title="Potential Violations"
              value={loading ? "..." : potentialViolations.length.toString()}
              icon={AlertTriangle}
              trend="+2 sustained"
              trendType="down"
              color="red"
            />
            <StatCard
              title="Resolved Cases"
              value={loading ? "..." : complaints.filter(c => c.status === 'Resolved').length.toString()}
              icon={CheckCircle}
              trend="94% resolution"
              trendType="up"
              color="emerald"
            />
          </div>

          {/* LIVE MONITORING ALERT BANNER CARD */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-red-500/40 relative overflow-hidden shadow-2xl space-y-6">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600 text-white rounded-2xl animate-pulse shadow-lg shadow-red-600/40">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">CRITICAL ACOUSTIC ALERT</span>
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[10px] font-bold animate-pulse">
                      POTENTIAL VIOLATION DETECTED
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Ganesh Utsav Mahotsav — Pimpri Chowk</h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">INCIDENT ID: NX-2026-00124</span>
                <span className="text-xs text-red-400 font-bold">Assigned: Pimpri Noise Cell</span>
              </div>
            </div>

            {/* Metrics Breakdown Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 relative z-10 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Current Noise</span>
                <strong className="text-2xl font-extrabold text-red-400">84 dB(A)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Permitted Ceiling</span>
                <strong className="text-2xl font-extrabold text-emerald-400">75 dB(A)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Variance</span>
                <strong className="text-2xl font-extrabold text-amber-400">+9 dB Breach</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Sustained Duration</span>
                <strong className="text-2xl font-extrabold text-white">08m 42s</strong>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="flex flex-wrap items-center gap-3 relative z-10 pt-2">
              <button
                onClick={() => navigate('/police/complaints/NX-2026-00124')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Eye className="w-4 h-4" /> Examine Evidence Package
              </button>
              <button
                onClick={() => navigate('/police/map')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-blue-400" /> View GIS Incident Map
              </button>
              <button
                onClick={() => navigate('/police/events/EVT-2026-101')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-indigo-400" /> View Event Details
              </button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart: 24h Noise Trend vs Threshold */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white">24-Hour City Noise Trend vs Permitted Limit</h3>
                  <p className="text-xs text-slate-400">Average measured decibel telemetry compared against 75 dB daytime ceiling.</p>
                </div>
              </div>
              <NoiseTimeChart data={timeSeriesData} permittedThreshold={rules.daytime_limit || 75} height={260} />
            </div>

            {/* Bar Chart: Hourly Violations Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white">Hourly Noise Violation Count</h3>
                  <p className="text-xs text-slate-400">Total detected decibel breaches logged by hour.</p>
                </div>
              </div>
              <ViolationsBarChart data={timeSeriesData} height={260} />
            </div>
          </div>

          {/* Tables Section: High Priority Complaints & Pending Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent High Priority Complaints */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" /> High-Priority Noise Complaints
                </h3>
                <Link to="/police/complaints" className="text-xs font-semibold text-blue-400 hover:underline">
                  View All Complaints →
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="h-16 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
                ) : potentialViolations.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center py-4">No high-priority complaints currently.</div>
                ) : potentialViolations.slice(0, 4).map((c) => (
                  <div
                    key={c.id || c._id}
                    onClick={() => navigate(`/police/complaints/${c.id || c._id}`)}
                    className="p-4 bg-slate-900/80 hover:bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{c.id || c._id}</span>
                        <StatusBadge status={c.status} priority={c.priority} />
                      </div>
                      <h4 className="font-bold text-xs text-white">{c.eventName || 'Unregistered Disturbance'}</h4>
                      <p className="text-[11px] text-slate-400">{c.locationName || c.location?.address}</p>
                    </div>

                    <div className="text-right font-mono text-xs shrink-0">
                      <span className="text-red-400 font-bold block">{c.measuredMaxNoise || c.analysis?.predicted_source_db?.toFixed(1) || '--'} dB(A)</span>
                      <span className="text-[10px] text-slate-500">Permitted: {c.permittedNoise || rules.daytime_limit || 65} dB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Event Applications */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-400" /> Pending Permit Applications
                </h3>
                <Link to="/police/applications" className="text-xs font-semibold text-blue-400 hover:underline">
                  Review All Applications →
                </Link>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="h-16 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
                ) : pendingApps.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center py-4">No pending applications currently.</div>
                ) : pendingApps.slice(0, 4).map((a) => (
                  <div
                    key={a.id || a._id}
                    onClick={() => navigate('/police/applications')}
                    className="p-4 bg-slate-900/80 hover:bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{a.id || a._id}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <h4 className="font-bold text-xs text-white">{a.eventName || a.event_name}</h4>
                      <p className="text-[11px] text-slate-400">Applicant: {a.applicant_name || a.applicantName || 'Citizen User'} • {a.venue || a.location_name}</p>
                    </div>

                    <div className="text-right text-xs font-mono shrink-0">
                      <span className="text-slate-300 font-bold block">{a.eventDate || a.date}</span>
                      <span className="text-[10px] text-slate-500">{a.startTime || a.start_time} - {a.endTime || a.end_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default PoliceDashboard;
