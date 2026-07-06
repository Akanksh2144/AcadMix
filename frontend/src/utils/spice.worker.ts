import { Simulation } from 'eecircuit-engine';

// Emscripten standard output captures
let capturedStdout = '';
let capturedStderr = '';

self.onmessage = async (e) => {
  const { code } = e.data;
  capturedStdout = '';
  capturedStderr = '';

  try {
    const sim = new Simulation();
    
    // Override spiceModule loggers if possible to capture warnings/errors
    const spiceModule = sim.__getSpiceModuleForTests() as any;
    if (spiceModule) {
      spiceModule.print = (text: string) => {
        capturedStdout += text + '\n';
      };
      spiceModule.printErr = (text: string) => {
        capturedStderr += text + '\n';
      };
    }

    await sim.start();
    sim.setNetList(code);
    const res = await sim.runSim();
    
    // If the library returns result with stdout or we captured it, attach it
    const finalResult = {
      ...res,
      stdout: (res as any).stdout || capturedStdout,
      stderr: (res as any).stderr || capturedStderr
    };

    self.postMessage({ success: true, result: finalResult });
  } catch (err: any) {
    self.postMessage({ 
      success: false, 
      error: err.message || String(err),
      stdout: capturedStdout,
      stderr: capturedStderr
    });
  }
};
