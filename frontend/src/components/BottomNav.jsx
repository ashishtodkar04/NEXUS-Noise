import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, AlertTriangle, FileText, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/citizen', icon: Home },
    { label: 'Events', path: '/citizen/events', icon: Calendar },
    { label: 'Report', path: '/citizen/complaint', icon: AlertTriangle, highlight: true },
    { label: 'Complaints', path: '/citizen/complaints', icon: FileText },
    { label: 'Profile', path: '/citizen/profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 md:hidden px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          if (item.highlight) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-red-600/40 ring-4 ring-slate-950 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-red-400 mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs transition-colors ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
