// Storage utility for state management with localStorage fallback

import {
  INITIAL_EVENTS,
  INITIAL_COMPLAINTS,
  INITIAL_APPLICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_NOISE_RULES
} from '../data/mockData';

const KEYS = {
  EVENTS: 'nexus_events',
  COMPLAINTS: 'nexus_complaints',
  APPLICATIONS: 'nexus_applications',
  NOTIFICATIONS: 'nexus_notifications',
  RULES: 'nexus_rules',
  CITIZEN_AUTH: 'nexus_citizen_auth',
  POLICE_AUTH: 'nexus_police_auth'
};

export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.EVENTS)) {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
  }
  if (!localStorage.getItem(KEYS.COMPLAINTS)) {
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
  }
  if (!localStorage.getItem(KEYS.APPLICATIONS)) {
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(KEYS.RULES)) {
    localStorage.setItem(KEYS.RULES, JSON.stringify(INITIAL_NOISE_RULES));
  }
};

// Helper getter & setter
export const getStored = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (err) {
    console.error(`Error loading key ${key}`, err);
    return defaultVal;
  }
};

export const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}`, err);
  }
};

// Specific accessors
export const getEvents = () => getStored(KEYS.EVENTS, INITIAL_EVENTS);
export const getComplaints = () => getStored(KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
export const getApplications = () => getStored(KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
export const getNotifications = () => getStored(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
export const getNoiseRules = () => getStored(KEYS.RULES, INITIAL_NOISE_RULES);

// Complaint actions
export const addComplaint = (newComplaint) => {
  const complaints = getComplaints();
  const updated = [newComplaint, ...complaints];
  setStored(KEYS.COMPLAINTS, updated);

  // Add police notification
  addNotification({
    id: `NOTIF-${Date.now()}`,
    recipient: 'police',
    title: 'New Noise Complaint Logged',
    message: `Complaint ${newComplaint.id} submitted at ${newComplaint.locationName} (${newComplaint.measuredMaxNoise} dB(A)).`,
    timestamp: new Date().toLocaleString('en-US', { hour12: false }),
    read: false,
    type: 'alert'
  });

  return updated;
};

export const updateComplaintStatus = (complaintId, newStatus, officerNotes = '') => {
  const complaints = getComplaints();
  const updated = complaints.map((c) => {
    if (c.id === complaintId) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timeline = c.timeline || [];
      return {
        ...c,
        status: newStatus,
        officerNotes: officerNotes || c.officerNotes,
        timeline: [...timeline, { status: newStatus, time: nowTime, note: officerNotes || `Status updated to ${newStatus}` }]
      };
    }
    return c;
  });
  setStored(KEYS.COMPLAINTS, updated);

  // Notify citizen
  addNotification({
    id: `NOTIF-${Date.now()}`,
    recipient: 'citizen',
    title: `Complaint ${complaintId} Updated`,
    message: `Your complaint status has been updated to "${newStatus}".`,
    timestamp: new Date().toLocaleString('en-US', { hour12: false }),
    read: false,
    type: 'info'
  });

  return updated;
};

// Application actions
export const addApplication = (newApp) => {
  const apps = getApplications();
  const updated = [newApp, ...apps];
  setStored(KEYS.APPLICATIONS, updated);

  addNotification({
    id: `NOTIF-${Date.now()}`,
    recipient: 'police',
    title: 'New Event Approval Application',
    message: `Application ${newApp.id} for "${newApp.eventName}" submitted by ${newApp.applicantName}.`,
    timestamp: new Date().toLocaleString('en-US', { hour12: false }),
    read: false,
    type: 'info'
  });

  return updated;
};

export const updateApplicationStatus = (appId, newStatus, approvedLimit = 75, specialConditions = '') => {
  const apps = getApplications();
  const updated = apps.map((a) => {
    if (a.id === appId) {
      return {
        ...a,
        status: newStatus,
        approvedLimitDb: approvedLimit,
        specialConditions: specialConditions || a.specialConditions,
        approvalRefNo: newStatus === 'Approved' ? `NXS-PERMIT-2026-${Math.floor(1000 + Math.random() * 9000)}` : null
      };
    }
    return a;
  });
  setStored(KEYS.APPLICATIONS, updated);

  addNotification({
    id: `NOTIF-${Date.now()}`,
    recipient: 'citizen',
    title: `Application ${appId} ${newStatus}`,
    message: `Event approval application for "${appId}" was marked as ${newStatus}.`,
    timestamp: new Date().toLocaleString('en-US', { hour12: false }),
    read: false,
    type: newStatus === 'Approved' ? 'success' : 'alert'
  });

  return updated;
};

// Rules action
export const updateRules = (newRules) => {
  setStored(KEYS.RULES, newRules);
  return newRules;
};
export const updateNoiseRules = updateRules;

export const resetStorage = () => {
  localStorage.clear();
  initializeStorage();
};

// Notifications helper
export const addNotification = (notif) => {
  const notifs = getNotifications();
  setStored(KEYS.NOTIFICATIONS, [notif, ...notifs]);
};

export const markNotificationsRead = (recipient = 'all') => {
  const notifs = getNotifications();
  const updated = notifs.map((n) => {
    if (recipient === 'all' || n.recipient === recipient) {
      return { ...n, read: true };
    }
    return n;
  });
  setStored(KEYS.NOTIFICATIONS, updated);
  return updated;
};

// Auth helpers
export const getPoliceAuth = () => getStored(KEYS.POLICE_AUTH, { isAuthenticated: false, officerId: null, officerName: '' });
export const setPoliceAuth = (authData) => setStored(KEYS.POLICE_AUTH, authData);
export const clearPoliceAuth = () => setStored(KEYS.POLICE_AUTH, { isAuthenticated: false, officerId: null, officerName: '' });
