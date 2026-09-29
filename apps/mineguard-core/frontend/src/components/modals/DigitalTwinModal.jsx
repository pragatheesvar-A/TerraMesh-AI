import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { 
  X, Box, Sliders, ZoomIn, ZoomOut
} from 'lucide-react';
import { useMineData } from '../../context/MineDataContext';

// --------------------------------------------------------
// GEOLOGICAL LAYERS (TERRAIN, COAL SEAM, SUBSIDENCE)
// --------------------------------------------------------

const TerrainMesh = ({ visible }) => {
  const meshRef = useRef();
  
  // Create a DEM-like terrain using plane geometry and modifying vertices
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(800, 800, 64, 64);
    geo.rotateX(-Math.PI / 2); // Lay flat
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Generate some mountain-like procedural noise
      const dist = Math.sqrt(x*x + z*z);
      let y = 150 * Math.exp(-(dist*dist) / 40000); // Main peak
      y += 20 * Math.sin(x * 0.02) * Math.cos(z * 0.02); // Ridges
      y += 10 * Math.sin(x * 0.05); // Micro noise
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  if (!visible) return null;

  return (
    <group position={[0, 100, 0]}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#1E293B" // Dark slate/charcoal
          roughness={0.9}
          metalness={0.1}
          wireframe={false}
          transparent
          opacity={0.85}
          depthWrite={true}
        />
      </mesh>
      {/* Topographic grid overlay */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#0F172A"
          wireframe={true}
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Mountain Peak Label */}
      <Html position={[0, 180, 0]} center>
        <div className="flex flex-col items-center pointer-events-none whitespace-nowrap">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mb-1" />
          <div className="text-[10px] font-mono font-bold text-emerald-100 bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-900/50">
            MT. JHARIA RANGE
          </div>
        </div>
      </Html>
    </group>
  );
};

