// ── AcadMix PCB Studio — Footprint Symbols (Silkscreen) ──────────────────────
// Hyper-realistic pure-silkscreen (yellow) outlines without bodies,
// matching the aesthetic of Altium and EasyEDA physical layout modes.

import React from 'react';

// ── Generic Scalable Footprints ──────────────────────────────────────────────

export const SMD0805 = ({ text = '' }: { text?: string }) => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    {/* Yellow silkscreen bounding box */}
    <rect x="0" y="0" width="40" height="20" fill="none" stroke="#ffff00" strokeWidth="1" />
    {text && <text x="20" y="14" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">{text}</text>}
  </svg>
);

export const THResistor = () => (
  <svg viewBox="0 0 60 20" width={60} height={20} className="overflow-visible">
    <rect x="10" y="2" width="40" height="16" fill="none" stroke="#ffff00" strokeWidth="1" />
    <path d="M 0 10 L 10 10 M 50 10 L 60 10" stroke="#ffff00" strokeWidth="1" fill="none" />
  </svg>
);

export const SOT23 = ({ text = 'Q' }: { text?: string }) => (
  <svg viewBox="0 0 30 30" width={30} height={30} className="overflow-visible">
    <rect x="5" y="5" width="20" height="20" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="15" y="19" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">{text}</text>
  </svg>
);

export const TO220 = () => (
  <svg viewBox="0 0 40 30" width={40} height={30} className="overflow-visible">
    <rect x="0" y="5" width="40" height="15" fill="none" stroke="#ffff00" strokeWidth="1" />
    <rect x="0" y="20" width="40" height="10" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Mounting hole silkscreen outline */}
    <circle cx="20" cy="12" r="3" fill="none" stroke="#ffff00" strokeWidth="1" />
  </svg>
);

export const GenericIC = ({ width, height, text }: { width: number; height: number; text: string }) => (
  <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
    <rect x="0" y="0" width={width} height={height} fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Pin 1 indicator dot */}
    <circle cx="6" cy="6" r="2" fill="#ffff00" />
    <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold" transform={height > width ? `rotate(-90 ${width/2} ${height/2})` : ''}>
      {text}
    </text>
  </svg>
);

// ── Passives ─────────────────────────────────────────────────────────────────
export const ResistorSymbol: React.FC = () => <SMD0805 text="R" />;
export const ResistorTHSymbol: React.FC = () => <THResistor />;
export const CapacitorSymbol: React.FC = () => <SMD0805 text="C" />;
export const CapacitorElecSymbol: React.FC = () => (
  <svg viewBox="0 0 30 30" width={30} height={30} className="overflow-visible">
    <circle cx="15" cy="15" r="14" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Polarity marker */}
    <path d="M 15 1 L 15 29" stroke="#ffff00" strokeWidth="1" />
    <path d="M 2 15 L 28 15" stroke="#ffff00" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);
export const InductorSymbol: React.FC = () => <SMD0805 text="L" />;
export const DiodeSymbol: React.FC = () => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    <rect x="0" y="0" width="40" height="20" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Cathode band */}
    <rect x="28" y="0" width="6" height="20" fill="#ffff00" />
    <text x="16" y="14" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">D</text>
  </svg>
);
export const LEDSymbol: React.FC = () => (
  <svg viewBox="0 0 40 20" width={40} height={20} className="overflow-visible">
    <rect x="0" y="0" width="40" height="20" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Cathode band */}
    <rect x="28" y="0" width="6" height="20" fill="#ffff00" />
    <text x="16" y="14" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">LED</text>
  </svg>
);
export const CrystalSymbol: React.FC = () => <SMD0805 text="Y" />;

// ── Active Semiconductors ──────────────────────────────────────────────────
export const NPNSymbol: React.FC = () => <SOT23 text="NPN" />;
export const PNPSymbol: React.FC = () => <SOT23 text="PNP" />;
export const NMOSFETSymbol: React.FC = () => <TO220 />;
export const OpAmpSymbol: React.FC = () => <GenericIC width={40} height={40} text="OpAmp" />;
export const VoltageRegulatorSymbol: React.FC = () => <GenericIC width={40} height={30} text="LDO" />;

