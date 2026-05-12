import React from 'react';

// ── Passives (0805 SMD) ───────────────────────────────────────────────────────
const SMD0805 = ({ color = '#1f2937', text = '' }) => (
  <svg viewBox="0 0 60 30" width={60} height={30} className="overflow-visible">
    {/* Silkscreen outline */}
    <rect x="-4" y="-4" width="68" height="38" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 2" />
    {/* Body */}
    <rect x="10" y="2" width="40" height="26" fill={color} rx="2" />
    {/* Text */}
    {text && <text x="30" y="18" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">{text}</text>}
  </svg>
);

export const ResistorSymbol: React.FC = () => <SMD0805 text="103" />;
export const CapacitorSymbol: React.FC = () => <SMD0805 color="#b45309" />; // Brownish MLCC
export const InductorSymbol: React.FC = () => <SMD0805 color="#374151" text="220" />; // Dark gray ferrite

// ── Polarized (Tantalum / Aluminum) ───────────────────────────────────────────
export const PolarizedCapSymbol: React.FC = () => (
  <svg viewBox="0 0 60 30" width={60} height={30} className="overflow-visible">
    <rect x="-4" y="-4" width="68" height="38" fill="none" stroke="#facc15" strokeWidth="1.5" />
    {/* Yellow body for Tantalum */}
    <rect x="10" y="2" width="40" height="26" fill="#ca8a04" rx="2" />
    {/* Polarity stripe (Anode) */}
    <rect x="12" y="2" width="6" height="26" fill="#713f12" />
  </svg>
);

export const DiodeSymbol: React.FC = () => (
  <svg viewBox="0 0 60 30" width={60} height={30} className="overflow-visible">
    <rect x="-4" y="-4" width="68" height="38" fill="none" stroke="#facc15" strokeWidth="1.5" />
    <rect x="10" y="4" width="40" height="22" fill="#111827" rx="2" />
    {/* Cathode stripe */}
    <rect x="14" y="4" width="4" height="22" fill="#cbd5e1" />
  </svg>
);

export const LEDSymbol: React.FC<{ color?: string }> = ({ color = '#ef4444' }) => (
  <svg viewBox="0 0 60 30" width={60} height={30} className="overflow-visible">
    <rect x="-4" y="-4" width="68" height="38" fill="none" stroke="#facc15" strokeWidth="1.5" />
    <rect x="10" y="4" width="40" height="22" fill="#f8fafc" rx="2" opacity="0.9" />
    <circle cx="30" cy="15" r="8" fill={color} opacity="0.8" />
    {/* Cathode mark on silkscreen */}
    <line x1="12" y1="-4" x2="12" y2="34" stroke="#facc15" strokeWidth="2" />
  </svg>
);

// ── Actives / Transistors (SOT-23) ────────────────────────────────────────────
const SOT23 = ({ text = 'Q' }) => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <rect x="-4" y="-4" width="48" height="48" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="10" y="6" width="20" height="28" fill="#111827" rx="2" />
    <text x="20" y="23" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">{text}</text>
  </svg>
);
export const NPNSymbol: React.FC = () => <SOT23 text="NPN" />;
export const PNPSymbol: React.FC = () => <SOT23 text="PNP" />;
export const NMOSSymbol: React.FC = () => <SOT23 text="NMOS" />;
export const PMOSSymbol: React.FC = () => <SOT23 text="PMOS" />;

