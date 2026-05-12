import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Box, Line } from '@react-three/drei';
import type { CircuitGraph } from './types';
import { getCatalogEntry } from './componentCatalog';

interface PCB3DViewerProps {
  graph: CircuitGraph;
}

export default function PCB3DViewer({ graph }: PCB3DViewerProps) {
  // Find board dimensions
  const boardNode = graph.components.find(c => c.type === 'board_custom' || c.type.startsWith('board_'));
  const width = boardNode?.properties.width || 800;
  const height = boardNode?.properties.height || 600;
  
  // Scale down heavily for 3D view (React Flow pixels to 3D units)
  const SCALE = 0.05;
  const w = width * SCALE;
  const h = height * SCALE;
  const thickness = 1.6 * SCALE * 10; // Standard 1.6mm thickness, exaggerated slightly for visibility

  // Center offset
  const offsetX = -w / 2;
  const offsetY = -h / 2;

  const components = useMemo(() => {
    return graph.components.filter(c => c.id !== boardNode?.id && !['vcc', 'gnd'].includes(c.type)).map(c => {
      const catalog = getCatalogEntry(c.type);
      // Rough approximation of component sizes based on category/type
      let cw = 10 * SCALE;
      let ch = 10 * SCALE;
      let depth = 5 * SCALE;
      let color = '#333333';

      if (catalog?.category === 'ic') { cw = 30 * SCALE; ch = 30 * SCALE; depth = 4 * SCALE; color = '#1a1a1a'; }
      if (catalog?.category === 'passive') { cw = 6 * SCALE; ch = 4 * SCALE; depth = 2 * SCALE; color = '#d4d4d4'; }
      if (catalog?.category === 'connector') { cw = 20 * SCALE; ch = 15 * SCALE; depth = 10 * SCALE; color = '#e5e7eb'; }

      // Map 2D coordinate to 3D. React Flow Y is down, 3D Z is depth. We put board on X-Z plane.
      // So RF X -> 3D X, RF Y -> 3D Z.
      // Adjusting relative to board center
      let posX = (c.position.x * SCALE) + offsetX;
      let posZ = (c.position.y * SCALE) + offsetY;

      // Adjust for board relative position (React Flow child nodes are absolute if no parent, but here we assume absolute)
      if (boardNode) {
         posX = ((c.position.x - boardNode.position.x) * SCALE) + offsetX;
         posZ = ((c.position.y - boardNode.position.y) * SCALE) + offsetY;
      }

      return (
        <group key={c.id} position={[posX, thickness / 2 + depth / 2, posZ]}>
          <Box args={[cw, depth, ch]} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
          </Box>
        </group>
      );
    });
  }, [graph.components, boardNode, offsetX, offsetY, thickness]);

  return (
    <div className="w-full h-full relative bg-gray-900">
      <Canvas shadows camera={{ position: [0, w, h], fov: 45 }}>
        <color attach="background" args={['#111827']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment preset="city" />

        {/* Board Substrate */}
        <group position={[0, 0, 0]}>
          <Box args={[w, thickness, h]} castShadow receiveShadow>
            <meshStandardMaterial color="#06301A" roughness={0.8} metalness={0.1} />
          </Box>
          
          {/* Silkscreen Grid / Decals could go here as textures */}
          
          {/* Components */}
          {components}
        </group>

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} />
        <ContactShadows position={[0, -thickness, 0]} opacity={0.5} scale={100} blur={2} far={10} />
      </Canvas>
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur text-white px-4 py-2 rounded-lg border border-gray-700 text-xs font-mono">
        Left Click + Drag: Rotate | Scroll: Zoom | Right Click + Drag: Pan
      </div>
    </div>
  );
}
