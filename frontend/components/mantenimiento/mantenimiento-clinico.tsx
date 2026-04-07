"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Float, Environment, ContactShadows, Grid, Sparkles } from "@react-three/drei"
import toast, { Toaster } from "react-hot-toast"
import { AlertTriangle, CheckCircle2, Wrench, Activity, ShieldAlert, Power, Loader2, Plus, X, Save, MousePointerClick, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- TIPOS DE DATOS ---
type EstadoSillon = 'operativo' | 'revision' | 'falla';

interface Sillon {
  id: number;
  nombre: string;
  estado: EstadoSillon;
  posicion: [number, number, number]; // Viene directamente desde el backend
  marca?: string;
  modelo?: string;
}

function Sillon3D({ datos, onClick, esFantasma = false }: { datos: Sillon, onClick?: (s: Sillon) => void, esFantasma?: boolean }) {
  const colorTema = esFantasma ? '#3b82f6' : 
    datos.estado === 'operativo' ? '#10b981' : 
    datos.estado === 'revision' ? '#f59e0b' :  
    '#ef4444';                                                         

  const emissiveIntensity = esFantasma ? 0.8 : datos.estado === 'falla' ? 1.5 : (datos.estado === 'revision' ? 0.5 : 0.2);
  const materialOpacidad = esFantasma ? 0.4 : 1;

  return (
    <group 
      position={datos.posicion} 
      onClick={(e) => { 
        if (!esFantasma && onClick) {
          e.stopPropagation(); 
          onClick(datos); 
        }
      }} 
      onPointerOver={() => !esFantasma && (document.body.style.cursor = 'pointer')}
      onPointerOut={() => !esFantasma && (document.body.style.cursor = 'auto')}
    >
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.2, 32]} />
        <meshStandardMaterial color={esFantasma ? colorTema : "#334155"} roughness={0.7} transparent={esFantasma} opacity={materialOpacidad} />
      </mesh>

      <Float speed={esFantasma ? 4 : 2} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[0, 0.6, 0.2]} rotation={[0.05, 0, 0]}>
          <boxGeometry args={[0.8, 0.2, 1.2]} />
          <meshPhysicalMaterial color={colorTema} roughness={0.2} clearcoat={1} metalness={0.5} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
        <mesh position={[0, 1.0, -0.4]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.8, 0.9, 0.2]} />
          <meshPhysicalMaterial color={colorTema} roughness={0.2} clearcoat={1} metalness={0.5} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
        <mesh position={[0, 1.5, -0.55]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.4, 0.25, 0.15]} />
          <meshPhysicalMaterial color={esFantasma ? colorTema : "#cbd5e1"} roughness={0.4} clearcoat={0.5} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
        <mesh position={[-0.6, 0.8, -0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6]} />
          <meshStandardMaterial color={esFantasma ? colorTema : "#94a3b8"} metalness={0.8} roughness={0.2} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
        <mesh position={[-0.2, 1.6, -0.2]} rotation={[0, 0, 1.57]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8]} />
          <meshStandardMaterial color={esFantasma ? colorTema : "#94a3b8"} metalness={0.8} roughness={0.2} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
        <mesh position={[0.2, 1.55, -0.2]}>
          <coneGeometry args={[0.2, 0.3, 16]} />
          <meshStandardMaterial color={colorTema} emissive={colorTema} emissiveIntensity={emissiveIntensity} transparent={esFantasma} opacity={materialOpacidad} />
        </mesh>
      </Float>

      {!esFantasma && datos.estado !== 'operativo' && (
        <Sparkles count={datos.estado === 'falla' ? 30 : 15} scale={2} size={4} speed={datos.estado === 'falla' ? 2 : 0.5} opacity={0.8} color={colorTema} position={[0, 1, 0]} />
      )}

      {esFantasma && (
         <Sparkles count={40} scale={2.5} size={6} speed={3} opacity={0.5} color={colorTema} position={[0, 1, 0]} />
      )}

      <Text position={[0, 2.2, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor={colorTema}>
        {esFantasma ? "NUEVO EQUIPO" : datos.nombre}
      </Text>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={colorTema} transparent opacity={esFantasma ? 0.3 : 0.6} />
      </mesh>
    </group>
  );
}

