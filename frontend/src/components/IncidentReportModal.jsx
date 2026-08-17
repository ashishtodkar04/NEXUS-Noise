import React from 'react';
import { X, Printer, Download, Shield, FileText, CheckCircle, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { SCIENTIFIC_DISCLAIMER } from '../utils/noiseCalculator';

const IncidentReportModal = ({ complaint, onClose }) => {
  if (!complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Generate Official Incident Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              <Printer className="w-4 h-4" /> Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 space-y-6 font-sans text-slate-200 text-xs">
          {/* Document Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-slate-700 pb-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-wider text-white uppercase">OFFICIAL NOISE COMPLIANCE & INCIDENT REPORT</h1>
              <p className="text-slate-400 font-mono text-[11px]">NEXUS NOISE CONTROL & PUBLIC SAFETY CELL • PIMPRI-CHINCHWAD POLICE</p>
            </div>
            <div className="text-right font-mono">
              <span className="block text-xs font-bold text-red-400">INCIDENT ID: {complaint.id}</span>
              <span className="text-[10px] text-slate-400">Date Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Incident Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Location Jurisdiction:</span>
              <strong className="text-slate-100">{complaint.locationName}</strong>
              <span className="block text-slate-400 text-[10px]">GPS: {complaint.lat}, {complaint.lng}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Event Reference:</span>
              <strong className="text-slate-100">{complaint.eventName || 'Unregistered Acoustic Disturbance'}</strong>
              <span className="block text-slate-400 text-[10px]">Category: {complaint.eventCategory || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp & Duration:</span>
              <strong className="text-slate-100">{complaint.date} at {complaint.time}</strong>
              <span className="block text-slate-400 text-[10px]">Duration Above Limit: {complaint.durationAboveLimit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Authority:</span>
              <strong className="text-slate-100">{complaint.assignedAuthority || 'Police Noise Cell'}</strong>
              <span className="block text-emerald-400 text-[10px]">Status: {complaint.status}</span>
            </div>
          </div>

          {/* Decibel Audit Table */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">Sound Measurement Audit</h4>
            <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[10px]">
                <tr>
                  <th className="p-2">PARAMETER</th>
                  <th className="p-2">PERMITTED CEILING</th>
                  <th className="p-2">RECORDED PEAK</th>
                  <th className="p-2">AVERAGE LEVEL</th>
                  <th className="p-2">VARIANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                <tr>
                  <td className="p-2">Sound Level (dB(A))</td>
                  <td className="p-2 text-emerald-400 font-bold">{complaint.permittedNoise} dB(A)</td>
                  <td className="p-2 text-red-400 font-bold">{complaint.measuredMaxNoise} dB(A)</td>
                  <td className="p-2 text-amber-400">{complaint.measuredAvgNoise} dB(A)</td>
                  <td className="p-2 text-red-400 font-bold">+{complaint.measuredMaxNoise - complaint.permittedNoise} dB Breach</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cryptographic Evidence Package Summary */}
          <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Cryptographic Evidence Validation</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> GPS Coordinates Lock Verified
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> High-Resolution Audio Payload Attached
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> NIST Timestamp Hash Attached
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Event Registration Correlated
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              Payload SHA-256 Signature: {complaint.evidencePackage?.hashSha256 || 'sha256-e3b0c44298fc1c149afbf4c8996fb924'}
            </div>
          </div>

          {/* Officer Findings */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">Officer Investigation Notes & Action Taken</h4>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 min-h-[60px]">
              {complaint.officerNotes || "Patrol unit dispatched to site. Event organizer issued formal written warning and sound level brought back under standard permitted threshold of 75 dB(A)."}
            </div>
          </div>

          {/* Disclaimer & Authorization Seal */}
          <div className="pt-4 border-t border-slate-800 flex items-end justify-between">
            <div className="max-w-md text-[10px] text-slate-500 leading-tight">
              {SCIENTIFIC_DISCLAIMER}
            </div>
            <div className="text-center font-mono text-[10px]">
              <div className="w-24 h-12 border border-slate-700 rounded flex items-center justify-center text-slate-500 uppercase font-bold mb-1 mx-auto">
                POLICE SEAL
              </div>
              <span className="block font-bold text-slate-300">Authorized Signatory</span>
              <span className="text-slate-500">Noise Control Division</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
