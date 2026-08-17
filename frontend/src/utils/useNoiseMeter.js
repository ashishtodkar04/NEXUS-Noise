import { useEffect, useRef, useState, useCallback } from 'react';

// Real-time microphone decibel meter built on the Web Audio API.
//
// Methodology (documented estimate, not calibrated lab equipment):
//   - Collect time-domain samples and compute RMS amplitude.
//   - Convert RMS -> dBFS :  20 * log10(rms)
//   - Convert dBFS -> dB SPL by adding a device offset. 0 dBFS maps to
//     ~90 dB SPL on the average phone/laptop mic (calibration constant,
//     adjustable below). Values are floored at 30 dB and rounded.
export const DBFS_TO_SPL_OFFSET = 90;

export function useNoiseMeter() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(0); // current dB SPL
  const [peak, setPeak] = useState(0);   // max dB SPL seen during a session
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    rafRef.current = null;
    setRunning(false);
    setLevel(0);
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 1) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length) || 0;
    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    const spl = Math.max(30, Math.round(dbFS + DBFS_TO_SPL_OFFSET));
    setLevel(spl);
    setPeak((p) => Math.max(p, spl));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError('');
    setPeak(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setRunning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError('Microphone access is required for live decibel monitoring.');
    }
  }, [tick]);

  useEffect(() => () => stop(), [stop]);

  return { level, peak, running, error, start, stop };
}
