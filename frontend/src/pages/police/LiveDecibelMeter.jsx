import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Shield, AlertTriangle, ArrowLeft, Activity } from 'lucide-react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { useNoiseMeter } from '../../utils/useNoiseMeter';

const LiveDecibelMeter = () => {
  const navigate = useNavigate();
  const meter = useNoiseMeter();
  const isRecording = meter.running;
  const decibels = meter.level;
  const maxDecibels = meter.peak;
  const [areaLimit, setAreaLimit] = useState(65);
  const [areaType, setAreaType] = useState('commercial');
  const [areaTypes, setAreaTypes] = useState([
    { value: 'silence', label: 'Silence Zone', limit: 50 },
    { value: 'residential', label: 'Residential Zone', limit: 55 },
    { value: 'commercial', label: 'Commercial Zone', limit: 65 },
    { value: 'industrial', label: 'Industrial Zone', limit: 75 }
  ]);
  const [logging, setLogging] = useState(false);

  // Pull live area limits from the city rules so admin edits are honoured (G4).
  useEffect(() => {
    const loadLimits = async () => {
      try {
        const res = await api.get('/rules/');
        const r = res.data || {};
        const opts = [
          { value: 'silence', label: 'Silence Zone', limit: r.silence_zone_limit ?? 50 },
          { value: 'residential', label: 'Residential Zone', limit: r.residential_limit ?? 55 },
          { value: 'commercial', label: 'Commercial Zone', limit: r.commercial_limit ?? 65 },
          { value: 'industrial', label: 'Industrial Zone', limit: r.industrial_limit ?? 75 }
        ];
        setAreaTypes(opts);
        const cur = opts.find(o => o.value === areaType) || opts[2];
        setAreaType(cur.value);
        setAreaLimit(cur.limit);
      } catch (e) { /* keep defaults when API unreachable */ }
    };
    loadLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const micError = meter.error;

  const getStatusColor = () => {
    if (decibels === 0) return 'text-slate-400';
    if (decibels <= areaLimit) return 'text-emerald-400';
    if (decibels <= areaLimit + 5) return 'text-amber-400';
    return 'text-red-500 animate-pulse';
  };

  const logMeasurement = async () => {
    if (decibels <= 0) {
      alert('Start a live measurement before logging to HQ.');
      return;
    }
    setLogging(true);
    try {
      let latitude = null;
      let longitude = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude = parseFloat(pos.coords.latitude.toFixed(6));
        longitude = parseFloat(pos.coords.longitude.toFixed(6));
      } catch (_) { /* location unavailable — still log the dB reading */ }

      await api.post('/readings/', {
        decibels,
        area_limit: areaLimit,
        area_type: areaType,
        latitude,
        longitude,
        note: `Field reading in ${areaType} zone against ${areaLimit} dB(A) limit`
      });
      alert(`Measurement logged to HQ: ${decibels} dB(A) vs ${areaLimit} dB(A) limit.`);
    } catch (err) {
      console.error('Failed to log measurement', err);
      alert('Failed to log measurement. Ensure the HQ API is reachable and you are authenticated.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-md mx-auto w-full space-y-6">
        
        <button 
          onClick={() => navigate('/patrol/dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patrol Dashboard
        </button>

        <div className="text-center space-y-1 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-extrabold text-white">Live Decibel Meter</h1>
          <p className="text-xs text-slate-400">Field Acoustic Measurement Tool</p>
        </div>

        {/* Configuration */}
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-400">Current Area Zone Rule</label>
          <select
            value={areaLimit}
            onChange={(e) => {
              const lim = parseInt(e.target.value);
              setAreaLimit(lim);
              const t = areaTypes.find(o => o.limit === lim);
              if (t) setAreaType(t.value);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
          >
            {areaTypes.map(t => (
              <option key={t.value} value={t.limit}>{t.label} ({t.limit} dB)</option>
            ))}
          </select>
        </div>

        {/* Display */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isRecording ? 'LIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="my-8">
            <span className={`text-8xl font-black font-mono tracking-tighter block ${getStatusColor()}`}>
              {decibels > 0 ? decibels : '--'}
            </span>
            <span className="text-sm font-bold text-slate-500 uppercase mt-2 block">dB(A) Leq</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold mb-1">Max Recorded</span>
              <span className="text-xl font-bold font-mono text-white">{maxDecibels > 0 ? maxDecibels : '--'} dB</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold mb-1">Violation Status</span>
              {decibels > areaLimit ? (
                <span className="text-xs font-bold text-red-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> BREACH (+{decibels - areaLimit}dB)
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> COMPLIANT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 pt-4">
          {!isRecording ? (
            <button
              onClick={meter.start}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-extrabold shadow-xl shadow-blue-600/30 flex justify-center items-center gap-2 transition-transform active:scale-95"
            >
              <Mic className="w-5 h-5" /> Start Live Measurement
            </button>
          ) : (
            <button
              onClick={meter.stop}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-extrabold shadow-xl shadow-red-600/30 flex justify-center items-center gap-2 transition-transform active:scale-95 animate-pulse"
            >
              <Square className="w-5 h-5 fill-white" /> Stop Measurement
            </button>
          )}
          {micError && (
            <p className="text-[11px] text-red-400 text-center">⚠ {micError}</p>
          )}
          <button
            onClick={logMeasurement}
            disabled={logging}
            className="w-full py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2 disabled:opacity-60"
          >
            <Activity className={`w-4 h-4 text-emerald-400 ${logging ? 'animate-spin' : ''}`} />
            {logging ? 'Logging measurement...' : 'Log Measurement to HQ'}
          </button>
        </div>

      </main>
    </div>
  );
};

export default LiveDecibelMeter;
