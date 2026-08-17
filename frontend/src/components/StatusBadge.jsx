import React from 'react';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, XCircle, FileText, Info } from 'lucide-react';

const StatusBadge = ({ status, priority }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Approved':
      case 'Resolved':
      case 'Within Permitted Limit':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle,
          dot: 'bg-emerald-500'
        };
      case 'Potential Violation':
      case 'Critical Violation':
        return {
          bg: 'bg-red-500/15 text-red-400 border-red-500/40 animate-pulse',
          icon: ShieldAlert,
          dot: 'bg-red-500'
        };
      case 'Warning Level':
      case 'Under Review':
      case 'Investigation':
      case 'Document Verification':
      case 'Authority Review':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: Clock,
          dot: 'bg-amber-500'
        };
      case 'Pending':
      case 'Pending Review':
      case 'Submitted':
      case 'pending_approval':
      case 'processing':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: FileText,
          dot: 'bg-blue-500'
        };
      case 'Evidence Verified':
      case 'completed':
        return {
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          icon: CheckCircle,
          dot: 'bg-indigo-400'
        };
      case 'Rejected':
      case 'Dismissed':
      case 'rejected':
      case 'failed_processing':
        return {
          bg: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
          icon: XCircle,
          dot: 'bg-gray-400'
        };
      default:
        return {
          bg: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
          icon: Info,
          dot: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{status}</span>
      {priority && (
        <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
          priority === 'High' ? 'bg-red-900/60 text-red-200' : priority === 'Medium' ? 'bg-amber-900/60 text-amber-200' : 'bg-blue-900/60 text-blue-200'
        }`}>
          {priority}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
