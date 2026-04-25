"use client"

import React, { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ScrollControls, useScroll, Environment, Float, Gltf, Scroll, Stars } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"

// --- 1. POLVO DIGITAL (Aún más fluido y etéreo) ---
function DigitalDustTrail() {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const count = 400; // Aumentamos para un efecto más inmersivo
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) temp.push({ x: 0, y: 0, speed: Math.random() * 0.02 + 0.01 });
    return temp;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const mouseX = (state.mouse.x * viewport.width) / 2;
    const mouseY = (state.mouse.y * viewport.height) / 2;
    const attr = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Inercia más suave y orgánica
      const followSpeed = 0.08 * (1 - i / count * 0.9); 
      particles[i].x += (mouseX - particles[i].x) * followSpeed;
      particles[i].y += (mouseY - particles[i].y) * followSpeed;
      
      // Añadimos una oscilación senoidal para que parezca que "respiran"
      const wave = Math.sin(state.clock.elapsedTime * particles[i].speed * 10) * 0.05;
      
      attr.array[i3] = particles[i].x + (Math.random() - 0.5) * 0.2 + wave;
      attr.array[i3 + 1] = particles[i].y + (Math.random() - 0.5) * 0.2 + wave;
      attr.array[i3 + 2] = (Math.random() - 0.5) * 2; // Profundidad
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.03} 
        color="#22d3ee" 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending} 
        sizeAttenuation={true}
      />
    </points>
  );
}