// ── ICs (SOIC / DIP) ──────────────────────────────────────────────────────────
const SOIC = ({ pinCount = 8, label = 'IC' }) => {
  const pinsPerSide = Math.ceil(pinCount / 2);
  const height = Math.max(40, pinsPerSide * 16 + 8);
  return (
    <svg viewBox={`0 0 60 ${height}`} width={60} height={height} className="overflow-visible">
      {/* Silkscreen outline */}
      <rect x="-4" y="-4" width="68" height={height + 8} fill="none" stroke="#facc15" strokeWidth="1.5" />
      {/* Pin 1 dot on silkscreen */}
      <circle cx="4" cy="8" r="2" fill="#facc15" />
      {/* IC Body */}
      <rect x="12" y="0" width="36" height={height} fill="#111827" rx="2" />
      {/* Dimple */}
      <circle cx="20" cy="8" r="3" fill="#1f2937" />
      <text x="30" y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold" transform={`rotate(-90, 30, ${height/2})`}>{label}</text>
    </svg>
  );
};
export const OpAmpSymbol: React.FC = () => <SOIC label="LM358" />;
export const Timer555Symbol: React.FC = () => <SOIC label="NE555" />;
export const ICChipSymbol: React.FC<{ pinCount?: number; label?: string }> = ({ pinCount = 8, label = 'IC' }) => <SOIC pinCount={pinCount} label={label} />;

// Logic Gates as ICs (SOIC-14)
export const ANDGateSymbol: React.FC = () => <SOIC pinCount={14} label="74HC08" />;
export const ORGateSymbol: React.FC = () => <SOIC pinCount={14} label="74HC32" />;
export const NOTGateSymbol: React.FC = () => <SOIC pinCount={14} label="74HC04" />;

// ── Misc ──────────────────────────────────────────────────────────────────────
export const CrystalSymbol: React.FC = () => (
  <svg viewBox="0 0 60 30" width={60} height={30} className="overflow-visible">
    <rect x="-4" y="-4" width="68" height="38" fill="none" stroke="#facc15" strokeWidth="1.5" />
    <rect x="10" y="2" width="40" height="26" fill="#94a3b8" rx="12" /> {/* Silver oval body */}
    <text x="30" y="18" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="bold">16M</text>
  </svg>
);

export const VregSymbol: React.FC = () => (
  <svg viewBox="0 0 60 60" width={60} height={60} className="overflow-visible">
    <rect x="-4" y="-4" width="68" height="68" fill="none" stroke="#facc15" strokeWidth="1.5" />
    <rect x="10" y="10" width="40" height="40" fill="#111827" /> {/* DPAK / TO-220 body */}
    {/* Tab */}
    <rect x="15" y="-2" width="30" height="12" fill="#cbd5e1" />
    <text x="30" y="34" textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">VREG</text>
  </svg>
);

// ── Connectors & Power (Vias / Test Points) ──────────────────────────────────
const TestPoint = ({ label = 'TP' }) => (
  <svg viewBox="0 0 30 30" width={30} height={30} className="overflow-visible">
    <circle cx="15" cy="15" r="14" fill="none" stroke="#facc15" strokeWidth="1.5" />
    {/* Pad area */}
    <circle cx="15" cy="15" r="8" fill="#D4AF37" />
    <text x="15" y="-4" textAnchor="middle" fontSize="10" fill="#facc15" fontWeight="bold">{label}</text>
  </svg>
);
export const VCCSymbol: React.FC = () => <TestPoint label="+5V" />;
export const GNDSymbol: React.FC = () => <TestPoint label="GND" />;

export const BatterySymbol: React.FC = () => (
  <svg viewBox="0 0 60 60" width={60} height={60} className="overflow-visible">
    <circle cx="30" cy="30" r="28" fill="none" stroke="#facc15" strokeWidth="1.5" />
    <circle cx="30" cy="30" r="24" fill="#e2e8f0" /> {/* Silver coin cell */}
    <text x="30" y="34" textAnchor="middle" fontSize="14" fill="#64748b" fontWeight="bold">CR2032</text>
  </svg>
);

// Fallbacks for anything else
export const SCRSymbol: React.FC = () => <SOT23 text="SCR" />;
export const FuseSymbol: React.FC = () => <SMD0805 color="#059669" text="F" />;
export const PotentiometerSymbol: React.FC = () => <SOIC pinCount={3} label="POT" />;
export const SwitchSymbol: React.FC = () => <SOIC pinCount={4} label="SW" />;
export const TransformerSymbol: React.FC = () => <SOIC pinCount={6} label="XFMR" />;
