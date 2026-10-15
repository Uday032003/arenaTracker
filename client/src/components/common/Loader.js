import React from 'react';

export function Spinner({ size = 20, color = 'var(--accent-green)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(255, 255, 255, 0.1)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        display: 'inline-block',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        gap: 'var(--space-3)',
      }}
    >
      <Spinner size={32} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        {text}
      </span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        minHeight: '190px',
        borderLeft: '4px solid var(--border-subtle)',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              className="skeleton"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton" style={{ width: '110px', height: '16px' }} />
              <div className="skeleton" style={{ width: '60px', height: '12px' }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '48px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton" style={{ width: '100%', height: '12px' }} />
          <div className="skeleton" style={{ width: '75%', height: '12px' }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-2)',
        }}
      >
        <div className="skeleton" style={{ flex: 1, height: '30px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          className="skeleton"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton" style={{ width: '140px', height: '16px' }} />
          <div className="skeleton" style={{ width: '90px', height: '12px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <div className="skeleton" style={{ width: '60px', height: '14px' }} />
        <div className="skeleton" style={{ width: '80px', height: '10px' }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonRow key={idx} />
      ))}
    </div>
  );
}

/* Exact Skeleton for HomePage */
export function SkeletonHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '120px', height: '14px' }} />
          <div className="skeleton" style={{ width: '220px', height: '32px' }} />
          <div className="skeleton" style={{ width: '300px', height: '16px' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="skeleton" style={{ width: '140px', height: '38px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '120px', height: '38px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ width: '80px', height: '12px' }} />
            <div className="skeleton" style={{ width: '50px', height: '28px' }} />
          </div>
        ))}
      </div>

      {/* Pinned Quick Logs Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '160px', height: '20px' }} />
          <div className="skeleton" style={{ width: '90px', height: '14px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Recent Occurrences Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '180px', height: '20px' }} />
        <SkeletonList count={4} />
      </div>
    </div>
  );
}

/* Exact Skeleton for RemindersPage */
export function SkeletonReminders() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
          <div className="skeleton" style={{ width: '200px', maxWidth: '100%', height: '28px' }} />
          <div className="skeleton" style={{ width: '280px', maxWidth: '100%', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', width: '100%' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
              <div className="skeleton" style={{ width: '90px', maxWidth: '100%', height: '12px' }} />
              <div className="skeleton" style={{ width: '120px', maxWidth: '100%', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Status Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden', maxWidth: '100%', minWidth: 0 }}>
          {[50, 60, 70, 50].map((w, idx) => (
            <div key={idx} className="skeleton" style={{ width: `${w}px`, height: '32px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
          ))}
        </div>
        <div className="skeleton" style={{ width: '180px', maxWidth: '100%', height: '32px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* List of Reminder Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderLeft: '4px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: '1 1 180px', minWidth: 0 }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="skeleton" style={{ width: '120px', maxWidth: '100%', height: '18px' }} />
                  <div className="skeleton" style={{ width: '50px', height: '16px', borderRadius: 'var(--radius-sm)' }} />
                </div>
                <div className="skeleton" style={{ width: '90px', maxWidth: '100%', height: '12px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0, marginLeft: 'auto' }}>
              <div className="skeleton" style={{ width: '70px', height: '16px' }} />
              <div className="skeleton" style={{ width: '36px', height: '22px', borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Exact Skeleton for InsightsPage */
export function SkeletonInsights() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '200px', height: '32px' }} />
          <div className="skeleton" style={{ width: '340px', height: '16px' }} />
        </div>
        <div className="skeleton" style={{ width: '260px', height: '36px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Top 3 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ width: '120px', height: '12px' }} />
            <div className="skeleton" style={{ width: '90px', height: '28px' }} />
            <div className="skeleton" style={{ width: '140px', height: '12px' }} />
          </div>
        ))}
      </div>

      {/* Main Trend Chart Card */}
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '180px', height: '20px' }} />
          <div className="skeleton" style={{ width: '100px', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', height: '200px', paddingTop: 'var(--space-4)' }}>
          {[40, 75, 55, 90, 60, 80, 45, 100, 70, 85, 50, 65].map((h, idx) => (
            <div
              key={idx}
              className="skeleton"
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom 2 Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="skeleton" style={{ width: '160px', height: '18px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '120px', height: '14px' }} />
              <div className="skeleton" style={{ width: '40px', height: '14px' }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="skeleton" style={{ width: '160px', height: '18px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '100px', height: '14px' }} />
              <div className="skeleton" style={{ width: '50px', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Exact Skeleton for SettingsPage */
export function SkeletonSettings() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ width: '220px', height: '32px' }} />
        <div className="skeleton" style={{ width: '320px', height: '16px' }} />
      </div>

      {/* Profile Form Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '130px', height: '20px' }} />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton" style={{ width: '90px', height: '14px' }} />
            <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <div className="skeleton" style={{ width: '120px', height: '38px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* Export Account Data Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '180px', height: '20px' }} />
        <div className="skeleton" style={{ width: '100%', height: '14px' }} />
        <div className="skeleton" style={{ width: '130px', height: '34px', borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Danger Zone Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div className="skeleton" style={{ width: '140px', height: '20px' }} />
        <div className="skeleton" style={{ width: '80%', height: '14px' }} />
        <div className="skeleton" style={{ width: '150px', height: '34px', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
}

/* Exact Skeleton for ItemDetailsPage */
export function SkeletonItemDetails() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Nav Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '110px', height: '32px', borderRadius: 'var(--radius-md)' }} />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '70px', height: '32px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '70px', height: '32px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* Hero Card */}
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div className="skeleton" style={{ width: '180px', height: '28px' }} />
              <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="skeleton" style={{ width: '260px', height: '14px' }} />
          </div>
          <div className="skeleton" style={{ width: '110px', height: '38px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ width: '90px', height: '12px' }} />
            <div className="skeleton" style={{ width: '60px', height: '26px' }} />
          </div>
        ))}
      </div>

      {/* History section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '160px', height: '20px' }} />
        <SkeletonList count={5} />
      </div>
    </div>
  );
}

/* Exact Skeleton for Activity & Item Form Pages */
export function SkeletonForm({ title = 'Form' }) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <div className="skeleton" style={{ width: '70px', height: '30px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: '200px', height: '28px' }} />
      </div>

      {/* Form Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton" style={{ width: '120px', height: '14px' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  );
}

/* Exact Skeleton for ActivityDetailsPage */
export function SkeletonActivityDetails() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '70px', height: '30px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }} />
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div className="skeleton" style={{ width: '160px', height: '24px' }} />
            <div className="skeleton" style={{ width: '100px', height: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="skeleton" style={{ width: '70px', height: '12px' }} />
              <div className="skeleton" style={{ width: '110px', height: '16px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
