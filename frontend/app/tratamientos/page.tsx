"use client"

import { useState, useEffect, useCallback } from "react"
import { NuevoTratamiento } from "@/components/tratamientos/nuevo-tratamiento"
import { TablaTratamientos } from "@/components/tratamientos/tabla-tratamientos" // Asegúrate que el nombre del archivo coincida
import { Loader2, ClipboardList } from "lucide-react"

export interface Tratamiento {
  id: string
  paciente: number | string
  paciente_nombre_completo?: string 
  estudiante: number | string
  estudiante_nombre_completo?: string // Para que el docente vea quién es el operador
  nombre_tratamiento: string
  diente_pieza: string | null
  estado: 'EN_PROGRESO' | 'FINALIZADO' | 'DERIVADO' | 'ABANDONADO'
  creado_en: string
  actualizado_en: string
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    console.error("Error al decodificar JWT:", e);
    return null;
  }
}

import { TratamientosExport } from "@/components/exporters/tratamientos-export"

export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [cargando, setCargando] = useState(true)

  const fetchTratamientos = useCallback(async () => {
    try {
      setCargando(true)
      const token = localStorage.getItem("access_token")
      
      if (!token) return

      // 1. IDENTIFICAR ROL
      let rolActual = localStorage.getItem("user_role")?.toUpperCase().trim() || "";
      if (!rolActual) {
        const decoded = parseJwt(token);
        rolActual = (decoded?.rol || decoded?.role || "").toUpperCase().trim();
      }

      // 2. DETERMINAR URL (Lógica igual a Mis Pacientes)
      const isEstudiante = rolActual.includes("ESTUDIANTE");
      const urlBase = 'http://127.0.0.1:8000/api/tratamientos/';
      const urlFetch = isEstudiante ? `${urlBase}mis_asignaciones/` : urlBase;

      const res = await fetch(urlFetch, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        // 3. ASIGNAR DIRECTAMENTE (Sin filtros manuales en el front)
        const lista = Array.isArray(data) ? data : data.results || []
        setTratamientos(lista)
      }
    } catch (error) {
      console.error("Error de red:", error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    fetchTratamientos()
  }, [fetchTratamientos])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-balance">
            Gestión de Tratamientos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Planes de tratamiento clínicos, estados y seguimiento de avances.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <TratamientosExport tratamientos={tratamientos} />
          <NuevoTratamiento onTratamientoCreado={fetchTratamientos} />
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="animate-pulse">Cargando datos clínicos...</p>
        </div>
      ) : tratamientos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50/50">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay tratamientos registrados</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            {/* Mensaje dinámico según si es estudiante o no */}
            No se encontraron registros de tratamientos en el sistema actualmente.
          </p>
        </div>
      ) : (
        <TablaTratamientos tratamientosIniciales={tratamientos} onRefresh={fetchTratamientos} />
      )}
    </div>
  )
}