// ── ICs & Digital ──────────────────────────────────────────────────────────
export const Timer555Symbol: React.FC = () => <GenericIC width={50} height={50} text="NE555" />;
export const ATmega328Symbol: React.FC = () => <GenericIC width={80} height={80} text="ATmega328" />;
export const ESP32Symbol: React.FC = () => (
  <svg viewBox="0 0 80 120" width={80} height={120} className="overflow-visible">
    <rect x="0" y="0" width="80" height="120" fill="none" stroke="#ffff00" strokeWidth="1" />
    {/* Antenna keepout zone */}
    <rect x="0" y="0" width="80" height="30" fill="none" stroke="#ffff00" strokeWidth="1" strokeDasharray="4 2" />
    <text x="40" y="15" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">ANTENNA</text>
    <text x="40" y="70" textAnchor="middle" fontSize="14" fill="#ffff00" fontWeight="bold">ESP32</text>
    <text x="40" y="85" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">WROOM</text>
  </svg>
);
export const L298NSymbol: React.FC = () => <GenericIC width={100} height={40} text="L298N" />;
export const LogicGateSymbol: React.FC = () => <GenericIC width={60} height={40} text="74HC" />;
export const ICChipSymbol: React.FC = () => <GenericIC width={50} height={40} text="IC" />;

// ── Connectors & Electromechanical ─────────────────────────────────────────
export const HeaderSymbol: React.FC = () => <GenericIC width={20} height={60} text="HDR" />;
export const USBSymbol: React.FC = () => <GenericIC width={60} height={40} text="USB-C" />;
export const SwitchSymbol: React.FC = () => <GenericIC width={30} height={30} text="SW" />;
export const BarrelSymbol: React.FC = () => (
  <svg viewBox="0 0 50 40" width={50} height={40} className="overflow-visible">
    <rect x="0" y="0" width="50" height="40" fill="none" stroke="#ffff00" strokeWidth="1" />
    <circle cx="25" cy="20" r="10" fill="none" stroke="#ffff00" strokeWidth="1" />
    <text x="25" y="24" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold">DC IN</text>
  </svg>
);

// ── Power & Ground ─────────────────────────────────────────────────────────
const TestPoint = () => (
  <svg viewBox="0 0 20 20" width={20} height={20} className="overflow-visible">
    <circle cx="10" cy="10" r="10" fill="none" stroke="#ffff00" strokeWidth="1" />
  </svg>
);
export const VCCSymbol: React.FC = () => <TestPoint />;
export const GNDSymbol: React.FC = () => <TestPoint />;
export const BatterySymbol: React.FC = () => (
  <svg viewBox="0 0 40 40" width={40} height={40} className="overflow-visible">
    <circle cx="20" cy="20" r="20" fill="none" stroke="#ffff00" strokeWidth="1" />
  </svg>
);

// ── Sensors & Misc ─────────────────────────────────────────────────────────
export const TestPointSymbol: React.FC = () => <TestPoint />;
export const MPU6050Symbol: React.FC = () => <GenericIC width={60} height={50} text="MPU6050" />;
export const DHT11Symbol: React.FC = () => (
  <svg viewBox="0 0 40 50" width={40} height={50} className="overflow-visible">
    <rect x="0" y="0" width="40" height="50" fill="none" stroke="#ffff00" strokeWidth="1" />
    <line x1="5" y1="10" x2="35" y2="10" stroke="#ffff00" strokeWidth="1" />
    <line x1="5" y1="20" x2="35" y2="20" stroke="#ffff00" strokeWidth="1" />
    <line x1="5" y1="30" x2="35" y2="30" stroke="#ffff00" strokeWidth="1" />
    <line x1="5" y1="40" x2="35" y2="40" stroke="#ffff00" strokeWidth="1" />
    <text x="20" y="28" textAnchor="middle" fontSize="10" fill="#ffff00" fontWeight="bold" transform="rotate(-90 20 25)">DHT11</text>
  </svg>
);
