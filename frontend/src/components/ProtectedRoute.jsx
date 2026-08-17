import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Frontend route guard.
 * require:
 *   'citizen'  -> citizen token must exist
 *   'police'   -> police token + role is police / police_admin
 *   'patrol'   -> police token + role is police_patrol
 *   'admin'    -> police token + role is police / police_admin (explicit)
 */
const ProtectedRoute = ({ children, require = 'citizen' }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const policeToken = localStorage.getItem('policeToken');
  const role = localStorage.getItem('role') || 'citizen';

  if (require === 'citizen') {
    if (!token) return <Navigate to="/citizen/login" replace />;
    return children;
  }

  // Police-family routes
  if (!policeToken) {
    return <Navigate to="/police/login" replace state={{ from: location }} />;
  }

  if (require === 'patrol') {
    if (role !== 'police_patrol') return <Navigate to="/police/dashboard" replace />;
  } else {
    // police or admin requested — patrols go to their own portal
    if (role === 'police_patrol') return <Navigate to="/patrol/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;