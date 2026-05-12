import React from 'react';

// ── Passives (0805 SMD) ───────────────────────────────────────────────────────
const SMD0805 = ({ text = '' }) => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    {/* Silkscreen outline only, no body fill */}
    <rect x="-2" y="-4" width="44" height="28" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Text */}
    {text && <text x="20" y="22" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">{text}</text>}
  </svg>
);

export const ResistorSymbol: React.FC = () => <SMD0805 text="R" />;
export const CapacitorSymbol: React.FC = () => <SMD0805 text="C" />;
export const InductorSymbol: React.FC = () => <SMD0805 text="L" />;

// ── Polarized (Tantalum / Aluminum) ───────────────────────────────────────────
export const PolarizedCapSymbol: React.FC = () => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    <rect x="-2" y="-4" width="44" height="28" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Polarity stripe on silkscreen */}
    <rect x="0" y="-4" width="4" height="28" fill="#ffff00" />
    <text x="20" y="22" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">C+</text>
  </svg>
);

export const DiodeSymbol: React.FC = () => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    <rect x="-2" y="-4" width="44" height="28" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Cathode stripe on silkscreen */}
    <rect x="36" y="-4" width="4" height="28" fill="#ffff00" />
    <text x="18" y="22" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">D</text>
  </svg>
);

export const LEDSymbol: React.FC = () => <DiodeSymbol />;

// ── Actives / Transistors (SOT-23) ────────────────────────────────────────────
const SOT23 = ({ text = 'Q' }) => (
  <svg viewBox="0 0 30 30" width={30} height={30} className="overflow-visible">
    <rect x="2" y="2" width="26" height="26" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="15" y="18" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">{text}</text>
  </svg>
);
export const NPNSymbol: React.FC = () => <SOT23 text="Q" />;
export const PNPSymbol: React.FC = () => <SOT23 text="Q" />;
export const NMOSSymbol: React.FC = () => <SOT23 text="Q" />;
export const PMOSSymbol: React.FC = () => <SOT23 text="Q" />;

// ── ICs (SOIC / DIP) ──────────────────────────────────────────────────────────
const SOIC = ({ pinCount = 8, label = 'U' }) => {
  const pinsPerSide = Math.ceil(pinCount / 2);
  const height = Math.max(30, pinsPerSide * 15);
  return (
    <svg viewBox={`0 0 40 ${height}`} width={40} height={height} className="overflow-visible">
      {/* Silkscreen outline */}
      <rect x="2" y="0" width="36" height={height} fill="none" stroke="#ffff00" strokeWidth="1" />
      {/* Pin 1 dot on silkscreen */}
      <circle cx="8" cy="6" r="2" fill="#ffff00" />
      <text x="20" y={height / 2 + 3} textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold" transform={`rotate(-90, 20, ${height/2})`}>{label}</text>
    </svg>
  );
};
export const OpAmpSymbol: React.FC = () => <SOIC label="U" />;
export const Timer555Symbol: React.FC = () => <SOIC label="U" />;
export const ICChipSymbol: React.FC<{ pinCount?: number; label?: string }> = ({ pinCount = 8, label = 'U' }) => <SOIC pinCount={pinCount} label={label} />;

// Logic Gates as ICs (SOIC-14)
export const ANDGateSymbol: React.FC = () => <SOIC pinCount={14} label="U" />;
export const ORGateSymbol: React.FC = () => <SOIC pinCount={14} label="U" />;
export const NOTGateSymbol: React.FC = () => <SOIC pinCount={14} label="U" />;

// ── Misc ──────────────────────────────────────────────────────────────────────
export const CrystalSymbol: React.FC = () => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    <rect x="-2" y="-2" width="44" height="24" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="20" y="13" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">Y</text>
  </svg>
);

export const VregSymbol: React.FC = () => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <rect x="0" y="0" width="40" height="40" fill="none" stroke="#ffff00" strokeWidth="1" />
    <rect x="5" y="-5" width="30" height="10" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">U</text>
  </svg>
);

// ── Connectors & Power (Vias / Test Points) ──────────────────────────────────
const TestPoint = ({ label = 'TP' }) => (
  <svg viewBox="0 0 20 20" width={20} height={20} className="overflow-visible">
    {/* Yellow silkscreen ring */}
    <circle cx="10" cy="10" r="10" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="10" y="-2" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">{label}</text>
  </svg>
);
export const VCCSymbol: React.FC = () => <TestPoint label="+5V" />;
export const GNDSymbol: React.FC = () => <TestPoint label="GND" />;

export const BatterySymbol: React.FC = () => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <circle cx="20" cy="20" r="20" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">BAT</text>
  </svg>
);

// Fallbacks for anything else
export const SCRSymbol: React.FC = () => <SOT23 text="SCR" />;
export const FuseSymbol: React.FC = () => <SMD0805 text="F" />;
export const PotentiometerSymbol: React.FC = () => <SOIC pinCount={3} label="VR" />;
export const SwitchSymbol: React.FC = () => <SOIC pinCount={4} label="SW" />;
export const TransformerSymbol: React.FC = () => <SOIC pinCount={6} label="T" />;
