"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Float, Environment, ContactShadows, Grid, Sparkles } from "@react-three/drei"
import toast, { Toaster } from "react-hot-toast"
import { AlertTriangle, CheckCircle2, Wrench, Activity, ShieldAlert, Power } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- TIPOS DE DATOS ---
type EstadoSillon = 'operativo' | 'revision' | 'falla';

interface Sillon {
  id: number;
  nombre: string;
  estado: EstadoSillon;
  posicion: [number, number, number];
}

// --- 1. COMPONENTE 3D: Sillón Dental Estilizado ---
function Sillon3D({ datos, onClick }: { datos: Sillon, onClick: (s: Sillon) => void }) {
  const colorTema = 
    datos.estado === 'operativo' ? '#10b981' : 
    datos.estado === 'revision' ? '#f59e0b' :  
    '#ef4444';                                 

  const emissiveIntensity = datos.estado === 'falla' ? 1.5 : (datos.estado === 'revision' ? 0.5 : 0.2);

  return (
    <group 
      position={datos.posicion} 
      onClick={(e) => { e.stopPropagation(); onClick(datos); }} 
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.2, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[0, 0.6, 0.2]} rotation={[0.05, 0, 0]}>
          <boxGeometry args={[0.8, 0.2, 1.2]} />
          <meshPhysicalMaterial color={colorTema} roughness={0.2} clearcoat={1} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.0, -0.4]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.8, 0.9, 0.2]} />
          <meshPhysicalMaterial color={colorTema} roughness={0.2} clearcoat={1} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.5, -0.55]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.4, 0.25, 0.15]} />
          <meshPhysicalMaterial color="#cbd5e1" roughness={0.4} clearcoat={0.5} />
        </mesh>
        <mesh position={[-0.6, 0.8, -0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.2, 1.6, -0.2]} rotation={[0, 0, 1.57]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 1.55, -0.2]}>
          <coneGeometry args={[0.2, 0.3, 16]} />
          <meshStandardMaterial color={colorTema} emissive={colorTema} emissiveIntensity={emissiveIntensity} />
        </mesh>
      </Float>

      {datos.estado !== 'operativo' && (
        <Sparkles count={datos.estado === 'falla' ? 30 : 15} scale={2} size={4} speed={datos.estado === 'falla' ? 2 : 0.5} opacity={0.8} color={colorTema} position={[0, 1, 0]} />
      )}

      <Text position={[0, 2.2, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor={colorTema}>
        {datos.nombre}
      </Text>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={colorTema} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// --- 2. COMPONENTE PRINCIPAL ---
export default function MantenimientoClinica() {
  const [sillones, setSillones] = useState<Sillon[]>([
    { id: 1, nombre: "Sillón 01", estado: 'operativo', posicion: [-5, 0, -3] },
    { id: 2, nombre: "Sillón 02", estado: 'operativo', posicion: [0, 0, -3] },
    { id: 3, nombre: "Sillón 03", estado: 'operativo', posicion: [5, 0, -3] },
    { id: 4, nombre: "Sillón 04", estado: 'revision', posicion: [-5, 0, 3] },
    { id: 5, nombre: "Sillón 05", estado: 'operativo', posicion: [0, 0, 3] },
    { id: 6, nombre: "Sillón 06", estado: 'falla', posicion: [5, 0, 3] },
  ]);

  const [sillonSeleccionado, setSillonSeleccionado] = useState<Sillon | null>(null);

  useEffect(() => {
    const intervaloWebSocket = setInterval(() => {
      const probabilidad = Math.random();
      if (probabilidad > 0.95) {
        const idAleatorio = Math.floor(Math.random() * 6) + 1;
        const estadosPosibles: EstadoSillon[] = ['operativo', 'revision', 'falla'];
        const nuevoEstado = estadosPosibles[Math.floor(Math.random() * estadosPosibles.length)];
        
        setSillones(prev => prev.map(s => {
          if (s.id === idAleatorio && s.estado !== nuevoEstado) {
            dispararAlerta(s.nombre, nuevoEstado);
            if (sillonSeleccionado && sillonSeleccionado.id === s.id) {
              setSillonSeleccionado({ ...s, estado: nuevoEstado });
            }
            return { ...s, estado: nuevoEstado };
          }
          return s;
        }));
      }
    }, 8000);
    return () => clearInterval(intervaloWebSocket);
  }, [sillonSeleccionado]);

  const dispararAlerta = (nombre: string, estado: EstadoSillon) => {
    if (estado === 'falla') {
      toast.error(`¡Alerta! ${nombre} reportado con fallas.`, {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid #ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' }
      });
    } else if (estado === 'revision') {
      toast(`Mantenimiento: ${nombre} en revisión.`, {
        icon: '⚠️',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid #f59e0b' }
      });
    } else {
      toast.success(`${nombre} restablecido y operativo.`, {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid #10b981' },
        iconTheme: { primary: '#10b981', secondary: '#fff' }
      });
    }
  };

  const cambiarEstadoManual = (nuevoEstado: EstadoSillon) => {
    if (!sillonSeleccionado) return;
    if (sillonSeleccionado.estado === nuevoEstado) return;

    setSillones(prev => prev.map(s => {
      if (s.id === sillonSeleccionado.id) {
        const sillonActualizado = { ...s, estado: nuevoEstado };
        setSillonSeleccionado(sillonActualizado);
        dispararAlerta(s.nombre, nuevoEstado);
        return sillonActualizado;
      }
      return s;
    }));
  };

  const operativos = sillones.filter(s => s.estado === 'operativo').length;
  const enRevision = sillones.filter(s => s.estado === 'revision').length;
  const enFalla = sillones.filter(s => s.estado === 'falla').length;

  return (
    <div className="flex flex-col gap-6 w-full">
      <Toaster position="top-right" />

      {/* --- SECCIÓN SUPERIOR: MÉTRICAS (Fila Horizontal) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Equipos Operativos</p>
              <p className="text-4xl font-black text-emerald-700">{operativos}</p>
            </div>
            <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-amber-100 bg-amber-50/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-600/80 uppercase tracking-wider mb-1">En Revisión</p>
              <p className="text-4xl font-black text-amber-700">{enRevision}</p>
            </div>
            <div className="h-14 w-14 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Wrench className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-red-100 bg-red-50/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-600/80 uppercase tracking-wider mb-1">Fuera de Servicio</p>
              <p className="text-4xl font-black text-red-700">{enFalla}</p>
            </div>
            <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- SECCIÓN INFERIOR: CONTROLES A LA IZQUIERDA + MAPA 3D A LA DERECHA --- */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 w-full">
        
        {/* LADO IZQUIERDO: Panel de Detalles e Interacción Manual */}
        <div className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0">
          <Card className={`rounded-[2rem] border-slate-200 shadow-xl transition-all duration-500 overflow-hidden sticky top-6
            ${sillonSeleccionado ? 'opacity-100 translate-y-0' : 'opacity-60 pointer-events-none'}`}>
            <div className={`h-3 w-full transition-colors duration-300 ${
              sillonSeleccionado?.estado === 'operativo' ? 'bg-emerald-500' :
              sillonSeleccionado?.estado === 'revision' ? 'bg-amber-500' :
              sillonSeleccionado?.estado === 'falla' ? 'bg-red-500' : 'bg-slate-300'
            }`}></div>
            
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-between">
                Gestión de Equipo
                {sillonSeleccionado?.estado === 'falla' && <ShieldAlert className="text-red-500 h-7 w-7 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              {sillonSeleccionado ? (
                <div className="space-y-8">
                  {/* Info Básica */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Identificador</p>
                      <p className="text-4xl font-black text-slate-900">{sillonSeleccionado.nombre}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full shadow-inner ring-4 ${
                      sillonSeleccionado.estado === 'operativo' ? 'bg-emerald-500 ring-emerald-100' :
                      sillonSeleccionado.estado === 'revision' ? 'bg-amber-500 ring-amber-100' : 
                      'bg-red-500 ring-red-100 animate-pulse'
                    }`}></div>
                  </div>
                  
                  {/* BOTONES DE CAMBIO DE ESTADO MANUAL */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Modificar Estado</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => cambiarEstadoManual('operativo')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'operativo' 
                            ? 'bg-emerald-100 border-emerald-300 shadow-sm ring-1 ring-emerald-400 pointer-events-none' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'operativo' ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                          <CheckCircle2 className={`h-6 w-6 ${sillonSeleccionado.estado === 'operativo' ? 'text-emerald-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'operativo' ? 'text-emerald-800' : 'text-slate-600'}`}>
                          Marcar Operativo
                        </span>
                      </button>

                      <button 
                        onClick={() => cambiarEstadoManual('revision')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'revision' 
                            ? 'bg-amber-100 border-amber-300 shadow-sm ring-1 ring-amber-400 pointer-events-none' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-amber-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'revision' ? 'bg-amber-200' : 'bg-slate-100'}`}>
                          <Wrench className={`h-6 w-6 ${sillonSeleccionado.estado === 'revision' ? 'text-amber-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'revision' ? 'text-amber-800' : 'text-slate-600'}`}>
                          Enviar a Revisión
                        </span>
                      </button>

                      <button 
                        onClick={() => cambiarEstadoManual('falla')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'falla' 
                            ? 'bg-red-100 border-red-300 shadow-sm ring-1 ring-red-400 pointer-events-none' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-red-300 hover:shadow-md'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'falla' ? 'bg-red-200' : 'bg-slate-100'}`}>
                          <Power className={`h-6 w-6 ${sillonSeleccionado.estado === 'falla' ? 'text-red-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'falla' ? 'text-red-800' : 'text-slate-600'}`}>
                          Reportar Falla
                        </span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-4 opacity-50">
                  <Activity className="h-16 w-16 text-slate-400" />
                  <p className="text-slate-500 font-medium text-center text-lg px-8">
                    Selecciona un equipo en el mapa 3D para visualizar y modificar su estado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* LADO DERECHO: Mapa 3D MAS ALTO (min-h-[850px]) */}
        <div className="flex-grow bg-[#020617] rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[600px] lg:min-h-[850px] border border-slate-800 ring-1 ring-white/10">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]"></div>
          </div>

          <div className="absolute top-6 left-6 z-10 bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" /> Gemelo Digital
            </h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Conexión Activa
            </p>
          </div>

          <Canvas camera={{ position: [0, 8, 16], fov: 45 }}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
            <Environment preset="city" />
            <Grid renderOrder={-1} position={[0, 0, 0]} infiniteGrid cellSize={1} cellThickness={0.5} sectionSize={3} sectionThickness={1} sectionColor={[0.2, 0.4, 1.0]} cellColor={[0.1, 0.2, 0.5]} fadeDistance={40} fadeStrength={2} />
            <ContactShadows position={[0, 0.01, 0]} scale={30} resolution={512} blur={2.5} opacity={0.6} />
            
            {sillones.map(sillon => (
              <Sillon3D key={sillon.id} datos={sillon} onClick={setSillonSeleccionado} />
            ))}

            <OrbitControls enablePan={true} enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.1} />
          </Canvas>
        </div>

      </div>
    </div>
  )
}