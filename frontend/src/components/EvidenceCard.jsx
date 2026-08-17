import React from 'react';
import { FileVideo, ShieldCheck, CheckCircle, AlertTriangle, Hash, MapPin, Clock } from 'lucide-react';
import api from '../services/api';

const evidenceUrl = (path) => path ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${path}` : null;

const EvidenceCard = ({ complaint }) => {
  const video = complaint?.video_evidence;
  const videoUrl = evidenceUrl(complaint?.video_url);
  const createdAt = complaint?.created_at ? new Date(complaint.created_at).toLocaleString() : 'Not available';

  if (!videoUrl) {
    return <div className="glass-panel p-6 rounded-2xl border border-amber-800/60 bg-amber-950/20 text-amber-200 text-sm flex gap-3"><AlertTriangle className="w-5 h-5 shrink-0" />No video evidence is attached to this legacy complaint. Treat it as requiring further verification.</div>;
  }

  const checks = [
    ['Readable video', Boolean(video)],
    ['GPS location', Number.isFinite(complaint?.lat) && Number.isFinite(complaint?.lng)],
    ['Timestamp', Boolean(complaint?.created_at)],
    ['Visual review', !video?.requires_visual_review],
  ];

  return (
    <section className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30"><FileVideo className="w-6 h-6" /></div>
          <div><h3 className="font-bold text-white">Verified Video Evidence</h3><p className="text-xs text-slate-400">Original footage and upload metadata for officer review.</p></div>
        </div>
        {video?.requires_visual_review ? <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/50 border border-amber-700/60 px-3 py-1.5 rounded-lg"><AlertTriangle className="w-3.5 h-3.5" />Low visual motion — inspect manually</span> : <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 px-3 py-1.5 rounded-lg"><ShieldCheck className="w-3.5 h-3.5" />Video structure verified</span>}
      </header>

      <video controls preload="metadata" src={videoUrl} className="w-full max-h-[430px] bg-black rounded-xl border border-slate-700" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {checks.map(([label, passed]) => <div key={label} className={`p-2.5 rounded-xl border text-center text-[11px] ${passed ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-amber-950/20 border-amber-800/50 text-amber-300'}`}>{passed ? <CheckCircle className="w-4 h-4 mx-auto mb-1" /> : <AlertTriangle className="w-4 h-4 mx-auto mb-1" />}{label}</div>)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
          <p className="flex items-center gap-1.5 text-slate-400"><Clock className="w-3.5 h-3.5" />Captured: <span className="text-slate-200">{createdAt}</span></p>
          <p className="flex items-center gap-1.5 text-slate-400"><MapPin className="w-3.5 h-3.5" />{complaint?.locationName || 'Location not provided'}</p>
          <p className="text-slate-400">Coordinates: <span className="font-mono text-blue-300">{complaint?.lat ?? '—'}, {complaint?.lng ?? '—'}</span></p>
        </div>
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
          <p className="text-slate-400">Duration: <span className="text-slate-200">{video?.duration_seconds ?? '—'} sec</span> · {video?.resolution || '—'} · {video?.fps ?? '—'} fps</p>
          <p className="text-slate-400">Frames: <span className="text-slate-200">{video?.frame_count ?? '—'}</span> · Motion signal: <span className="text-slate-200">{video?.visual_motion_score ?? '—'}</span></p>
          <p className="flex gap-1.5 text-slate-400 break-all"><Hash className="w-3.5 h-3.5 shrink-0 mt-0.5" />SHA-256: <span className="font-mono text-emerald-300">{video?.sha256 || 'Legacy evidence — hash unavailable'}</span></p>
        </div>
      </div>
    </section>
  );
};

export default EvidenceCard;
