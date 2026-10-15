import { describe, it, expect, beforeEach, vi } from 'vitest';
import { alarmAudio, RINGTONE_PRESETS } from '../utils/alarmAudio.js';

describe('alarmAudio utility and presets', () => {
  beforeEach(() => {
    localStorage.clear();
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('exposes a rich catalog of preset ringtones', () => {
    expect(RINGTONE_PRESETS.length).toBeGreaterThanOrEqual(6);
    const ids = RINGTONE_PRESETS.map((p) => p.id);
    expect(ids).toContain('modern-chime');
    expect(ids).toContain('digital-beep');
    expect(ids).toContain('marimba');
    expect(ids).toContain('radar-ping');
    expect(ids).toContain('emergency-siren');
    expect(ids).toContain('zen-bell');
  });

  it('allows changing and persisting ringtones', () => {
    alarmAudio.setRingtone('marimba');
    expect(alarmAudio.getRingtone()).toBe('marimba');
    expect(localStorage.getItem('alarm_ringtone_id')).toBe('marimba');

    alarmAudio.setRingtone('digital-beep');
    expect(alarmAudio.getRingtone()).toBe('digital-beep');
    expect(localStorage.getItem('alarm_ringtone_id')).toBe('digital-beep');
  });

  it('allows setting and clamping volume between 0 and 1', () => {
    alarmAudio.setVolume(0.85);
    expect(alarmAudio.getVolume()).toBe(0.85);
    expect(localStorage.getItem('alarm_ringtone_volume')).toBe('0.85');

    // Clamping checks
    alarmAudio.setVolume(1.5);
    expect(alarmAudio.getVolume()).toBe(1);

    alarmAudio.setVolume(-0.2);
    expect(alarmAudio.getVolume()).toBe(0);
  });

  it('supports custom audio upload and clean removal', () => {
    const dummyDataUrl = 'data:audio/mp3;base64,SUQzBAAAAAAA';
    const saved = alarmAudio.saveCustomAudio(dummyDataUrl, 'my-ringtone.mp3');
    expect(saved).toBe(true);
    expect(alarmAudio.getRingtone()).toBe('custom-file');
    expect(alarmAudio.getCustomAudioName()).toBe('my-ringtone.mp3');

    alarmAudio.removeCustomAudio();
    expect(alarmAudio.getCustomAudioName()).toBe('');
    expect(alarmAudio.getRingtone()).toBe('modern-chime');
  });
});
