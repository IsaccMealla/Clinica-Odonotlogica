"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as Tooltip2D, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { Users, TrendingUp, Activity, Stethoscope, BadgeDollarSign, HeartPulse, Filter } from "lucide-react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Environment, Html, Sparkles, RoundedBox } from "@react-three/drei"
import * as THREE from "three"

// --- DATOS ---
const datosMensuales = [
  { mes: "Ene", pacientes: 120, ingresos: 4500, egresos: 2000 },
  { mes: "Feb", pacientes: 135, ingresos: 5200, egresos: 2100 },
  { mes: "Mar", pacientes: 110, ingresos: 3900, egresos: 1800 },
  { mes: "Abr", pacientes: 165, ingresos: 6800, egresos: 2500 },
  { mes: "May", pacientes: 190, ingresos: 8100, egresos: 2800 },
  { mes: "Jun", pacientes: 175, ingresos: 7200, egresos: 2600 },
]

// --- COMPONENTE THREE.JS: BARRA DE ESTADÍSTICA ---
function Barra3D({ position, color, height, label, detalle, isActive, isAnyActive }: { position: [number, number, number], color: string, height: number, label: string, detalle: string, isActive: boolean, isAnyActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHover] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = (height / 2) + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
      const targetOpacity = isAnyActive && !isActive ? 0.2 : 1;
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
    }
  })

  const isFocused = hovered || isActive;

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={[position[0], height / 2, position[2]]}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={() => { if(meshRef.current) meshRef.current.scale.y = 1.1; setTimeout(() => { if(meshRef.current) meshRef.current.scale.y = 1 }, 150) }}
      >
        <boxGeometry args={[0.9, height, 0.9]} />
        <meshPhysicalMaterial color={isFocused ? "#ffffff" : color} roughness={0.1} metalness={0.4} clearcoat={0.8} transparent={true} opacity={1} />
        
        {isFocused && (
          <Html position={[0, height / 2 + 0.3, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 whitespace-nowrap pointer-events-none transition-all duration-300 transform scale-100">
              <p className="font-bold text-rose-400">{label}</p>
              <p>{detalle}</p>
            </div>
          </Html>
        )}
      </mesh>
      {}
      <Text position={[position[0], -0.4, position[2]]} fontSize={0.25} color="#1f2937" anchorY="top" maxWidth={1.2} textAlign="center">{label}</Text>
    </group>
  )
}

