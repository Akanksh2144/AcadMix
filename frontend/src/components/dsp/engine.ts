/**
 * DSP Engine — Client-side signal processing pipeline.
 *
 * Processes a React Flow graph: generates signals at source nodes,
 * propagates them through processing nodes (gain, add, filter),
 * and returns result buffers for scope visualisation.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface DSPNodeData {
  label: string;
  // Signal Generator
  waveform?: 'sine' | 'square' | 'sawtooth' | 'triangle';
  frequency?: number;   // Hz
  amplitude?: number;   // peak value
  dcOffset?: number;
  // Gain
  gain?: number;
  // Filter
  filterType?: 'lowpass' | 'highpass';
  cutoff?: number;      // normalised 0-1
  // Noise Generator
  noiseType?: 'white' | 'gaussian';
  // Delay
  delaySamples?: number;
  // Constant / DC Source
  value?: number;
  // Downsampler
  factor?: number;
  // Comparator
  threshold?: number;
  // Scope / FFT — no extra config; they render what they receive
}

export interface SimulationResult {
  /** node-id → Float64Array of computed samples */
  signals: Record<string, Float64Array>;
  /** time axis shared by all signals */
  time: Float64Array;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 1024;   // samples
const DURATION    = 1;      // seconds  → 1024 total samples

// ── Signal generation ────────────────────────────────────────────────────────

function generateSignal(
  waveform: string,
  freq: number,
  amp: number,
  dc: number,
  N: number,
  dt: number,
): Float64Array {
  const buf = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const t = i * dt;
    const phase = 2 * Math.PI * freq * t;
    switch (waveform) {
      case 'sine':
        buf[i] = dc + amp * Math.sin(phase);
        break;
      case 'square':
        buf[i] = dc + amp * (Math.sin(phase) >= 0 ? 1 : -1);
        break;
      case 'sawtooth':
        buf[i] = dc + amp * (2 * ((freq * t) % 1) - 1);
        break;
      case 'triangle': {
        const p = ((freq * t) % 1);
        buf[i] = dc + amp * (p < 0.5 ? 4 * p - 1 : 3 - 4 * p);
        break;
      }
      default:
        buf[i] = dc;
    }
  }
  return buf;
}

// ── Simple FIR filter (windowed sinc) ────────────────────────────────────────

function firLowPass(signal: Float64Array, cutoff: number): Float64Array {
  const order = 31;
  const half  = (order - 1) / 2;
  const kernel = new Float64Array(order);
  let sum = 0;
  for (let i = 0; i < order; i++) {
    const n = i - half;
    if (n === 0) {
      kernel[i] = 2 * cutoff;
    } else {
      kernel[i] = Math.sin(2 * Math.PI * cutoff * n) / (Math.PI * n);
    }
    // Hamming window
    kernel[i] *= 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (order - 1));
    sum += kernel[i];
  }
  // Normalise
  for (let i = 0; i < order; i++) kernel[i] /= sum;

  const out = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    let acc = 0;
    for (let j = 0; j < order; j++) {
      const idx = i - j;
      acc += kernel[j] * (idx >= 0 ? signal[idx] : 0);
    }
    out[i] = acc;
  }
  return out;
}

function firHighPass(signal: Float64Array, cutoff: number): Float64Array {
  const lp = firLowPass(signal, cutoff);
  const out = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    out[i] = signal[i] - lp[i];
  }
  return out;
}

// ── Graph traversal & execution ──────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: string;
  data: DSPNodeData;
}
interface GraphEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Topologically sort nodes then evaluate each one.
 * Returns signals keyed by node ID.
 */
