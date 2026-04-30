"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"

interface EvaluarAvanceProps {
  avance: any; // Puedes cambiar 'any' por la interfaz real de tu avance si la tienes
  onClose: () => void;
  onEvaluacionCompletada: () => void;
}

export function EvaluarAvance({ avance, onClose, onEvaluacionCompletada }: EvaluarAvanceProps) {
  const [cargando, setCargando] = useState(false)
  const [datosEvaluacion, setDatosEvaluacion] = useState({
    // 👇 ACTUALIZADO: usando las llaves exactas de SeguimientoAcademico
    estado_academico: 'APROBADO', 
    comentarios_docente: ''
  })

  const handleEnviarEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    const token = localStorage.getItem("access_token")

    try {
      // 👇 ACTUALIZADO: El payload ahora coincide con los campos de tu modelo en Django
      const payload = {
        estado_academico: datosEvaluacion.estado_academico,
        comentarios_docente: datosEvaluacion.comentarios_docente
      }

      const res = await fetch(`http://127.0.0.1:8000/api/avances-clinicos/${avance.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onEvaluacionCompletada() // Avisamos al componente padre que recargue los datos
        onClose() // Cerramos el modal
      } else {
        const errorData = await res.json()
        console.error("Error al evaluar:", errorData)
        alert(`Error al guardar: \n${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      alert("Error de conexión con el servidor.")
    } finally {
      setCargando(false)
    }
  }

  // Prevenimos clics accidentales fuera del modal para no perder lo escrito
  const handleFondoClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleFondoClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Evaluar Sesión Clínica
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleEnviarEvaluacion} className="p-5 space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Decisión</label>
            <select 
              required
              value={datosEvaluacion.estado_academico}
              onChange={(e) => setDatosEvaluacion({...datosEvaluacion, estado_academico: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700"
            >
              {/* 👇 ACTUALIZADO: Solo dejamos las opciones válidas del backend */}
              <option value="APROBADO">✅ Aprobar sin observaciones</option>
              <option value="RECHAZADO">❌ Rechazar / Con Observaciones</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Observaciones (Obligatorio si se rechaza o se observa)
            </label>
            <textarea 
              required={datosEvaluacion.estado_academico === 'RECHAZADO'}
              rows={4}
              placeholder="Escribe el feedback para el estudiante..."
              value={datosEvaluacion.comentarios_docente}
              onChange={(e) => setDatosEvaluacion({...datosEvaluacion, comentarios_docente: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-700 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={cargando}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-indigo-400"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {cargando ? 'Guardando...' : 'Confirmar Evaluación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}