import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Bell, Shield, Menu, X, PlusCircle, Volume2, Calendar, FileText, User } from 'lucide-react';

const Navbar = ({ mode = 'citizen' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const location = useLocation();
  // Badge count from local state only — full count is available on the Notifications page
  const unreadCount = 0;
  const isPoliceAuthenticated = !!localStorage.getItem('policeToken');

  React.useEffect(() => {
    const loadActiveUser = async () => {
      const token = mode === 'police' ? localStorage.getItem('policeToken') : localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) setActiveUser(await response.json());
      } catch (error) {
        console.error('Unable to load active user', error);
      }
    };
    loadActiveUser();
  }, [mode]);

  const officerName = activeUser?.full_name || 'Police Officer';
  const officerInitials = officerName.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'PO';

  const citizenNavItems = [
    { label: 'Home', path: '/citizen' },
    { label: 'Events', path: '/citizen/events' },
    { label: 'Report Noise', path: '/citizen/complaint', highlight: true },
    { label: 'My Complaints', path: '/citizen/complaints' },
    { label: 'My Applications', path: '/citizen/applications' },
    { label: 'Notifications', path: '/citizen/notifications', badge: unreadCount },
    { label: 'Profile', path: '/citizen/profile' }
  ];

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-red-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                  NEXUS<span className="text-red-500 font-black ml-1">NOISE</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                  Civic Noise Compliance Platform
                </span>
              </div>
            </Link>

            {/* View Mode Tag */}
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
              mode === 'police' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {mode === 'police' ? <Shield className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              {mode === 'police' ? 'Police Authority Portal' : 'Citizen Portal'}
            </span>
          </div>

          {/* Desktop Citizen Navigation Links */}
          {mode === 'citizen' && (
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {citizenNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                      item.highlight
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-md hover:shadow-red-600/30'
                        : isActive
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                    {item.badge > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Controls: Police Switch / Profile */}
          <div className="flex items-center gap-3">
            {mode === 'citizen' ? (
              <Link
                to={isPoliceAuthenticated ? "/police/dashboard" : "/police/login"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all hover:border-slate-600"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Police Login</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/citizen"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Citizen View</span>
                </Link>
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-red-950 border border-red-700 flex items-center justify-center font-bold text-xs text-red-200">
                    {officerInitials}
                  </div>
                  <div className="text-left text-xs leading-none">
                    <span className="block font-bold text-slate-200">{officerName}</span>
                    <span className="text-[10px] text-slate-400">ID: {activeUser?.badge_id || activeUser?.email || 'Loading...'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          {mode === 'citizen' && citizenNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
                item.highlight
                  ? 'bg-red-600 text-white font-bold'
                  : location.pathname === item.path
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800">
            <Link
              to={mode === 'citizen' ? "/police/login" : "/citizen"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
            >
              {mode === 'citizen' ? <Shield className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
              <span>{mode === 'citizen' ? "Switch to Police Authority Portal" : "Switch to Citizen Portal"}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
