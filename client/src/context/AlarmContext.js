import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import { remindersApi } from '../services/api.js';
import { alarmAudio, RINGTONE_PRESETS } from '../utils/alarmAudio.js';
import { sendBrowserNotification, requestNotificationPermission } from '../utils/browserNotifications.js';

const AlarmContext = createContext(null);

export function AlarmProvider({ children }) {
  const { user } = useAuth();
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [isRinging, setIsRinging] = useState(false);
  const alertedIdsRef = useRef(new Set());

  // Ringtone state
  const [currentRingtone, setCurrentRingtone] = useState(() => alarmAudio.getRingtone());
  const [volume, setVolumeState] = useState(() => alarmAudio.getVolume());
  const [customAudioName, setCustomAudioName] = useState(() => alarmAudio.getCustomAudioName());
  const [previewingId, setPreviewingId] = useState(null);

  const changeRingtone = (ringtoneId) => {
    alarmAudio.setRingtone(ringtoneId);
    setCurrentRingtone(ringtoneId);
  };

  const changeVolume = (newVol) => {
    alarmAudio.setVolume(newVol);
    setVolumeState(alarmAudio.getVolume());
  };

  const previewRingtone = (ringtoneId) => {
    if (previewingId === ringtoneId) {
      alarmAudio.stopPreview();
      setPreviewingId(null);
      return;
    }
    alarmAudio.preview(ringtoneId);
    setPreviewingId(ringtoneId);
  };

  const stopPreview = () => {
    alarmAudio.stopPreview();
    setPreviewingId(null);
  };

  const uploadCustomRingtone = async (file) => {
    if (!file) return { success: false, message: 'No file provided' };
    if (!file.type.startsWith('audio/')) {
      return { success: false, message: 'Please select a valid audio file (e.g. MP3, WAV, OGG)' };
    }
    // Limit file size to 6MB to prevent localStorage overflow
    if (file.size > 6 * 1024 * 1024) {
      return { success: false, message: 'Audio file must be under 6MB for local browser storage' };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const saved = alarmAudio.saveCustomAudio(dataUrl, file.name);
        if (saved) {
          setCustomAudioName(file.name);
          setCurrentRingtone('custom-file');
          resolve({ success: true, fileName: file.name });
        } else {
          resolve({ success: false, message: 'Could not store audio in browser memory' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Error reading file' });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCustomRingtone = () => {
    alarmAudio.removeCustomAudio();
    setCustomAudioName('');
    setCurrentRingtone(alarmAudio.getRingtone());
  };

  // Check for due reminders from the server
  const checkDueReminders = useCallback(async () => {
    if (!user) return;

    try {
      const res = await remindersApi.getDue();
      const dueList = res?.data || [];

      if (dueList.length > 0) {
        // Filter out already alerted in current session until dismissed or snoozed
        const newDue = dueList.filter((r) => !alertedIdsRef.current.has(r.id));

        if (newDue.length > 0) {
          newDue.forEach((r) => alertedIdsRef.current.add(r.id));
          setActiveAlarms((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const merged = [...prev];
            newDue.forEach((item) => {
              if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
          });

          // Start the continuous looping alarm audio
          alarmAudio.start();
          setIsRinging(true);

          // Trigger browser system notification for each new due reminder
          newDue.forEach((item) => {
            const body = item.amount
              ? `Amount: ${item.currency || '₹'}${item.amount} • Due Now`
              : (item.notes || 'Your scheduled reminder is due now!');
            sendBrowserNotification(`⏰ Reminder Alarm: ${item.title}`, { body });
          });
        }
      }
    } catch (err) {
      console.error('[AlarmContext] Error checking due reminders:', err);
    }
  }, [user]);

  // Periodic poll every 15 seconds when authenticated
  useEffect(() => {
    if (!user) {
      alarmAudio.stop();
      setIsRinging(false);
      setActiveAlarms([]);
      alertedIdsRef.current.clear();
      return;
    }

    // Check immediately on login
    checkDueReminders();

    const intervalId = setInterval(checkDueReminders, 15000);
    return () => clearInterval(intervalId);
  }, [user, checkDueReminders]);

  // Stop alarm sound and dismiss reminder
  const dismissAlarm = async (reminderId) => {
    try {
      if (reminderId !== 'test-demo') {
        await remindersApi.dismiss(reminderId);
      }
    } catch (err) {
      console.error('[AlarmContext] Dismiss error:', err);
    } finally {
      setActiveAlarms((prev) => {
        const remaining = prev.filter((r) => r.id !== reminderId);
        if (remaining.length === 0) {
          alarmAudio.stop();
          setIsRinging(false);
        }
        return remaining;
      });
      alertedIdsRef.current.delete(reminderId);
    }
  };

  // Snooze alarm for given minutes
  const snoozeAlarm = async (reminderId, minutes = 10) => {
    try {
      if (reminderId !== 'test-demo') {
        await remindersApi.snooze(reminderId, minutes);
      }
    } catch (err) {
      console.error('[AlarmContext] Snooze error:', err);
    } finally {
      setActiveAlarms((prev) => {
        const remaining = prev.filter((r) => r.id !== reminderId);
        if (remaining.length === 0) {
          alarmAudio.stop();
          setIsRinging(false);
        }
        return remaining;
      });
      alertedIdsRef.current.delete(reminderId);
    }
  };

  // Mark reminder as completed from alarm
  const completeAlarm = async (reminderId) => {
    try {
      if (reminderId !== 'test-demo') {
        await remindersApi.complete(reminderId);
      }
    } catch (err) {
      console.error('[AlarmContext] Complete error:', err);
    } finally {
      setActiveAlarms((prev) => {
        const remaining = prev.filter((r) => r.id !== reminderId);
        if (remaining.length === 0) {
          alarmAudio.stop();
          setIsRinging(false);
        }
        return remaining;
      });
      alertedIdsRef.current.delete(reminderId);
    }
  };

  // Instant test alarm for user verification
  const testAlarm = async () => {
    await requestNotificationPermission();
    const demoReminder = {
      id: 'test-demo',
      title: 'Demo EMI / Birthday Alarm Test',
      type: 'emi',
      amount: 15000,
      currency: '₹',
      due_datetime: new Date().toISOString(),
      notes: 'This is a test alarm demonstrating continuous ringing until stopped!',
    };

    setActiveAlarms((prev) => [demoReminder, ...prev.filter((p) => p.id !== 'test-demo')]);
    alarmAudio.start();
    setIsRinging(true);
    sendBrowserNotification('⏰ Test Alarm: Demo EMI Payment Due', {
      body: 'Continuous alarm is ringing! Click or open app to stop.',
    });
  };

  return (
    <AlarmContext.Provider
      value={{
        activeAlarms,
        isRinging,
        dismissAlarm,
        snoozeAlarm,
        completeAlarm,
        testAlarm,
        checkDueReminders,
        // Ringtone controls
        currentRingtone,
        changeRingtone,
        volume,
        changeVolume,
        availableRingtones: RINGTONE_PRESETS,
        previewingId,
        previewRingtone,
        stopPreview,
        uploadCustomRingtone,
        removeCustomRingtone,
        customAudioName,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within an AlarmProvider');
  }
  return context;
}