export function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
): SimulationResult {
  const N  = SAMPLE_RATE;
  const dt = DURATION / N;

  // Build adjacency: target → [source signals]
  const inbound: Record<string, string[]> = {};
  for (const e of edges) {
    if (!inbound[e.target]) inbound[e.target] = [];
    inbound[e.target].push(e.source);
  }

  // Topological sort (Kahn's algorithm)
  const indegree: Record<string, number> = {};
  for (const n of nodes) indegree[n.id] = 0;
  for (const e of edges) indegree[e.target] = (indegree[e.target] || 0) + 1;

  const queue: string[] = [];
  for (const n of nodes) {
    if (indegree[n.id] === 0) queue.push(n.id);
  }

  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of edges) {
      if (e.source === id) {
        indegree[e.target]--;
        if (indegree[e.target] === 0) queue.push(e.target);
      }
    }
  }

  // Evaluate
  const nodeMap: Record<string, GraphNode> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const signals: Record<string, Float64Array> = {};

  for (const id of order) {
    const node = nodeMap[id];
    if (!node) continue;

    const inputs = (inbound[id] || []).map((srcId) => signals[srcId]).filter(Boolean);

    switch (node.type) {
      case 'signalGenerator': {
        const { waveform = 'sine', frequency = 5, amplitude = 1, dcOffset = 0 } = node.data;
        signals[id] = generateSignal(waveform, frequency, amplitude, dcOffset, N, dt);
        break;
      }
      case 'noiseGenerator': {
        const amp = node.data.amplitude ?? 0.5;
        const isGaussian = node.data.noiseType === 'gaussian';
        const out = new Float64Array(N);
        for (let i = 0; i < N; i++) {
          if (isGaussian) {
            // Box-Muller transform for Gaussian noise
            const u1 = Math.random();
            const u2 = Math.random();
            out[i] = amp * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          } else {
            out[i] = amp * (2 * Math.random() - 1);
          }
        }
        signals[id] = out;
        break;
      }
      case 'constant': {
        const val = node.data.value ?? 1;
        const out = new Float64Array(N);
        for (let i = 0; i < N; i++) out[i] = val;
        signals[id] = out;
        break;
      }
      case 'adder': {
        const out = new Float64Array(N);
        for (const inp of inputs) {
          for (let i = 0; i < N; i++) out[i] += inp[i];
        }
        signals[id] = out;
        break;
      }
      case 'multiplier': {
        if (inputs.length >= 2) {
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) out[i] = inputs[0][i] * inputs[1][i];
          signals[id] = out;
        } else if (inputs.length === 1) {
          signals[id] = inputs[0].slice();
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'gain': {
        const g = node.data.gain ?? 1;
        if (inputs.length > 0) {
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) out[i] = inputs[0][i] * g;
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'filter': {
        if (inputs.length > 0) {
          const c = node.data.cutoff ?? 0.2;
          signals[id] = node.data.filterType === 'highpass'
            ? firHighPass(inputs[0], c)
            : firLowPass(inputs[0], c);
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'delay': {
        if (inputs.length > 0) {
          const d = node.data.delaySamples ?? 50;
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            const srcIdx = i - d;
            out[i] = srcIdx >= 0 ? inputs[0][srcIdx] : 0;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'downsampler': {
        if (inputs.length > 0) {
          const f = node.data.factor ?? 2;
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            // Zero-order hold: keep the value from the last sampled point
            const srcIdx = Math.floor(i / f) * f;
            out[i] = srcIdx < N ? inputs[0][srcIdx] : 0;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'comparator': {
        if (inputs.length > 0) {
          const thresh = node.data.threshold ?? 0;
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            out[i] = inputs[0][i] > thresh ? 1 : 0;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'splitter': {
        // Pass-through — the signal is available at this node ID for any outputs
        signals[id] = inputs.length > 0 ? inputs[0].slice() : new Float64Array(N);
        break;
      }
      case 'scope':
      case 'fft': {
        // Pass-through — just copy the first input for visualisation
        signals[id] = inputs.length > 0 ? inputs[0] : new Float64Array(N);
        break;
      }
      default:
        signals[id] = new Float64Array(N);
    }
  }

  // Build shared time axis
  const time = new Float64Array(N);
  for (let i = 0; i < N; i++) time[i] = i * dt;

  return { signals, time };
}
