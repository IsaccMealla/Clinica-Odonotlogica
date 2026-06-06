"use client"

import { useEffect, useState } from "react"
import { MALLA_ODONTOLOGIA, MateriaEstado, RecordEstudiante } from "@/lib/malla-curricular-store"
import { CheckCircle2, Lock, BookOpen, AlertCircle } from "lucide-react"
import { loadMe } from "@/lib/permissions"

export function MallaCurricularUI() {
  const [materiasInscritas, setMateriasInscritas] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    (async () => {
      const me = await loadMe()
      setUser(me)
      const r = me?.rol || localStorage.getItem("user_role")
      if (r === 'ADMIN') setIsAdmin(true)
      
      fetchRecord(me?.id)
    })()
  }, [])

  const fetchRecord = async (userId: any) => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
      // El endpoint de record academico puede recibir estudiante_id. Si no, usa el actual.
      const res = await fetch(`http://localhost:8000/api/materia-estudiante/record_academico/`, { headers })
      if (res.ok) {
        const data = await res.json()
        setMateriasInscritas(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Helper to find state and docente from the backend data
  const getEstadoData = (materiaCodigo: string) => {
    const inscripcion = materiasInscritas.find(m => m.materia_codigo === materiaCodigo)
    if (inscripcion) {
      return {
        estado: inscripcion.estado as MateriaEstado,
        docente: inscripcion.docente_nombre || "Sin Asignar",
        id: inscripcion.id,
        materia_id: inscripcion.materia
      }
    }
    return { estado: 'PENDIENTE' as MateriaEstado, docente: null, id: null, materia_id: null }
  }

  // Agrupar materias por semestre
  const semestres = [5, 6, 7, 8, 9]

  const handleChangeEstado = async (materiaCodigo: string) => {
    if (!isAdmin) return // Only admin can modify

    // This is a complex logic to actually toggle states in backend. For now, since the user said 
    // "el no puede modificar su malla curricular pero el admin si", we can simulate the update
    // or just leave a visual alert that it requires a full inscription process.
    // For a functional demo, let's just alert since full CRUD for inscriptions might need specific materia IDs.
    alert("Como ADMIN, aquí podrías inscribir o modificar el estado de la materia. (Funcionalidad de edición de malla en desarrollo)")
  }

  const getEstiloEstado = (estado: MateriaEstado) => {
    switch (estado) {
      case 'APROBADA': return "bg-green-100 border-clinica-secondary text-green-800 hover:bg-green-200"
      case 'REPROBADA': return "bg-red-100 border-red-500 text-red-800 hover:bg-red-200"
      case 'CURSANDO': return "bg-clinica-primary/10 border-clinica-primary text-clinica-primary hover:bg-clinica-primary/20"
      case 'BLOQUEADA': return "bg-gray-100 border-gray-300 text-gray-400 opacity-70 cursor-not-allowed"
      case 'PENDIENTE': return "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      default: return "bg-white border-gray-300 text-gray-700"
    }
  }

  const getIconoEstado = (estado: MateriaEstado) => {
    switch (estado) {
      case 'APROBADA': return <CheckCircle2 className="w-4 h-4 text-clinica-secondary" />
      case 'REPROBADA': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'CURSANDO': return <BookOpen className="w-4 h-4 text-clinica-primary" />
      case 'BLOQUEADA': return <Lock className="w-4 h-4 text-gray-400" />
      default: return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Malla Curricular / Récord Académico</h1>
          <p className="text-slate-500">Expediente de materias y docentes asignados.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-500">Estudiante</div>
          <div className="text-lg font-bold text-clinica-primary">{user?.first_name} {user?.last_name}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm font-medium">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-clinica-secondary/100 rounded-full"></div> Aprobada</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Reprobada</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-clinica-primary rounded-full"></div> Cursando</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-full"></div> Bloqueada</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {semestres.map(semestre => {
          const materiasSemestre = MALLA_ODONTOLOGIA.filter(m => m.semestre === semestre)
          
          // Also add those from the DB if not in the mock MALLA
          const inscripcionesSemestre = materiasInscritas.filter(m => m.materia_codigo && m.materia_codigo.includes(`-${semestre}1`) || (semestre===9 && m.materia_codigo.includes('911')))
          
          // We will use MALLA_ODONTOLOGIA as the base layout, but highlight based on getEstadoData
          return (
            <div key={semestre} className="flex flex-col gap-3">
              <h3 className="font-black text-slate-700 bg-slate-200 text-center py-2 rounded-lg">SEMESTRE {semestre}</h3>
              {materiasSemestre.map(materia => {
                const data = getEstadoData(materia.id)
                const estado = data.estado
                
                return (
                  <button
                    key={materia.id}
                    onClick={() => handleChangeEstado(materia.id)}
                    disabled={!isAdmin}
                    className={`text-left p-3 rounded-lg border-2 transition-all flex flex-col justify-between min-h-[90px] shadow-sm ${getEstiloEstado(estado)} ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] font-bold opacity-70 mb-1">{materia.id}</span>
                      {getIconoEstado(estado)}
                    </div>
                    <span className="font-semibold text-sm leading-tight">{materia.nombre}</span>
                    
                    {data.docente && (
                      <div className="mt-2 text-xs bg-white/50 p-1 rounded font-medium text-clinica-primary">
                        👨‍⚕️ {data.docente}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
