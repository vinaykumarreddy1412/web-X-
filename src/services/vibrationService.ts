// Web Audio Context helper for instant tactile sound cues
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Play a short electronic beep (barcode scanner confirmation style)
 */
export const playScannerBeep = (freq = 880, duration = 0.12, type: OscillatorType = 'sine'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
};

/**
 * Trigger immediate haptic vibration and audio beep when a QR code is scanned
 */
export const triggerScanVibration = (): boolean => {
  // 1. Play scan audio beep
  playScannerBeep(987.77, 0.15, 'sine'); // High B5 note for crisp scan beep

  // 2. Hardware vibration (150ms quick buzz)
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      return navigator.vibrate(150);
    } catch (e) {
      console.warn('Scan vibration failed:', e);
      return false;
    }
  }
  return false;
};

/**
 * Trigger haptic vibration & success fanfare when attendance is saved
 */
export const triggerAttendanceVibration = (): boolean => {
  // 1. Play two-tone success chime
  playScannerBeep(659.25, 0.1, 'sine'); // E5
  setTimeout(() => playScannerBeep(880, 0.2, 'triangle'), 100); // A5

  // 2. Double-pulse haptic vibration
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      // Distinct pulse pattern: 200ms vibrate, 100ms pause, 200ms vibrate
      return navigator.vibrate([200, 100, 200]);
    } catch (e) {
      console.warn('Attendance vibration failed:', e);
      return false;
    }
  }
  return false;
};

/**
 * Trigger error vibration feedback
 */
export const triggerErrorVibration = (): boolean => {
  playScannerBeep(220, 0.25, 'sawtooth');

  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      return navigator.vibrate([100, 50, 100, 50, 200]);
    } catch (e) {
      console.warn('Error vibration failed:', e);
      return false;
    }
  }
  return false;
};

