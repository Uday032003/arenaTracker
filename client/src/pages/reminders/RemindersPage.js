import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Plus,
  CreditCard,
  Cake,
  Receipt,
  Heart,
  Calendar,
  CheckCircle,
  Trash2,
  Volume2,
  Repeat,
  DollarSign,
  AlertCircle,
  Clock,
  Music,
  X,
  BellRing,
  Send,
} from 'lucide-react';
import { remindersApi } from '../../services/api.js';
import { useAlarm } from '../../context/AlarmContext.js';
import { SkeletonReminders } from '../../components/common/Loader.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { RingtoneSelectorModal } from '../../components/reminders/RingtoneSelectorModal.js';

export function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'completed'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRingtoneModalOpen, setIsRingtoneModalOpen] = useState(false);

  // Web Push controls from AlarmContext
  const {
    isPushSupported,
    isPushSubscribed,
    pushLoading,
    enablePushNotifications,
    disablePushNotifications,
    sendTestPush,
  } = useAlarm();
  const [pushStatusMsg, setPushStatusMsg] = useState(null);
  const [testingPush, setTestingPush] = useState(false);

  const handleTogglePush = async () => {
    setPushStatusMsg(null);
    if (isPushSubscribed) {
      const res = await disablePushNotifications();
      if (res.success) {
        setPushStatusMsg('Background push notifications disabled.');
      } else {
        setPushStatusMsg(`Error: ${res.message}`);
      }
    } else {
      const res = await enablePushNotifications();
      if (res.success) {
        setPushStatusMsg('Background push notifications enabled! You will receive alarms even when the browser tab is closed.');
      } else {
        setPushStatusMsg(`Could not enable: ${res.message}`);
      }
    }
    setTimeout(() => setPushStatusMsg(null), 6000);
  };

  const handleTestPush = async () => {
    try {
      setTestingPush(true);
      const res = await sendTestPush();
      setPushStatusMsg(res?.message || 'Test notification sent! Check your desktop notifications.');
    } catch (err) {
      setPushStatusMsg(`Failed to send test: ${err.message}`);
    } finally {
      setTestingPush(false);
      setTimeout(() => setPushStatusMsg(null), 6000);
    }
  };

  const { testAlarm, checkDueReminders } = useAlarm();

  // Form state
  const initialFormState = {
    title: '',
    type: 'emi',
    amount: '',
    currency: '₹',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '10:00',
    recurrence: 'monthly',
    alarm_enabled: true,
    remind_before_days: 0,
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await remindersApi.getAll();
      setReminders(res?.data || []);
    } catch (err) {
      console.error('Fetch reminders error:', err);
      setError(err?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const openCreateModal = (presetType = 'emi') => {
    const today = new Date();
    // Default 10:00 AM
    const dateStr = today.toISOString().split('T')[0];
    let defaultRecurrence = 'monthly';
    if (presetType === 'birthday' || presetType === 'anniversary') {
      defaultRecurrence = 'yearly';
    } else if (presetType === 'custom') {
      defaultRecurrence = 'none';
    }

    setEditingReminder(null);
    setFormData({
      ...initialFormState,
      type: presetType,
      due_date: dateStr,
      due_time: '10:00',
      recurrence: defaultRecurrence,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    const dateObj = new Date(reminder.due_datetime);
    const dateStr = dateObj.toISOString().split('T')[0];
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const mins = String(dateObj.getMinutes()).padStart(2, '0');

    setFormData({
      title: reminder.title,
      type: reminder.type || 'custom',
      amount: reminder.amount ? String(reminder.amount) : '',
      currency: reminder.currency || '₹',
      due_date: dateStr,
      due_time: `${hours}:${mins}`,
      recurrence: reminder.recurrence || 'none',
      alarm_enabled: Boolean(reminder.alarm_enabled),
      remind_before_days: reminder.remind_before_days !== undefined ? reminder.remind_before_days : 0,
      notes: reminder.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setSubmitting(true);
      const combinedDateTime = new Date(`${formData.due_date}T${formData.due_time || '00:00'}:00`).toISOString();

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency || '₹',
        due_datetime: combinedDateTime,
        recurrence: formData.recurrence,
        alarm_enabled: formData.alarm_enabled,
        remind_before_days: parseInt(formData.remind_before_days || '0', 10),
        notes: formData.notes ? formData.notes.trim() : null,
      };

      if (editingReminder) {
        await remindersApi.update(editingReminder.id, payload);
      } else {
        await remindersApi.create(payload);
      }

      setIsModalOpen(false);
      fetchReminders();
      checkDueReminders();
    } catch (err) {
      alert(err?.message || 'Failed to save reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await remindersApi.delete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err?.message || 'Failed to delete reminder');
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      if (reminder.status === 'completed') {
        await remindersApi.update(reminder.id, { status: 'pending' });
      } else {
        await remindersApi.complete(reminder.id);
      }
      fetchReminders();
    } catch (err) {
      alert(err?.message || 'Failed to update reminder status');
    }
  };

  // Filtered lists and metrics
  const { filteredReminders, emiTotal, upcomingCount } = useMemo(() => {
    let list = reminders;

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((r) => r.status !== 'completed');
    } else {
      list = list.filter((r) => r.status === 'completed');
    }

    // Category tab filter
    if (selectedTab !== 'all') {
      list = list.filter((r) => r.type === selectedTab);
    }

    // Compute monthly EMI total
    let totalEmi = 0;
    reminders.forEach((r) => {
      if (r.type === 'emi' && r.status !== 'completed' && r.amount) {
        totalEmi += Number(r.amount);
      }
    });

    // Upcoming within 7 days
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = reminders.filter((r) => {
      if (r.status === 'completed') return false;
      const due = new Date(r.due_datetime);
      return due >= now && due <= nextWeek;
    }).length;

    return { filteredReminders: list, emiTotal: totalEmi, upcomingCount: upcoming };
  }, [reminders, selectedTab, statusFilter]);

  const getTypeMeta = (type) => {
    switch (type) {
      case 'emi':
        return { label: 'EMI', icon: CreditCard, color: 'var(--accent-green)', bg: 'var(--accent-green-glow)' };
      case 'birthday':
        return { label: 'Birthday', icon: Cake, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' };
      case 'bill':
        return { label: 'Bill', icon: Receipt, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'anniversary':
        return { label: 'Anniversary', icon: Heart, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
      default:
        return { label: 'Reminder', icon: Bell, color: 'var(--accent-green)', bg: 'var(--accent-green-glow)' };
    }
  };

  if (loading) {
    return <SkeletonReminders />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', width: '100%' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Smart Reminders
          </span>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginTop: '2px' }}>
            Reminders & Continuous Alarms
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Never miss EMIs, birthdays, or bill payments. Alarms ring continuously until stopped.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {isPushSupported && (
            <>
              <button
                className={`btn btn-sm ${isPushSubscribed ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  borderColor: isPushSubscribed ? 'var(--accent-green)' : 'var(--border-subtle)',
                  color: isPushSubscribed ? 'var(--accent-green)' : 'var(--text-secondary)',
                  gap: '6px',
                }}
                onClick={handleTogglePush}
                disabled={pushLoading}
                title="Get alerts on your computer even when the website is not open"
              >
                <BellRing size={15} />
                <span>
                  {pushLoading
                    ? 'Updating...'
                    : isPushSubscribed
                    ? 'Background Alerts: ON'
                    : 'Enable Background Alerts'}
                </span>
              </button>

              {isPushSubscribed && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleTestPush}
                  disabled={testingPush}
                  title="Send a test notification to verify background alerts work on your device"
                  style={{ gap: '4px', fontSize: 'var(--font-size-xs)' }}
                >
                  <Send size={13} />
                  <span>{testingPush ? 'Sending...' : 'Test Push'}</span>
                </button>
              )}
            </>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => setIsRingtoneModalOpen(true)}
            title="Customize alarm ringtone, volume, and upload custom audio"
          >
            <Music size={16} color="var(--accent-green)" />
            <span>Alarm Ringtone</span>
          </button>
          <button className="btn btn-primary" onClick={() => openCreateModal('emi')}>
            <Plus size={16} />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {pushStatusMsg && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--accent-green)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{pushStatusMsg}</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px 6px' }}
            onClick={() => setPushStatusMsg(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', width: '100%' }}>
        {/* Total Monthly EMI */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--accent-green-glow)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly EMI Commitments</span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              ₹{emiTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Due in 7 Days */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Due This Week</span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {upcomingCount} reminder{upcomingCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Active Birthdays / Anniversaries */}
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cake size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Birthdays & Celebrations</span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {reminders.filter((r) => r.type === 'birthday' || r.type === 'anniversary').length} tracked
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Status Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', width: '100%', minWidth: 0 }}>
        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            maxWidth: '100%',
            minWidth: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'emi', label: 'EMIs' },
            { id: 'birthday', label: 'Birthdays' },
            { id: 'bill', label: 'Bills' },
            { id: 'anniversary', label: 'Anniversaries' },
            { id: 'custom', label: 'Other' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${selectedTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flexShrink: 0 }}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            className={`btn btn-sm ${statusFilter === 'active' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 12px' }}
            onClick={() => setStatusFilter('active')}
          >
            Active & Upcoming
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '4px 12px' }}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Reminders List */}
      {error ? (
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', borderColor: 'var(--danger)' }}>
          <AlertCircle size={32} color="var(--danger)" style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-3)' }} onClick={fetchReminders}>
            Retry
          </button>
        </div>
      ) : filteredReminders.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter === 'active' ? 'active' : 'completed'} reminders`}
          description={
            statusFilter === 'active'
              ? 'Add an EMI, birthday, or bill payment reminder to get notified with an alarm when due.'
              : 'Completed reminders will appear here.'
          }
          action={
            statusFilter === 'active' && (
              <button className="btn btn-primary" onClick={() => openCreateModal('emi')}>
                <Plus size={16} />
                <span>Create Reminder</span>
              </button>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          {filteredReminders.map((reminder) => {
            const typeMeta = getTypeMeta(reminder.type);
            const Icon = typeMeta.icon;
            const dueDate = new Date(reminder.due_datetime);
            const isOverdue = dueDate < new Date() && reminder.status !== 'completed';

            return (
              <div
                key={reminder.id}
                className="card"
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  borderLeft: `4px solid ${isOverdue ? '#ef4444' : typeMeta.color}`,
                  opacity: reminder.status === 'completed' ? 0.7 : 1,
                  flexWrap: 'wrap',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: '1 1 200px', minWidth: 0 }}>
                  {/* Category icon */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: typeMeta.bg,
                      color: typeMeta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Main Details */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 600,
                          margin: 0,
                          wordBreak: 'break-word',
                          textDecoration: reminder.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        {reminder.title}
                      </h3>

                      {reminder.amount && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {reminder.currency || '₹'}{Number(reminder.amount).toLocaleString()}
                        </span>
                      )}

                      {reminder.recurrence && reminder.recurrence !== 'none' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Repeat size={12} />
                          {reminder.recurrence}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2) var(--space-3)', marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: isOverdue ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                        <Calendar size={13} />
                        {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        at {dueDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {isOverdue && ' (Due Now)'}
                      </span>

                      {reminder.alarm_enabled && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--accent-green)' }}>
                          <Bell size={12} />
                          Alarm Active
                        </span>
                      )}

                      {reminder.remind_before_days > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                          <Clock size={11} />
                          Rings {reminder.remind_before_days}d before
                        </span>
                      )}

                      {reminder.notes && (
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          • {reminder.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, marginLeft: 'auto' }}>
                  <button
                    className={`btn btn-sm ${reminder.status === 'completed' ? 'btn-ghost' : 'btn-secondary'}`}
                    onClick={() => handleToggleComplete(reminder)}
                    title={reminder.status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}
                  >
                    <CheckCircle size={16} color={reminder.status === 'completed' ? 'var(--accent-green)' : 'currentColor'} />
                  </button>

                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(reminder)} title="Edit">
                    Edit
                  </button>

                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(reminder.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Reminder Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(10, 10, 12, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 28px var(--accent-green-glow)',
              borderRadius: 'var(--radius-xl)',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'scaleIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            {(() => {
              const currentMeta = getTypeMeta(formData.type);
              const CategoryIcon = currentMeta.icon;
              return (
                <div
                  style={{
                    padding: 'var(--space-5) var(--space-6)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: currentMeta.bg,
                        border: `1.5px solid ${currentMeta.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentMeta.color,
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>
                        {editingReminder ? 'Edit Reminder' : 'New Smart Reminder'}
                      </h2>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Set schedules & continuous looping alarms until dismissed
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                    style={{
                      padding: '7px',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })()}

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <div
                style={{
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-5)',
                }}
              >
                {/* Category Selector Chips */}
                <div>
                  <label
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Select Category
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {[
                      { id: 'emi', label: 'EMI Loan', icon: CreditCard, color: 'var(--accent-green)' },
                      { id: 'birthday', label: 'Birthday', icon: Cake, color: '#ec4899' },
                      { id: 'bill', label: 'Utility Bill', icon: Receipt, color: '#f59e0b' },
                      { id: 'anniversary', label: 'Anniversary', icon: Heart, color: '#a855f7' },
                      { id: 'custom', label: 'Custom', icon: Bell, color: '#06b6d4' },
                    ].map((cat) => {
                      const isSelected = formData.type === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => {
                            let defRec = formData.recurrence;
                            if (cat.id === 'birthday' || cat.id === 'anniversary') defRec = 'yearly';
                            else if (cat.id === 'emi' || cat.id === 'bill') defRec = 'monthly';
                            setFormData({ ...formData, type: cat.id, recurrence: defRec });
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '10px 6px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? `1.5px solid ${cat.color}` : '1px solid var(--border-subtle)',
                            backgroundColor: isSelected ? `${cat.color}15` : 'var(--bg-secondary)',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Icon size={18} color={isSelected ? cat.color : 'currentColor'} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reminder Title */}
                <div>
                  <label
                    htmlFor="reminder_title"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Reminder Title *
                  </label>
                  <input
                    id="reminder_title"
                    type="text"
                    className="form-input"
                    placeholder={
                      formData.type === 'emi'
                        ? 'e.g. HDFC Home Loan EMI'
                        : formData.type === 'birthday'
                          ? "e.g. Mom's Birthday 🎉"
                          : formData.type === 'bill'
                            ? 'e.g. Electricity / Wi-Fi Bill'
                            : 'e.g. Important Task or Meeting'
                    }
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      padding: '10px 14px',
                    }}
                  />
                </div>

                {/* Amount (for EMI & Utility Bills) */}
                {(formData.type === 'emi' || formData.type === 'bill') && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label
                        htmlFor="reminder_amount"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Payment Amount
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
                        {formData.type === 'emi' ? 'Monthly Commitment' : 'Due Amount'}
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--accent-green)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 700,
                        }}
                      >
                        ₹
                      </span>
                      <input
                        id="reminder_amount"
                        type="number"
                        step="any"
                        className="form-input"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          paddingLeft: '34px',
                          paddingRight: '14px',
                          paddingTop: '10px',
                          paddingBottom: '10px',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 600,
                        }}
                        placeholder="e.g. 15000"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Date & Time (2 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label
                      htmlFor="due_date"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '6px',
                      }}
                    >
                      <Calendar size={13} color="var(--accent-green)" />
                      <span>Due Date *</span>
                    </label>
                    <input
                      id="due_date"
                      type="date"
                      className="form-input"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        padding: '10px 12px',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="due_time"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '6px',
                      }}
                    >
                      <Clock size={13} color="var(--accent-green)" />
                      <span>Alarm Time *</span>
                    </label>
                    <input
                      id="due_time"
                      type="time"
                      className="form-input"
                      value={formData.due_time}
                      onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        padding: '10px 12px',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </div>

                {/* Repeat Schedule & Advance Alert (2 Columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                  <div>
                    <label
                      htmlFor="recurrence_select"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '6px',
                      }}
                    >
                      <Repeat size={13} color="var(--text-muted)" />
                      <span>Repeat Schedule</span>
                    </label>
                    <select
                      id="recurrence_select"
                      className="form-select"
                      value={formData.recurrence}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        padding: '10px 12px',
                        colorScheme: 'dark',
                      }}
                    >
                      <option value="none">One-time (No repeat)</option>
                      <option value="monthly">Monthly (EMIs & Bills)</option>
                      <option value="yearly">Yearly (Birthdays & Anniversaries)</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="remind_before_select"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '6px',
                      }}
                    >
                      <Bell size={13} color="var(--text-muted)" />
                      <span>Advance Alert</span>
                    </label>
                    <select
                      id="remind_before_select"
                      className="form-select"
                      value={formData.remind_before_days}
                      onChange={(e) => setFormData({ ...formData, remind_before_days: parseInt(e.target.value, 10) })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        padding: '10px 12px',
                        colorScheme: 'dark',
                      }}
                    >
                      <option value={0}>On the event date</option>
                      <option value={1}>1 day before</option>
                      <option value={2}>2 days before</option>
                      <option value={3}>3 days before</option>
                      <option value={7}>1 week before</option>
                    </select>
                  </div>
                </div>

                {/* Continuous Ringing Alarm Interactive Toggle Card */}
                <div
                  style={{
                    backgroundColor: formData.alarm_enabled ? 'rgba(62, 207, 142, 0.08)' : 'var(--bg-secondary)',
                    border: formData.alarm_enabled ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setFormData({ ...formData, alarm_enabled: !formData.alarm_enabled })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: formData.alarm_enabled ? 'var(--accent-green-glow)' : 'rgba(255, 255, 255, 0.05)',
                        border: formData.alarm_enabled ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: formData.alarm_enabled ? 'var(--accent-green)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Bell size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Continuous Ringing Alarm
                        </span>
                        {formData.alarm_enabled && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--accent-green-glow)',
                              color: 'var(--accent-green)',
                              fontWeight: 600,
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                        Plays continuous alarm audio & notification until stopped
                      </p>
                    </div>
                  </div>

                  {/* Modern Animated Toggle Switch */}
                  <div
                    role="switch"
                    aria-checked={formData.alarm_enabled}
                    style={{
                      width: '44px',
                      height: '24px',
                      backgroundColor: formData.alarm_enabled ? 'var(--accent-green)' : 'var(--bg-input)',
                      border: formData.alarm_enabled ? '1px solid var(--accent-green)' : '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-full)',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: formData.alarm_enabled ? '22px' : '3px',
                        transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label
                    htmlFor="reminder_notes"
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="reminder_notes"
                    className="form-textarea"
                    rows={2}
                    placeholder="Reference numbers, gift ideas, or payment links..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      padding: '10px 12px',
                      minHeight: '75px',
                      resize: 'vertical',
                    }}
                  />
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
                  justifyContent: 'flex-end',
                  gap: 'var(--space-3)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 24px',
                    boxShadow: 'var(--shadow-green)',
                  }}
                >
                  <CheckCircle size={15} />
                  <span>{submitting ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Create Reminder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ringtone Settings Modal */}
      <RingtoneSelectorModal
        isOpen={isRingtoneModalOpen}
        onClose={() => setIsRingtoneModalOpen(false)}
      />
    </div>
  );
}
