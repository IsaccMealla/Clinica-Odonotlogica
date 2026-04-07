// Archivo: components/tratamientos/editar-avance.tsx
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Upload, Loader2, Image as ImageIcon, Trash2 } from "lucide-react"

interface Evidencia {
  id: number
  archivo: string
}

interface EditarAvanceProps {
  avance: any
  isOpen: boolean
  onClose: () => void
  onActualizar: () => void
}

export function EditarAvance({ avance, isOpen, onClose, onActualizar }: EditarAvanceProps) {
  const [cargando, setCargando] = useState(false)
  const [cargandoImgs, setCargandoImgs] = useState(true)
  const [descripcion, setDescripcion] = useState(avance?.descripcion_procedimiento || "")
  
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<Evidencia[]>([])
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([])
  const [idsAEliminar, setIdsAEliminar] = useState<Set<number>>(new Set())
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Cargar imágenes que ya existen
  const fetchEvidencias = useCallback(async () => {
    if (!avance?.id) return
    try {
      setCargandoImgs(true)
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/evidencias/?avance_clinico=${avance.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEvidenciasExistentes(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error("Error cargando evidencias:", error)
    } finally {
      setCargandoImgs(false)
    }
  }, [avance?.id])

  useEffect(() => {
    if (isOpen) {
      fetchEvidencias()
      setDescripcion(avance?.descripcion_procedimiento || "")
      setArchivosNuevos([])
      setIdsAEliminar(new Set())
    }
  }, [isOpen, avance, fetchEvidencias])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivosNuevos(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleRemoveExisting = (evidencia: Evidencia) => {
    setIdsAEliminar(prev => new Set(prev).add(evidencia.id))
    setEvidenciasExistentes(prev => prev.filter(e => e.id !== evidencia.id))
  }

  const handleRemoveNew = (index: number) => {
    setArchivosNuevos(prev => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    const token = localStorage.getItem("access_token")

    try {
      // 1. Actualizar texto
      const resAvance = await fetch(`http://127.0.0.1:8000/api/avances-clinicos/${avance.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ descripcion_procedimiento: descripcion })
      })

      if (!resAvance.ok) throw new Error("Error actualizando texto de la sesión")

      // 2. Borrar imágenes marcadas
      for (const id of idsAEliminar) {
        const resDel = await fetch(`http://127.0.0.1:8000/api/evidencias/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!resDel.ok) {
            console.error(`No se pudo eliminar la imagen con ID: ${id}`)
        }
      }

 // 3. Subir nuevas imágenes
      if (archivosNuevos.length > 0) {
        for (const archivo of archivosNuevos) {
          const formData = new FormData()
          
          // CORRECCIÓN 1: El campo en el modelo se llama 'avance' (no avance_clinico)
          formData.append('avance', avance.id.toString()) 

          // CORRECCIÓN 2: 'tipo_evidencia' es obligatorio. 
          // Usamos 'FOTO_PROCESO' como valor por defecto de las opciones de tu modelo
          formData.append('tipo_evidencia', 'FOTO_PROCESO') 
          
          // El archivo y la descripción (opcional)
          formData.append('archivo', archivo) 
          formData.append('descripcion', 'Imagen subida desde edición')

          const resImg = await fetch('http://127.0.0.1:8000/api/evidencias/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          })

          if (!resImg.ok) {
            const errorData = await resImg.json()
            console.error("Django rechazó la imagen:", errorData)
            throw new Error(`Error en imagen: ${JSON.stringify(errorData)}`)
          }
        }
      }

      onActualizar()
      onClose()
    } catch (error: any) {
      console.error("Error al guardar:", error)
      alert(`Error al guardar: ${error.message}`)
    } finally {
      setCargando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Sesión Clínica</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleGuardar} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Descripción</label>
            <textarea
              required
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Imágenes Actuales</label>
            {cargandoImgs ? (
              <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
            ) : evidenciasExistentes.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {evidenciasExistentes.map((evidencia) => (
                  <div key={evidencia.id} className="relative shrink-0 group">
                    <img src={evidencia.archivo} alt="Evidencia" className="h-16 w-16 object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleRemoveExisting(evidencia)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:scale-110">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No hay imágenes previas.</p>}
          </div>

          <div className="space-y-3 border-t pt-4">
            <label className="text-sm font-semibold text-gray-700">Agregar Nuevas Imágenes</label>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Clic para seleccionar</p>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
            
            {archivosNuevos.length > 0 && (
               <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
                  {archivosNuevos.map((file, i) => (
                    <div key={i} className="relative shrink-0">
                        <img src={URL.createObjectURL(file)} alt="Nueva" className="h-16 w-16 object-cover rounded-lg border" />
                        <button type="button" onClick={() => handleRemoveNew(i)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:scale-110">
                          <X className="w-3 h-3" />
                        </button>
                    </div>
                  ))}
               </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-sm">Cancelar</button>
            <button type="submit" disabled={cargando} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
              {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}