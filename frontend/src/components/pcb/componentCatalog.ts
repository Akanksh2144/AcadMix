// ── AcadMix PCB Studio — Component Catalog ───────────────────────────────────
// The full catalog of available PCB components for the library panel.

import type { CatalogEntry, ComponentCategory, ComponentType } from './types';

function createPins(
  count: number, 
  side: 'left' | 'right' | 'top' | 'bottom', 
  startIndex: number = 1, 
  prefix: string = '', 
  type: 'input' | 'output' | 'bidirectional' | 'power' | 'ground' = 'bidirectional'
) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${startIndex + i}`,
    label: `${prefix}${startIndex + i}`,
    type,
    side,
  }));
}

export const COMPONENT_CATALOG: CatalogEntry[] = [
  // ── Passive Components (Massively Expanded) ────────────────────────────────
  // Resistors: 0402, 0603, 0805, 1206, and Through-Hole variants
  ...[10, 22, 33, 47, 100, 220, 330, 470, 680, 1000, 2200, 4700, 10000, 22000, 47000, 100000, 470000, 1000000].flatMap(v => {
    const valStr = v >= 1000000 ? `${v/1000000}M` : v >= 1000 ? `${v/1000}k` : `${v}`;
    return [
      { type: `res_0402_${v}`, label: `Res ${valStr} 0402`, category: 'passive', description: `${valStr}Ω 0402 SMD Resistor`, refDesPrefix: 'R', defaultProperties: { value: `${valStr}Ω`, package: '0402' }, pins: createPins(2, 'left', 1) },
      { type: `res_0603_${v}`, label: `Res ${valStr} 0603`, category: 'passive', description: `${valStr}Ω 0603 SMD Resistor`, refDesPrefix: 'R', defaultProperties: { value: `${valStr}Ω`, package: '0603' }, pins: createPins(2, 'left', 1) },
      { type: `res_0805_${v}`, label: `Res ${valStr} 0805`, category: 'passive', description: `${valStr}Ω 0805 SMD Resistor`, refDesPrefix: 'R', defaultProperties: { value: `${valStr}Ω`, package: '0805' }, pins: createPins(2, 'left', 1) },
      { type: `res_th_${v}`, label: `Res ${valStr} TH`, category: 'passive', description: `${valStr}Ω Through-hole Resistor`, refDesPrefix: 'R', defaultProperties: { value: `${valStr}Ω`, package: 'AXIAL-0.3' }, pins: createPins(2, 'left', 1) },
    ] as CatalogEntry[];
  }),

  // Capacitors: Ceramic (0402, 0603, 0805) and Electrolytic
  ...['10pF', '22pF', '47pF', '100pF', '220pF', '470pF', '1nF', '2.2nF', '4.7nF', '10nF', '22nF', '47nF', '100nF', '220nF', '470nF', '1uF', '2.2uF', '4.7uF', '10uF'].flatMap(v => {
    return [
      { type: `cap_0402_${v.replace('.', '_')}`, label: `Cap ${v} 0402`, category: 'passive', description: `${v} 0402 SMD Capacitor`, refDesPrefix: 'C', defaultProperties: { value: v, package: '0402' }, pins: createPins(2, 'left', 1) },
      { type: `cap_0603_${v.replace('.', '_')}`, label: `Cap ${v} 0603`, category: 'passive', description: `${v} 0603 SMD Capacitor`, refDesPrefix: 'C', defaultProperties: { value: v, package: '0603' }, pins: createPins(2, 'left', 1) },
      { type: `cap_0805_${v.replace('.', '_')}`, label: `Cap ${v} 0805`, category: 'passive', description: `${v} 0805 SMD Capacitor`, refDesPrefix: 'C', defaultProperties: { value: v, package: '0805' }, pins: createPins(2, 'left', 1) },
    ] as CatalogEntry[];
  }),
  ...['1uF', '4.7uF', '10uF', '22uF', '47uF', '100uF', '220uF', '470uF', '1000uF'].map(v => (
    { type: `cap_elec_${v.replace('.', '_')}`, label: `Cap ${v} Elec`, category: 'passive', description: `${v} Electrolytic Capacitor`, refDesPrefix: 'C', defaultProperties: { value: v, package: 'ELEC-CAN' }, pins: [{ id: '1', label: '+', type: 'bidirectional', side: 'left' }, { id: '2', label: '-', type: 'bidirectional', side: 'right' }] } as CatalogEntry
  )),

  // Inductors
  ...['1uH', '2.2uH', '4.7uH', '10uH', '22uH', '47uH', '100uH', '220uH', '470uH', '1mH'].map(v => (
    { type: `ind_0805_${v.replace('.', '_')}`, label: `Ind ${v} 0805`, category: 'passive', description: `${v} 0805 SMD Inductor`, refDesPrefix: 'L', defaultProperties: { value: v, package: '0805' }, pins: createPins(2, 'left', 1) } as CatalogEntry
  )),

  // ── Active Semiconductors ──────────────────────────────────────────────────
  { type: 'diode_1n4148', label: '1N4148', category: 'active', description: 'Signal Diode', refDesPrefix: 'D', defaultProperties: { value: '1N4148', package: 'SOD-123' }, pins: [{ id: 'a', label: 'A', type: 'bidirectional', side: 'left' }, { id: 'k', label: 'K', type: 'bidirectional', side: 'right' }] },
  { type: 'diode_1n4007', label: '1N4007', category: 'active', description: 'Rectifier Diode', refDesPrefix: 'D', defaultProperties: { value: '1N4007', package: 'DO-41' }, pins: [{ id: 'a', label: 'A', type: 'bidirectional', side: 'left' }, { id: 'k', label: 'K', type: 'bidirectional', side: 'right' }] },
  { type: 'led_red', label: 'LED Red', category: 'active', description: 'Red LED 0603', refDesPrefix: 'D', defaultProperties: { value: 'Red', package: '0603' }, pins: [{ id: 'a', label: 'A', type: 'bidirectional', side: 'left' }, { id: 'k', label: 'K', type: 'bidirectional', side: 'right' }] },
  { type: 'led_green', label: 'LED Green', category: 'active', description: 'Green LED 0603', refDesPrefix: 'D', defaultProperties: { value: 'Green', package: '0603' }, pins: [{ id: 'a', label: 'A', type: 'bidirectional', side: 'left' }, { id: 'k', label: 'K', type: 'bidirectional', side: 'right' }] },
  { type: 'led_blue', label: 'LED Blue', category: 'active', description: 'Blue LED 0603', refDesPrefix: 'D', defaultProperties: { value: 'Blue', package: '0603' }, pins: [{ id: 'a', label: 'A', type: 'bidirectional', side: 'left' }, { id: 'k', label: 'K', type: 'bidirectional', side: 'right' }] },
  { type: 'bjt_2n2222', label: '2N2222 NPN', category: 'active', description: 'General Purpose NPN', refDesPrefix: 'Q', defaultProperties: { value: '2N2222', package: 'SOT-23' }, pins: [{ id: 'b', label: 'B', type: 'input', side: 'left' }, { id: 'c', label: 'C', type: 'bidirectional', side: 'top' }, { id: 'e', label: 'E', type: 'bidirectional', side: 'bottom' }] },
  { type: 'bjt_2n2907', label: '2N2907 PNP', category: 'active', description: 'General Purpose PNP', refDesPrefix: 'Q', defaultProperties: { value: '2N2907', package: 'SOT-23' }, pins: [{ id: 'b', label: 'B', type: 'input', side: 'left' }, { id: 'c', label: 'C', type: 'bidirectional', side: 'top' }, { id: 'e', label: 'E', type: 'bidirectional', side: 'bottom' }] },
  { type: 'mosfet_n_bss138', label: 'BSS138 N-CH', category: 'active', description: 'N-Channel Logic Level MOSFET', refDesPrefix: 'Q', defaultProperties: { value: 'BSS138', package: 'SOT-23' }, pins: [{ id: 'g', label: 'G', type: 'input', side: 'left' }, { id: 'd', label: 'D', type: 'bidirectional', side: 'top' }, { id: 's', label: 'S', type: 'bidirectional', side: 'bottom' }] },
  { type: 'mosfet_p_bss84', label: 'BSS84 P-CH', category: 'active', description: 'P-Channel Logic Level MOSFET', refDesPrefix: 'Q', defaultProperties: { value: 'BSS84', package: 'SOT-23' }, pins: [{ id: 'g', label: 'G', type: 'input', side: 'left' }, { id: 'd', label: 'D', type: 'bidirectional', side: 'top' }, { id: 's', label: 'S', type: 'bidirectional', side: 'bottom' }] },

  // ── ICs & Digital ──────────────────────────────────────────────────────────
  { type: 'mcu_esp32_wroom', label: 'ESP32-WROOM-32', category: 'ic', description: 'WiFi/BT SoC Module', refDesPrefix: 'U', defaultProperties: { value: 'ESP32' }, pins: [ ...createPins(19, 'left', 1), ...createPins(19, 'right', 20) ] },
  { type: 'mcu_stm32f103c8', label: 'STM32F103C8T6', category: 'ic', description: 'Cortex-M3 BluePill IC', refDesPrefix: 'U', defaultProperties: { value: 'STM32' }, pins: [ ...createPins(24, 'left', 1), ...createPins(24, 'right', 25) ] },
  { type: 'mcu_rp2040', label: 'RP2040', category: 'ic', description: 'Raspberry Pi Dual Core MCU', refDesPrefix: 'U', defaultProperties: { value: 'RP2040', package: 'QFN-56' }, pins: [ ...createPins(14, 'left', 1), ...createPins(14, 'bottom', 15), ...createPins(14, 'right', 29), ...createPins(14, 'top', 43) ] },
  { type: 'mcu_atmega328p', label: 'ATmega328P-AU', category: 'ic', description: '8-bit AVR MCU', refDesPrefix: 'U', defaultProperties: { value: 'ATmega328P', package: 'TQFP-32' }, pins: [ ...createPins(8, 'left', 1), ...createPins(8, 'bottom', 9), ...createPins(8, 'right', 17), ...createPins(8, 'top', 25) ] },
  { type: 'logic_74hc595', label: '74HC595 Shift Reg', category: 'ic', description: '8-bit Shift Register', refDesPrefix: 'U', defaultProperties: { value: '74HC595', package: 'SOIC-16' }, pins: [ ...createPins(8, 'left', 1), ...createPins(8, 'right', 9) ] },
  { type: 'logic_74hc138', label: '74HC138 Decoder', category: 'ic', description: '3-to-8 Decoder', refDesPrefix: 'U', defaultProperties: { value: '74HC138', package: 'SOIC-16' }, pins: [ ...createPins(8, 'left', 1), ...createPins(8, 'right', 9) ] },
  { type: 'logic_ne555', label: 'NE555 Timer', category: 'ic', description: 'Precision Timer IC', refDesPrefix: 'U', defaultProperties: { value: 'NE555', package: 'SOIC-8' }, pins: [ ...createPins(4, 'left', 1), ...createPins(4, 'right', 5) ] },
  { type: 'opamp_lm358', label: 'LM358 Dual OpAmp', category: 'ic', description: 'Low Power Dual OpAmp', refDesPrefix: 'U', defaultProperties: { value: 'LM358', package: 'SOIC-8' }, pins: [ ...createPins(4, 'left', 1), ...createPins(4, 'right', 5) ] },
  { type: 'opamp_tl072', label: 'TL072 JFET OpAmp', category: 'ic', description: 'Low Noise Dual OpAmp', refDesPrefix: 'U', defaultProperties: { value: 'TL072', package: 'SOIC-8' }, pins: [ ...createPins(4, 'left', 1), ...createPins(4, 'right', 5) ] },

  // ── Connectors ─────────────────────────────────────────────────────────────
  ...[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 40].flatMap(n => [
    { type: `header_1x${n}`, label: `Header 1x${n}`, category: 'connector', description: `Single row ${n}-pin Header`, refDesPrefix: 'J', defaultProperties: { value: `1x${n}` }, pins: createPins(n, 'left', 1) },
    { type: `header_2x${n}`, label: `Header 2x${n}`, category: 'connector', description: `Dual row ${n*2}-pin Header`, refDesPrefix: 'J', defaultProperties: { value: `2x${n}` }, pins: [ ...createPins(n, 'left', 1), ...createPins(n, 'right', n+1) ] },
  ] as CatalogEntry[]),
  { type: 'usb_c', label: 'USB-C Header', category: 'connector', description: 'USB Type-C 16-pin', refDesPrefix: 'J', defaultProperties: { value: 'USB-C' }, pins: [ ...createPins(8, 'left', 1, 'A'), ...createPins(8, 'right', 1, 'B') ] },
  { type: 'micro_usb', label: 'Micro USB', category: 'connector', description: 'Micro-B Receptacle', refDesPrefix: 'J', defaultProperties: { value: 'Micro-B' }, pins: createPins(5, 'bottom', 1) },
  { type: 'barrel_jack', label: 'DC Barrel Jack', category: 'connector', description: 'Power Jack 5.5mm', refDesPrefix: 'J', defaultProperties: { value: '5.5x2.1mm' }, pins: [{ id: 'pwr', label: 'V+', type: 'power', side: 'left' }, { id: 'gnd', label: 'GND', type: 'ground', side: 'right' }] },
  { type: 'sd_slot', label: 'MicroSD Slot', category: 'connector', description: 'MicroSD Card Reader', refDesPrefix: 'J', defaultProperties: { value: 'Push-Push' }, pins: createPins(8, 'right', 1) },
  { type: 'hdmi', label: 'HDMI Type-A', category: 'connector', description: 'HDMI Receptacle', refDesPrefix: 'J', defaultProperties: { value: 'HDMI' }, pins: [ ...createPins(10, 'left', 1), ...createPins(9, 'right', 11) ] },

  // ── Power ──────────────────────────────────────────────────────────────────
  { type: 'ldo_ams1117', label: 'AMS1117 LDO', category: 'power', description: '3.3V/5V LDO Regulator', refDesPrefix: 'U', defaultProperties: { value: '3.3V', package: 'SOT-223' }, pins: [{ id: 'in', label: 'IN', type: 'input', side: 'left' }, { id: 'out', label: 'OUT', type: 'output', side: 'right' }, { id: 'gnd', label: 'GND', type: 'ground', side: 'bottom' }] },
  { type: 'reg_7805', label: '7805 Reg', category: 'power', description: '+5V Linear Regulator', refDesPrefix: 'U', defaultProperties: { value: '5V', package: 'TO-220' }, pins: [{ id: 'in', label: 'IN', type: 'input', side: 'left' }, { id: 'out', label: 'OUT', type: 'output', side: 'right' }, { id: 'gnd', label: 'GND', type: 'ground', side: 'bottom' }] },
  { type: 'buck_mp2307', label: 'Buck Converter', category: 'power', description: 'Step-Down Module', refDesPrefix: 'PS', defaultProperties: { value: 'Adj 3A' }, pins: [{ id: 'in_p', label: 'IN+', type: 'power', side: 'left' }, { id: 'in_n', label: 'IN-', type: 'ground', side: 'left' }, { id: 'out_p', label: 'OUT+', type: 'power', side: 'right' }, { id: 'out_n', label: 'OUT-', type: 'ground', side: 'right' }] },
  { type: 'tp4056', label: 'LiPo Charger', category: 'power', description: 'TP4056 Charger IC', refDesPrefix: 'U', defaultProperties: { value: '1A' }, pins: [ ...createPins(4, 'left', 1), ...createPins(4, 'right', 5) ] },
  { type: 'battery_cr2032', label: 'CR2032 Holder', category: 'power', description: 'Coin Cell Holder', refDesPrefix: 'BT', defaultProperties: { value: '3V' }, pins: [{ id: 'pos', label: '+', type: 'power', side: 'left' }, { id: 'neg', label: '-', type: 'ground', side: 'right' }] },
  { type: 'battery_jst', label: 'LiPo JST Header', category: 'power', description: '2-pin JST-PH', refDesPrefix: 'J', defaultProperties: { value: '3.7V' }, pins: [{ id: 'pos', label: '+', type: 'power', side: 'left' }, { id: 'neg', label: '-', type: 'ground', side: 'right' }] },
  { type: 'vcc_node', label: 'VCC Rail', category: 'power', description: 'Power Net Label', refDesPrefix: 'PWR', defaultProperties: { value: '+3.3V' }, pins: [{ id: '1', label: 'VCC', type: 'power', side: 'bottom' }] },
  { type: 'gnd_node', label: 'GND Node', category: 'power', description: 'Ground Net Label', refDesPrefix: 'GND', defaultProperties: { value: 'GND' }, pins: [{ id: '1', label: 'GND', type: 'ground', side: 'top' }] },

  // ── Sensors & Misc ─────────────────────────────────────────────────────────
  { type: 'bme280', label: 'BME280 Sensor', category: 'sensor', description: 'Temp/Humid/Press I2C', refDesPrefix: 'U', defaultProperties: { value: 'I2C' }, pins: createPins(4, 'bottom', 1) },
  { type: 'mpu6050', label: 'MPU6050 IMU', category: 'sensor', description: '6-Axis Accel/Gyro', refDesPrefix: 'U', defaultProperties: { value: 'I2C' }, pins: [ ...createPins(4, 'left', 1), ...createPins(4, 'right', 5) ] },
  { type: 'oled_128x64', label: 'OLED 0.96"', category: 'sensor', description: '128x64 I2C Display', refDesPrefix: 'DISP', defaultProperties: { value: 'SSD1306' }, pins: createPins(4, 'top', 1) },
  { type: 'lcd_1602', label: 'LCD 16x2 I2C', category: 'sensor', description: 'Alpha-numeric Display', refDesPrefix: 'DISP', defaultProperties: { value: 'PCF8574' }, pins: createPins(4, 'top', 1) },
  { type: 'encoder', label: 'Rotary Encoder', category: 'sensor', description: 'Quadrature Encoder', refDesPrefix: 'SW', defaultProperties: { value: 'EC11' }, pins: [ ...createPins(3, 'left', 1), ...createPins(2, 'right', 4) ] },
  { type: 'hcsr04', label: 'HC-SR04', category: 'sensor', description: 'Ultrasonic Distance', refDesPrefix: 'U', defaultProperties: { value: 'Sonar' }, pins: createPins(4, 'bottom', 1) },
  { type: 'dht22', label: 'DHT22 Sensor', category: 'sensor', description: 'High Precision Temp/Humid', refDesPrefix: 'U', defaultProperties: { value: 'Digital' }, pins: createPins(4, 'bottom', 1) },
  { type: 'relay_spdt', label: 'Relay (SPDT)', category: 'sensor', description: '5V Signal Relay', refDesPrefix: 'K', defaultProperties: { value: '5V' }, pins: [ ...createPins(2, 'left', 1), ...createPins(3, 'right', 3) ] },
  { type: 'buzzer', label: 'Buzzer (Active)', category: 'sensor', description: '5V Piezo Buzzer', refDesPrefix: 'BZ', defaultProperties: { value: '5V' }, pins: [{ id: '1', label: '+', type: 'input', side: 'left' }, { id: '2', label: '-', type: 'ground', side: 'right' }] },

  // ── Boards (Templates) ─────────────────────────────────────────────────────
  { type: 'board_custom', label: 'Custom Board', category: 'board', description: 'Resizable PCB Outline', refDesPrefix: 'BRD', defaultProperties: { width: 800, height: 600, outline: 'rectangular' }, pins: [] },
  { type: 'board_100x100', label: 'Standard 100x100mm', category: 'board', description: 'Standard Eurocard size', refDesPrefix: 'BRD', defaultProperties: { width: 1000, height: 1000, outline: 'rectangular' }, pins: [] },
  { type: 'board_50x50', label: 'Standard 50x50mm', category: 'board', description: 'Small square board', refDesPrefix: 'BRD', defaultProperties: { width: 500, height: 500, outline: 'rectangular' }, pins: [] },
  { type: 'board_uno', label: 'Arduino Uno Shield', category: 'board', description: 'Uno compatible outline', refDesPrefix: 'BRD', defaultProperties: { width: 686, height: 533, outline: 'uno' }, pins: [] },
  { type: 'board_mega', label: 'Arduino Mega Shield', category: 'board', description: 'Mega compatible outline', refDesPrefix: 'BRD', defaultProperties: { width: 1016, height: 533, outline: 'mega' }, pins: [] },
  { type: 'board_hat', label: 'RPi HAT', category: 'board', description: 'Raspberry Pi HAT outline', refDesPrefix: 'BRD', defaultProperties: { width: 650, height: 560, outline: 'hat' }, pins: [] },
  { type: 'copper_pour', label: 'Copper Pour', category: 'board', description: 'Ground/Power Plane Area', refDesPrefix: 'POUR', defaultProperties: { width: 400, height: 400, net: 'GND' }, pins: [{ id: 'gnd', label: 'GND', type: 'ground', side: 'top' }] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getCatalogEntry(type: string): CatalogEntry | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}

export function getCatalogByCategory(category: ComponentCategory): CatalogEntry[] {
  return COMPONENT_CATALOG.filter(c => c.category === category);
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  passive: 'Passive Components',
  active: 'Active Semiconductors',
  ic: 'ICs & Digital',
  connector: 'Connectors',
  power: 'Power & Ground',
  sensor: 'Sensors & Misc',
  board: 'PCB Boards',
};

export const CATEGORY_ORDER: ComponentCategory[] = ['board', 'passive', 'active', 'ic', 'connector', 'power', 'sensor'];
