import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, MapPin, Mic, Camera } from 'lucide-react';
import api from '../../services/api';

const CitizenLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const requestPermissions = async () => {
    try {
      // Request Camera and Mic
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // Request Location
      navigator.geolocation.getCurrentPosition(
        () => setPermissionsGranted(true),
        (err) => console.log('Location denied', err)
      );
      setPermissionsGranted(true);
    } catch (err) {
      setError('Please allow Camera, Microphone, and Location permissions to use this app effectively.');
      console.log('Permission error', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissionsGranted) {
      await requestPermissions();
      if (!permissionsGranted) return; // wait for next click if not granted
    }

    try {
      if (isLogin) {
        // Login requires form url encoded data for OAuth2PasswordRequestForm
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);
        
        const response = await api.post('/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', 'citizen');
        localStorage.removeItem('policeToken'); // ensure a clean citizen-only session
        navigate('/citizen/dashboard');
      } else {
        const response = await api.post('/auth/register', formData);
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', 'citizen');
        localStorage.removeItem('policeToken'); // ensure a clean citizen-only session
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'Citizen Login' : 'Register'}
          </h2>
          <p className="text-gray-400 text-sm">
            Access your noise complaint dashboard and report issues.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          {!permissionsGranted && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <p className="text-xs text-blue-300 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                This app requires device permissions to submit noise complaints accurately.
              </p>
              <div className="flex gap-2 text-gray-400">
                <MapPin className="w-4 h-4" /> <Mic className="w-4 h-4" /> <Camera className="w-4 h-4" />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
          <div className="mt-4">
             <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                Return to Home
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLogin;