const StrataLayers = ({ visible, subsidenceVisible, deformation }) => {
  if (!visible) return null;
  
  // Calculate subsidence morph target depth
  const dip = 1.42 * (1 + deformation / 100) * 10; // Scaled for visual
  
  return (
    <group>
      {/* Sandstone Layer */}
      <mesh position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html position={[-300, 20, 0]} center>
        <div className="text-[9px] font-mono font-bold text-slate-400">SANDSTONE STRATA</div>
      </Html>

      {/* Coal Seam */}
      <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 600, 32, 32]} />
        <meshStandardMaterial color="#0F172A" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[-300, -60, 0]} center>
        <div className="text-[9px] font-bold font-mono text-cyan-600 bg-cyan-950/40 px-1 rounded">COAL SEAM</div>
      </Html>
      
      {/* Subsidence Bowl */}
      {subsidenceVisible && (
        <group position={[50, -60, 20]}>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
            {/* Creates a bowl-like depression */}
            <circleGeometry args={[120, 32]} />
            <meshBasicMaterial 
              color={deformation > 25 ? "#EF4444" : "#F59E0B"} 
              transparent 
              opacity={0.3} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          <mesh rotation={[-Math.PI/2, 0, 0]}>
            <circleGeometry args={[80, 32]} />
            <meshBasicMaterial 
              color={deformation > 25 ? "#DC2626" : "#D97706"} 
              transparent 
              opacity={0.5} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          
          <Html position={[0, -dip - 10, 0]} center>
            <div className="flex flex-col items-center pointer-events-none whitespace-nowrap">
              <div className="w-px h-8 bg-red-500/50" />
              <div className="text-[9px] font-mono font-bold text-red-200 bg-red-950/80 px-1.5 py-0.5 border border-red-500/50 rounded mt-1">
                ▼ DEFORMATION: -{(14.2 * (1 + deformation/100)).toFixed(1)}mm
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

// --------------------------------------------------------
// INFRASTRUCTURE (SHAFTS, TUNNELS, BOREHOLES)
// --------------------------------------------------------

const Infrastructure = ({ tunnelsVisible, sensorsVisible, faultsVisible, deformation }) => {
  // Main Shaft
  const shaftTop = 150; // On terrain
  const shaftBot = -120;
  
  // Tunnels (Main Drift + Crosscuts)
  const tunnelPoints = [
    new THREE.Vector3(-150, shaftBot, 50),
    new THREE.Vector3(-100, -100, 50),
    new THREE.Vector3(0, -100, 0),
    new THREE.Vector3(120, -100, 40),
    new THREE.Vector3(200, -100, 40)
  ];

  return (
    <group>
      {/* Pithead Shaft */}
      <group position={[-150, (shaftTop + shaftBot)/2, 50]}>
        <mesh>
          <cylinderGeometry args={[8, 8, shaftTop - shaftBot, 16]} />
          <meshStandardMaterial color="#64748B" roughness={0.7} metalness={0.5} />
        </mesh>
        <Html position={[0, (shaftTop - shaftBot)/2 + 20, 0]} center>
          <div className="text-[10px] font-mono font-bold text-white bg-slate-800/90 px-2 py-1 rounded border border-slate-600 shadow-lg pointer-events-none whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-400 rounded-sm" />
              PITHEAD SHAFT 01
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Depth: 412m</div>
          </div>
        </Html>
      </group>

      {/* Decline Tunnel to Coal Seam */}
      {tunnelsVisible && (
        <group>
          {/* Main Drift Tube */}
          <mesh>
            <tubeGeometry args={[new THREE.CatmullRomCurve3(tunnelPoints), 64, 4, 8, false]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          
          {/* Evacuation Route Glow Line */}
          <Line
            points={tunnelPoints}
            color="#10B981"
            lineWidth={3}
            dashed={false}
          />
          <Html position={[120, -85, 40]} center>
            <div className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-800/50 rounded pointer-events-none flex items-center gap-1 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              ROUTE B (SAFE ESCAPE)
            </div>
          </Html>
        </group>
      )}

      {/* Boreholes & Sensors */}
      {sensorsVisible && (
        <group>
          {/* Borehole 03 */}
          <group position={[50, 40, 20]}>
            <mesh>
              <cylinderGeometry args={[1, 1, 200, 8]} />
              <meshStandardMaterial color="#94A3B8" />
            </mesh>
            <Html position={[0, 110, 0]} center>
              <div className="text-[9px] font-mono font-bold text-slate-300 bg-[#0B0F17]/90 px-2 py-1 rounded border border-slate-700 w-32">
                <div className="text-white border-b border-slate-700 pb-0.5 mb-0.5">BOREHOLE 03</div>
                <div className="flex justify-between"><span>Depth:</span><span>428m</span></div>
                <div className="flex justify-between"><span>Tilt:</span><span>4.8°</span></div>
              </div>
            </Html>
            
            {/* Sensor Node attached to borehole */}
            <mesh position={[0, -90, 0]}>
              <boxGeometry args={[4, 6, 4]} />
              <meshStandardMaterial color="#EF4444" />
              <pointLight color="#EF4444" intensity={2} distance={30} />
              <Html position={[8, 0, 0]}>
                <div className="text-[9px] font-mono font-bold text-red-400 bg-red-950/90 px-1.5 py-0.5 border border-red-500/50 rounded whitespace-nowrap">
                  ● NODE-017 (CRITICAL)
                  <br />
                  <span className="text-white">Disp: {(14.2 * (1 + deformation/100)).toFixed(1)}mm</span>
                </div>
              </Html>
            </mesh>
          </group>

          {/* Additional Node on Tunnel */}
          <mesh position={[100, -100, 40]}>
            <boxGeometry args={[3, 3, 3]} />
            <meshStandardMaterial color="#06B6D4" />
            <Html position={[8, 10, 0]}>
              <div className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/90 px-1.5 py-0.5 border border-cyan-800/50 rounded whitespace-nowrap">
                ● NODE-016
                <br />
                <span className="text-slate-300">Disp: 2.1mm</span>
              </div>
            </Html>
          </mesh>
        </group>
      )}

      {/* Fault Planes */}
      {faultsVisible && (
        <group position={[80, -40, -50]} rotation={[0, Math.PI / 6, Math.PI / 8]}>
          <mesh>
            <planeGeometry args={[300, 200]} />
            <meshStandardMaterial color="#F43F5E" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh>
            <planeGeometry args={[300, 200]} />
            <meshBasicMaterial color="#BE123C" wireframe transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 100, 0]} center>
            <div className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1 rounded border border-rose-900/50 whitespace-nowrap">
              FAULT F-03 (STRIKE 127°)
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

// --------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------

export default function DigitalTwinModal({ isOpen, onClose }) {
  const { sensors, workers, selectSensorNode } = useMineData();

  const [deformation, setDeformation] = useState(20);
  const [activePreset, setActivePreset] = useState('ISOMETRIC');
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  const [layers, setLayers] = useState({
    surface: true,
    subsidence: true,
    coalSeam: true,
    tunnels: true,
    sensors: true,
    faults: true,
  });

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (!controlsRef.current || !cameraRef.current) return;
    
    // Smoothly animate camera (basic instant jump for simplicity in this demo, R3F useFrame can lerp it)
    if (preset === 'ISOMETRIC') {
      cameraRef.current.position.set(300, 300, 400);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'TOP') {
      cameraRef.current.position.set(0, 600, 0);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'SECTION') {
      cameraRef.current.position.set(500, -50, 0);
      controlsRef.current.target.set(0, -50, 0);
    } else if (preset === 'TUNNELS') {
      cameraRef.current.position.set(0, 50, 200);
      controlsRef.current.target.set(0, -100, 0);
    }
  };

  if (!isOpen) return null;

  const baseRisk = 62;
  const simulatedRisk = Math.min(99, Math.round(baseRisk + (deformation * 1.1)));
  const calculatedTrough = Math.round(14.2 * (1 + deformation / 100));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl bg-[#0B0F17] border border-slate-700 shadow-2xl p-5 md:p-6 font-mono text-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-[#06B6D4]/40 text-[#06B6D4]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-[#F8FAFC]">
                DIGITAL MINE TWIN — 3D ISOMETRIC STRATA EXPLORER
              </h2>
              <p className="text-xs text-slate-400">
                High-Fidelity WebGL Engineering Visualization
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#162235] border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Canvas & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
          
          {/* WebGL Viewport (8 cols) */}
          <div className="lg:col-span-8 relative rounded-xl border border-slate-800 bg-[#06090E] overflow-hidden h-[500px] lg:h-auto">
            <Canvas shadows gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
              <PerspectiveCamera makeDefault ref={cameraRef} position={[300, 300, 400]} fov={45} near={1} far={2000} />
              <OrbitControls 
                ref={controlsRef} 
                enableDamping 
                dampingFactor={0.05} 
                maxPolarAngle={Math.PI / 1.5}
                minDistance={100}
                maxDistance={800}
                target={[0, 0, 0]}
              />
              
              {/* Lighting */}
              <ambientLight intensity={1.5} color="#F8FAFC" />
              <directionalLight position={[200, 500, -200]} intensity={2.5} color="#FFFFFF" castShadow shadow-bias={-0.001} />
              <pointLight position={[0, -100, 0]} intensity={1.0} color="#06B6D4" distance={500} /> {/* Underground glow */}
              
              {/* Atmospheric Fog */}
              <fog attach="fog" args={['#06090E', 300, 1000]} />

              {/* Grid Helper */}
              <Grid position={[0, -200, 0]} args={[1000, 1000]} cellSize={20} cellThickness={0.5} cellColor="#1E293B" sectionSize={100} sectionThickness={1} sectionColor="#334155" fadeDistance={800} />

              {/* 3D Scene Components */}
              <TerrainMesh visible={layers.surface} />
              <StrataLayers visible={layers.coalSeam} subsidenceVisible={layers.subsidence} deformation={deformation} />
              <Infrastructure tunnelsVisible={layers.tunnels} sensorsVisible={layers.sensors} faultsVisible={layers.faults} deformation={deformation} />
            </Canvas>

            {/* Camera presets overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0B0F17]/80 backdrop-blur border border-slate-700/50 p-1.5 rounded-lg text-[10px]">
              {['ISOMETRIC', 'TOP', 'SECTION', 'TUNNELS'].map(p => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    activePreset === p ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(8,145,178,0.5)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <div className="absolute bottom-3 right-3 text-[9px] text-slate-500 font-bold bg-[#0B0F17]/80 px-2 py-1 rounded">
              Drag to Orbit • Scroll to Zoom
            </div>
          </div>

          {/* Right Controls & What-If Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-1 text-xs">
            
            {/* What-If Simulation */}
            <div className="p-4 rounded-xl bg-[#0F172A] border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)] space-y-3">
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  What-If Deformation Stress
                </span>
                <span className="text-[#F8FAFC] bg-amber-950/50 px-2 py-0.5 rounded">+{deformation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={deformation}
                onChange={(e) => setDeformation(Number(e.target.value))}
                className="w-full accent-[#F59E0B] bg-slate-800 rounded h-1.5 cursor-pointer"
              />
              <div className="flex justify-between pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Risk Forecast:</span>
                <span className={`font-bold ${simulatedRisk >= 75 ? 'text-red-400' : 'text-amber-400'}`}>
                  {baseRisk}% &rarr; {simulatedRisk}%
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Max Sag Depth:</span>
                <span className="text-red-400 font-bold">-{calculatedTrough} mm</span>
              </div>
            </div>

            {/* Layer Filter Buttons */}
            <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Toggle Geological Layers:</span>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                {[
                  { key: 'surface', label: 'Surface Terrain' },
                  { key: 'subsidence', label: 'Subsidence Bowl' },
                  { key: 'coalSeam', label: 'Geological Strata' },
                  { key: 'tunnels', label: 'Underground Mine' },
                  { key: 'sensors', label: 'LoRa Sensors' },
                  { key: 'faults', label: 'Fault Structures' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => toggleLayer(item.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      layers[item.key] 
                        ? 'bg-cyan-950/30 border-cyan-800/80 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                        : 'bg-[#0B0F17] border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold leading-tight">{item.label}</span>
                    <div className={`w-6 h-3.5 rounded-full relative transition-colors flex-shrink-0 ${layers[item.key] ? 'bg-[#06B6D4]' : 'bg-slate-700'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 ${layers[item.key] ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Info Panel */}
            <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Selected Object</span>
              <div className="text-[10px] text-slate-400">
                Click a sensor or geological structure in the 3D view to inspect its properties.
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Three.js WebGL Geotechnical Renderer</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
}
