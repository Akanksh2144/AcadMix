import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

// An arrow representing an E or B field vector
function VectorArrow({ position, direction, length, color, isElectric }: any) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      // Dynamic scaling based on length
      meshRef.current.scale.set(1, Math.max(0.01, Math.abs(length)), 1);
      // Flip if negative
      if (length < 0) {
        meshRef.current.rotation.x = isElectric ? Math.PI : Math.PI / 2;
        meshRef.current.rotation.z = Math.PI; // Correct arrow head
      } else {
        meshRef.current.rotation.x = isElectric ? 0 : Math.PI / 2;
        meshRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Shaft */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function WaveAnimation({ frequency = 1 }: { frequency?: number }) {
  const points = 40;
  const length = 20;
  const zStep = length / points;

  // We'll pass the animated length to each arrow via refs, but for React-Three-Fiber
  // it's easier to animate the whole group or individual elements inside a useFrame loop
  
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * frequency;
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        // We have two children per z-step (Electric and Magnetic)
        const zIndex = Math.floor(i / 2);
        const zPos = (zIndex * zStep) - (length / 2);
        
        // kz - wt
        const phase = (2 * Math.PI * (zPos / length) * 4) - t; 
        const val = Math.sin(phase) * 2;
        
        // Scale child
        child.scale.set(1, Math.max(0.01, Math.abs(val)), 1);
        
        // Flip direction if negative
        const isE = i % 2 === 0;
        if (val < 0) {
          child.rotation.x = isE ? Math.PI : -Math.PI / 2;
        } else {
          child.rotation.x = isE ? 0 : Math.PI / 2;
        }
      });
    }
  });

  const arrows = useMemo(() => {
    const arr = [];
    for (let i = 0; i < points; i++) {
      const zPos = (i * zStep) - (length / 2);
      // E Field (Red, pointing Y)
      arr.push(
        <group key={`e-${i}`} position={[0, 0, zPos]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#f43f5e" />
          </mesh>
        </group>
      );
      // B Field (Blue, pointing X)
      arr.push(
        <group key={`b-${i}`} position={[0, 0, zPos]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      );
    }
    return arr;
  }, [points, zStep, length]);

  return <group ref={groupRef}>{arrows}</group>;
}

export default function EM3DVisualizer() {
  const [speed, setSpeed] = React.useState(2);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [5, 5, 10], fov: 45 }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          <WaveAnimation frequency={speed} />
          
          {/* Axis Labels */}
          <Text position={[0, 3, 0]} color="#f43f5e" fontSize={0.5}>E Field (y)</Text>
          <Text position={[3, 0, 0]} color="#3b82f6" fontSize={0.5}>H Field (x)</Text>
          <Text position={[0, -0.5, 10]} color="#10b981" fontSize={0.5}>Propagation (z)</Text>

          <Grid 
            infiniteGrid 
            fadeDistance={30} 
            sectionColor="#334155" 
            cellColor="#1e293b" 
            position={[0, -2.5, 0]} 
          />
          <OrbitControls autoRotate autoRotateSpeed={0.5} />
        </Canvas>

        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 w-64 flex flex-col gap-4 text-white shadow-xl">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">3D Wave Controls</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Propagation Speed</span>
              <span className="font-mono text-emerald-400">{speed}x</span>
            </label>
            <input 
              type="range" 
              min="0" max="10" step="0.5"
              value={speed} 
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            This visualizes a plane electromagnetic wave. The Electric (Red) and Magnetic (Blue) fields are orthogonal to each other and to the direction of propagation (Z-axis).
          </p>
        </div>
      </div>
    </div>
  );
}
