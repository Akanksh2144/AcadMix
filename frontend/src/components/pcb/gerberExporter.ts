import type { CircuitGraph } from './types';

export interface GerberFiles {
  topCopper: string;
  bottomCopper: string;
  drill: string;
  outline: string;
}

export function exportGerbers(graph: CircuitGraph): GerberFiles {
  const date = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  
  // Standard RS-274X Header
  const header = `G04 AcadMix PCB Studio - Gerber RS-274X Export*
%TF.GenerationSoftware,AcadMix,PCBStudio,1.0*%
%TF.CreationDate,${date}*%
%FSLAX34Y34*%
%MOMM*%
%LPD*%
%INAcadMix_PCB*%
`;

  // Macro for generic circular pad
  const apertures = `
%ADD10C,1.500000*%
%ADD11C,0.800000*%
%ADD12C,0.400000*%
`;

  let topDraw = '';
  let botDraw = '';
  let outlineDraw = '';
  let drillDraw = 'M48\nMETRIC,TZ\nT1C0.8\nT2C0.4\n%\n';

  // Extract edges (traces)
  graph.wires.forEach((wire) => {
    // In a real scenario we need the actual screen coordinates of the edge path
    // For now, this is a placeholder macro representing the presence of a trace.
    topDraw += `G04 Trace ${wire.id}*\n`;
  });

  // Extract components & vias
  graph.components.forEach((comp) => {
    if (comp.type === 'board_custom' || comp.type.startsWith('board_')) {
      const w = comp.properties.width || 800;
      const h = comp.properties.height || 600;
      // Draw a simple rectangular outline
      outlineDraw += `D10*\nX0000Y0000D02*\nX${w}000Y0000D01*\nX${w}000Y${h}000D01*\nX0000Y${h}000D01*\nX0000Y0000D01*\n`;
    } else if (comp.type === 'via') {
      const x = Math.round(comp.position.x * 1000);
      const y = Math.round(comp.position.y * 1000);
      topDraw += `D12*\nX${x}Y${y}D03*\n`;
      botDraw += `D12*\nX${x}Y${y}D03*\n`;
      drillDraw += `T2\nX${x}Y${y}\n`;
    } else {
      // Standard component pad placeholder
      const x = Math.round(comp.position.x * 1000);
      const y = Math.round(comp.position.y * 1000);
      topDraw += `D10*\nX${x}Y${y}D03*\n`;
      drillDraw += `T1\nX${x}Y${y}\n`;
    }
  });

  return {
    topCopper: header + apertures + topDraw + 'M02*\n',
    bottomCopper: header + apertures + botDraw + 'M02*\n',
    outline: header + apertures + outlineDraw + 'M02*\n',
    drill: drillDraw + 'M30\n'
  };
}
