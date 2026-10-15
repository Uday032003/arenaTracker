import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Clock,
  Navigation,
  Phone,
  AlertCircle,
  TrendingUp,
  MapPin,
  Flame,
} from 'lucide-react';
import { insightsApi } from '../../services/api.js';
import { SkeletonInsights } from '../../components/common/Loader.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorBanner } from '../../components/common/ErrorMessage.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';

const COLORS = ['#3ecf8e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];

export function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await insightsApi.getInsights({
        startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [startDate, endDate]);

  if (loading) {
    return <SkeletonInsights />;
  }

  const formatSeconds = (secs) => {
    if (!secs) return '0 mins';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const occurrencesByItem = data?.occurrencesByItem || [];
  const activityTrend = data?.activityTrend || [];
  const occurrencesByType = data?.occurrencesByType || [];
  const timedStats = data?.timedStats || { total_sessions: 0, total_duration_seconds: 0, avg_duration_seconds: 0 };
  const callStats = data?.callStats || { total_calls: 0, incoming_calls: 0, outgoing_calls: 0, total_call_duration_seconds: 0 };
  const frequentPlaces = data?.frequentPlaces || [];
  const itemsNotLoggedRecently = data?.itemsNotLoggedRecently || [];

  const hasAnyData = occurrencesByItem.length > 0 || activityTrend.length > 0 || timedStats.total_sessions > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Personal Insights</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Real database analytics on habits, elapsed time, places visited, and communications
          </p>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: 'var(--font-size-xs)' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>to</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: 'var(--font-size-xs)' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchInsights} />}

      {!hasAnyData ? (
        <EmptyState
          icon="sparkles"
          title="No Analytics Data Yet"
          description="Log some occurrences and timers to unlock charts, frequency trends, and personal habits."
        />
      ) : (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <div className="card">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Timed Duration
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
                {formatSeconds(timedStats.total_duration_seconds)}
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Across {timedStats.total_sessions} completed sessions
              </span>
            </div>

            <div className="card">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Avg Session Duration
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginTop: '2px' }}>
                {formatSeconds(timedStats.avg_duration_seconds)}
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Per workout / walk / ride
              </span>
            </div>

            <div className="card">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Calls Logged
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>
                {callStats.total_calls} calls
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                {callStats.incoming_calls} incoming • {callStats.outgoing_calls} outgoing
              </span>
            </div>

            <div className="card">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Unique Places Visited
              </span>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#8b5cf6', marginTop: '2px' }}>
                {frequentPlaces.length} locations
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Recorded during rides & trips
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Occurrences per Item Bar Chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                Most Frequently Logged Items
              </h3>
              {occurrencesByItem.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No activity logs found</p>
              ) : (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occurrencesByItem} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="item_name" stroke="#6b7280" fontSize={11} interval={0} angle={-25} textAnchor="end" />
                      <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--accent-green)' }}
                      />
                      <Bar dataKey="occurrences" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Activity Trend Area Chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                Daily Frequency (Last 30 Days)
              </h3>
              {activityTrend.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No trends in this timeframe</p>
              ) : (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.slice(5)} />
                      <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#3ecf8e" strokeWidth={2} fillOpacity={1} fill="url(#trendGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown & Neglected Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Frequently Visited Places */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Navigation size={18} color="var(--accent-green)" />
                <span>Frequently Visited Places</span>
              </h3>

              {frequentPlaces.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Start a ride or trip and record stops to build your personal memory map.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {frequentPlaces.map((place, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <MapPin size={15} color="var(--accent-green)" />
                        <div>
                          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{place.name}</p>
                          {place.address && (
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{place.address}</p>
                          )}
                        </div>
                      </div>
                      <span className="badge badge-purple">{place.visit_count} visits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items Not Logged Recently */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <AlertCircle size={18} color="var(--warning)" />
                <span>Items Not Logged Recently (&gt; 7 Days)</span>
              </h3>

              {itemsNotLoggedRecently.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  All active items in your library have been logged recently!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {itemsNotLoggedRecently.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <TrackingIcon name={item.icon} size={15} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <span className="badge badge-gray" style={{ color: 'var(--warning)' }}>
                        {item.last_occurrence?.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
