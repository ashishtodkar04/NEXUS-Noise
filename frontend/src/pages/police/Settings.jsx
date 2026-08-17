import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, UserPlus, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

const Settings = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', name: '', badge_id: '', role: 'police_patrol' });

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const policeToken = localStorage.getItem('policeToken');
      const res = await api.get('/auth/police/approved', {
        headers: { Authorization: `Bearer ${policeToken}` }
      });
      setOfficers(res.data);
    } catch (err) {
      // If 401/403, likely not admin — show empty state
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const policeToken = localStorage.getItem('policeToken');
      await api.post('/auth/police/approve', form, {
        headers: { Authorization: `Bearer ${policeToken}` }
      });
      setSuccess(`Officer ${form.name} (${form.email}) added to whitelist.`);
      setForm({ email: '', name: '', badge_id: '', role: 'police_patrol' });
      fetchOfficers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add officer.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (email) => {
    if (!confirm(`Remove officer ${email} from the approved list?`)) return;
    try {
      const policeToken = localStorage.getItem('policeToken');
      await api.delete(`/auth/police/approved/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${policeToken}` }
      });
      setSuccess(`Removed ${email} from the whitelist.`);
      fetchOfficers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove officer.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full overflow-x-hidden">

          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Authority Station Settings</h1>
              <p className="text-xs text-slate-400">Manage station details, officer access whitelist, and system data.</p>
            </div>
          </div>

          {/* Station Info */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">PD</div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Pimpri Division Noise Cell HQ</h3>
                <p className="text-xs text-slate-400">Station ID: PCMC-POLICE-DIST-04 • Officer-in-Charge: Inspector Deshmukh</p>
              </div>
            </div>
          </div>

          {/* Officer Whitelist Management */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Officer Access Whitelist</h2>
                <p className="text-xs text-slate-400">Only approved officers can log in to the Police Authority Portal. Admin-managed.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            {/* Add Officer Form */}
            <form onSubmit={handleAdd} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" /> Add New Approved Officer
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required
                    placeholder="Inspector Sharma"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required
                    placeholder="officer@police.gov"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Badge ID</label>
                  <input value={form.badge_id} onChange={e => setForm(p => ({...p, badge_id: e.target.value}))} required
                    placeholder="PCMC-PO-4521"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500">
                    <option value="police_patrol">Patrol Officer (Field)</option>
                    <option value="police_admin">Admin Officer (Dashboard)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={adding}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-70">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Approve Officer
                </button>
              </div>
            </form>

            {/* Approved Officers List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Officers ({officers.length})</h3>
              {loading ? (
                <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading whitelist...
                </div>
              ) : officers.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No officers on the whitelist yet.</div>
              ) : officers.map((officer, i) => (
                <div key={i} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-900/40 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                      {(officer.name || officer.email)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{officer.name || 'Officer'}</div>
                      <div className="text-[11px] text-slate-400">{officer.email}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-500">{officer.badge_id}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${officer.role === 'police_admin' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'}`}>
                          {officer.role === 'police_admin' ? 'Admin' : 'Patrol'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {officer.email !== 'admin@police.gov' && (
                    <button onClick={() => handleRemove(officer.email)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Settings;
