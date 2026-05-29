"use client"

import { useState, useEffect } from "react"
import { TablaAsistencia } from "@/components/asistencia/TablaAsistencia"
import { RegistroManual } from "@/components/asistencia/RegistroManual"
import { GraficosAsistencia } from "@/components/asistencia/GraficosAsistencia"
import { AsignarHuella } from "@/components/asistencia/AsignarHuella"
import { GestionHuellas } from "@/components/asistencia/GestionHuellas" // <-- IMPORTAMOS EL NUEVO PANEL
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // <-- IMPORTAMOS LOS TABS
import { ActivitySquare, Fingerprint } from "lucide-react"

import { AsistenciaExport } from "@/components/exporters/asistencia-export"

export default function AsistenciaPage() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)

  const fetchAsistencias = async () => {
    try {
      const token = localStorage.getItem("access_token") || ""

      const res = await fetch("http://localhost:8000/api/asistencia/", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setRegistros(data.results || data) 
      } else {
        console.error("Error obteniendo registros. Status:", res.status)
      }
    } catch (error) {
      console.error("Error conectando con Django:", error)
    } finally {
      if (cargando) setCargando(false)
    }
  }

  useEffect(() => {
    fetchAsistencias()
    
    // Auto-recarga cada 5 segundos para efecto "Tiempo Real"
    const intervalId = setInterval(fetchAsistencias, 5000)
    return () => clearInterval(intervalId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Centro Biométrico
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor de ingresos y gestión de identidades del sistema.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           {/* BOTONES DE ACCIÓN GLOBAL */}
           <AsistenciaExport registros={registros} />
           <AsignarHuella onAsignacionExitosa={fetchAsistencias} />
           <RegistroManual onRegistroExitoso={fetchAsistencias} />
        </div>
      </div>

      {/* SISTEMA DE PESTAÑAS (TABS) */}
      <Tabs defaultValue="monitoreo" className="w-full">
        
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-100/50 dark:bg-slate-800/50">
          <TabsTrigger value="monitoreo" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <ActivitySquare className="w-4 h-4 mr-2" />
            Monitoreo en Vivo
          </TabsTrigger>
          <TabsTrigger value="gestion" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Fingerprint className="w-4 h-4 mr-2" />
            Gestión de Huellas
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 1: MONITOREO EN VIVO (Lo que ya tenías) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="monitoreo" className="space-y-8 animate-in fade-in duration-500">
          {/* ZONA DE GRÁFICOS */}
          {!cargando && registros.length > 0 && (
            <div className="w-full">
              <GraficosAsistencia registros={registros} />
            </div>
          )}

          {/* TABLA DE ASISTENCIA */}
          {cargando ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <TablaAsistencia 
                registrosIniciales={registros} 
                onRefresh={fetchAsistencias} 
              />
            </div>
          )}
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 2: GESTIÓN DE HUELLAS (El nuevo panel) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="gestion" className="animate-in fade-in duration-500">
          <GestionHuellas />
        </TabsContent>

      </Tabs>
      
    </div>
  )
}