"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Users, Activity,
  ToggleLeft, ToggleRight, Bell, TrendingUp, Armchair
} from "lucide-react"

export function PanelDocenteSupervision() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState<'bandeja' | 'estudiantes' | 'dashboard'>('dashboard')
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set())

  const prevSolicitudesIds = useRef<Set<string>>(new Set())

  const cargarDatos = useCallback(async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
      
      const [resPend, resHistorial] = await Promise.all([
        fetch('http://localhost:8000/api/solicitud-guardado/pendientes/', { headers }),
        fetch('http://localhost:8000/api/solicitud-guardado/', { headers })
      ])
      
      if (resPend.ok) {
        const pendientes = await resPend.json()
        setSolicitudesPendientes(pendientes)
      }
      if (resHistorial.ok) {
        const h = await resHistorial.json()
        // Filtrar los que no están pendientes y tomar los últimos 15
        const cerrados = h.filter((s: any) => s.estado !== 'PENDIENTE').slice(-15)
        setHistorial(cerrados)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
    const interval = setInterval(cargarDatos, 3000)
    return () => clearInterval(interval)
  }, [cargarDatos])

  useEffect(() => {
    const currentIds = new Set(solicitudesPendientes.map(s => s.id.toString()))
    
    const nuevasIds: string[] = []
    currentIds.forEach(id => {
      if (!prevSolicitudesIds.current.has(id)) {
        nuevasIds.push(id)
      }
    })

    if (nuevasIds.length > 0 && prevSolicitudesIds.current.size > 0) {
      setFlashingIds(prev => {
        const next = new Set(prev)
        nuevasIds.forEach(id => next.add(id))
        return next
      })

      setTimeout(() => {
        setFlashingIds(prev => {
          const next = new Set(prev)
          nuevasIds.forEach(id => next.delete(id))
          return next
        })
      }, 6000)

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc1 = audioCtx.createOscillator()
        const gain1 = audioCtx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(660, audioCtx.currentTime)
        osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08)
        gain1.gain.setValueAtTime(0, audioCtx.currentTime)
        gain1.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.03)
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
        osc1.connect(gain1)
        gain1.connect(audioCtx.destination)
        osc1.start(audioCtx.currentTime)
        osc1.stop(audioCtx.currentTime + 0.2)

        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15)
        osc2.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.22)
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

    prevSolicitudesIds.current = currentIds
  }, [solicitudesPendientes])

  const handleAprobar = async (id: string) => {
    try {
      const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        'Content-Type': 'application/json'
      }
      // Damos 30 minutos de permiso por defecto
      await fetch(`http://localhost:8000/api/solicitud-guardado/${id}/aprobar/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tiempo_ventana_minutos: 30 })
      })
      setFlashingIds(prev => { const n = new Set(prev); n.delete(id); return n })
      cargarDatos()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRechazar = async (id: string) => {
    try {
      const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        'Content-Type': 'application/json'
      }
      const justificacion = prompt("Justificación del rechazo:") || "Sin justificación"
      await fetch(`http://localhost:8000/api/solicitud-guardado/${id}/rechazar/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ justificacion })
      })
      setFlashingIds(prev => { const n = new Set(prev); n.delete(id); return n })
      cargarDatos()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
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
      </div>

      {activeTab === 'bandeja' && (
        <div className="space-y-4 animate-in fade-in duration-300">
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
                </div>
              ) : (
                solicitudesPendientes.map((sol: any) => {
                  const isFlashing = flashingIds.has(sol.id.toString())
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
                            {sol.tipo_guardado.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(sol.fecha_solicitud).toLocaleTimeString('es-ES')}</span>
                          {isFlashing && <span className="text-[10px] font-bold text-red-600 animate-pulse">🔴 NUEVA SOLICITUD</span>}
                        </div>
                        <p className={`text-sm font-semibold ${isFlashing ? 'text-red-800' : 'text-slate-800'}`}>{sol.estudiante_nombre}</p>
                        <p className="text-xs text-slate-500">Materia: {sol.materia_nombre} {sol.paciente_nombre && `• Paciente: ${sol.paciente_nombre}`}</p>
                        <p className="text-xs text-slate-500 italic mt-1">"{sol.descripcion}"</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button onClick={() => handleAprobar(sol.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar (30m)
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

          {historial.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-600">Historial Reciente</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                {historial.map((sol: any) => (
                  <div key={sol.id} className={`flex items-center justify-between text-xs p-3 rounded-lg border ${sol.estado === 'APROBADO' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                      <p className="font-semibold text-slate-700">{sol.estudiante_nombre} — {sol.tipo_guardado}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sol.fecha_respuesta && new Date(sol.fecha_respuesta).toLocaleString('es-ES')}</p>
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
    </div>
  )
}