// --- COMPONENTE THREE.JS: DIENTE INTERACTIVO (CON ROTACIÓN POR TECLADO) ---
function Diente3D({ modoCaries, cariesPositions, onAddCaries, tieneTornillo }: { modoCaries: boolean, cariesPositions: [number, number, number][], onAddCaries: (pos: [number, number, number]) => void, tieneTornillo: boolean }) {
  const dienteRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  // Controlar rotación con flechas del teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 0.3; // Velocidad de giro
      if (e.key === "ArrowLeft") targetRotation.current.y -= speed;
      if (e.key === "ArrowRight") targetRotation.current.y += speed;
      if (e.key === "ArrowUp") targetRotation.current.x -= speed;
      if (e.key === "ArrowDown") targetRotation.current.x += speed;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useFrame((state) => {
    if (dienteRef.current) {
      // Animación de flotar (solo en Y)
      dienteRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
      
      // Aplicar la rotación del teclado suavemente (Lerp)
      dienteRef.current.rotation.y = THREE.MathUtils.lerp(dienteRef.current.rotation.y, targetRotation.current.y, 0.1);
      dienteRef.current.rotation.x = THREE.MathUtils.lerp(dienteRef.current.rotation.x, targetRotation.current.x, 0.1);
    }
  })

  const handleCariesClick = (e: any) => {
    if (modoCaries && dienteRef.current) {
      e.stopPropagation();
      const localPoint = dienteRef.current.worldToLocal(e.point.clone());
      onAddCaries([localPoint.x, localPoint.y, localPoint.z]);
    }
  }

  return (
    <group ref={dienteRef}>
      {/* Corona del diente */}
      <RoundedBox 
        args={[1.5, 1.5, 1.5]} 
        radius={0.3} 
        smoothness={4} 
        position={[0, 0.5, 0]}
        onPointerDown={handleCariesClick}
        onPointerOver={() => { if(modoCaries) document.body.style.cursor = 'crosshair' }}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
      >
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={0.5} />
      </RoundedBox>

      {/* Raíces */}
      {!tieneTornillo && (
        <>
          <mesh position={[-0.35, -0.8, 0]}>
            <coneGeometry args={[0.35, 1.5, 16]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          <mesh position={[0.35, -0.8, 0]}>
            <coneGeometry args={[0.35, 1.5, 16]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.1} />
          </mesh>
        </>
      )}

      {/* Renderizar TODAS las caries */}
      {cariesPositions.map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#291c19" roughness={0.9} />
        </mesh>
      ))}

      {/* Tornillo de Implante */}
      {tieneTornillo && (
        <group position={[0, -1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.25, 0.15, 2, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.2} />
          </mesh>
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[0, -0.6 + i * 0.3, 0]}>
              <torusGeometry args={[0.26, 0.05, 16, 32]} />
              <meshStandardMaterial color="#64748b" metalness={1} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function DashboardReportesPage() {
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string | null>(null);
  
  // Estados para el simulador del diente
  const [modoCaries, setModoCaries] = useState(false);
  const [cariesPositions, setCariesPositions] = useState<[number, number, number][]>([]);
  const [tieneTornillo, setTieneTornillo] = useState(false);

  const especialidades3D = [
    { label: "General", color: "#0ea5e9", height: 2, pos: [-2.5, 0, 0], det: "450 Consultas" },
    { label: "Ortodoncia", color: "#8b5cf6", height: 4, pos: [0, 0, 0], det: "920 Ajustes" },
    { label: "Periodoncia", color: "#f43f5e", height: 1.5, pos: [2.5, 0, 0], det: "120 Tratamientos" },
    { label: "Cirugía", color: "#10b981", height: 2.8, pos: [0, 0, -2.5], det: "Extracciones: 85" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Centro de Analítica</h1>
          <p className="text-muted-foreground mt-1">Monitoreo clínico, financiero y de pacientes en tiempo real.</p>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
          { title: "Pacientes Atendidos", value: "895", desc: "+12% este mes", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Tratamientos Exitosos", value: "1,420", desc: "98% de satisfacción", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-100" },
          { title: "Casos de Riesgo", value: "18%", desc: "Atención prioritaria", icon: Activity, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Ingresos", value: "$8.1k", desc: "+24% vs mes anterior", icon: BadgeDollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        ].map((stat, index) => (
          <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TERCERA FILA: GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Flujo Financiero Anual</CardTitle>
            <CardDescription>Ingresos vs Egresos</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosMensuales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip2D contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica 3D (Ajustada para fondos claros) */}
        <Card className="shadow-lg bg-white border border-gray-200 relative overflow-hidden flex flex-col">
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-gray-900 flex items-center justify-between">
              Análisis 3D
              {filtroEspecialidad && (
                <button onClick={() => setFiltroEspecialidad(null)} className="text-xs bg-gray-200 hover:bg-gray-300 text-black font-bold px-2 py-1 rounded transition-colors">
                  Limpiar
                </button>
              )}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Filter className="w-4 h-4 text-gray-500 mt-1 mr-1" />
              {especialidades3D.map(esp => (
                <button
                  key={esp.label}
                  onClick={() => setFiltroEspecialidad(filtroEspecialidad === esp.label ? null : esp.label)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all border-2 font-bold ${
                    filtroEspecialidad === esp.label 
                      ? "bg-rose-100 border-rose-500 text-rose-700" 
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {esp.label}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow relative z-10 p-0 h-[300px]">
            <Canvas camera={{ position: [0, 5, 9], fov: 45 }}>
              <Environment preset="city" />
              <ambientLight intensity={0.8} />
              <directionalLight position={[10, 20, 10]} intensity={1.5} />
              
              <group position={[0, -1.5, 0]}>
                {especialidades3D.map((esp, i) => (
                  <Barra3D 
                    key={i} position={esp.pos as [number, number, number]} height={esp.height} color={esp.color} label={esp.label} detalle={esp.det} isActive={filtroEspecialidad === esp.label} isAnyActive={filtroEspecialidad !== null}
                  />
                ))}
                <mesh position={[0, -0.15, 0]}>
                  <cylinderGeometry args={[4.5, 4.5, 0.1, 64]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
                </mesh>
              </group>

              <OrbitControls enableZoom={false} autoRotate={!filtroEspecialidad} autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
          </CardContent>
        </Card>
      </div>

      {/* CUARTA FILA: SIMULADOR INTERACTIVO */}
      <div className="grid grid-cols-1 mt-8">
        <Card className="shadow-lg border border-gray-200 bg-white overflow-hidden">
          <CardHeader>
            <CardTitle>Simulador Clínico 3D</CardTitle>
            <CardDescription>Usa las <b>flechas de tu teclado</b> (⬅️ ➡️ ⬆️ ⬇️) para girar el diente en 3D.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6 h-[400px]">
            
            {/* Controles: BOTONES TOTALMENTE REDISEÑADOS (Sin blancos, letras negras) */}
            <div className="flex flex-col gap-4 w-full md:w-1/3 justify-center">
              
              <button 
                onClick={() => setModoCaries(!modoCaries)}
                className={`p-3 rounded-lg font-extrabold transition-all duration-300 shadow-sm border-2 ${
                  modoCaries 
                    ? 'bg-amber-400 border-amber-600 text-black' 
                    : 'bg-gray-100 border-gray-400 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {modoCaries ? "🎯 Modo Caries (Usa Flechas para girar)" : "Activar Pincel de Caries"}
              </button>

              <button 
                onClick={() => setTieneTornillo(!tieneTornillo)}
                className={`p-3 rounded-lg font-extrabold transition-all duration-300 shadow-sm border-2 ${
                  tieneTornillo 
                    ? 'bg-indigo-300 border-indigo-600 text-black' 
                    : 'bg-gray-100 border-gray-400 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tieneTornillo ? "Remover Implante" : "Colocar Implante"}
              </button>

              <button 
                onClick={() => { setCariesPositions([]); setTieneTornillo(false); setModoCaries(false); }}
                className="p-3 rounded-lg font-extrabold bg-red-100 border-2 border-red-500 text-red-700 hover:bg-red-200 transition-all mt-4 shadow-sm"
              >
                Limpiar Diente
              </button>
            </div>

            {/* Canvas de Three.js */}
            <div className="w-full md:w-2/3 bg-gray-50 rounded-xl relative overflow-hidden shadow-inner border-2 border-gray-200">
              {modoCaries && (
                <div className="absolute top-4 left-4 z-10 bg-amber-400 text-black border border-amber-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-md">
                  Gira con las flechas del teclado y haz clic para pintar
                </div>
              )}
              
              <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
                <Environment preset="studio" />
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                
                <Diente3D 
                  modoCaries={modoCaries} 
                  cariesPositions={cariesPositions} 
                  onAddCaries={(pos) => setCariesPositions(prev => [...prev, pos])}
                  tieneTornillo={tieneTornillo} 
                />
                
                {/* Desactivamos el OrbitControls para que no pelee con las flechas del teclado */}
                <OrbitControls enableZoom={true} enableRotate={!modoCaries} enablePan={false} />
              </Canvas>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  )
}