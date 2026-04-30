"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sparkles, MeshDistortMaterial, Sphere, Environment } from "@react-three/drei"

// --- Sub-componente Animado ---
function NucleoHolografico() {
  const sphereRef = useRef<any>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={sphereRef}>
        <Sphere args={[1.5, 64, 64]}>
          <MeshDistortMaterial 
            color="#3b82f6" 
            attach="material" 
            distort={0.4} 
            speed={2}     
            roughness={0.2} 
            metalness={0.8}
            wireframe={true} 
          />
        </Sphere>
      </mesh>
      
      <Sphere args={[0.8, 32, 32]}>
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} toneMapped={false} />
      </Sphere>

      <Sparkles count={100} scale={5} size={3} speed={0.4} opacity={0.6} color="#60a5fa" />
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
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 animate-pulse tracking-widest uppercase text-center px-4">
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