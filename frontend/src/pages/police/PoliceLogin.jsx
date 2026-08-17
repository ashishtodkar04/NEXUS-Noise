import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const PoliceLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notApproved, setNotApproved] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotApproved(false);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/police/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('policeToken', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.removeItem('token'); // ensure a clean police-only session
      // Check role for redirect
      const role = res.data.role;
      if (role === 'police_patrol') {
        navigate('/patrol/dashboard');
      } else {
        navigate('/police/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.toLowerCase().includes('not on approved list') || detail.toLowerCase().includes('not authorized')) {
        setNotApproved(true);
      } else {
        setError(detail || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 shadow-2xl shadow-red-600/30">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">Police Authority Portal</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Nexus Noise • Law Enforcement Division</p>
          </div>
        </div>

        {/* Not Approved Warning */}
        {notApproved && (
          <div className="p-5 bg-amber-950/60 border border-amber-700/60 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              Access Not Authorized
            </div>
            <p className="text-xs text-amber-200 leading-relaxed">
              Your email address <strong className="font-mono">{email}</strong> is not on the approved officer whitelist. Please contact your <strong>Police Admin</strong> to get your account approved before logging in.
            </p>
          </div>
        )}

        {/* Error */}
        {error && !notApproved && (
          <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Officer Email / Badge ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                placeholder="officer@police.gov" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Authorization Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••" />
            </div>
          </div>

          {/* Hint box */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-500 space-y-0.5">
            <span className="font-bold text-slate-400 block">Demo Credentials:</span>
            <span className="font-mono text-blue-400">admin@police.gov / admin123</span>
            <span className="block mt-1 text-slate-600">Patrol officers must be approved by an Admin first.</span>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Authenticate Officer Session <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Nexus Noise Home
          </Link>
          <p className="text-[10px] text-slate-600">Official Government Demonstration Prototype • Pimpri-Chinchwad</p>
        </div>
      </div>
    </div>
  );
};

export default PoliceLogin;
