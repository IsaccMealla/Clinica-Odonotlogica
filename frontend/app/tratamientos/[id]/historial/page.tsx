"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, User, Phone, AlertTriangle, Calendar, Activity, ChevronRight, Plus, ClipboardList } from "lucide-react"

// Si ya tienes este componente modificado para aceptar pacienteId predefinido, lo puedes importar:
// import { NuevoTratamiento } from "@/components/tratamientos/nuevo-tratamiento"

export default function HistorialClinicoPage() {
  const params = useParams()
  const router = useRouter()
  const pacienteId = params.id as string

  const [paciente, setPaciente] = useState<any>(null)
  const [tratamientos, setTratamientos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  const fetchHistorial = useCallback(async () => {
    try {
      setCargando(true)
      const token = localStorage.getItem("access_token")
      if (!token) return

      // 1. Obtener datos del paciente
      const resPac = await fetch(`http://127.0.0.1:8000/api/pacientes/${pacienteId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (resPac.ok) {
        setPaciente(await resPac.json())
      }

      // 2. Obtener todos los tratamientos y filtrar los de este paciente
      const resTrat = await fetch(`http://127.0.0.1:8000/api/tratamientos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (resTrat.ok) {
        const data = await resTrat.json()
        const todosLosTratamientos = Array.isArray(data) ? data : data.results || []
        
        // Filtramos estrictamente los que pertenecen a este paciente
        const tratamientosDelPaciente = todosLosTratamientos.filter(
          (t: any) => t.paciente.toString() === pacienteId.toString()
        )
        
        // Ordenamos del más reciente al más antiguo
        tratamientosDelPaciente.sort((a: any, b: any) => 
          new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
        )
        
        setTratamientos(tratamientosDelPaciente)
      }
    } catch (error) {
      console.error("Error cargando el historial clínico:", error)
    } finally {
      setCargando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    fetchHistorial()
  }, [fetchHistorial])

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'FINALIZADO': return 'bg-green-100 text-green-700 border-green-200'
      case 'DERIVADO': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'ABANDONADO': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">Cargando historial clínico integral...</p>
    </div>
  )

  if (!paciente) return (
    <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl max-w-lg mx-auto mt-10 border border-red-200">
      <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
      <h2 className="font-bold text-lg">Paciente no encontrado</h2>
      <p className="text-sm">No se pudieron cargar los datos de este paciente.</p>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline text-sm font-medium">Volver atrás</button>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER PACIENTE */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-6">
        <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 capitalize">
            {paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
            <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
              <User className="w-4 h-4 text-blue-500" /> CI: {paciente.ci || 'N/A'}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
              <Phone className="w-4 h-4 text-green-500" /> {paciente.telefono || 'Sin teléfono'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DATOS MÉDICOS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Activity className="w-5 h-5 text-blue-600" /> Ficha Médica
            </h3>
            
            <div className="space-y-5 text-sm">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Alergias Registradas</span>
                {paciente.alergias && paciente.alergias.toLowerCase() !== 'ninguna' ? (
                  <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span className="font-semibold">{paciente.alergias}</span>
                  </div>
                ) : (
                  <span className="font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-lg block border border-gray-100">Ninguna reportada</span>
                )}
              </div>

              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Enfermedades Base</span>
                <span className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg block border border-gray-100">
                  {paciente.enfermedades_base || 'Ninguna registrada'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-50">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1.5">Fecha de Nacimiento</span>
                <span className="font-medium text-gray-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> 
                  {paciente.fecha_nacimiento || 'No registrada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE TRATAMIENTOS */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Historial Odontológico</h2>
              <p className="text-sm text-gray-500 mt-1">Todos los tratamientos y procedimientos de este paciente.</p>
            </div>
            
            {/* Botón para abrir modal de nuevo tratamiento (Deberás conectarlo a tu componente NuevoTratamiento) */}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
              <Plus className="w-4 h-4" /> Iniciar Tratamiento
            </button>
          </div>

          {tratamientos.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">Sin tratamientos aún</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Este paciente es nuevo en la clínica o no se le han asignado planes de tratamiento todavía.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tratamientos.map((trat) => (
                <div 
                  key={trat.id} 
                  onClick={() => router.push(`/tratamientos/${trat.id}`)}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-lg capitalize">{trat.nombre_tratamiento}</h4>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getBadgeEstado(trat.estado)}`}>
                        {trat.estado.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(trat.creado_en).toLocaleDateString()}
                      </span>
                      {trat.diente_pieza && (
                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          Pieza: {trat.diente_pieza}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
                    <div className="flex items-center text-blue-600 text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1.5 rounded-lg">
                      Ver Expediente <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}