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
  // Downsampler / Upsampler
  factor?: number;
  // Comparator
  threshold?: number;
  // AM Modulator
  carrierFreq?: number;
  modulationIndex?: number;
  // Phase Shifter
  phaseDeg?: number;
  // Quantizer
  bits?: number;
  // Chirp Generator
  startFreq?: number;
  endFreq?: number;
  // Impulse Generator
  position?: number;
  // Moving Average
  windowSize?: number;
  // Scope / FFT / Power Meter — visualizers
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
      case 'chirpGenerator': {
        const f0 = node.data.startFreq ?? 1;
        const f1 = node.data.endFreq ?? 50;
        const amp = node.data.amplitude ?? 1;
        const out = new Float64Array(N);
        for (let i = 0; i < N; i++) {
          const t = i * dt;
          // Linear chirp: instantaneous freq = f0 + (f1-f0)*t/T
          const freq = f0 + (f1 - f0) * t / (N * dt);
          const phase = 2 * Math.PI * (f0 * t + (f1 - f0) * t * t / (2 * N * dt));
          out[i] = amp * Math.sin(phase);
        }
        signals[id] = out;
        break;
      }
      case 'impulseGenerator': {
        const amp = node.data.amplitude ?? 1;
        const pos = node.data.position ?? 0;
        const out = new Float64Array(N);
        if (pos >= 0 && pos < N) out[pos] = amp;
        signals[id] = out;
        break;
      }
      case 'subtractor': {
        // A - B: first input is A, second is B
        const out = new Float64Array(N);
        if (inputs.length >= 2) {
          for (let i = 0; i < N; i++) out[i] = inputs[0][i] - inputs[1][i];
        } else if (inputs.length === 1) {
          for (let i = 0; i < N; i++) out[i] = inputs[0][i];
        }
        signals[id] = out;
        break;
      }
      case 'absValue': {
        if (inputs.length > 0) {
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) out[i] = Math.abs(inputs[0][i]);
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'integrator': {
        if (inputs.length > 0) {
          const out = new Float64Array(N);
          let acc = 0;
          for (let i = 0; i < N; i++) {
            acc += inputs[0][i] * dt;
            out[i] = acc;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'upsampler': {
        if (inputs.length > 0) {
          const f = node.data.factor ?? 2;
          const out = new Float64Array(N);
          // Insert zeros between samples
          for (let i = 0; i < N; i++) {
            out[i] = (i % f === 0) ? inputs[0][Math.floor(i / f)] || 0 : 0;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'phaseShifter': {
        if (inputs.length > 0) {
          const phaseRad = ((node.data.phaseDeg ?? 90) * Math.PI) / 180;
          const phaseSamples = Math.round((phaseRad / (2 * Math.PI)) * N);
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            const srcIdx = (i - phaseSamples + N) % N;
            out[i] = inputs[0][srcIdx];
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'amModulator': {
        if (inputs.length > 0) {
          const fc = node.data.carrierFreq ?? 50;
          const m = node.data.modulationIndex ?? 0.8;
          const out = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            const t = i * dt;
            const carrier = Math.cos(2 * Math.PI * fc * t);
            // Standard AM: s(t) = [1 + m * x(t)] * cos(2πfct)
            out[i] = (1 + m * inputs[0][i]) * carrier;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'quantizer': {
        if (inputs.length > 0) {
          const bits = node.data.bits ?? 4;
          const levels = Math.pow(2, bits);
          const out = new Float64Array(N);
          // Find signal range for mid-riser quantization
          let minVal = Infinity, maxVal = -Infinity;
          for (let i = 0; i < N; i++) {
            if (inputs[0][i] < minVal) minVal = inputs[0][i];
            if (inputs[0][i] > maxVal) maxVal = inputs[0][i];
          }
          const range = maxVal - minVal || 1;
          const step = range / levels;
          for (let i = 0; i < N; i++) {
            const normalised = (inputs[0][i] - minVal) / range;
            const level = Math.floor(normalised * levels);
            const clamped = Math.min(level, levels - 1);
            out[i] = minVal + (clamped + 0.5) * step;
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'movingAverage': {
        if (inputs.length > 0) {
          const w = node.data.windowSize ?? 8;
          const out = new Float64Array(N);
          let sum = 0;
          for (let i = 0; i < N; i++) {
            sum += inputs[0][i];
            if (i >= w) sum -= inputs[0][i - w];
            out[i] = sum / Math.min(i + 1, w);
          }
          signals[id] = out;
        } else {
          signals[id] = new Float64Array(N);
        }
        break;
      }
      case 'mixer': {
        // Same as multiplier — kept as an alias for clarity in comms context
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
      case 'scope':
      case 'fft':
      case 'powerMeter': {
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
