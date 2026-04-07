"use client"

import { useState, useEffect, useCallback } from "react"
// Estos componentes los crearemos en el siguiente paso en components/tratamientos/
import { NuevoTratamiento } from "@/components/tratamientos/nuevo-tratamiento"
import { TablaTratamientos } from "@/components/tratamientos/tabla-tratamientos"
import { Loader2, ClipboardList } from "lucide-react"

// Definimos la interfaz basada en tu modelo de Django actualizado
export interface Tratamiento {
  id: string
  paciente: number | string // Depende de si el serializador devuelve el ID o el objeto anidado
  paciente_nombre_completo?: string // 👈 ¡AQUÍ ESTÁ EL CAMPO NUEVO PARA EL NOMBRE!
  estudiante: number | string
  nombre_tratamiento: string
  diente_pieza: string | null
  estado: 'EN_PROGRESO' | 'FINALIZADO' | 'DERIVADO' | 'ABANDONADO'
  creado_en: string
  actualizado_en: string
}

export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [cargando, setCargando] = useState(true)

  // Función estable para obtener los tratamientos
  const fetchTratamientos = useCallback(async () => {
    try {
      setCargando(true)
      
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        console.error("No se encontró el token de acceso.")
        return
      }

      const res = await fetch('http://127.0.0.1:8000/api/tratamientos/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setTratamientos(Array.isArray(data) ? data : data.results || [])
      } else {
        console.error("Error al obtener tratamientos. Status:", res.status)
      }
    } catch (error) {
      console.error("Error de red al conectar con Django:", error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    fetchTratamientos()
  }, [fetchTratamientos])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestión de Tratamientos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Supervisa los planes de tratamiento clínicos, su estado y asignaciones.
          </p>
        </div>
        
        {/* Pasamos la función fetchTratamientos para refrescar tras crear uno nuevo */}
        <NuevoTratamiento onTratamientoCreado={fetchTratamientos} />
      </div>

      {/* Área de Contenido */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="animate-pulse">Cargando expedientes clínicos...</p>
        </div>
      ) : tratamientos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay tratamientos activos</h3>
          <p className="text-gray-500">Comienza asignando un plan de tratamiento a un paciente.</p>
        </div>
      ) : (
        <TablaTratamientos tratamientosIniciales={tratamientos} onRefresh={fetchTratamientos} />
      )}
    </div>
  )
}