import React, { useId } from 'react';
import { Link } from 'react-router-dom';

/**
 * Premium Realistic 3D Emblem Logo for Arena Tracker
 * Features realistic lighting, glassmorphic refraction, metallic beveled bezel,
 * emerald gemstone core, and specular highlights.
 * Clicking the logo navigates to the home page.
 */
export function Logo({ size = 'md', className = '', to = '/home', onClick }) {
  const isLarge = size === 'lg';
  const emblemSize = isLarge ? 38 : 30;
  const gradientId = useId();

  return (
    <Link
      to={to || '/home'}
      onClick={onClick}
      className={`arena-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isLarge ? '12px' : '9px',
        userSelect: 'none',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
      }}
      title="Go to Home"
    >
      {/* Realistic 3D Glassmorphic Emblem */}
      <div
        style={{
          position: 'relative',
          width: `${emblemSize}px`,
          height: `${emblemSize}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-1px)';
          e.currentTarget.style.filter = 'drop-shadow(0 6px 16px rgba(62, 207, 142, 0.45))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.filter = 'none';
        }}
      >
        <svg
          width={emblemSize}
          height={emblemSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'block',
            overflow: 'visible',
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5)) drop-shadow(0 2px 6px rgba(62, 207, 142, 0.25))',
          }}
        >
          <defs>
            {/* Outer metallic bezel ring */}
            <linearGradient id={`${gradientId}-bezel`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="25%" stopColor="#3ecf8e" />
              <stop offset="60%" stopColor="#107040" />
              <stop offset="85%" stopColor="#08381f" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>

            {/* Inner jewel gemstone dome */}
            <radialGradient id={`${gradientId}-gem`} cx="38%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="22%" stopColor="#4ade80" />
              <stop offset="55%" stopColor="#16a34a" />
              <stop offset="85%" stopColor="#0f4a27" />
              <stop offset="100%" stopColor="#052011" />
            </radialGradient>

            {/* Top specular glossy reflection sheen */}
            <linearGradient id={`${gradientId}-sheen`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Glowing 3D Momentum Pulse Line */}
            <linearGradient id={`${gradientId}-pulse`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#f0fdf4" />
              <stop offset="55%" stopColor="#dcfce7" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>

            {/* Ambient drop shadow behind dynamic crest */}
            <filter id={`${gradientId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* 1. Base Squircle / Rounded Diamond Bezel */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill={`url(#${gradientId}-gem)`}
            stroke={`url(#${gradientId}-bezel)`}
            strokeWidth="1.8"
          />

          {/* 2. Inner Recessed Cavity Ring */}
          <rect
            x="5.5"
            y="5.5"
            width="37"
            height="37"
            rx="9.5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="0.8"
          />

          {/* 3. Glossy Glass Reflection Sheen */}
          <path
            d="M5.5 15 C5.5 10 9.5 5.5 15 5.5 L33 5.5 C38.5 5.5 42.5 10 42.5 15 C42.5 19 32 23 24 23 C16 23 5.5 19 5.5 15 Z"
            fill={`url(#${gradientId}-sheen)`}
          />

          {/* 4. Realistic 3D Central Activity Wave & Diamond Nexus */}
          <g filter={`url(#${gradientId}-shadow)`}>
            {/* Smooth dynamic momentum wave */}
            <path
              d="M10 25 L16 25 L20.5 14 L27.5 34 L32 25 L38 25"
              stroke={`url(#${gradientId}-pulse)`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Top energy diamond apex point */}
            <polygon
              points="20.5,10 23,14 20.5,18 18,14"
              fill="#ffffff"
            />
            {/* Glowing core highlight on diamond */}
            <circle
              cx="20.5"
              cy="14"
              r="2"
              fill="#ecfdf5"
            />
          </g>

          {/* 5. Bottom Rim Ambient Shadow for realism */}
          <path
            d="M8 38 C14 43 34 43 40 38"
            stroke="rgba(0, 0, 0, 0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Modern Wordmark with realistic gradient badge */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span
            style={{
              fontSize: isLarge ? '1.5rem' : '1.18rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          >
            arena
          </span>
          <span
            style={{
              fontSize: isLarge ? '1.5rem' : '1.18rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #a7f3d0 0%, #3ecf8e 60%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            Tracker
          </span>
        </div>
        {isLarge && (
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: '3px',
            }}
          >
            Live Activity & Alarms
          </span>
        )}
      </div>
    </Link>
  );
}
