"use client"

import React, { useRef, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Float, Gltf, Stars, ScrollControls, Scroll } from "@react-three/drei"
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
        color="#10B981"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
}

// --- 2. COLUMNA DIENTES (Movimiento corregido y luz mejorada) ---
function TeethModel() {
  const modelRef = useRef<THREE.Group>(null);
  
  const targetOffset = useRef(0);
  const currentOffset = useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetOffset.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state, delta) => {
    if (!modelRef.current) return;
    
    currentOffset.current = THREE.MathUtils.lerp(currentOffset.current, targetOffset.current, 5 * delta);
    const offset = currentOffset.current;
    
    // Rotación suave
    modelRef.current.rotation.y = state.clock.elapsedTime * 0.15 + (offset * Math.PI * 2);
    modelRef.current.rotation.z = offset * 0.1; 
    
    // Más pequeños y centrados
    modelRef.current.position.y = THREE.MathUtils.lerp(-0.5, 0, offset);
    modelRef.current.position.x = THREE.MathUtils.lerp(1, 0, offset);
    modelRef.current.position.z = THREE.MathUtils.lerp(-1, 1, offset);
  });

  return (
    <group ref={modelRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <Gltf 
          src="/3DModel/types_of_human_teeth.glb" 
          position={[0, 0, 0]} 
          scale={0.05}
        />
        {/* Luces anidadas en el modelo para resaltar los relieves */}
        <pointLight position={[2, 0, 2]} intensity={8} distance={10} color="#0F766E" /> {/* Primario */}
        <pointLight position={[-2, 2, -2]} intensity={5} distance={10} color="#10B981" /> {/* Secundario */}
      </Float>
    </group>
  );
}

