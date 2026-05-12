import React from 'react';

// ── Logical Schematic Symbols (IEEE / IEC style) ─────────────────────────────
// These are black/white standard schematic symbols used in the Schematic Editor mode.

export const SchResistor = ({ text = 'R' }: { text?: string }) => (
  <svg viewBox="0 0 60 20" width={60} height={20} className="overflow-visible">
    <polyline points="0,10 15,10 20,2 30,18 40,2 45,10 60,10" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeLinejoin="bevel" />
    {text && <text x="30" y="-5" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchCapacitor = ({ text = 'C' }: { text?: string }) => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <line x1="0" y1="20" x2="16" y2="20" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="24" y1="20" x2="40" y2="20" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="16" y1="5" x2="16" y2="35" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="24" y1="5" x2="24" y2="35" stroke="#e5e7eb" strokeWidth="2" />
    {text && <text x="20" y="-5" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchInductor = ({ text = 'L' }: { text?: string }) => (
  <svg viewBox="0 0 60 20" width={60} height={20} className="overflow-visible">
    <line x1="0" y1="10" x2="15" y2="10" stroke="#e5e7eb" strokeWidth="2" />
    <path d="M 15 10 A 5 5 0 0 1 25 10 A 5 5 0 0 1 35 10 A 5 5 0 0 1 45 10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="45" y1="10" x2="60" y2="10" stroke="#e5e7eb" strokeWidth="2" />
    {text && <text x="30" y="-5" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchDiode = ({ text = 'D' }: { text?: string }) => (
  <svg viewBox="0 0 40 30" width={40} height={30} className="overflow-visible">
    <line x1="0" y1="15" x2="15" y2="15" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="25" y1="15" x2="40" y2="15" stroke="#e5e7eb" strokeWidth="2" />
    <polygon points="15,5 15,25 25,15" fill="#e5e7eb" />
    <line x1="25" y1="5" x2="25" y2="25" stroke="#e5e7eb" strokeWidth="2" />
    {text && <text x="20" y="-5" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchNPN = ({ text = 'Q' }: { text?: string }) => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="12" y1="10" x2="12" y2="30" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="0" y1="20" x2="12" y2="20" stroke="#e5e7eb" strokeWidth="2" /> {/* Base */}
    <line x1="12" y1="15" x2="24" y2="5" stroke="#e5e7eb" strokeWidth="2" /> {/* Collector */}
    <line x1="24" y1="5" x2="24" y2="0" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="12" y1="25" x2="24" y2="35" stroke="#e5e7eb" strokeWidth="2" /> {/* Emitter */}
    <line x1="24" y1="35" x2="24" y2="40" stroke="#e5e7eb" strokeWidth="2" />
    {/* Arrow */}
    <polygon points="24,35 20,30 18,34" fill="#e5e7eb" />
    {text && <text x="35" y="20" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchOpAmp = ({ text = 'OpAmp' }: { text?: string }) => (
  <svg viewBox="0 0 60 50" width={60} height={50} className="overflow-visible">
    <polygon points="10,5 10,45 50,25" fill="none" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="0" y1="15" x2="10" y2="15" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="0" y1="35" x2="10" y2="35" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="50" y1="25" x2="60" y2="25" stroke="#e5e7eb" strokeWidth="2" />
    <text x="16" y="19" fontSize="12" fill="#e5e7eb" fontWeight="bold">+</text>
    <text x="16" y="39" fontSize="12" fill="#e5e7eb" fontWeight="bold">-</text>
    {text && <text x="30" y="-5" textAnchor="middle" fontSize="12" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);

export const SchGround = () => (
  <svg viewBox="0 0 30 30" width={30} height={30} className="overflow-visible">
    <line x1="15" y1="0" x2="15" y2="15" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="5" y1="15" x2="25" y2="15" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="8" y1="20" x2="22" y2="20" stroke="#e5e7eb" strokeWidth="2" />
    <line x1="12" y1="25" x2="18" y2="25" stroke="#e5e7eb" strokeWidth="2" />
  </svg>
);

export const SchGenericIC = ({ width = 60, height = 80, text = 'IC' }: { width?: number; height?: number; text?: string }) => (
  <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
    <rect x="0" y="0" width={width} height={height} fill="none" stroke="#e5e7eb" strokeWidth="2" />
    {text && <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize="14" fill="#e5e7eb" fontWeight="bold">{text}</text>}
  </svg>
);
