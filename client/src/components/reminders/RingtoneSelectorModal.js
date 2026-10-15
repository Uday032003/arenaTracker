import React, { useState, useRef } from 'react';
import {
  X,
  Music,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Square,
  Check,
  Upload,
  Trash2,
  Sparkles,
  Bell,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { useAlarm } from '../../context/AlarmContext.js';

export function RingtoneSelectorModal({ isOpen, onClose }) {
  const {
    currentRingtone,
    changeRingtone,
    volume,
    changeVolume,
    availableRingtones,
    previewingId,
    previewRingtone,
    stopPreview,
    uploadCustomRingtone,
    removeCustomRingtone,
    customAudioName,
    testAlarm,
  } = useAlarm();

  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    const res = await uploadCustomRingtone(file);
    if (res.success) {
      setUploadSuccess(`Uploaded "${res.fileName}" successfully!`);
    } else {
      setUploadError(res.message || 'Failed to upload audio file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    stopPreview();
    onClose();
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} color="var(--text-muted)" />;
    if (volume < 0.5) return <Volume1 size={18} color="var(--accent-green)" />;
    return <Volume2 size={18} color="var(--accent-green)" />;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(10, 10, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px var(--accent-green-glow)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-green-glow)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
              }}
            >
              <Music size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>
                Alarm Ringtone Settings
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Select a built-in melody or upload your own audio file
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="btn btn-secondary"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: 'var(--space-6)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {/* Master Volume Slider */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {getVolumeIcon()}
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  Alarm Master Volume
                </span>
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                  backgroundColor: 'var(--accent-green-glow)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {Math.round(volume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: '100%',
                accentColor: 'var(--accent-green)',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            />
          </div>

          {/* Preset Synthesizer Ringtones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Built-in Melody Presets
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Zero network lag • Works offline
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {availableRingtones.map((preset) => {
                const isSelected = currentRingtone === preset.id;
                const isPreviewing = previewingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => changeRingtone(preset.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: isSelected ? 'rgba(62, 207, 142, 0.08)' : 'var(--bg-secondary)',
                      border: isSelected ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid var(--accent-green)' : '2px solid var(--text-muted)',
                          backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      />

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {preset.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isSelected ? 'var(--accent-green-glow)' : 'rgba(255, 255, 255, 0.05)',
                              color: isSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                              fontWeight: 500,
                            }}
                          >
                            {preset.tag}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview Button */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        previewRingtone(preset.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: 'var(--font-size-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isPreviewing ? 'var(--accent-green-glow)' : undefined,
                        borderColor: isPreviewing ? 'var(--accent-green)' : undefined,
                        color: isPreviewing ? 'var(--accent-green)' : undefined,
                        flexShrink: 0,
                      }}
                      title={isPreviewing ? 'Stop preview' : 'Preview tone'}
                    >
                      {isPreviewing ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                      <span>{isPreviewing ? 'Playing...' : 'Preview'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom File Upload Section */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={16} color="var(--accent-green)" />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  Custom Audio Ringtone (MP3 / WAV)
                </span>
              </div>
            </div>

            {customAudioName ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: currentRingtone === 'custom-file' ? 'rgba(62, 207, 142, 0.08)' : 'var(--bg-card)',
                  border: currentRingtone === 'custom-file' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                onClick={() => changeRingtone('custom-file')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: currentRingtone === 'custom-file' ? '6px solid var(--accent-green)' : '2px solid var(--text-muted)',
                      backgroundColor: currentRingtone === 'custom-file' ? 'var(--bg-card)' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {customAudioName}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)' }}>
                      {currentRingtone === 'custom-file' ? 'Active Alarm Ringtone' : 'Click to select as active'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      previewRingtone('custom-file');
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: 'var(--font-size-xs)',
                      backgroundColor: previewingId === 'custom-file' ? 'var(--accent-green-glow)' : undefined,
                      borderColor: previewingId === 'custom-file' ? 'var(--accent-green)' : undefined,
                      color: previewingId === 'custom-file' ? 'var(--accent-green)' : undefined,
                    }}
                  >
                    {previewingId === 'custom-file' ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomRingtone();
                    }}
                    style={{
                      padding: '6px 10px',
                      color: 'var(--danger)',
                    }}
                    title="Remove custom audio"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="alarm-audio-upload-input"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  borderStyle: 'dashed',
                }}
              >
                <Upload size={16} />
                <span>{customAudioName ? 'Upload different audio file...' : 'Upload custom sound (.mp3, .wav, .ogg)'}</span>
              </button>
            </div>

            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: 'var(--font-size-xs)' }}>
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: 'var(--font-size-xs)' }}>
                <Check size={14} />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={testAlarm}
            title="Launch full screen demo alarm to see continuous ringing in action"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Bell size={15} color="var(--accent-green)" />
            <span>Test Live Alarm</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClose}
            style={{ padding: '8px 24px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