// --- 3. DASHBOARD UI (Estética pulida y glassmorphism) ---
const DashboardUI = React.memo(function DashboardUI({ role }: { role: string | null }) {
  const cardRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let animationFrameId: number;
    const updateCardTransform = () => {
      if (cardRef.current) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const offset = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        const rotation = -5 + (10 * offset);
        const scale = 0.95 + (0.05 * Math.sin(offset * Math.PI));
        
        cardRef.current.style.transform = `perspective(1000px) rotateY(${rotation}deg) scale(${scale})`;
      }
      animationFrameId = requestAnimationFrame(updateCardTransform);
    };

    updateCardTransform();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (

    <div className="w-full text-white selection:bg-clinica-secondary/30">

      {/* SECCIÓN 1: HERO */}
      <section className="h-screen flex items-center px-12 md:px-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.5 }}
          className="z-10"
        >
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-gradient-to-r from-clinica-secondary to-transparent" />
              <span className="text-clinica-secondary font-mono tracking-[0.5em] text-[10px] uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                Biometric Dental Pro
              </span>
            </div>
            {role && (
              <div className="flex items-center gap-2">
                <div className="inline-block px-3 py-1 bg-clinica-primary/30 border border-clinica-primary/30 rounded-full text-clinica-secondary text-xs font-bold tracking-widest uppercase">
                  Rol: {role}
                </div>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white text-xs font-semibold tracking-wide">
                  {typeof window !== 'undefined' ? (localStorage.getItem('user_name') || 'Usuario Clínico') : 'Usuario'}
                </div>
              </div>
            )}
          </div>
          <h1 className="text-[6rem] md:text-[9rem] font-black leading-[0.85] tracking-tighter mb-6">
            CLINICA<br />
            <span className="text-transparent text-outline italic bg-clip-text bg-gradient-to-r from-clinica-secondary to-clinica-primary">
              DENTAL PRO
            </span>
          </h1>
          <p className="max-w-md text-slate-400 text-lg font-light leading-relaxed border-l-2 border-clinica-secondary/30 pl-4">
            Ecosistema digital de precisión genómica para odontología avanzada.
          </p>
        </motion.div>
      </section>

      {/* SECCIÓN 2: ROL DASHBOARD ORBITAL */}
      <section className="h-screen flex items-center justify-start px-12 md:px-24">
        <div
          ref={cardRef}
          className="grid grid-cols-6 grid-rows-4 gap-6 w-full max-w-5xl h-[600px] z-10 transition-transform duration-75 ease-linear origin-left"
        >
          {/* Tarjeta Principal (Dinámica según rol) */}
          <div className="col-span-4 row-span-3 bg-[#0a0f1c]/60 backdrop-blur-xl border border-white/10 hover:border-clinica-secondary/50 transition-colors duration-500 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-[0_10px_40px_-15px_rgba(16,185,129,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-clinica-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-clinica-secondary/20 transition-all duration-700"></div>

            <div className="relative z-10">
              <p className="flex items-center gap-2 text-clinica-secondary font-mono text-[10px] tracking-widest uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-clinica-secondary animate-pulse"></span>
                ACCESO RÁPIDO
              </p>
              <h2 className="text-5xl font-black italic tracking-tighter text-slate-100">
                {role === 'ADMIN' ? 'GESTIÓN DE CLÍNICA' : role === 'DOCENTE' ? 'SUPERVISIÓN CLÍNICA' : role === 'ESTUDIANTE' ? 'MIS PACIENTES' : 'AGENDA GENERAL'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 mt-8">
              {role === 'ADMIN' && (
                <>
                  <a href="/usuarios" className="bg-clinica-primary/20 p-4 rounded-xl border border-clinica-primary/30 hover:bg-clinica-primary/40 transition">Usuarios</a>
                  <a href="/admin/qa" className="bg-clinica-secondary/20 p-4 rounded-xl border border-clinica-secondary/30 hover:bg-clinica-secondary/40 transition">Auditorías QA</a>
                </>
              )}
              {role === 'DOCENTE' && (
                <>
                  <a href="/supervision" className="bg-clinica-primary/20 p-4 rounded-xl border border-clinica-primary/30 hover:bg-clinica-primary/40 transition">Bandeja Supervisión</a>
                  <a href="/pacientes" className="bg-clinica-secondary/20 p-4 rounded-xl border border-clinica-secondary/30 hover:bg-clinica-secondary/40 transition">Todos los Pacientes</a>
                </>
              )}
              {role === 'ESTUDIANTE' && (
                <>
                  <a href="/mis-pacientes" className="bg-clinica-primary/20 p-4 rounded-xl border border-clinica-primary/30 hover:bg-clinica-primary/40 transition">Mis Pacientes</a>
                  <a href="/academico" className="bg-clinica-secondary/20 p-4 rounded-xl border border-clinica-secondary/30 hover:bg-clinica-secondary/40 transition">Récord Académico</a>
                </>
              )}
            </div>
          </div>

          {/* Tarjetas Secundarias */}
          <div className="col-span-2 row-span-2 bg-gradient-to-br from-clinica-primary/40 to-[#0a0f1c]/60 backdrop-blur-xl border border-white/5 hover:border-clinica-secondary/30 transition-all duration-300 rounded-[2rem] p-8 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]" />
            <p className="text-4xl font-black relative z-10 text-white">PRO-LINK</p>
            <p className="text-[10px] text-clinica-secondary font-mono uppercase mt-2 relative z-10">Conexión Activa</p>
          </div>

          <div className="col-span-2 row-span-2 bg-[#0a0f1c]/40 backdrop-blur-md border border-white/5 hover:bg-white/[0.03] transition-all duration-300 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
            <p className="text-5xl font-black text-clinica-secondary drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">24/7</p>
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
          className="max-w-xl bg-[#0a0f1c]/70 border border-clinica-secondary/20 p-16 rounded-[3rem] backdrop-blur-xl z-10 shadow-[0_0_50px_rgba(16,185,129,0.05)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-clinica-secondary to-clinica-primary"></div>
          <h2 className="text-5xl md:text-6xl font-black mb-8 leading-none">
            EL FUTURO ES <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-clinica-secondary to-clinica-primary">DIGITAL.</span>
          </h2>
          <button className="group relative bg-clinica-secondary text-white px-10 py-4 rounded-xl font-black transition-all text-xs tracking-widest overflow-hidden hover:scale-105 active:scale-95">
            <span className="relative z-10">COMENZAR AHORA</span>
            <div className="absolute inset-0 bg-clinica-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          </button>
        </motion.div>
      </section>
    </div>
  );
});

import { PanelRecepcion } from "@/components/panel-recepcion"
import { loadMe } from "@/lib/permissions"

// --- 4. COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    (async () => {
      const me = await loadMe()
      const r = me?.rol || localStorage.getItem('user_role')
      if (r) setRole(r.toUpperCase())
      else setRole('UNKNOWN')
    })()
  }, [])

  // Evita el montaje doble del Canvas que causa el error "createRoot()" en React 19 + drei
  if (role === null) {
    return <div className="w-full h-screen bg-[#042f2e] flex items-center justify-center text-clinica-secondary animate-pulse font-mono text-xs">INICIALIZANDO SISTEMA BIOMÉTRICO...</div>
  }

  if (role === 'RECEPCIONISTA') {
    return (
      <main className="w-full min-h-screen bg-[#042f2e]">
        <PanelRecepcion />
      </main>
    )
  }

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#042f2e] relative overflow-x-hidden">

      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} eventSource={containerRef}>
          <color attach="background" args={["#042f2e"]} />

          <ambientLight intensity={0.2} />
          {/* Luz azul profundo general */}
          <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#1e3a8a" />
          <Environment preset="city" />

          <Stars radius={100} depth={50} count={2500} factor={4} saturation={1} fade speed={0.5} />

          <DigitalDustTrail />
          <TeethModel />
        </Canvas>
      </div>

      <div className="relative z-10 w-full pointer-events-auto">
        <DashboardUI role={role} />
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .text-outline { -webkit-text-stroke: 1px rgba(16, 185, 129, 0.4); }
        body { background-color: #042f2e; margin: 0; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}