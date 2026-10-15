/**
 * Web Audio API Looping Alarm Synthesizer & Sound Manager
 * Supports multiple synthesizer presets, custom audio file uploads,
 * preview playback, volume control, and persistent local settings.
 */

export const RINGTONE_PRESETS = [
  {
    id: 'modern-chime',
    name: 'Modern Chime',
    description: 'Pleasant dual harmonic chime (A5/C6 & E5/E6)',
    tag: 'Pleasant',
    interval: 1100,
  },
  {
    id: 'digital-beep',
    name: 'Digital Watch Beep',
    description: 'Classic double-beep retro digital watch alert',
    tag: 'Classic',
    interval: 850,
  },
  {
    id: 'marimba',
    name: 'Marimba Arpeggio',
    description: 'Warm acoustic 4-note melodic marimba (C-E-G-C)',
    tag: 'Melodic',
    interval: 1300,
  },
  {
    id: 'radar-ping',
    name: 'Radar Sonar',
    description: 'Futuristic sonar ping with acoustic resonance',
    tag: 'Modern',
    interval: 1200,
  },
  {
    id: 'emergency-siren',
    name: 'Urgent Alert',
    description: 'Alternating high-tempo pulsing alarm for urgent bills',
    tag: 'High Alert',
    interval: 950,
  },
  {
    id: 'zen-bell',
    name: 'Zen Temple Bell',
    description: 'Warm 432Hz deep meditative singing bowl chime',
    tag: 'Gentle',
    interval: 1800,
  },
];

const STORAGE_KEYS = {
  RINGTONE: 'alarm_ringtone_id',
  VOLUME: 'alarm_ringtone_volume',
  CUSTOM_DATA: 'alarm_custom_audio_data',
  CUSTOM_NAME: 'alarm_custom_audio_name',
};

class AlarmAudioPlayer {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.previewTimeoutId = null;
    this.isPlaying = false;
    this.isPreviewing = false;
    this.customAudio = null;

    // Load persisted settings
    this.currentRingtoneId = localStorage.getItem(STORAGE_KEYS.RINGTONE) || 'modern-chime';
    const savedVol = localStorage.getItem(STORAGE_KEYS.VOLUME);
    this.volume = savedVol !== null ? Math.max(0, Math.min(1, parseFloat(savedVol))) : 0.7;

