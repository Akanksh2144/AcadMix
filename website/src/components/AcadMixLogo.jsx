import React from 'react';

const AcadMixLogo = ({ size = 40, showText = true, className = '' }) => {
  return (
    <div className={`acadmix-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="cap-grad" x1="10" y1="10" x2="38" y2="38">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Rounded background */}
        <rect width="48" height="48" rx="14" fill="url(#logo-grad)" />
        {/* Graduation cap - top */}
        <path d="M24 12L8 20L24 28L40 20L24 12Z" fill="white" opacity="0.95"/>
        {/* Cap brim shadow */}
        <path d="M24 28L8 20V24L24 32L40 24V20L24 28Z" fill="white" opacity="0.5"/>
        {/* Tassel */}
        <path d="M36 20V30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
        <circle cx="36" cy="31" r="2" fill="white" opacity="0.8"/>
        {/* Digital nodes */}
        <circle cx="14" cy="34" r="1.5" fill="white" opacity="0.4"/>
        <circle cx="20" cy="37" r="1" fill="white" opacity="0.3"/>
        <circle cx="28" cy="37" r="1" fill="white" opacity="0.3"/>
        <path d="M14 34L20 37M20 37L28 37" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      </svg>
      {showText && (
        <span style={{
          fontSize: `${size * 0.55}px`,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AcadMix
        </span>
      )}
    </div>
  );
};

export default AcadMixLogo;
