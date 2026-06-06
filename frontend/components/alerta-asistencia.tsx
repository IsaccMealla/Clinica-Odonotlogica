"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, LogIn, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AlertaAsistencia() {
  const [mostrar, setMostrar] = useState(false)
  const [materias, setMaterias] = useState<any[]>([])
  const [materiaId, setMateriaId] = useState("")
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('user_role')?.toUpperCase()
    const isPresente = localStorage.getItem('estudiante_presente') === 'true'
    
    // Solo mostramos si es ESTUDIANTE o DOCENTE y NO está presente
    if ((role === 'ESTUDIANTE' || role === 'DOCENTE') && !isPresente) {
      setMostrar(true)
      cargarMaterias()
    }
    
    // Listen for manual attendance changes
    const checkAsistencia = () => {
      const isNowPresente = localStorage.getItem('estudiante_presente') === 'true'
      setMostrar(!isNowPresente && (role === 'ESTUDIANTE' || role === 'DOCENTE'))
    }
    window.addEventListener('storage', checkAsistencia)
    return () => window.removeEventListener('storage', checkAsistencia)
  }, [])

  const cargarMaterias = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
      const res = await fetch('http://localhost:8000/api/materia-estudiante/mis_materias/', { headers })
      if (res.ok) {
        const data = await res.json()
        setMaterias(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarcar = async () => {
    if (!materiaId) {
      alert("Por favor selecciona una materia.")
      return
    }

    setCargando(true)
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }

      const res = await fetch('http://localhost:8000/api/asistencia/registrar_ingreso/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ materia_id: materiaId })
      })

      if (res.ok) {
        const m = materias.find(x => (x.materia || x.materia_id) == materiaId)
        localStorage.setItem("estudiante_presente", "true")
        localStorage.setItem("estudiante_materia_id", materiaId)
        localStorage.setItem("estudiante_materia", m?.materia_nombre || m?.materia_codigo || "Materia")
        
        // Disparar evento para que BotonAsistencia se actualice
        window.dispatchEvent(new Event('storage'))
        
        setMostrar(false)
        window.location.reload() // Reload to apply subject-specific permissions across the app
      } else {
        alert("Hubo un error al registrar el ingreso.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  if (!mostrar) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-clinica-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-clinica-secondary" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-2">Registro de Asistencia Requerido</h2>
        <p className="text-slate-600 mb-6 text-sm">
          Para acceder al sistema, debes indicar con qué materia estás ingresando a la clínica hoy.
        </p>
        
        <div className="space-y-4 mb-8 text-left">
          <label className="text-sm font-semibold text-slate-700">Selecciona tu Materia Clínica:</label>
          <Select onValueChange={setMateriaId} value={materiaId}>
            <SelectTrigger className="w-full text-left">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {materias.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No tienes materias asignadas</div>
              ) : (
                materias.map(m => (
                  <SelectItem key={m.materia || m.materia_id} value={String(m.materia || m.materia_id)}>
                    {m.materia_nombre || m.materia_codigo || "Materia"}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleMarcar}
          disabled={cargando || !materiaId}
          className="w-full bg-clinica-secondary hover:bg-clinica-secondary/90 text-white py-6 text-base shadow-lg shadow-clinica-secondary/30"
        >
          {cargando ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
          Ingresar al Sistema
        </Button>
      </div>
    </div>
  )
}