    // Load custom audio if saved
    this.customAudioName = localStorage.getItem(STORAGE_KEYS.CUSTOM_NAME) || '';
    const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_DATA);
    if (customData) {
      this.initCustomAudio(customData);
    }
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initCustomAudio(dataUrl) {
    try {
      this.customAudio = new Audio(dataUrl);
      this.customAudio.volume = this.volume;
      this.customAudio.preload = 'auto';
    } catch (e) {
      console.error('[alarmAudio] Error initializing custom audio:', e);
      this.customAudio = null;
    }
  }

  setVolume(newVolume) {
    this.volume = Math.max(0, Math.min(1, Number(newVolume)));
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(this.volume));
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
  }

  getVolume() {
    return this.volume;
  }

  setRingtone(ringtoneId) {
    this.currentRingtoneId = ringtoneId;
    localStorage.setItem(STORAGE_KEYS.RINGTONE, ringtoneId);
  }

  getRingtone() {
    return this.currentRingtoneId;
  }

  saveCustomAudio(dataUrl, fileName) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DATA, dataUrl);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_NAME, fileName);
      this.customAudioName = fileName;
      this.initCustomAudio(dataUrl);
      this.setRingtone('custom-file');
      return true;
    } catch (err) {
      console.error('[alarmAudio] Failed to save custom audio to localStorage:', err);
      return false;
    }
  }

  removeCustomAudio() {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_DATA);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_NAME);
    this.customAudioName = '';
    if (this.customAudio) {
      try {
        this.customAudio.pause();
      } catch (_) {}
      this.customAudio = null;
    }
    if (this.currentRingtoneId === 'custom-file') {
      this.setRingtone('modern-chime');
    }
  }

  getCustomAudioName() {
    return this.customAudioName;
  }

  /**
   * Sound synthesis presets using Web Audio API
   */

  // 1. Modern Chime (Harmonic A5/C6 & E5/E6)
  playModernChime() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;

    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.4 * vol, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.35);
    gain2.gain.setValueAtTime(0.001, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.35 * vol, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.48);
  }

  // 2. Digital Watch Double Beep (Square wave 2048Hz)
  playDigitalBeep() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;

    const beepTimes = [0, 0.11];
    beepTimes.forEach((tOffset) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2048, now + tOffset);

      gain.gain.setValueAtTime(0.001, now + tOffset);
      gain.gain.linearRampToValueAtTime(0.25 * vol, now + tOffset + 0.01);
      gain.gain.setValueAtTime(0.25 * vol, now + tOffset + 0.06);
      gain.gain.linearRampToValueAtTime(0.001, now + tOffset + 0.075);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + tOffset);
      osc.stop(now + tOffset + 0.08);
    });
  }

  // 3. Marimba 4-Note Melody (C5, E5, G5, C6)
  playMarimba() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const tOffset = idx * 0.12;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + tOffset);

      gain.gain.setValueAtTime(0.001, now + tOffset);
      gain.gain.linearRampToValueAtTime(0.45 * vol, now + tOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tOffset + 0.32);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + tOffset);
      osc.stop(now + tOffset + 0.35);
    });
  }

  // 4. Futuristic Radar Ping
  playRadarPing() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4 * vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // Subtle resonance echo
    const echoOsc = this.audioCtx.createOscillator();
    const echoGain = this.audioCtx.createGain();
    echoOsc.type = 'triangle';
    echoOsc.frequency.setValueAtTime(700, now + 0.05);
    echoGain.gain.setValueAtTime(0.001, now + 0.05);
    echoGain.gain.linearRampToValueAtTime(0.18 * vol, now + 0.08);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    echoOsc.connect(echoGain);
    echoGain.connect(this.audioCtx.destination);
    echoOsc.start(now + 0.05);
    echoOsc.stop(now + 0.38);
  }

  // 5. Emergency Siren (Urgent dual-tone alternating alert)
  playEmergencySiren() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;

    const pulses = [
      { offset: 0, freq: 880 },
      { offset: 0.12, freq: 1175 },
      { offset: 0.24, freq: 880 },
      { offset: 0.36, freq: 1175 },
    ];

    pulses.forEach((p) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.freq, now + p.offset);

      gain.gain.setValueAtTime(0.001, now + p.offset);
      gain.gain.linearRampToValueAtTime(0.22 * vol, now + p.offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.offset + 0.11);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + p.offset);
      osc.stop(now + p.offset + 0.12);
    });
  }

  // 6. Zen Temple Bell (432Hz deep meditative chime)
  playZenBell() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const vol = this.volume;

    // Fundamental 432Hz
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.5 * vol, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 1.25);

    // Harmonic 864Hz octave
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(864, now);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.25 * vol, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(now);
    osc2.stop(now + 0.85);
  }

  playPreset(presetId) {
    switch (presetId) {
      case 'digital-beep':
        this.playDigitalBeep();
        break;
      case 'marimba':
        this.playMarimba();
        break;
      case 'radar-ping':
        this.playRadarPing();
        break;
      case 'emergency-siren':
        this.playEmergencySiren();
        break;
      case 'zen-bell':
        this.playZenBell();
        break;
      case 'modern-chime':
      default:
        this.playModernChime();
        break;
    }
  }

  getPresetInterval(presetId) {
    const found = RINGTONE_PRESETS.find((p) => p.id === presetId);
    return found ? found.interval : 1100;
  }

  /**
   * Preview a specific ringtone once or twice so the user can sample it
   */
  preview(ringtoneId) {
    this.stopPreview();
    this.initContext();
    this.isPreviewing = true;

    if (ringtoneId === 'custom-file' && this.customAudio) {
      this.customAudio.currentTime = 0;
      this.customAudio.volume = this.volume;
      this.customAudio.loop = false;
      this.customAudio.play().catch((e) => console.warn('[alarmAudio] Preview failed:', e));
      return;
    }

    // Play synthesized tone
    this.playPreset(ringtoneId);

    // Play a second cycle after preset interval, then auto-stop preview state
    const interval = this.getPresetInterval(ringtoneId);
    this.previewTimeoutId = setTimeout(() => {
      if (this.isPreviewing) {
        this.playPreset(ringtoneId);
        setTimeout(() => {
          this.isPreviewing = false;
        }, interval);
      }
    }, interval);
  }

  stopPreview() {
    this.isPreviewing = false;
    if (this.previewTimeoutId) {
      clearTimeout(this.previewTimeoutId);
      this.previewTimeoutId = null;
    }
    if (this.customAudio) {
      try {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      } catch (_) {}
    }
  }

  /**
   * Start looping the alarm sound continuously until stop() is called
   */
  start() {
    if (this.isPlaying) return;
    this.stopPreview();

    this.isPlaying = true;
    const activeId = this.currentRingtoneId;

    if (activeId === 'custom-file' && this.customAudio) {
      this.customAudio.currentTime = 0;
      this.customAudio.volume = this.volume;
      this.customAudio.loop = true;
      this.customAudio.play().catch((err) => {
        console.warn('[alarmAudio] Custom audio playback error:', err);
        // Fallback to modern chime if custom file fails
        this.initContext();
        this.playModernChime();
        this.intervalId = setInterval(() => {
          if (this.isPlaying) this.playModernChime();
        }, 1100);
      });
      return;
    }

    this.initContext();
    this.playPreset(activeId);
    const interval = this.getPresetInterval(activeId);

    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playPreset(activeId);
      }
    }, interval);
  }

  /**
   * Stop the alarm sound immediately
   */
  stop() {
    this.isPlaying = false;
    this.stopPreview();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.customAudio) {
      try {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      } catch (_) {}
    }
  }
}

export const alarmAudio = new AlarmAudioPlayer();