// --- 2. COMPONENTE PRINCIPAL ---
export default function MantenimientoClinica() {
  const [sillones, setSillones] = useState<Sillon[]>([]);
  const [sillonSeleccionado, setSillonSeleccionado] = useState<Sillon | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados para la Creación de un Nuevo Equipo
  const [modoCreacion, setModoCreacion] = useState(false);
  const [posicionFantasma, setPosicionFantasma] = useState<[number, number, number] | null>(null);
  const [formNuevo, setFormNuevo] = useState({ nombre: '', marca: '', modelo: '' });

  useEffect(() => {
    const fetchSillones = async () => {
      setCargandoInicial(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("http://localhost:8000/api/sillones/", { headers });
        
        if (res.ok) {
          const data = await res.json();
          
          setSillones(data);
        } else {
          toast.error("Error al leer la base de datos.");
          setSillones([]);
        }
      } catch (error) {
        toast.error("Error de conexión con el servidor.");
        setSillones([]); 
      } finally {
        setCargandoInicial(false);
      }
    };
    fetchSillones();
  }, []);
  

  useEffect(() => {
    if (sillones.length === 0 || modoCreacion) return;
    
    const intervaloWebSocket = setInterval(() => {
      if (Math.random() > 0.95) {
        const indexAleatorio = Math.floor(Math.random() * sillones.length);
        const sillonAfectado = sillones[indexAleatorio];
        const estadosPosibles: EstadoSillon[] = ['operativo', 'revision', 'falla'];
        const nuevoEstado = estadosPosibles[Math.floor(Math.random() * estadosPosibles.length)];
        
        if (sillonAfectado && sillonAfectado.estado !== nuevoEstado) {
          dispararAlerta(sillonAfectado.nombre, nuevoEstado);
          
          if (sillonSeleccionado?.id === sillonAfectado.id) {
            setSillonSeleccionado({ ...sillonAfectado, estado: nuevoEstado });
          }
          
          setSillones(prev => prev.map((s, i) => 
            i === indexAleatorio ? { ...s, estado: nuevoEstado } : s
          ));
        }
      }
    }, 10000);
    
    return () => clearInterval(intervaloWebSocket);
  }, [sillonSeleccionado, sillones, modoCreacion]);

  const dispararAlerta = (nombre: string, estado: EstadoSillon) => {
    if (estado === 'falla') toast.error(`¡Alerta! ${nombre} reportado con fallas.`);
    else if (estado === 'revision') toast(`Mantenimiento: ${nombre} en revisión.`, { icon: '⚠️' });
    else toast.success(`${nombre} restablecido y operativo.`);
  };

  // --- API: ACTUALIZAR ESTADO ---
  const cambiarEstadoManual = async (nuevoEstado: EstadoSillon) => {
    if (!sillonSeleccionado || guardando) return;
    setGuardando(true);
    
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8000/api/sillones/${sillonSeleccionado.id}/`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (res.ok) {
        dispararAlerta(sillonSeleccionado.nombre, nuevoEstado);
        setSillonSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : null);
        setSillones(prev => prev.map(s => 
          s.id === sillonSeleccionado.id ? { ...s, estado: nuevoEstado } : s
        ));
      } else {
        toast.error("Error al actualizar el equipo en la BD.");
      }

    } catch (error) {
      toast.error("Error al actualizar el equipo.");
    } finally {
      setGuardando(false);
    }
  };

  // --- API: CREAR NUEVO SILLÓN ---
  const guardarNuevoSillon = async () => {
    if (!posicionFantasma) {
      toast.error("Haz clic en el mapa para ubicar el sillón.");
      return;
    }
    if (!formNuevo.nombre.trim()) {
      toast.error("El nombre del equipo es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      
      const payload = {
        nombre: formNuevo.nombre,
        estado: 'operativo',
        marca: formNuevo.marca || 'Genérica',
        modelo: formNuevo.modelo || 'N/A',
        posicion_x: posicionFantasma[0],
        posicion_y: posicionFantasma[1],
        posicion_z: posicionFantasma[2],
      };

      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:8000/api/sillones/", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const nuevoSillonDB = await res.json(); 
        
        const sillonFormateado = {
          id: nuevoSillonDB.id || Date.now(),
          nombre: formNuevo.nombre,
          estado: 'operativo' as EstadoSillon,
          posicion: posicionFantasma 
        };
        
        setSillones(prev => [...prev, sillonFormateado]);
        toast.success("¡Equipo guardado en la base de datos!");
        
        setModoCreacion(false);
        setPosicionFantasma(null);
        setFormNuevo({ nombre: '', marca: '', modelo: '' });
      } else {
        toast.error("El servidor rechazó los datos (Revisa tu backend).");
      }

    } catch (error) {
      toast.error("Error de red al intentar guardar en la base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  // --- API: ELIMINAR SILLÓN ---
  const eliminarSillon = async () => {
    if (!sillonSeleccionado || guardando) return;

    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente: ${sillonSeleccionado.nombre}?`)) return;

    setGuardando(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8000/api/sillones/${sillonSeleccionado.id}/`, {
        method: "DELETE",
        headers: headers
      });

      if (res.ok || res.status === 204) {
        setSillones(prev => prev.filter(s => s.id !== sillonSeleccionado.id));
        setSillonSeleccionado(null);
        toast.success("Equipo eliminado correctamente.");
      } else {
        toast.error("El servidor no pudo eliminar el equipo.");
      }

    } catch (error) {
      toast.error("Error de red al intentar eliminar.");
    } finally {
      setGuardando(false);
    }
  };

  const operativos = sillones.filter(s => s.estado === 'operativo').length;
  const enRevision = sillones.filter(s => s.estado === 'revision').length;
  const enFalla = sillones.filter(s => s.estado === 'falla').length;

  if (cargandoInicial) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 animate-pulse">Sincronizando Gemelo Digital...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      <Toaster position="top-right" />

      {/* --- MÉTRICAS SUPERIORES --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50/50 shadow-sm overflow-hidden md:col-span-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Operativos</p>
              <p className="text-3xl font-black text-emerald-700">{operativos}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-amber-100 bg-amber-50/50 shadow-sm overflow-hidden md:col-span-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider mb-1">Revisión</p>
              <p className="text-3xl font-black text-amber-700">{enRevision}</p>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-red-100 bg-red-50/50 shadow-sm overflow-hidden md:col-span-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600/80 uppercase tracking-wider mb-1">En Falla</p>
              <p className="text-3xl font-black text-red-700">{enFalla}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* BOTÓN PARA ACTIVAR MODO CREACIÓN */}
        <div className="md:col-span-1 flex items-stretch">
          <button 
            onClick={() => {
              setModoCreacion(!modoCreacion);
              setSillonSeleccionado(null);
              setPosicionFantasma(null);
            }}
            className={`w-full rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 shadow-sm
              ${modoCreacion 
                ? 'bg-slate-800 text-white hover:bg-slate-900 border-2 border-slate-900' 
                : 'bg-white border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500'}`}
          >
            {modoCreacion ? <X className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
            <span className="font-bold">{modoCreacion ? "Cancelar Creación" : "Instalar Nuevo Equipo"}</span>
          </button>
        </div>
      </div>

      {/* --- PANEL PRINCIPAL (IZQ: CONTROLES, DER: 3D) --- */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 w-full">
        
        {/* PANEL IZQUIERDO */}
        <div className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0">
          <Card className={`rounded-[2rem] border-slate-200 shadow-xl transition-all duration-500 overflow-hidden sticky top-6
            ${(sillonSeleccionado || modoCreacion) ? 'opacity-100 translate-y-0' : 'opacity-60 pointer-events-none'}`}>
            
            {/* Cabecera del Panel de Color Dinámico */}
            <div className={`h-3 w-full transition-colors duration-300 ${
              modoCreacion ? 'bg-blue-500' :
              sillonSeleccionado?.estado === 'operativo' ? 'bg-emerald-500' :
              sillonSeleccionado?.estado === 'revision' ? 'bg-amber-500' :
              sillonSeleccionado?.estado === 'falla' ? 'bg-red-500' : 'bg-slate-300'
            }`}></div>
            
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-between">
                {modoCreacion ? "Nuevo Equipo" : "Gestión de Equipo"}
                {sillonSeleccionado?.estado === 'falla' && !modoCreacion && <ShieldAlert className="text-red-500 h-7 w-7 animate-pulse" />}
                {modoCreacion && <MousePointerClick className="text-blue-500 h-7 w-7 animate-bounce" />}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              
              {/* --- VISTA DE CREACIÓN --- */}
              {modoCreacion ? (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-sm">
                    <Activity className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p>Haz clic en cualquier parte de la cuadrícula 3D para establecer las coordenadas del nuevo sillón.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador / Nombre *</label>
                      <input 
                        type="text" 
                        value={formNuevo.nombre}
                        onChange={(e) => setFormNuevo({...formNuevo, nombre: e.target.value})}
                        placeholder="Ej. Sillón 07" 
                        className="w-full mt-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</label>
                        <input 
                          type="text" 
                          value={formNuevo.marca}
                          onChange={(e) => setFormNuevo({...formNuevo, marca: e.target.value})}
                          placeholder="Sirona" 
                          className="w-full mt-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo</label>
                        <input 
                          type="text" 
                          value={formNuevo.modelo}
                          onChange={(e) => setFormNuevo({...formNuevo, modelo: e.target.value})}
                          placeholder="Intego" 
                          className="w-full mt-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Coordenadas Capturadas</label>
                      <div className="flex gap-2">
                        {['X', 'Y', 'Z'].map((eje, i) => (
                          <div key={eje} className="flex-1 bg-slate-100 rounded-xl p-2 text-center border border-slate-200">
                            <span className="block text-[10px] font-black text-slate-400">{eje}</span>
                            <span className="font-mono font-bold text-slate-700">
                              {posicionFantasma ? posicionFantasma[i].toFixed(1) : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={guardarNuevoSillon}
                      disabled={guardando || !posicionFantasma || !formNuevo.nombre}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-4 rounded-xl font-bold transition-colors mt-6 shadow-md hover:shadow-lg"
                    >
                      {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Registrar Equipo
                    </button>
                  </div>
                </div>

              // --- VISTA DE EDICIÓN NORMAL ---
              ) : sillonSeleccionado ? (
                <div className="space-y-8 animate-in slide-in-from-left-4">
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
                  
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Modificar Estado</p>
                      {guardando && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 relative">
                      {guardando && <div className="absolute inset-0 z-10 bg-white/40 rounded-xl"></div>}
                      
                      <button 
                        onClick={() => cambiarEstadoManual('operativo')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'operativo' ? 'bg-emerald-100 border-emerald-300 shadow-sm ring-1 ring-emerald-400 pointer-events-none' : 'bg-white hover:bg-slate-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'operativo' ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                          <CheckCircle2 className={`h-6 w-6 ${sillonSeleccionado.estado === 'operativo' ? 'text-emerald-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'operativo' ? 'text-emerald-800' : 'text-slate-600'}`}>Marcar Operativo</span>
                      </button>

                      <button 
                        onClick={() => cambiarEstadoManual('revision')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'revision' ? 'bg-amber-100 border-amber-300 shadow-sm ring-1 ring-amber-400 pointer-events-none' : 'bg-white hover:bg-slate-50 hover:border-amber-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'revision' ? 'bg-amber-200' : 'bg-slate-100'}`}>
                          <Wrench className={`h-6 w-6 ${sillonSeleccionado.estado === 'revision' ? 'text-amber-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'revision' ? 'text-amber-800' : 'text-slate-600'}`}>Enviar a Revisión</span>
                      </button>

                      <button 
                        onClick={() => cambiarEstadoManual('falla')}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          sillonSeleccionado.estado === 'falla' ? 'bg-red-100 border-red-300 shadow-sm ring-1 ring-red-400 pointer-events-none' : 'bg-white hover:bg-slate-50 hover:border-red-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sillonSeleccionado.estado === 'falla' ? 'bg-red-200' : 'bg-slate-100'}`}>
                          <Power className={`h-6 w-6 ${sillonSeleccionado.estado === 'falla' ? 'text-red-700' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-lg font-bold ${sillonSeleccionado.estado === 'falla' ? 'text-red-800' : 'text-slate-600'}`}>Reportar Falla</span>
                      </button>
                    </div>

                    {/* BOTÓN DE ELIMINAR */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button 
                        onClick={eliminarSillon}
                        disabled={guardando}
                        className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors font-bold"
                      >
                        {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        Eliminar Equipo del Sistema
                      </button>
                    </div>

                  </div>
                </div>

              // --- VISTA VACÍA ---
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

        {/* --- MAPA 3D --- */}
        <div className={`flex-grow bg-[#020617] rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[600px] lg:min-h-[850px] border ring-1 transition-colors duration-500 ${modoCreacion ? 'border-blue-500/50 ring-blue-500/30' : 'border-slate-800 ring-white/10'}`}>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-700 ${modoCreacion ? 'bg-blue-600/20' : 'bg-blue-500/10'}`}></div>
          </div>

          <div className="absolute top-6 left-6 z-10 bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              {modoCreacion ? <Plus className="h-6 w-6 text-blue-400" /> : <Activity className="h-6 w-6 text-blue-400" />}
              {modoCreacion ? "Instalación de Equipo" : "Gemelo Digital"}
            </h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${modoCreacion ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${modoCreacion ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
              </span>
              {modoCreacion ? "Haz clic en la cuadrícula" : "Sincronización en vivo"}
            </p>
          </div>

          <Canvas camera={{ position: [0, 8, 16], fov: 45 }}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
            <Environment preset="city" />
            
            <Grid renderOrder={-1} position={[0, 0, 0]} infiniteGrid cellSize={1} cellThickness={0.5} sectionSize={3} sectionThickness={1} sectionColor={modoCreacion ? [0.2, 0.6, 1.0] : [0.2, 0.4, 1.0]} cellColor={modoCreacion ? [0.1, 0.3, 0.6] : [0.1, 0.2, 0.5]} fadeDistance={40} fadeStrength={2} />
            <ContactShadows position={[0, 0.01, 0]} scale={30} resolution={512} blur={2.5} opacity={0.6} />
            
            {/* PLANO INVISIBLE PARA CAPTURAR CLICS EN MODO CREACIÓN */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, -0.05, 0]} 
              visible={false}
              onClick={(e) => {
                if (modoCreacion) {
                  e.stopPropagation();
                  // Redondear a intervalos de 0.5 para que encaje mejor en la cuadrícula
                  const x = Math.round(e.point.x * 2) / 2;
                  const z = Math.round(e.point.z * 2) / 2;
                  setPosicionFantasma([x, 0, z]);
                }
              }}
              onPointerOver={() => modoCreacion && (document.body.style.cursor = 'crosshair')}
              onPointerOut={() => modoCreacion && (document.body.style.cursor = 'auto')}
            >
              <planeGeometry args={[100, 100]} />
              <meshBasicMaterial />
            </mesh>

            {/* RENDERIZAR SILLONES EXISTENTES */}
            {sillones.map(sillon => (
              <Sillon3D key={sillon.id} datos={sillon} onClick={(s) => {
                if (!modoCreacion) setSillonSeleccionado(s);
              }} />
            ))}

            {/* RENDERIZAR SILLÓN FANTASMA SI HAY COORDENADAS */}
            {modoCreacion && posicionFantasma && (
              <Sillon3D 
                esFantasma={true} 
                datos={{ id: 999, nombre: formNuevo.nombre || "NUEVO", estado: 'operativo', posicion: posicionFantasma }} 
              />
            )}

            <OrbitControls enablePan={true} enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.1} />
          </Canvas>
        </div>

      </div>
    </div>
  )
}