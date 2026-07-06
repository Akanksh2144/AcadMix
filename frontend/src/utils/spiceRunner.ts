// @ts-ignore
import SpiceWorker from './spice.worker?worker';

export function runSpiceSimulation(code: string, timeoutMs: number = 15000): Promise<any> {
  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    
    const timer = setTimeout(() => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      reject(new Error(`Simulation timed out after ${timeoutMs / 1000} seconds. Ensure your circuit topology is correct, has a path to ground, and does not contain floating nodes.`));
    }, timeoutMs);

    try {
      worker = new SpiceWorker();
      
      worker.onmessage = (event) => {
        clearTimeout(timer);
        const { success, result, error, stdout, stderr } = event.data;
        if (worker) {
          worker.terminate();
          worker = null;
        }
        if (success) {
          resolve(result);
        } else {
          const errMsg = error || 'Simulation failed';
          const logs = [stdout, stderr].filter(Boolean).join('\n');
          reject(new Error(logs ? `${errMsg}\n\nSimulation Log:\n${logs}` : errMsg));
        }
      };

      worker.onerror = (err) => {
        clearTimeout(timer);
        if (worker) {
          worker.terminate();
          worker = null;
        }
        reject(new Error(err.message || 'Simulation worker error'));
      };

      worker.postMessage({ code });
    } catch (err: any) {
      clearTimeout(timer);
      if (worker) {
        worker.terminate();
      }
      reject(err);
    }
  });
}
