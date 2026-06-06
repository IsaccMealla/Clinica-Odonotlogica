"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sparkles, Environment } from "@react-three/drei"

// --- Sub-componente Animado ---
function NucleoHolografico() {
  const dienteRef = useRef<any>(null);

  useFrame((state) => {
    if (dienteRef.current) {
      dienteRef.current.rotation.y = state.clock.elapsedTime * 0.6;
      dienteRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
      <group ref={dienteRef}>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[1.2, 64, 64]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.15} />
        </mesh>

        <mesh position={[-0.45, -1.1, 0]} rotation={[Math.PI, 0.1, 0]}>
          <coneGeometry args={[0.34, 1.4, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.15} />
        </mesh>

        <mesh position={[0.45, -1.1, 0]} rotation={[Math.PI, -0.1, 0]}>
          <coneGeometry args={[0.34, 1.4, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} metalness={0.15} />
        </mesh>
      </group>

      <Sparkles count={80} scale={5} size={2.5} speed={0.4} opacity={0.65} color="#60a5fa" />
    </Float>
  );
}

// --- Props para hacerlo reutilizable ---
interface PantallaCargaProps {
  texto?: string;
  subtexto?: string;
  alturaClase?: string; // Para controlar si ocupa toda la pantalla o solo una tarjeta
}

// --- Componente Principal Exportable ---
export default function PantallaCarga3D({ 
  texto = "Sincronizando Gemelo Digital", 
  subtexto = "Conectando con la base de datos...",
  alturaClase = "h-[60vh]"
}: PantallaCargaProps) {
  
  return (
    <div className={`flex flex-col items-center justify-center w-full bg-[#020617] rounded-[2rem] overflow-hidden relative border border-slate-800 shadow-2xl ${alturaClase}`}>
      
      {/* Capa de texto HTML superpuesta */}
      <div className="absolute z-10 bottom-10 flex flex-col items-center">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-clinica-secondary to-emerald-400 animate-pulse tracking-widest uppercase text-center px-4">
          {texto}
        </h2>
        <p className="text-slate-400 text-sm mt-2 font-mono text-center">
          {subtexto}
        </p>
      </div>

      {/* El Lienzo 3D */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Environment preset="city" />
          <NucleoHolografico />
        </Canvas>
      </div>
    </div>
  );
}