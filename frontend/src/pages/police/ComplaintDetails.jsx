import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  Clock,
  Volume2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer,
  ChevronLeft,
  ShieldCheck,
  Send,
  XCircle,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import EvidenceCard from '../../components/EvidenceCard';
import MapView from '../../components/MapView';
import { NoiseTimeChart } from '../../components/NoiseChart';
import IncidentReportModal from '../../components/IncidentReportModal';
import api from '../../services/api';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [officerNotes, setOfficerNotes] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [statusState, setStatusState] = useState('Pending');

  React.useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setCurrentComplaint(res.data);
        setStatusState(res.data.status);
        setOfficerNotes(res.data.officer_notes || '');
      } catch (err) {
        console.error("Failed to fetch complaint details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id]);

  // Time series mock data for the complaint's specific timeline graph
  const noiseGraphData = [
    { time: '21:30', measured: 72 },
    { time: '21:35', measured: 76 },
    { time: '21:40', measured: 81 },
    { time: '21:42', measured: 88 },
    { time: '21:45', measured: 84 },
    { time: '21:50', measured: 82 }
  ];

  const handleAction = async (newStatus, noteText) => {
    const updatedNotes = noteText || officerNotes || `Officer action: status set to ${newStatus}`;
    try {
      await api.put(`/complaints/${id}`, {
        status: newStatus,
        officer_notes: updatedNotes
      });
      setStatusState(newStatus);
      alert(`Complaint ${id} updated to status: "${newStatus}"`);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  };

  if (loading || !currentComplaint) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar mode="police" />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/police/complaints')}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-blue-400">{currentComplaint.id || currentComplaint._id}</span>
                  <StatusBadge status={statusState} priority={currentComplaint.priority} />
                </div>
                <h1 className="text-2xl font-extrabold text-white">{currentComplaint.event_name || 'Noise Complaint Evidence Case'}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Generate Incident Report
              </button>
            </div>
          </div>

          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Incident Date & Time</span>
              <strong className="text-slate-100 text-sm font-bold">{currentComplaint.date || new Date(currentComplaint.timestamp).toLocaleDateString()} at {currentComplaint.time || new Date(currentComplaint.timestamp).toLocaleTimeString()}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Measured Peak</span>
              <strong className="text-red-400 text-base font-bold">{currentComplaint.analysis?.predicted_source_db?.toFixed(1) || 'N/A'} dB(A)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Permitted Threshold</span>
              <strong className="text-emerald-400 text-base font-bold">{currentComplaint.permitted_db || 65} dB(A)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Duration Above Limit</span>
              <strong className="text-amber-400 text-base font-bold">10m</strong>
            </div>
          </div>

          {/* Grid Layout: Left Evidence Package + Noise Graph; Right Map + Officer Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Noise Graph over time */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">Logged Decibel Telemetry Timeline</h3>
                    <p className="text-xs text-slate-400">Microphone reading graph with horizontal 75 dB permitted ceiling.</p>
                  </div>
                  <span className="text-xs font-mono text-red-400 bg-red-950/60 px-2.5 py-1 rounded border border-red-800">
                    +{((currentComplaint.analysis?.predicted_source_db || 0) - (currentComplaint.permitted_db || 65)).toFixed(1)} dB Breach
                  </span>
                </div>
                <NoiseTimeChart data={noiseGraphData} permittedThreshold={currentComplaint.permitted_db || 65} height={250} />
              </div>

              {/* Cryptographic Evidence Card */}
              <EvidenceCard complaint={currentComplaint} />

            </div>

            {/* Right 1 Column */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Incident GIS Map */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Incident GIS Coordinates</h3>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
                  <MapView
                    complaints={[currentComplaint]}
                    height="100%"
                    selectedCenter={currentComplaint.location ? [currentComplaint.location.lat, currentComplaint.location.lng] : undefined}
                    zoom={15}
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                  <span className="text-slate-500 block text-[10px]">ADDRESS:</span>
                  {currentComplaint.location?.address || 'N/A'}
                </div>
              </div>

              {/* OFFICER ACTION PANEL */}
              <div className="glass-panel p-6 rounded-3xl border-2 border-red-500/30 space-y-4 shadow-2xl">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-400" /> Officer Review & Case Action
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Officer Findings & Action Notes</label>
                  <textarea
                    rows={4}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter official investigation notes..."
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleAction('Evidence Verified', 'Acoustic logs & geotag confirmed valid.')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify Evidence Package
                  </button>

                  <button
                    onClick={() => handleAction('Potential Violation', 'Sustained decibel breach tagged as violation.')}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                  >
                    <AlertTriangle className="w-4 h-4" /> Mark as Official Violation
                  </button>

                  <button
                    onClick={() => handleAction('Investigation', 'Patrol squad dispatched to event venue.')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Forward for Site Squad Patrol
                  </button>

                  <button
                    onClick={() => handleAction('Resolved', 'Challan issued and sound level restored under 75 dB limit.')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve Case (Challan Issued)
                  </button>

                  <button
                    onClick={() => handleAction('Dismissed', 'Dismissed due to insufficient audio sample duration.')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800"
                  >
                    <XCircle className="w-4 h-4" /> Dismiss Complaint
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* Incident Report Modal */}
      {showReportModal && (
        <IncidentReportModal
          complaint={currentComplaint}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default ComplaintDetails;
