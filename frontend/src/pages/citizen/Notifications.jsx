import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import api from '../../services/api';

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications/');
        setNotifs(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifs(notifs.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Notifications</h1>
            <p className="text-xs text-slate-400">Updates regarding your complaints and event permit applications.</p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" /> Mark All Read
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
             [1, 2, 3].map(i => (
               <div key={i} className="h-20 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800"></div>
             ))
          ) : notifs.length === 0 ? (
             <div className="text-center py-12 text-slate-500 text-sm">
                No notifications found.
             </div>
          ) : notifs.map((n) => (
            <div
              key={n.id || n._id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                n.read ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-900 border-blue-500/40 text-white shadow-lg'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                n.type === 'alert' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {n.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                 n.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{n.title}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{n.timestamp || new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-400">{n.message}</p>
              </div>
            </div>
          ))}
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
