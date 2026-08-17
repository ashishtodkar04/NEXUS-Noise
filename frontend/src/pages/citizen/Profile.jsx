import React, { useEffect, useState } from 'react';
import { User, Shield, MapPin, Volume2, Info, BookOpen } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import api from '../../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setProfile(data))
      .catch((error) => console.error('Failed to load profile', error));
  }, []);

  const name = profile?.full_name || 'Loading profile…';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : '…';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400 flex items-center justify-center text-white font-black text-2xl shadow-xl">
            {initials}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold text-white">{name}</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                Verified Resident
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Pimpri-Chinchwad Municipal Jurisdiction, Pune
            </p>
            <p className="text-xs text-slate-500 font-mono">{profile ? `${profile.email}${profile.phone ? ` • ${profile.phone}` : ''}` : 'Loading account details…'}</p>
          </div>
        </div>

        {/* Noise Regulations Guide */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" /> Statutory Noise Permitted Limits (India Rules 2000)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-sans block text-[11px]">Industrial Zone</span>
              <div className="text-white font-bold">Day: <span className="text-emerald-400">75 dB</span></div>
              <div className="text-white font-bold">Night: <span className="text-blue-400">70 dB</span></div>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-sans block text-[11px]">Commercial Zone</span>
              <div className="text-white font-bold">Day: <span className="text-emerald-400">65 dB</span></div>
              <div className="text-white font-bold">Night: <span className="text-blue-400">55 dB</span></div>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-sans block text-[11px]">Residential Zone</span>
              <div className="text-white font-bold">Day: <span className="text-emerald-400">55 dB</span></div>
              <div className="text-white font-bold">Night: <span className="text-blue-400">45 dB</span></div>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-sans block text-[11px]">Silence Zone (Hospital/School)</span>
              <div className="text-white font-bold">Day: <span className="text-emerald-400">50 dB</span></div>
              <div className="text-white font-bold">Night: <span className="text-blue-400">40 dB</span></div>
            </div>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
