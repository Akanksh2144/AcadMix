import type { VLSIComponent, ComponentCategory } from './types';
import componentsData from './components.json';

export const CATEGORY_ORDER: ComponentCategory[] = [
  'io', 'gates', 'flipflops', 'combinational', 'arithmetic', 'sequential_adv', 
  'memory', 'display', 'timing', 'communication', 'interface', 'processor', 'dsp', 'testing', 'annotation'
];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  io: 'Inputs & Outputs',
  gates: 'Logic Gates',
  flipflops: 'Flip-Flops & Latches',
  combinational: 'Combinational Logic',
  arithmetic: 'Arithmetic Blocks',
  sequential_adv: 'Advanced Sequential',
  memory: 'Memory Elements',
  display: 'Output Displays',
  timing: 'Timing & Clock',
  communication: 'Communication',
  interface: 'I/O Interface',
  processor: 'Microprocessors',
  dsp: 'Digital Signal Processing',
  testing: 'Testing & Verification',
  annotation: 'Annotations & Labels',
};

export const COMPONENT_CATALOG: VLSIComponent[] = componentsData as VLSIComponent[];

export function getCatalogEntry(type: string): VLSIComponent | undefined {
  return COMPONENT_CATALOG.find(c => c.type === type);
}
