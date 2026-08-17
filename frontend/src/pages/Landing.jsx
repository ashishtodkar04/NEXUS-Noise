import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Volume2, Shield, AlertTriangle, FileCheck, MapPin, Clock,
  BarChart3, CheckCircle, ArrowRight, Activity, Mic,
  ChevronDown, Lock, Mail, User, Phone, Loader2, Eye, EyeOff,
  Cpu, Zap, Globe, Users, Star, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

// ─── Sub-components ─────────────────────────────────────────────────────────

const NavBar = () => (
  <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-gray-900 text-lg tracking-tight">Nexus<span className="text-blue-600">Noise</span></span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
        <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
        <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
        <a href="#portals" className="hover:text-gray-900 transition-colors">Portals</a>
        <a href="#get-started" className="hover:text-gray-900 transition-colors">Get Started</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/police/login" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          <Shield className="w-3.5 h-3.5" /> Police Portal
        </Link>
        <a href="#get-started" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
          Get Started →
        </a>
      </div>
    </div>
  </nav>
);

const StatBadge = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-black text-white">{value}</div>
    <div className="text-xs text-blue-200 font-semibold mt-0.5">{label}</div>
  </div>
);

// ─── Auth Block ──────────────────────────────────────────────────────────────

const AuthBlock = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', form.email);
        params.append('password', form.password);
        const res = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', 'citizen');
        localStorage.removeItem('policeToken');
        navigate('/citizen/dashboard');
      } else {
        const res = await api.post('/auth/register', {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone
        });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', 'citizen');
        localStorage.removeItem('policeToken');
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => { setIsLogin(true); setError(''); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-700'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(''); }}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-700'}`}
        >
          Create Account
        </button>
      </div>

      <div className="p-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input name="full_name" type="text" required value={form.full_name} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="+91 9876543210" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Sign In to Citizen Portal' : 'Create My Account')}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <Link to="/police/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors mt-3">
            <Shield className="w-3.5 h-3.5" />
            Police Officer? Login to Authority Portal →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Main Landing Page ───────────────────────────────────────────────────────

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <NavBar />

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase">
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Pimpri-Chinchwad Municipal Noise Compliance System
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1]">
              Smarter Noise Control.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Stronger Communities.
              </span>
            </h1>

            <p className="text-xl text-blue-100/80 font-normal leading-relaxed max-w-2xl mx-auto">
              A complete AI-powered platform that lets citizens report noise violations, police verify events in real-time, and organizers apply for event permits — all from one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#get-started"
                className="group w-full sm:w-auto px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Get Started Free
              </a>
              <a href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2">
                <ChevronDown className="w-5 h-5" />
                See How It Works
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-white/10 pt-10">
            <StatBadge value="4 AI Agents" label="Evidence Analysis" />
            <StatBadge value="Real-Time" label="GIS Map Tracking" />
            <StatBadge value="5 Zones" label="Limit Rule Sets" />
            <StatBadge value="100%" label="Digital Records" />
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">The Challenge</span>
            <h2 className="text-4xl font-black text-gray-900">Why Traditional Noise Complaints Fail</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Verbal complaints lack evidence, officers arrive late, and there's no centralized data. This platform solves all of it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Volume2, color: 'red', title: 'Excessive Event Noise', desc: 'DJ subwoofers operating beyond permitted decibel limits and cutting into nighttime hours.' },
              { icon: FileCheck, color: 'amber', title: 'No Hard Evidence', desc: 'Verbal complaints are impossible to prosecute without structured, timestamped evidence data.' },
              { icon: Clock, color: 'blue', title: 'Delayed Response', desc: 'By the time patrol arrives, organisers lower volumes — leaving officers with nothing to act on.' },
              { icon: Globe, color: 'indigo', title: 'No Central Database', desc: 'No real-time map, approval database, or correlation between events and noise levels exists.' }
            ].map((item, i) => {
              const Icon = item.icon;
              const colors = {
                red: 'bg-red-100 text-red-600',
                amber: 'bg-amber-100 text-amber-600',
                blue: 'bg-blue-100 text-blue-600',
                indigo: 'bg-indigo-100 text-indigo-600'
              };
              return (
                <div key={i} className="p-6 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg rounded-2xl transition-all space-y-4 group">
                  <div className={`w-11 h-11 rounded-xl ${colors[item.color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">Step By Step</span>
            <h2 className="text-4xl font-black text-gray-900">End-to-End Compliance Workflow</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">From initial report to official enforcement, every step is digital, verifiable, and auditable.</p>
          </div>

          <div className="relative">
            {/* Connecting line (hidden on mobile) */}
            <div className="hidden lg:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200" style={{ top: '2.5rem', left: '6%', right: '6%' }} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', icon: FileCheck, title: 'Organiser Applies', desc: 'Event organiser submits a permit application with location, duration, speaker count, and expected noise level.', color: 'blue' },
                { step: '02', icon: Shield, title: 'Police Sets Limit', desc: 'Authority officer reviews the application and assigns a permitted decibel ceiling (e.g. 65 dB residential).', color: 'indigo' },
                { step: '03', icon: AlertTriangle, title: 'Citizen Reports Violation', desc: 'If noise exceeds limits, a citizen records a 30-second video using the complaint wizard and submits it.', color: 'amber' },
                { step: '04', icon: Cpu, title: 'AI Analyses Evidence', desc: '4-agent AI pipeline extracts audio dB, identifies source location, applies inverse-square law, checks area limits.', color: 'purple' },
                { step: '05', icon: MapPin, title: 'GPS Geotagging', desc: "Complaint giver's location and the event source location are separately captured and plotted on the GIS map.", color: 'green' },
                { step: '06', icon: Zap, title: 'Real-Time Alert', desc: 'If the AI confirms a valid violation, police dashboard receives a WebSocket push notification instantly.', color: 'red' },
                { step: '07', icon: BarChart3, title: 'Officer Reviews', desc: 'Police admin sees the full evidence package, video, decibel readings, source prediction, and area limit.', color: 'blue' },
                { step: '08', icon: CheckCircle, title: 'Action & Resolution', desc: 'Challan generated, patrol dispatched via mobile app, or case marked resolved with digital audit trail.', color: 'green' }
              ].map((s, i) => {
                const Icon = s.icon;
                const iconColors = {
                  blue: 'bg-blue-100 text-blue-600', indigo: 'bg-indigo-100 text-indigo-600',
                  amber: 'bg-amber-100 text-amber-600', purple: 'bg-purple-100 text-purple-600',
                  green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600'
                };
                return (
                  <div key={i} className="relative bg-white border border-gray-100 hover:border-blue-200 hover:shadow-xl rounded-2xl p-6 space-y-3 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl font-black text-gray-100 font-mono">{s.step}</span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[s.color]}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">Platform Features</span>
            <h2 className="text-4xl font-black text-gray-900">Everything Built In</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: '4-Agent AI Pipeline', desc: 'Audio extraction → Visual analysis → Inverse-Square law → Area limit check. Every complaint is machine-validated.', tag: 'AI Powered' },
              { icon: MapPin, title: 'Live GIS Mapping', desc: 'Leaflet heatmap shows complaint density, event locations, complaint giver locations, and source predictions.', tag: 'Real-Time' },
              { icon: Volume2, title: 'Live Decibel Meter', desc: 'Patrol officers can measure field decibels directly from their phone browser — no extra hardware needed.', tag: 'Mobile' },
              { icon: FileCheck, title: 'Event Permit System', desc: 'Digital application portal for organizers with police approval/rejection workflow and permit reference numbers.', tag: 'Workflow' },
              { icon: Shield, title: 'Officer Approval System', desc: 'Police admin curates a whitelist of authorized officers. Only approved emails can access the Authority Portal.', tag: 'Security' },
              { icon: AlertTriangle, title: 'Evidence Complaint Wizard', desc: '6-step wizard capturing location geotag, noise telemetry, event correlation, 30s video evidence, and description.', tag: 'Citizen' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-lg rounded-2xl transition-all group space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-1 rounded-full">{f.tag}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PORTALS ──────────────────────────────────────────── */}
      <section id="portals" className="py-20 bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-white/10 border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">Two Portals</span>
            <h2 className="text-4xl font-black">Built for Everyone in the System</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Citizen Portal */}
            <div className="bg-white/5 border border-white/10 hover:border-blue-400/40 rounded-3xl p-8 space-y-6 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Citizen Portal</h3>
                  <p className="text-sm text-blue-300">For residents & event organizers</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-blue-100">
                {['Report noise violations with video & GPS evidence', 'Apply for event sound system permits', 'Track the status of your complaints in real-time', 'Browse nearby events and verify their approvals', 'View the noise heatmap around you'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />{item}</li>
                ))}
              </ul>
              <a href="#get-started" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                Access Citizen Portal <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Police Portal */}
            <div className="bg-white/5 border border-white/10 hover:border-red-400/40 rounded-3xl p-8 space-y-6 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Police Authority Portal</h3>
                  <p className="text-sm text-red-300">For admin officers & field patrol units</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-blue-100">
                {['Command dashboard with live complaint KPIs', 'Review AI-analysed video evidence packages', 'Approve or reject event permit applications', 'Live decibel meter for field patrol officers', 'Manage officer whitelist & access control', 'GIS map with heatmap, events & complaint pins'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-red-400 shrink-0" />{item}</li>
                ))}
              </ul>
              <Link to="/police/login" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-red-500/30">
                Police Officer Login <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── GET STARTED / AUTH BLOCK ─────────────────────────── */}
      <section id="get-started" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="space-y-6">
              <span className="inline-block bg-green-100 text-green-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">Free to Use</span>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">
                Join Nexus Noise Today and Make Your Community Quieter.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Citizens can create a free account in seconds. Your evidence is encrypted, timestamped, and goes directly to the police command centre for review.
              </p>
              <div className="space-y-3">
                {[
                  'No app download required — works in any browser',
                  'Your location data is used only for verification',
                  'AI analysis happens automatically in the background',
                  'Get instant status updates on your complaints'
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Auth form */}
            <AuthBlock />
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-white text-base">NexusNoise</span>
              </div>
              <p className="text-sm leading-relaxed">Civic noise-monitoring and event compliance platform for the Pimpri-Chinchwad Division.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Citizen Portal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/citizen/login" className="hover:text-white transition-colors">Sign In / Register</Link></li>
                <li><Link to="/citizen/complaint" className="hover:text-white transition-colors">Report Noise</Link></li>
                <li><Link to="/citizen/apply" className="hover:text-white transition-colors">Apply for Permit</Link></li>
                <li><Link to="/citizen/events" className="hover:text-white transition-colors">Nearby Events Map</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Police Authority</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/police/login" className="hover:text-white transition-colors">Officer Login</Link></li>
                <li><Link to="/police/dashboard" className="hover:text-white transition-colors">Command Dashboard</Link></li>
                <li><Link to="/patrol/dashboard" className="hover:text-white transition-colors">Patrol Officer Portal</Link></li>
                <li><Link to="/patrol/meter" className="hover:text-white transition-colors">Live Decibel Meter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Legal & Info</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="cursor-pointer hover:text-white transition-colors">Noise Pollution Rules 2000</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Privacy & Geotag Policy</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Scientific Disclaimer</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Contact Control Room</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-xs text-gray-500">
            © 2026 Nexus Noise Compliance System — Pimpri-Chinchwad Division. Academic Prototype.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
