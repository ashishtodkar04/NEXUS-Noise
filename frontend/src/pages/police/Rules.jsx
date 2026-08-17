import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle, Info, Shield, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

const Rules = () => {
  const [daytimeLimit, setDaytimeLimit] = useState('');
  const [nighttimeLimit, setNighttimeLimit] = useState('');
  const [warningThreshold, setWarningThreshold] = useState('');
  const [violationThreshold, setViolationThreshold] = useState('');
  const [cutoffTime, setCutoffTime] = useState('');
  const [minMonitoringSec, setMinMonitoringSec] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await api.get('/rules/');
        const r = res.data;
        if (r) {
          setDaytimeLimit(r.daytime_limit || 75);
          setNighttimeLimit(r.nighttime_limit || 55);
          setWarningThreshold(r.warning_threshold || 3);
          setViolationThreshold(r.violation_threshold || 5);
          setCutoffTime(r.cutoff_time || '22:00');
          setMinMonitoringSec(r.min_monitoring_duration_sec || 300);
        }
      } catch (err) {
        console.error("Failed to fetch rules", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/rules/', {
        daytime_limit: daytimeLimit,
        nighttime_limit: nighttimeLimit,
        warning_threshold: warningThreshold,
        violation_threshold: violationThreshold,
        cutoff_time: cutoffTime,
        min_monitoring_duration_sec: minMonitoringSec
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update rules", err);
      alert("Failed to update rules.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Noise Regulation Configuration</h1>
              <p className="text-xs text-slate-400">Configure municipal decibel thresholds, warning offsets, and cutoff schedules.</p>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Noise threshold rules updated successfully! Controls reflected across system algorithms.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                1. Statutory Decibel Ceilings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daytime Limit (6 AM - 10 PM): <strong className="text-emerald-400 font-mono">{daytimeLimit} dB(A)</strong>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={daytimeLimit}
                    onChange={(e) => setDaytimeLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nighttime Limit (10 PM - 6 AM): <strong className="text-blue-400 font-mono">{nighttimeLimit} dB(A)</strong>
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={80}
                    value={nighttimeLimit}
                    onChange={(e) => setNighttimeLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                2. Automated Violation Algorithm Offsets
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Warning Trigger Offset (+dB)</label>
                  <input
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Triggers Warning status at limit + {warningThreshold} dB</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Violation Trigger Offset (+dB)</label>
                  <input
                    type="number"
                    value={violationThreshold}
                    onChange={(e) => setViolationThreshold(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Triggers Violation status at limit + {violationThreshold} dB</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nighttime Loudspeaker Cutoff Schedule</label>
                  <input
                    type="time"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Audio Monitoring Duration (Seconds)</label>
                  <input
                    type="number"
                    value={minMonitoringSec}
                    onChange={(e) => setMinMonitoringSec(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading || saving}
                className={`px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 ${(loading || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {saving ? 'Saving...' : 'Save Noise Limit Rules'}
              </button>
            </div>

          </form>

        </main>
      </div>
    </div>
  );
};

export default Rules;
