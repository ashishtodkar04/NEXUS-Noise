import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';

// Citizen Portal Pages
import CitizenLogin from './pages/citizen/CitizenLogin';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportNoise from './pages/citizen/ReportNoise';
import ApplyApproval from './pages/citizen/ApplyApproval';
import CitizenComplaints from './pages/citizen/Complaints';
import CitizenApplications from './pages/citizen/Applications';
import NearbyEvents from './pages/citizen/NearbyEvents';
import Notifications from './pages/citizen/Notifications';
import Profile from './pages/citizen/Profile';

// Police Authority Portal Pages
import PoliceLogin from './pages/police/PoliceLogin';
import PoliceDashboard from './pages/police/PoliceDashboard';
import PatrolDashboard from './pages/police/PatrolDashboard';
import LiveDecibelMeter from './pages/police/LiveDecibelMeter';
import Monitoring from './pages/police/Monitoring';
import PoliceComplaints from './pages/police/Complaints';
import ComplaintDetails from './pages/police/ComplaintDetails';
import PoliceEvents from './pages/police/Events';
import EventDetails from './pages/police/EventDetails';
import PoliceApplications from './pages/police/Applications';
import PoliceMap from './pages/police/Map';
import PoliceRules from './pages/police/Rules';
import PoliceReports from './pages/police/Reports';
import PoliceSettings from './pages/police/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Citizen Portal Routes */}
        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/complaint" element={<ProtectedRoute><ReportNoise /></ProtectedRoute>} />
        <Route path="/citizen/apply" element={<ProtectedRoute><ApplyApproval /></ProtectedRoute>} />
        <Route path="/citizen/complaints" element={<ProtectedRoute><CitizenComplaints /></ProtectedRoute>} />
        <Route path="/citizen/applications" element={<ProtectedRoute><CitizenApplications /></ProtectedRoute>} />
        <Route path="/citizen/events" element={<ProtectedRoute><NearbyEvents /></ProtectedRoute>} />
        <Route path="/citizen/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Police Authority Portal Routes */}
        <Route path="/police/login" element={<PoliceLogin />} />
        <Route path="/police/dashboard" element={<ProtectedRoute require="police"><PoliceDashboard /></ProtectedRoute>} />
        <Route path="/patrol/dashboard" element={<ProtectedRoute require="patrol"><PatrolDashboard /></ProtectedRoute>} />
        <Route path="/patrol/meter" element={<ProtectedRoute require="patrol"><LiveDecibelMeter /></ProtectedRoute>} />
        <Route path="/police/monitoring" element={<ProtectedRoute require="police"><Monitoring /></ProtectedRoute>} />
        <Route path="/police/complaints" element={<ProtectedRoute require="police"><PoliceComplaints /></ProtectedRoute>} />
        <Route path="/police/complaints/:id" element={<ProtectedRoute require="police"><ComplaintDetails /></ProtectedRoute>} />
        <Route path="/police/events" element={<ProtectedRoute require="police"><PoliceEvents /></ProtectedRoute>} />
        <Route path="/police/events/:id" element={<ProtectedRoute require="police"><EventDetails /></ProtectedRoute>} />
        <Route path="/police/applications" element={<ProtectedRoute require="police"><PoliceApplications /></ProtectedRoute>} />
        <Route path="/police/map" element={<ProtectedRoute require="police"><PoliceMap /></ProtectedRoute>} />
        <Route path="/police/rules" element={<ProtectedRoute require="police"><PoliceRules /></ProtectedRoute>} />
        <Route path="/police/reports" element={<ProtectedRoute require="police"><PoliceReports /></ProtectedRoute>} />
        <Route path="/police/settings" element={<ProtectedRoute require="police"><PoliceSettings /></ProtectedRoute>} />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
