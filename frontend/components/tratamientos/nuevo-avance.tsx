"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, X, Upload, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react"

interface NuevoAvanceProps {
  tratamientoId: string
  onAvanceCreado: () => void
}

export function NuevoAvance({ tratamientoId, onAvanceCreado }: NuevoAvanceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorBackend, setErrorBackend] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [descripcion, setDescripcion] = useState("")
  const [archivos, setArchivos] = useState<File[]>([])

  // Limpiar errores al abrir el modal
  useEffect(() => {
    if (isOpen) setErrorBackend(null)
  }, [isOpen])

  const getEstudianteId = () => {
    const token = localStorage.getItem("access_token")
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.user_id || payload.id // Intenta ambos por si acaso
    } catch { return null }
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDACIÓN DE ID: Si tu backend usa números, parseInt está bien. 
    // Si usa UUIDs (letras y números), usa tratamientoId directamente.
    const idFinal = isNaN(Number(tratamientoId)) ? tratamientoId : parseInt(tratamientoId)

    if (!idFinal) {
      setErrorBackend("ID DE TRATAMIENTO NO VÁLIDO.")
      return
    }

    setCargando(true)
    setErrorBackend(null)
    const token = localStorage.getItem("access_token")

    try {
      // PASO 1: Crear el Avance
      const resAvance = await fetch('http://127.0.0.1:8000/api/avances-clinicos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tratamiento: idFinal,
          estudiante: getEstudianteId(),
          descripcion_procedimiento: descripcion,
          fecha: new Date().toISOString().split('T')[0],
          firma_docente: false
        })
      })

      if (!resAvance.ok) {
        const errorData = await resAvance.json()
        throw new Error(JSON.stringify(errorData))
      }
      
      const avanceCreado = await resAvance.json()

      // PASO 2: Subir Fotos (Evidencias)
      if (archivos.length > 0) {
        for (const archivo of archivos) {
          const formData = new FormData()
          formData.append('avance_clinico', avanceCreado.id.toString())
          formData.append('archivo', archivo)
          
          await fetch('http://127.0.0.1:8000/api/evidencias/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          })
        }
      }

      // Éxito
      setDescripcion("")
      setArchivos([])
      setIsOpen(false)
      onAvanceCreado()

    } catch (error: any) {
      console.error("Error en el guardado:", error.message)
      setErrorBackend(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
      >
        <Plus className="w-4 h-4" /> Registrar Sesión
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Sesión Clínica</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-5">
              {errorBackend && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex gap-3 items-start animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-1">Error del servidor:</p>
                    <pre className="whitespace-pre-wrap font-mono bg-white/50 p-2 rounded border border-red-100 italic">
                      {errorBackend}
                    </pre>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Descripción del Procedimiento
                </label>
                <textarea 
                  required 
                  rows={4} 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Se realizó aislamiento absoluto y apertura cameral..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Evidencias (Fotos / Radiografías)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Haz clic para seleccionar archivos</p>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={(e) => e.target.files && setArchivos(Array.from(e.target.files))} 
                  />
                </div>
                
                {archivos.length > 0 && (
                   <div className="flex gap-2 flex-wrap mt-2">
                      {archivos.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 text-[11px] font-bold">
                          <ImageIcon className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{f.name}</span>
                        </div>
                      ))}
                   </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={cargando} 
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:bg-blue-300 transition-all active:scale-95"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : "Guardar Avance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}