import React, { useEffect, useState } from 'react';
import { Volume2, AlertTriangle, ShieldCheck, Info, Activity } from 'lucide-react';
import { SCIENTIFIC_DISCLAIMER, getNoiseSeverity, getDecibelCategoryLabel } from '../utils/noiseCalculator';

const NoiseMeter = ({ currentDb = 82, permittedDb = 75, isLive = false, duration = "06:32" }) => {
  const severity = getNoiseSeverity(currentDb, permittedDb);
  const diff = currentDb - permittedDb;

  // Calculate rotation percentage for meter arc (0 to 120 dB range)
  const maxRangeDb = 120;
  const percentage = Math.min(100, Math.max(0, (currentDb / maxRangeDb) * 100));
  const strokeDashoffset = 440 - (440 * percentage) / 100;

  // Animated bars state for acoustic wave
  const [waveHeights, setWaveHeights] = useState([30, 45, 70, 85, 60, 40, 90, 75, 50, 30]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setWaveHeights(Array.from({ length: 12 }, () => Math.floor(Math.random() * 75) + 20));
    }, 200);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 ${severity.border} border-2`}>
      {/* Background Ambient Glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${
        diff > 5 ? 'bg-red-600' : diff > 0 ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Top Banner Status */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${severity.bg} ${severity.text}`}>
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Current Noise Monitor</h3>
            <p className="text-xs text-gray-400">{getDecibelCategoryLabel(currentDb)}</p>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            <span>LIVE MICROPHONE STREAM</span>
          </div>
        )}
      </div>

      {/* Circular Gauge Center */}
      <div className="flex flex-col items-center justify-center my-4 relative z-10">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* SVG Circular Gauge */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-gray-800"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Permitted Limit Indicator Arc */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-blue-500/40"
              strokeWidth="4"
              strokeDasharray="440"
              strokeDashoffset={440 - (440 * (permittedDb / 120))}
              fill="transparent"
            />
            {/* Value Track Arc */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className={`transition-all duration-500 ease-out ${
                diff > 5 ? 'stroke-red-500' : diff > 0 ? 'stroke-amber-400' : 'stroke-emerald-400'
              }`}
              strokeWidth="12"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
              {currentDb}
            </span>
            <span className="text-sm font-semibold text-gray-400 mt-0.5">dB(A)</span>
            
            <div className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severity.bg} ${severity.text} ${severity.border}`}>
              {diff > 0 ? `+${diff} dB Above Limit` : `${Math.abs(diff)} dB Below Limit`}
            </div>
          </div>
        </div>

        {/* Live Acoustic Visualizer Bars */}
        <div className="flex items-end justify-center gap-1 h-8 my-2">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-t transition-all duration-150 ${
                diff > 5 ? 'bg-red-500' : diff > 0 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Threshold Comparison Grid */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-900/60 rounded-xl text-center border border-gray-800 relative z-10 mb-3">
        <div>
          <span className="block text-[11px] font-medium text-gray-400 uppercase">Permitted</span>
          <span className="text-base font-bold text-blue-400">{permittedDb} dB(A)</span>
        </div>
        <div>
          <span className="block text-[11px] font-medium text-gray-400 uppercase">Current Reading</span>
          <span className={`text-base font-bold ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {currentDb} dB(A)
          </span>
        </div>
        <div>
          <span className="block text-[11px] font-medium text-gray-400 uppercase">Duration</span>
          <span className="text-base font-bold text-gray-200">{duration}</span>
        </div>
      </div>

      {/* Scientific Microphone Disclaimer */}
      <div className="flex items-start gap-2 p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 relative z-10">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong className="text-blue-200 font-semibold">Estimated microphone reading:</strong> Smartphone microphones are indicative software sensors. Official legal enforcement requires certified sound-level meters.
        </p>
      </div>
    </div>
  );
};

export default NoiseMeter;
