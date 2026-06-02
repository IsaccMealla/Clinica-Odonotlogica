// FILE: components/seguridad/PanelDocenteSupervision.tsx
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Users, Activity,
  ToggleLeft, ToggleRight, Bell, TrendingUp, Armchair
} from "lucide-react"
import {
  obtenerSolicitudesPendientes,
  obtenerSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
  obtenerPermisosProactivos,
  togglePermisoProactivo,
  obtenerStatsHoy,
  getEstudiantesDemo,
  SILLONES_CLINICOS,
  MODULOS_SUPERVISABLES,
  type SolicitudDocente,
  type PermisoProactivo
} from "@/lib/supervision-store"

export function PanelDocenteSupervision() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudDocente[]>([])
  const [historial, setHistorial] = useState<SolicitudDocente[]>([])
  const [permisos, setPermisos] = useState<PermisoProactivo[]>([])
  const [statsHoy, setStatsHoy] = useState({ fecha: '', procedimientos: 0 })
  const [estudiantesDocente, setEstudiantesDocente] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'bandeja' | 'estudiantes' | 'dashboard'>('dashboard')
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas')
  // IDs de solicitudes que están parpadeando en rojo
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set())

  const materiasDocente = ['Todas', 'Clínica de Operatoria I', 'Clínica de Endodoncia', 'Cirugía Bucal']

  const docenteId = "1"
  const docenteNombre = "Dr. Jaimes"
  const metaProc = 20 // Meta de procedimientos diarios

  const cargarDatos = useCallback(() => {
    setSolicitudesPendientes(obtenerSolicitudesPendientes())
    setHistorial(obtenerSolicitudes().filter(s => s.estado !== 'PENDIENTE').slice(-15).reverse())
    setPermisos(obtenerPermisosProactivos())
    setStatsHoy(obtenerStatsHoy())
    setEstudiantesDocente(getEstudiantesDemo())
  }, [])

  useEffect(() => {
    cargarDatos()
    const handler = () => cargarDatos()
    window.addEventListener('supervision-update', handler)
    const interval = setInterval(cargarDatos, 2000)
    return () => {
      window.removeEventListener('supervision-update', handler)
      clearInterval(interval)
    }
  }, [cargarDatos])

  // ==========================================
  // NOTIFICACIÓN CON AUDIO — Alerta sonora médica limpia
  // Usa AudioContext sintetizado (0.3 seg) al recibir nueva solicitud
  // La tarjeta del alumno parpadea en rojo en la bandeja en tiempo real
  // ==========================================
  const prevSolicitudesCount = useRef(0)
  const prevSolicitudesIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const currentIds = new Set(solicitudesPendientes.map(s => s.id))
    
    // Detectar nuevas solicitudes (que no existían antes)
    const nuevasIds: string[] = []
    currentIds.forEach(id => {
      if (!prevSolicitudesIds.current.has(id)) {
        nuevasIds.push(id)
      }
    })

    if (nuevasIds.length > 0 && prevSolicitudesIds.current.size > 0) {
      // Marcar las nuevas para parpadeo rojo
      setFlashingIds(prev => {
        const next = new Set(prev)
        nuevasIds.forEach(id => next.add(id))
        return next
      })

      // Quitar el parpadeo después de 6 segundos
      setTimeout(() => {
        setFlashingIds(prev => {
          const next = new Set(prev)
          nuevasIds.forEach(id => next.delete(id))
          return next
        })
      }, 6000)

      // Reproducir alerta sonora médica limpia
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Tono 1: Alerta suave ascendente (tipo notificación clínica)
        const osc1 = audioCtx.createOscillator()
        const gain1 = audioCtx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(660, audioCtx.currentTime) // E5
        osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08) // A5
        gain1.gain.setValueAtTime(0, audioCtx.currentTime)
        gain1.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.03)
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
        osc1.connect(gain1)
        gain1.connect(audioCtx.destination)
        osc1.start(audioCtx.currentTime)
        osc1.stop(audioCtx.currentTime + 0.2)

        // Tono 2: Segundo ping (doble alerta médica)
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15) // A5
        osc2.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.22) // E6
        gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.15)
        gain2.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.18)
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.start(audioCtx.currentTime + 0.15)
        osc2.stop(audioCtx.currentTime + 0.35)
      } catch (e) {
        console.log('AudioContext error:', e)
      }
    }

    prevSolicitudesCount.current = solicitudesPendientes.length
    prevSolicitudesIds.current = currentIds
  }, [solicitudesPendientes])

  const handleAprobar = (id: string) => {
    aprobarSolicitud(id, docenteId, docenteNombre)
    setFlashingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    cargarDatos()
  }

  const handleRechazar = (id: string) => {
    rechazarSolicitud(id, docenteId, docenteNombre)
    setFlashingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    cargarDatos()
  }

  const handleTogglePermiso = (estudianteId: string, modulo: string) => {
    togglePermisoProactivo(estudianteId, modulo, docenteId, docenteNombre)
    cargarDatos()
  }

  const tienePermiso = (estudianteId: string, modulo: string): boolean => {
    return permisos.some(p => p.estudianteId === estudianteId && p.modulo === modulo && p.habilitado)
  }

  // Datos para gráficos
  const avancePorEstudiante = estudiantesDocente.map(est => {
    const aprobados = obtenerSolicitudes().filter(s => s.estudianteId === est.id && s.estado === 'APROBADO').length
    return { ...est, aprobados, meta: 8 }
  })

  const sillonesOcupados = SILLONES_CLINICOS.filter(s => s.ocupado).length
  const sillonesLibres = SILLONES_CLINICOS.filter(s => !s.ocupado).length
  const progresoProcedimientos = Math.min((statsHoy.procedimientos / metaProc) * 100, 100)

  return (
    <div className="space-y-6">
      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <TrendingUp className="w-4 h-4" /> Cuadro de Mando
        </button>
        <button
          onClick={() => setActiveTab('bandeja')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all relative ${activeTab === 'bandeja' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Bell className="w-4 h-4" /> Bandeja de Solicitudes
          {solicitudesPendientes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {solicitudesPendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('estudiantes')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'estudiantes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users className="w-4 h-4" /> Control de Estudiantes
        </button>
      </div>

      {/* ==================== TAB 1: CUADRO DE MANDO ==================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Fila de indicadores principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* TARJETA: Procedimientos Supervisados Hoy */}
            <Card className="border-emerald-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Procedimientos Supervisados Hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-end justify-between mb-3">
                  <span className="text-4xl font-black text-emerald-700">{statsHoy.procedimientos}</span>
                  <span className="text-sm text-slate-500 font-semibold">/ {metaProc} meta</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progresoProcedimientos}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">{Math.round(progresoProcedimientos)}% completado</p>
              </CardContent>
            </Card>

            {/* TARJETA: Sillones Clínicos */}
            <Card className="border-blue-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Armchair className="w-4 h-4" /> Sillones Clínicos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <span className="text-3xl font-black text-blue-700">{sillonesOcupados}</span>
                    <p className="text-[10px] font-bold text-blue-500 uppercase">Ocupados</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black text-slate-400">{sillonesLibres}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Libres</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {SILLONES_CLINICOS.map(s => (
                    <div key={s.id} className="relative group" title={s.ocupado ? `${s.nombre} - ${s.estudiante}` : `${s.nombre} - Libre`}>
                      <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${s.ocupado ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'}`}>
                        <Armchair className="w-4 h-4" />
                      </div>
                      <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {s.ocupado ? s.estudiante : 'Libre'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* TARJETA: Solicitudes Pendientes */}
            <Card className="border-amber-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Solicitudes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-center">
                  <span className="text-5xl font-black text-amber-600">{solicitudesPendientes.length}</span>
                  <p className="text-sm text-slate-500 font-medium mt-1">en espera de revisión</p>
                </div>
                {solicitudesPendientes.length > 0 && (
                  <Button onClick={() => setActiveTab('bandeja')} className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white text-sm">
                    Ir a la Bandeja →
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* GRÁFICO: Avance Académico por Estudiante (Barras CSS) */}
          <Card className="border-indigo-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-6 py-4">
              <CardTitle className="text-base font-bold text-indigo-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Cupos Académicos y Avance por Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {avancePorEstudiante.map(est => {
                const pct = Math.min((est.aprobados / est.meta) * 100, 100)
                return (
                  <div key={est.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {est.nombre.charAt(5)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{est.nombre}</p>
                          <p className="text-[10px] text-slate-400">Paciente: {est.paciente} • {est.sillon}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-indigo-700">{est.aprobados} / {est.meta}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-400 to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB 2: BANDEJA DE SOLICITUDES ==================== */}
      {activeTab === 'bandeja' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Solicitudes Pendientes */}
          <Card className="border-amber-200 shadow-md">
            <CardHeader className="bg-amber-50 border-b border-amber-100">
              <CardTitle className="text-base font-bold text-amber-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Solicitudes Pendientes ({solicitudesPendientes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {solicitudesPendientes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                  <p className="text-sm font-medium">No hay solicitudes pendientes</p>
                  <p className="text-xs">Todos los estudiantes tienen sus permisos al día.</p>
                </div>
              ) : (
                solicitudesPendientes.map(sol => {
                  const isFlashing = flashingIds.has(sol.id)
                  return (
                    <div
                      key={sol.id}
                      className={`flex items-center justify-between rounded-xl p-4 hover:shadow-md transition-all duration-300 ${
                        isFlashing
                          ? 'bg-red-100 border-2 border-red-500 animate-pulse shadow-lg shadow-red-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isFlashing && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isFlashing ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}>
                            {sol.modulo.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(sol.timestamp).toLocaleTimeString('es-ES')}</span>
                          {isFlashing && <span className="text-[10px] font-bold text-red-600 animate-pulse">🔴 NUEVA SOLICITUD</span>}
                        </div>
                        <p className={`text-sm font-semibold ${isFlashing ? 'text-red-800' : 'text-slate-800'}`}>{sol.estudianteNombre}</p>
                        <p className="text-xs text-slate-500">Acción: {sol.accion} {sol.pacienteNombre && `• Paciente: ${sol.pacienteNombre}`}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button onClick={() => handleAprobar(sol.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                        </Button>
                        <Button onClick={() => handleRechazar(sol.id)} size="sm" variant="destructive" className="shadow-sm">
                          <XCircle className="w-4 h-4 mr-1" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Historial reciente */}
          {historial.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-600">Historial Reciente</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                {historial.map(sol => (
                  <div key={sol.id} className={`flex items-center justify-between text-xs p-3 rounded-lg border ${sol.estado === 'APROBADO' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                      <p className="font-semibold text-slate-700">{sol.estudianteNombre} — {sol.accion}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sol.timestampRespuesta && new Date(sol.timestampRespuesta).toLocaleString('es-ES')}</p>
                    </div>
                    <span className={`font-bold ${sol.estado === 'APROBADO' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sol.estado === 'APROBADO' ? '✓ Aprobado' : '✗ Rechazado'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ==================== TAB 3: CONTROL DE ESTUDIANTES (PERMISOS PROACTIVOS) ==================== */}
      {activeTab === 'estudiantes' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-blue-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Estudiantes a Cargo — Agrupados por Materia
                  </CardTitle>
                  <p className="text-xs text-blue-600 mt-1">Habilita módulos individualmente para cada estudiante con un solo clic. Los botones en su pantalla se desbloquean en tiempo real.</p>
                </div>
                <select
                  className="px-3 py-1.5 text-sm border-blue-200 rounded-md text-blue-800 bg-white"
                  value={filtroMateria}
                  onChange={(e) => setFiltroMateria(e.target.value)}
                >
                  {materiasDocente.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {Object.entries(
                estudiantesDocente
                  .filter(est => filtroMateria === 'Todas' || est.materia === filtroMateria)
                  .reduce((acc, est) => {
                    if (!acc[est.materia]) acc[est.materia] = []
                    acc[est.materia].push(est)
                    return acc
                  }, {} as Record<string, typeof estudiantesDocente>)
              ).map(([materia, estudiantes]) => (
                <div key={materia} className="space-y-4">
                  <h3 className="font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-md border border-slate-200">
                    {materia} <span className="text-sm font-normal text-slate-500 ml-2">({estudiantes.length} estudiantes)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {estudiantes.map(est => (
                      <div key={est.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {est.nombre.slice(5, 7)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{est.nombre}</p>
                              <p className="text-xs text-slate-400">Paciente: {est.paciente} • Sillón: {est.sillon}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">ID Estudiante</p>
                            <p className="text-xs font-mono text-slate-600">#{est.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {MODULOS_SUPERVISABLES.map(mod => {
                            const activo = tienePermiso(est.id, mod.key)
                            return (
                              <button
                                key={mod.key}
                                onClick={() => handleTogglePermiso(est.id, mod.key)}
                                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${activo
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                  }`}
                              >
                                {activo ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                )}
                                <span className="truncate">{mod.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}