// --- 2. COLUMNA ADN (Movimiento corregido y luz mejorada) ---
function DNAHelix() {
  const dnaRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame((state) => {
    if (!dnaRef.current) return;
    const offset = scroll.offset; // Va de 0 a 1
    
    // Rotación suave que se acelera con el scroll
    dnaRef.current.rotation.y = state.clock.elapsedTime * 0.15 + (offset * Math.PI * 3);
    dnaRef.current.rotation.z = offset * 0.2; // Inclinación sutil
    
    // CORRECCIÓN DE POSICIÓN: Mantenemos el modelo en la pantalla
    // Empieza un poco abajo (-1.5) y sube lentamente (hasta 1.5)
    dnaRef.current.position.y = THREE.MathUtils.lerp(-1.5, 1.5, offset);
    
    // Se acerca un poco hacia el centro al scrollear
    dnaRef.current.position.x = THREE.MathUtils.lerp(3, 1.5, offset);
    dnaRef.current.position.z = THREE.MathUtils.lerp(-2, 1, offset);
  });

  return (
    <group ref={dnaRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Gltf 
          src="/3DModel/dna__double__helix__ultra.glb" 
          position={[0, 0, 0]} 
        />
        {/* Luces anidadas en el modelo para resaltar los relieves */}
        <pointLight position={[2, 0, 2]} intensity={8} distance={10} color="#06b6d4" /> {/* Cian */}
        <pointLight position={[-2, 2, -2]} intensity={5} distance={10} color="#8b5cf6" /> {/* Violeta para contraste */}
      </Float>
    </group>
  );
}

// --- 3. DASHBOARD UI (Estética pulida y glassmorphism) ---
function DashboardUI() {
  const scroll = useScroll();
  const cardRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateCardTransform = () => {
      if (cardRef.current) {
        const offset = scroll.offset; 
        const rotation = THREE.MathUtils.lerp(-5, 5, offset);
        const scale = THREE.MathUtils.lerp(0.95, 1, Math.sin(offset * Math.PI));
        
        cardRef.current.style.transform = `perspective(1000px) rotateY(${rotation}deg) scale(${scale})`;
      }
    };

    const interval = setInterval(updateCardTransform, 16);
    return () => clearInterval(interval);
  }, [scroll]);

  return (
    <div className="w-full text-white selection:bg-cyan-500/30">
      
      {/* SECCIÓN 1: HERO */}
      <section className="h-screen flex items-center px-12 md:px-24">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.5 }}
          className="z-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[1px] w-12 bg-gradient-to-r from-cyan-500 to-transparent" />
            <span className="text-cyan-400 font-mono tracking-[0.5em] text-[10px] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              Biometric Dental Pro
            </span>
          </div>
          <h1 className="text-[6rem] md:text-[9rem] font-black leading-[0.85] tracking-tighter mb-6">
            CLINICA<br/>
            <span className="text-transparent text-outline italic bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              DENTAL PRO
            </span>
          </h1>
          <p className="max-w-md text-slate-400 text-lg font-light leading-relaxed border-l-2 border-cyan-500/30 pl-4">
            Ecosistema digital de precisión genómica para odontología avanzada.
          </p>
        </motion.div>
      </section>

      {/* SECCIÓN 2: BENTO GRID ORBITAL */}
      <section className="h-screen flex items-center justify-start px-12 md:px-24">
        <div 
          ref={cardRef}
          className="grid grid-cols-6 grid-rows-4 gap-6 w-full max-w-5xl h-[600px] z-10 transition-transform duration-75 ease-linear origin-left"
        >
          {/* Tarjeta Principal */}
          <div className="col-span-4 row-span-3 bg-[#0a0f1c]/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-colors duration-500 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-[0_10px_40px_-15px_rgba(6,182,212,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
            
            <div className="relative z-10">
              <p className="flex items-center gap-2 text-cyan-500 font-mono text-[10px] tracking-widest uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Telemetry Stream
              </p>
              <h2 className="text-5xl font-black italic tracking-tighter text-slate-100">ANÁLISIS <br/>ESTRUCTURAL</h2>
            </div>
            <div className="flex items-baseline gap-4 relative z-10">
              <span className="text-9xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">100</span>
              <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest">% Integridad</span>
            </div>
          </div>

          {/* Tarjetas Secundarias */}
          <div className="col-span-2 row-span-2 bg-gradient-to-br from-cyan-900/40 to-[#0a0f1c]/60 backdrop-blur-xl border border-white/5 hover:border-cyan-400/30 transition-all duration-300 rounded-[2rem] p-8 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
            <p className="text-4xl font-black relative z-10 text-white">PRO-LINK</p>
            <p className="text-[10px] text-cyan-400 font-mono uppercase mt-2 relative z-10">Active Node</p>
          </div>

          <div className="col-span-2 row-span-2 bg-[#0a0f1c]/40 backdrop-blur-md border border-white/5 hover:bg-white/[0.03] transition-all duration-300 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
            <p className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">24/7</p>
            <p className="text-xs text-slate-400 uppercase mt-2 font-bold tracking-widest">Uptime Real</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CIERRE */}
      <section className="h-screen flex items-center px-12 md:px-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl bg-[#0a0f1c]/70 border border-cyan-500/20 p-16 rounded-[3rem] backdrop-blur-xl z-10 shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-none">
            EL FUTURO ES <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">DIGITAL.</span>
          </h2>
          <button className="group relative bg-cyan-500 text-[#01040a] px-10 py-4 rounded-xl font-black transition-all text-xs tracking-widest overflow-hidden hover:scale-105 active:scale-95">
            <span className="relative z-10">GESTIONAR REGISTROS</span>
            <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </button>
        </motion.div>
      </section>
    </div>
  );
}

// --- 4. COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
  return (
    <main className="w-full h-screen bg-[#020617] relative overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={["#020617"]} />
          
          <ambientLight intensity={0.2} />
          {/* Luz azul profundo general */}
          <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#1e3a8a" /> 
          <Environment preset="city" />
          
          <Stars radius={100} depth={50} count={2500} factor={4} saturation={1} fade speed={0.5} />
          
          <DigitalDustTrail />

          {/* Damping suaviza el scroll de Three.js */}
          <ScrollControls pages={3} damping={0.25} distance={1.2}>
            <DNAHelix />
            <Scroll html className="w-full">
              <DashboardUI />
            </Scroll>
          </ScrollControls>
        </Canvas>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .text-outline { -webkit-text-stroke: 1px rgba(34, 211, 238, 0.4); }
        body { background-color: #020617; margin: 0; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}