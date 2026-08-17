import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Volume2,
  Mic,
  Square,
  FileVideo,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldCheck
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import BottomNav from '../../components/BottomNav';
import MapView from '../../components/MapView';
import { SCIENTIFIC_DISCLAIMER } from '../../utils/noiseCalculator';
import api from '../../services/api';
import { useNoiseMeter } from '../../utils/useNoiseMeter';
import { useGeolocation } from '../../utils/useGeolocation';
import LocationGate from '../../components/LocationGate';

const ReportNoise = () => {
  const navigate = useNavigate();
  // Default noise rules — will be pulled from API if needed
  const rules = { daytimeLimit: 65, nighttimeLimit: 55 };
  const events = [];

  // Wizard Step State (1 to 6)
  const [step, setStep] = useState(1);

  // Form Fields State
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Step 2: Noise Telemetry State (driven by the real microphone)
  const [isMonitoring, setIsMonitoring] = useState(false);
  const meter = useNoiseMeter();
  const geo = useGeolocation();
  const [currentNoise, setCurrentNoise] = useState(0);
  const [avgNoise, setAvgNoise] = useState(0);
  const [maxNoise, setMaxNoise] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  // Step 3: Event Info
  const [eventName, setEventName] = useState('');
  const [eventCategory, setEventCategory] = useState('Festival');
  const [eventOrganizer, setEventOrganizer] = useState('');
  const [areaType, setAreaType] = useState('residential');
  const [useMapFallback, setUseMapFallback] = useState(false);
  const [eventLat, setEventLat] = useState('');
  const [eventLng, setEventLng] = useState('');

  // Step 4: Evidence Files State
  const [videoFileObj, setVideoFileObj] = useState(null);

  // Step 5: Description
  const [description, setDescription] = useState('');

  // Submitted Complaint Result State
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Video Recording State
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoTimeLeft, setVideoTimeLeft] = useState(30);
  const mediaRecorderRef = React.useRef(null);
  const videoPreviewRef = React.useRef(null);
  const streamRef = React.useRef(null);

  useEffect(() => {
    let timer;
    if (isRecordingVideo && videoTimeLeft > 0) {
      timer = setInterval(() => setVideoTimeLeft((prev) => prev - 1), 1000);
    } else if (videoTimeLeft === 0 && isRecordingVideo) {
      stopVideoRecording();
    }
    return () => clearInterval(timer);
  }, [isRecordingVideo, videoTimeLeft]);

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], 'recorded_evidence.webm', { type: 'video/webm' });
        setVideoFileObj(file);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
          videoPreviewRef.current.src = URL.createObjectURL(blob);
        }
      };
      
      setVideoTimeLeft(30);
      setIsRecordingVideo(true);
      mediaRecorder.start(100);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access is required to record evidence.");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecordingVideo(false);
  };

  const discardRecording = () => {
    setVideoFileObj(null);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.src = '';
    }
  };

  // Microphone Noise Simulator Interval
  // Request location permission when the wizard opens.
  useEffect(() => { geo.request(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // When location is granted, use the real coordinates.
  useEffect(() => {
    if (geo.status === 'granted' && geo.coords) {
      setLat(geo.coords.latitude);
      setLng(geo.coords.longitude);
    }
  }, [geo.status, geo.coords]);

  // Duration timer while the real microphone is running.
  useEffect(() => {
    let interval = null;
    if (isMonitoring) {
      interval = setInterval(() => setDurationSec((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Mirror the live mic meter into the wizard state (real telemetry, no simulation).
  useEffect(() => {
    if (!isMonitoring) return;
    setCurrentNoise(meter.level);
    setMaxNoise((prev) => Math.max(prev, meter.level));
    setAvgNoise((prev) => (prev === 0 ? meter.level : Math.round((prev + meter.level) / 2)));
  }, [isMonitoring, meter.level]);

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleUseCurrentLocation = () => {
    if (!geo.coords) {
      geo.request();
      alert('Location permission is required before a complaint can be filed.');
      return;
    }
    setLat(geo.coords.latitude);
    setLng(geo.coords.longitude);
    setLocationName((current) => current || `GPS location: ${geo.coords.latitude.toFixed(5)}, ${geo.coords.longitude.toFixed(5)}`);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();

    if (!videoFileObj) {
      alert("Please upload a video file for analysis.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('video', videoFileObj);
      formData.append('shop_name', locationName);
      formData.append('area_type', areaType);
      
      if (useMapFallback) {
        formData.append('event_lat', eventLat);
        formData.append('event_lon', eventLng);
      }

      const response = await api.post('/complaints/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show processing state visually before the websocket updates it (if it takes long)
      const newComplaintData = {
        ...response.data,
        id: response.data.complaint_id || response.data.cache_id,
        measuredMaxNoise: maxNoise,
        status: response.data.status || 'pending_approval',
        assignedAuthority: 'Local Police Division'
      };

      setSubmittedComplaint(newComplaintData);
      setStep(7); // Show Confirmation View
    } catch (err) {
      console.error('Error submitting complaint:', err);
      alert('Failed to submit complaint. Please ensure you are logged in.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar mode="citizen" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

        <LocationGate status={geo.status} onRequest={geo.request}>
        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Citizen Evidence Complaint Wizard
          </span>
          <h1 className="text-3xl font-extrabold text-white">Report Excessive Noise</h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Capture location geotag, real-time decibel telemetry, and encrypted audio evidence for official police review.
          </p>
        </div>

        {/* Step Progress Bar */}
        {step <= 6 && (
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>Step {step} of 6: {
                step === 1 ? 'Location Geotag' :
                step === 2 ? 'Noise Telemetry' :
                step === 3 ? 'Event Info' :
                step === 4 ? 'Verified Video Evidence' :
                step === 5 ? 'Issue Description' : 'Evidence Summary'
              }</span>
              <span className="text-blue-400">{Math.round((step / 6) * 100)}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-red-500 transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: LOCATION */}
        {step === 1 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" /> Step 1 — Capture Incident Location
              </h3>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" /> Use My Current Location
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter location address..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude Coordinate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude Coordinate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Map Preview */}
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
                <MapView
                  events={events}
                  height="100%"
                  selectedCenter={[lat, lng]}
                  zoom={14}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                Continue to Noise Evidence <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: NOISE EVIDENCE MONITOR */}
        {step === 2 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-red-500" /> Step 2 — Record Noise Evidence Telemetry
              </h3>
              <span className="text-xs text-slate-400 font-mono">Microphone Sensor Engine</span>
            </div>

            {/* Live Meter Display */}
            <div className="p-6 bg-slate-900/90 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-800 text-red-400 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Live Microphone Sensor — dB SPL Estimate</span>
              </div>

              <div className="my-4">
                <span className="text-6xl font-black text-white font-mono tracking-tight block">
                  {currentNoise}
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase">Estimated Decibels — dB(A)</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto p-3 bg-slate-950 rounded-xl text-xs font-mono border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Current</span>
                  <strong className="text-blue-400 font-bold">{currentNoise} dB</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Average</span>
                  <strong className="text-emerald-400 font-bold">{avgNoise} dB</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Maximum</span>
                  <strong className="text-red-400 font-bold">{maxNoise} dB</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                  <strong className="text-amber-400 font-bold">{formatDuration(durationSec)}</strong>
                </div>
              </div>

              {/* Start & Stop Controls */}
              <div className="flex justify-center gap-4 pt-2">
                {!isMonitoring ? (
                  <button
                    type="button"
                    onClick={() => { meter.start(); setIsMonitoring(true); }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <Mic className="w-4 h-4" /> Start Live Monitoring
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { meter.stop(); setIsMonitoring(false); }}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" /> Stop & Save Evidence
                  </button>
                )}
                {meter.error && (
                  <p className="text-[11px] text-red-400 text-center">⚠ {meter.error}</p>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed border border-slate-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{SCIENTIFIC_DISCLAIMER}</span>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                Continue to Event Information <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVENT INFO */}
        {step === 3 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Step 3 — Event Correlation</h3>
              <span className="text-xs text-slate-400">Match active venue</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Name / Disturbance Source</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Ganesh Utsav Mahotsav..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Category</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="DJ">DJ / Electronic Concert</option>
                  <option value="Festival">Festival Celebration</option>
                  <option value="Religious event">Religious Event</option>
                  <option value="Wedding">Wedding Reception</option>
                  <option value="Political event">Political Rally</option>
                  <option value="Construction">Construction Activity</option>
                  <option value="Commercial">Commercial Speaker</option>
                  <option value="Other">Other Unspecified</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Organizer (Optional)</label>
                <input
                  type="text"
                  value={eventOrganizer}
                  onChange={(e) => setEventOrganizer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                  placeholder="Organizer name or committee..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Area Type (For Limit Rules)</label>
                <select
                  value={areaType}
                  onChange={(e) => setAreaType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="residential">Residential Zone (55 dB Limit)</option>
                  <option value="commercial">Commercial Zone (65 dB Limit)</option>
                  <option value="industrial">Industrial Zone (75 dB Limit)</option>
                  <option value="silence">Silence Zone (50 dB Limit)</option>
                </select>
              </div>

              {/* Map Fallback Option */}
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useMapFallback}
                    onChange={(e) => setUseMapFallback(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-800 border-slate-700" 
                  />
                  <div>
                    <span className="block text-sm font-bold text-white">AI Cannot Detect Source? (Map Fallback)</span>
                    <span className="block text-xs text-slate-400">If the noise source is hidden from the video, drop a pin manually to calculate distance.</span>
                  </div>
                </label>

                {useMapFallback && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Event Lat</label>
                        <input type="number" step="0.0001" value={eventLat} onChange={(e) => setEventLat(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-800 rounded-lg text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Event Lng</label>
                        <input type="number" step="0.0001" value={eventLng} onChange={(e) => setEventLng(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-800 rounded-lg text-xs text-white" />
                      </div>
                    </div>
                    <div className="h-48 rounded-xl overflow-hidden border border-slate-700">
                      <MapView height="100%" selectedCenter={[eventLat, eventLng]} zoom={15} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                Continue to Evidence Upload <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE UPLOAD */}
        {step === 4 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Step 4 — Record Video Evidence</h3>
              <span className="text-xs text-emerald-400">Video required</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-3 relative">
                <FileVideo className="w-8 h-8 text-purple-400 mx-auto" />
                <h4 className="font-bold text-xs text-white">Camera Video Evidence (Required)</h4>
                <p className="text-[11px] text-slate-400 max-w-lg mx-auto">Record the active source and surrounding context. Audio-only or non-decodable uploads are rejected; the server records a tamper-check hash, duration, frame rate, and visual-motion signal for police review.</p>
                
                {!videoFileObj && !isRecordingVideo && (
                  <button
                    type="button"
                    onClick={startVideoRecording}
                    className="px-4 py-2 w-full bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg"
                  >
                    ● Start Recording
                  </button>
                )}

                {isRecordingVideo && (
                  <div className="space-y-2">
                    <div className="text-red-500 font-bold text-sm animate-pulse">
                      Recording: {videoTimeLeft}s remaining
                    </div>
                    <video ref={videoPreviewRef} muted className="w-full max-w-sm mx-auto h-40 bg-black rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={stopVideoRecording}
                      className="px-4 py-2 w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" /> Stop Recording
                    </button>
                  </div>
                )}

                {videoFileObj && !isRecordingVideo && (
                  <div className="space-y-2">
                    <video ref={videoPreviewRef} controls className="w-full max-w-sm mx-auto h-40 bg-black rounded-lg object-cover" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={discardRecording}
                        className="px-3 py-1.5 flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Retake
                      </button>
                      <div className="px-3 py-1.5 flex-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Saved
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!videoFileObj) {
                    alert('Record a video of the disturbance before continuing. Audio-only evidence is not accepted.');
                    return;
                  }
                  setStep(5);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                Continue to Complaint Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLAINT DETAILS */}
        {step === 5 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Step 5 — Issue Description</h3>
              <span className="text-xs text-slate-400">Impact statement</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Describe how the excessive noise is impacting your area:
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Describe the issue in detail..."
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                Review Evidence Summary <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: EVIDENCE SUMMARY & SUBMISSION */}
        {step === 6 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Step 6 — Evidence Summary & Verification
              </h3>
              <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-xs font-bold">
                Potential Violation Detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Location & Time</h4>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-bold text-white">{locationName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-bold text-white">15 August 2026 at 09:42 PM</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Geotag Lock:</span>
                  <span className="font-mono text-emerald-400">{lat}, {lng}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Noise Telemetry Summary</h4>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Estimated Maximum:</span>
                  <span className="font-bold text-red-400">{maxNoise} dB(A)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Average Level:</span>
                  <span className="font-bold text-amber-400">{avgNoise} dB(A)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span className="text-slate-400">Permitted Threshold:</span>
                  <span className="font-bold text-emerald-400">{rules.daytimeLimit} dB(A)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Duration Above Limit:</span>
                  <span className="font-bold text-white">{formatDuration(durationSec)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs text-blue-300 leading-relaxed">
              {SCIENTIFIC_DISCLAIMER}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmitComplaint}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-red-600/40 active:scale-95 transition-transform"
              >
                <AlertTriangle className="w-5 h-5" /> Submit Complaint to Police
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION SCREEN (STEP 7) */}
        {step === 7 && submittedComplaint && (
          <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Complaint Submitted Successfully</h2>
              <p className="text-xs text-slate-400 mt-1">Your evidence package has been logged with police authority.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 max-w-md mx-auto space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Complaint Reference ID:</span>
                <span className="font-mono font-extrabold text-blue-400 text-sm">{submittedComplaint.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-amber-400">{submittedComplaint.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned Authority:</span>
                <span className="font-semibold text-slate-200">{submittedComplaint.assignedAuthority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Noise Reading:</span>
                <span className="font-bold text-red-400">{submittedComplaint.measuredMaxNoise} dB(A)</span>
              </div>
            </div>

            {/* Timeline progression visual */}
            <div className="pt-4 max-w-md mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Investigation Timeline</h4>
              <div className="flex items-center justify-between text-xs font-semibold relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
                  <span className="text-[10px] text-emerald-400 mt-1">Submitted</span>
                </div>
                <div className="flex-1 h-0.5 bg-emerald-600 mx-2" />
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">2</div>
                  <span className="text-[10px] text-amber-400 mt-1">Under Review</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-800 mx-2" />
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold">3</div>
                  <span className="text-[10px] text-slate-400 mt-1">Investigation</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-800 mx-2" />
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold">4</div>
                  <span className="text-[10px] text-slate-400 mt-1">Resolved</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/citizen/complaints')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs"
              >
                Track My Complaints
              </button>
              <button
                type="button"
                onClick={() => navigate('/police/login')}
                className="px-6 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl font-bold text-xs"
              >
                Switch to Police Demo Portal →
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

export default ReportNoise;
