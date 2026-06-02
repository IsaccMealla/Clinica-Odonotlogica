"use client"

import { useEffect, useState } from "react"
import { MALLA_ODONTOLOGIA, getRecordAcademico, saveRecordAcademico, calcularEstadoMateria, MateriaEstado, RecordEstudiante } from "@/lib/malla-curricular-store"
import { CheckCircle2, Lock, BookOpen, AlertCircle } from "lucide-react"

export function MallaCurricularUI() {
  const [record, setRecord] = useState<RecordEstudiante | null>(null)

  useEffect(() => {
    setRecord(getRecordAcademico())
    const listener = () => setRecord(getRecordAcademico())
    window.addEventListener('academico-update', listener)
    return () => window.removeEventListener('academico-update', listener)
  }, [])

  if (!record) return null

  // Agrupar materias por semestre
  const semestres = [5, 6, 7, 8]

  const handleChangeEstado = (materiaId: string) => {
    const estadoActual = calcularEstadoMateria(materiaId, record)
    if (estadoActual === 'BLOQUEADA') return // No se puede interactuar con las bloqueadas directamente

    let nuevoEstado: MateriaEstado = 'APROBADA'
    if (estadoActual === 'APROBADA') nuevoEstado = 'REPROBADA'
    else if (estadoActual === 'REPROBADA') nuevoEstado = 'PENDIENTE'
    else if (estadoActual === 'PENDIENTE') nuevoEstado = 'CURSANDO'
    else if (estadoActual === 'CURSANDO') nuevoEstado = 'APROBADA'

    const nuevoHistorial = { ...record.historial, [materiaId]: nuevoEstado }
    
    // Si la materia es REPROBADA o PENDIENTE, debemos limpiar en cascada (o dejar que el store las calcule como bloqueadas)
    // El motor de `calcularEstadoMateria` automáticamente bloqueará las dependientes, pero para no tener inconsistencias
    // en el historial guardado, podemos eliminar el estado de las materias dependientes si su prerequisito se reprueba.
    if (nuevoEstado === 'REPROBADA' || nuevoEstado === 'PENDIENTE') {
      MALLA_ODONTOLOGIA.forEach(m => {
        if (m.prerequisitos.includes(materiaId)) {
          delete nuevoHistorial[m.id]
        }
      })
    }

    const nuevoRecord = { ...record, historial: nuevoHistorial }
    setRecord(nuevoRecord)
    saveRecordAcademico(nuevoRecord)
  }

  const getEstiloEstado = (estado: MateriaEstado) => {
    switch (estado) {
      case 'APROBADA': return "bg-green-100 border-green-500 text-green-800 hover:bg-green-200"
      case 'REPROBADA': return "bg-red-100 border-red-500 text-red-800 hover:bg-red-200"
      case 'CURSANDO': return "bg-clinica-primary/10 border-clinica-primary text-clinica-primary hover:bg-clinica-primary/20"
      case 'BLOQUEADA': return "bg-gray-100 border-gray-300 text-gray-400 opacity-70 cursor-not-allowed"
      case 'PENDIENTE': return "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
    }
  }

  const getIconoEstado = (estado: MateriaEstado) => {
    switch (estado) {
      case 'APROBADA': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'REPROBADA': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'CURSANDO': return <BookOpen className="w-4 h-4 text-clinica-primary" />
      case 'BLOQUEADA': return <Lock className="w-4 h-4 text-gray-400" />
      case 'PENDIENTE': return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Malla Curricular / Expediente Académico</h1>
          <p className="text-slate-500">Simulador interactivo de pre-requisitos troncales (Haz clic en una materia para cambiar su estado)</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-500">Estudiante</div>
          <div className="text-lg font-bold text-clinica-primary">{record.nombre}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm font-medium">
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Aprobada</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Reprobada</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-clinica-primary rounded-full"></div> Cursando</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-full"></div> Bloqueada</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {semestres.map(semestre => {
          const materiasSemestre = MALLA_ODONTOLOGIA.filter(m => m.semestre === semestre)
          
          return (
            <div key={semestre} className="flex flex-col gap-3">
              <h3 className="font-black text-slate-700 bg-slate-200 text-center py-2 rounded-lg">SEMESTRE {semestre}</h3>
              {materiasSemestre.map(materia => {
                const estado = calcularEstadoMateria(materia.id, record)
                
                return (
                  <button
                    key={materia.id}
                    onClick={() => handleChangeEstado(materia.id)}
                    className={`text-left p-3 rounded-lg border-2 transition-all flex flex-col justify-between min-h-[90px] shadow-sm ${getEstiloEstado(estado)}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] font-bold opacity-70 mb-1">{materia.id}</span>
                      {getIconoEstado(estado)}
                    </div>
                    <span className="font-semibold text-sm leading-tight">{materia.nombre}</span>
                    {materia.prerequisitos.length > 0 && (
                      <span className="text-[9px] mt-1 opacity-60">Req: {materia.prerequisitos.join(', ')}</span>
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
