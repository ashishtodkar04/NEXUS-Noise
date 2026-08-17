import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Calendar,
  FileCheck,
  ShieldAlert,
  Map,
  Sliders,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Shield
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const policeRoutes = [
    { label: 'Dashboard', path: '/police/dashboard', icon: LayoutDashboard },
    { label: 'Live Monitoring', path: '/police/monitoring', icon: Activity, badge: 'LIVE' },
    { label: 'Events', path: '/police/events', icon: Calendar },
    { label: 'Applications', path: '/police/applications', icon: FileCheck },
    { label: 'Complaints', path: '/police/complaints', icon: ShieldAlert },
    { label: 'Live GIS Map', path: '/police/map', icon: Map },
    { label: 'Noise Rules', path: '/police/rules', icon: Sliders },
    { label: 'Reports & Analytics', path: '/police/reports', icon: BarChart3 },
    { label: 'Authority Settings', path: '/police/settings', icon: Settings }
  ];

  const handleLogout = () => {
    localStorage.removeItem('policeToken');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/police/login');
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* Department Title */}
        <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-red-600/20 text-red-400 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">NOISE CELL HQ</h4>
            <p className="text-[10px] text-red-400 font-mono">Pimpri-Chinchwad Division</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {policeRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = location.pathname === route.path || (route.path !== '/police/dashboard' && location.pathname.startsWith(route.path));
            return (
              <Link
                key={route.path}
                to={route.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{route.label}</span>
                </div>
                {route.badge && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded animate-pulse">
                    {route.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Officer Profile & Logout */}
      <div className="pt-4 border-t border-slate-900 space-y-3">
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-950 border border-red-700 flex items-center justify-center font-bold text-xs text-red-200">
              PO
            </div>
            <div className="text-left text-xs leading-none">
              <span className="block font-bold text-slate-200">Officer Deshmukh</span>
              <span className="text-[10px] text-slate-400">Badge #PC-8812</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/40 rounded-xl text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Authority Portal</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
