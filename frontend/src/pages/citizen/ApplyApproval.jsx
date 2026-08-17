import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, MapPin, Calendar, Clock, Upload, CheckCircle, Info, Shield, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import MapView from '../../components/MapView';
import api from '../../services/api';
import { useGeolocation } from '../../utils/useGeolocation';
import LocationGate from '../../components/LocationGate';
import EventLocationPicker from '../../components/EventLocationPicker';

const ApplyApproval = () => {
  const navigate = useNavigate();

  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState('Festival');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [crowd, setCrowd] = useState('');
  const [hasSoundSystem, setHasSoundSystem] = useState(false);
  const [hasDj, setHasDj] = useState(false);
  const [speakerCount, setSpeakerCount] = useState('');
  const [expectedNoise, setExpectedNoise] = useState('');
  const [organizerAddress, setOrganizerAddress] = useState('');
  const [description, setDescription] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [documents, setDocuments] = useState({
    event_permission: null,
    venue_booking: null,
    organizer_id: null,
  });

  const [submittedApp, setSubmittedApp] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Applicant's real location (required gate) + the event's map-pinned location.
  const geo = useGeolocation();
  const [eventLat, setEventLat] = useState(null);
  const [eventLng, setEventLng] = useState(null);

  useEffect(() => { geo.request(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setApplicantName(data.full_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
      } catch (err) {
        console.error('Failed to load active user profile', err);
        setProfileError('We could not load your account details. Please sign in again.');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToRules) {
      alert("Please agree to comply with applicable noise regulations.");
      return;
    }
    if (eventLat === null || eventLng === null) {
      alert('Please pin the exact event location on the map before submitting.');
      return;
    }
    if (Object.values(documents).some((file) => !file)) {
      alert('Please upload all three mandatory supporting documents.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedDocuments = await Promise.all(
        Object.entries(documents).map(async ([documentType, file]) => {
          const formData = new FormData();
          formData.append('document_type', documentType);
          formData.append('file', file);
          const response = await api.post('/applications/documents', formData);
          return response.data;
        })
      );
      const payload = {
        event_name: eventName,
        category: category,
        location_name: venue,
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        expected_attendees: Number(crowd),
        sound_equipment: hasSoundSystem ? `Speakers: ${speakerCount}${hasDj ? ' with DJ' : ''}` : 'None',
        location_lat: eventLat,
        location_lng: eventLng,
        applicant_lat: geo.coords ? geo.coords.latitude : null,
        applicant_lng: geo.coords ? geo.coords.longitude : null,
        applicant_name: applicantName,
        applicant_phone: phone,
        applicant_email: email,
        organizer_address: organizerAddress || null,
        description: description || null,
        expected_noise: expectedNoise ? Number(expectedNoise) : null,
        speaker_count: speakerCount ? Number(speakerCount) : null,
        has_sound_system: hasSoundSystem,
        has_dj: hasDj,
        documents: uploadedDocuments,
      };

      const res = await api.post('/applications/', payload);
      setSubmittedApp(res.data);
    } catch (err) {
      console.error("Failed to submit application", err);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

        <LocationGate status={geo.status} onRequest={geo.request}>
        {/* Page Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <FileCheck className="w-3.5 h-3.5" /> Event Sound Permit Application
          </span>
          <h1 className="text-3xl font-extrabold text-white">Apply for Event / Noise Approval</h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Submit event details, venue layout, and sound equipment specifications for police noise cell sanctioning.
          </p>
        </div>

        {!submittedApp ? (
          <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            {profileError && <p className="p-3 rounded-xl border border-red-800 bg-red-950/40 text-xs text-red-300">{profileError}</p>}
            
            {/* Applicant Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                1. Applicant Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Applicant details are loaded from your signed-in Nexus Noise account.</p>
            </div>

            {/* Event Specs */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                2. Event & Sound Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Festival">Festival</option>
                    <option value="DJ">DJ / Music Event</option>
                    <option value="Wedding">Wedding Reception</option>
                    <option value="Religious event">Religious Event</option>
                    <option value="Political event">Political Event</option>
                    <option value="Commercial">Commercial Trade Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time (Cutoff)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Address</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Organizer Address</label>
                  <input type="text" value={organizerAddress} onChange={(e) => setOrganizerAddress(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Peak Noise (dB)</label>
                  <input type="number" min="0" max="150" value={expectedNoise} onChange={(e) => setExpectedNoise(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" placeholder="Describe the event and sound-management plan..." />
              </div>

              {/* Event Location (map pin) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Event Location (permitted site)</label>
                <EventLocationPicker
                  center={geo.coords ? [geo.coords.latitude, geo.coords.longitude] : [18.6279, 73.8009]}
                  onChange={(c) => { setEventLat(c.latitude); setEventLng(c.longitude); }}
                />
                {!eventLat && (
                  <p className="text-[11px] text-amber-400">Please pin the exact event location on the map before submitting.</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Crowd</label>
                  <input
                    type="number"
                    value={crowd}
                    onChange={(e) => setCrowd(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Speaker Count</label>
                  <input
                    type="number"
                    value={speakerCount}
                    onChange={(e) => setSpeakerCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sound System?</label>
                  <select
                    value={hasSoundSystem ? 'Yes' : 'No'}
                    onChange={(e) => setHasSoundSystem(e.target.value === 'Yes')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">DJ System?</label>
                  <select
                    value={hasDj ? 'Yes' : 'No'}
                    onChange={(e) => setHasDj(e.target.value === 'Yes')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload Simulation */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                3. Mandatory Supporting Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['event_permission', '1. Event Permission Document'],
                  ['venue_booking', '2. Venue Booking Document'],
                  ['organizer_id', '3. Organizer ID Proof'],
                ].map(([key, label]) => (
                  <label key={key} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2 cursor-pointer hover:border-blue-500/60">
                    <span className="font-semibold text-white block">{label}</span>
                    <input
                      type="file"
                      required
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setDocuments((current) => ({ ...current, [key]: e.target.files?.[0] || null }))}
                      className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-2 file:py-1 file:text-white"
                    />
                    <span className={documents[key] ? 'text-emerald-400 font-mono block' : 'text-slate-500 block'}>
                      {documents[key] ? `${documents[key].name} ✓` : 'PDF, JPG, PNG, or WEBP (max 10 MB)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkbox Compliance */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="rulesCheck"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <label htmlFor="rulesCheck" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                I hereby declare that I agree to comply with all applicable noise pollution regulations (Noise Pollution Control Rules 2000), permitted decibel ceilings (e.g. 75 dB daytime, 55 dB nighttime), and standard operating hours.
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting || profileLoading || !!profileError}
                className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {submitting || profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />} 
                {profileLoading ? 'Loading account...' : submitting ? 'Submitting...' : 'Submit Event Approval Application'}
              </button>
            </div>

          </form>
        ) : (
          /* Confirmation Screen */
          <div className="glass-panel p-8 rounded-3xl border border-blue-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/40">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Application Submitted Successfully</h2>
              <p className="text-xs text-slate-400 mt-1">Application reference ID logged into police review queue.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 max-w-md mx-auto space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Application ID:</span>
                <span className="font-mono font-bold text-blue-400 text-sm">{submittedApp._id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Event Name:</span>
                <span className="font-bold text-white">{submittedApp.event_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-400">{submittedApp.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event Date:</span>
                <span className="font-semibold text-slate-200">{submittedApp.date} ({submittedApp.start_time} - {submittedApp.end_time})</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/citizen/applications')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs"
              >
                Track My Applications
              </button>
            </div>
          </div>
        )}

        </LocationGate>
      </main>

      <BottomNav />
    </div>
  );
};

export default ApplyApproval;
