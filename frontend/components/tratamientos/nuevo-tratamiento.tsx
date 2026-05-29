"use client"

import { useState, useEffect } from "react"
import { Plus, X, Loader2 } from "lucide-react"

interface NuevoTratamientoProps {
  onTratamientoCreado: () => void
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
}

// Estructura mejorada para que el valor guardado sea descriptivo
const opcionesPiezas = [
  { grupo: "General", items: ["Toda la boca", "Arcada Superior", "Arcada Inferior", "Hemiarcada Derecha", "Hemiarcada Izquierda"] },
  { grupo: "Cuadrante 1 (Sup. Derecho)", items: ["11", "12", "13", "14", "15", "16", "17", "18"] },
  { grupo: "Cuadrante 2 (Sup. Izquierdo)", items: ["21", "22", "23", "24", "25", "26", "27", "28"] },
  { grupo: "Cuadrante 3 (Inf. Izquierdo)", items: ["31", "32", "33", "34", "35", "36", "37", "38"] },
  { grupo: "Cuadrante 4 (Inf. Derecho)", items: ["41", "42", "43", "44", "45", "46", "47", "48"] },
]

export function NuevoTratamiento({ onTratamientoCreado }: NuevoTratamientoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  
  const [usuarioActual, setUsuarioActual] = useState({ rol: "", id: "" })
  const [pacientes, setPacientes] = useState<any[]>([])
  const [estudiantes, setEstudiantes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    paciente: "",
    estudiante: "",
    nombre_tratamiento: "",
    diente_pieza: "",
  })

  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales()
    }
  }, [isOpen])

  const cargarDatosIniciales = async () => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    const decoded = parseJwt(token)
    
    // 1. Buscamos el rol en el localStorage O dentro del Token (como rol, role, o tipo_usuario)
    const rolCrudo = localStorage.getItem("user_role") || localStorage.getItem("rol") || decoded?.rol || decoded?.role || decoded?.tipo_usuario || "";
    const rolActual = String(rolCrudo).toUpperCase().trim();
    
    // 2. El ID ya vimos que funciona bien, pero mantenemos el respaldo
    const idActual = decoded?.user_id || decoded?.id || localStorage.getItem("user_id") || localStorage.getItem("id") || ""; 
    
    setUsuarioActual({ rol: rolActual, id: idActual })

    // Si detectamos que es estudiante, o si el rol sigue vacío pero tenemos un ID, pre-asignamos el ID
    if (rolActual.includes("ESTUDIANTE") || !rolActual) {
      setFormData(prev => ({ ...prev, estudiante: idActual }))
    }

    try {
      const resPac = await fetch('http://127.0.0.1:8000/api/pacientes/mis_asignaciones/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resPac.ok) {
        const data = await resPac.json()
        setPacientes(Array.isArray(data) ? data : data.results || [])
      }

      if (rolActual === "ADMIN" || rolActual === "DOCENTE") {
        const resEst = await fetch('http://127.0.0.1:8000/api/usuarios/estudiantes/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (resEst.ok) {
          const data = await resEst.json()
          setEstudiantes(Array.isArray(data) ? data : data.results || [])
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    const token = localStorage.getItem("access_token")
    
    // REGLA DE ORO: Si formData.estudiante está vacío, usamos el ID que sí encontramos (el '4')
    const estudianteIdFinal = formData.estudiante || usuarioActual.id;

    if (!estudianteIdFinal) {
      setCargando(false);
      alert("Error: No se pudo detectar el ID del estudiante para asignar el tratamiento.");
      return; 
    }

    const payload = {
      ...formData,
      estado: 'EN_PROGRESO',
      estudiante: estudianteIdFinal 
    }
    
    console.log("📦 Datos FINAL que se enviarán a Django:", payload);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/tratamientos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsOpen(false)
        setFormData({ paciente: "", estudiante: "", nombre_tratamiento: "", diente_pieza: "" })
        onTratamientoCreado() 
      } else {
        const errorData = await res.json()
        console.error("Error rechazado por Django:", errorData)
        alert(`Error al guardar: \n${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      alert("Error de conexión con el servidor.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Nuevo Tratamiento
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Iniciar Nuevo Tratamiento</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Paciente</label>
                  <select 
                    required
                    value={formData.paciente}
                    onChange={(e) => setFormData(prev => ({...prev, paciente: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700"
                  >
                    <option value="">Seleccione...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellido_paterno}</option>
                    ))}
                  </select>
                </div>

                {(usuarioActual.rol === "ADMIN" || usuarioActual.rol === "DOCENTE") && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Estudiante a Cargo</label>
                    <select 
                      required
                      value={formData.estudiante}
                      onChange={(e) => setFormData(prev => ({...prev, estudiante: e.target.value}))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700"
                    >
                      <option value="">Seleccione...</option>
                      {estudiantes.map(e => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Procedimiento / Tratamiento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Profilaxis, Exodoncia..."
                  value={formData.nombre_tratamiento}
                  onChange={(e) => setFormData(prev => ({...prev, nombre_tratamiento: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700"
                />
              </div>

              {/* SELECTOR DE PIEZA MEJORADO */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Diente / Arcada (Opcional)</label>
                <select 
                  value={formData.diente_pieza}
                  onChange={(e) => setFormData(prev => ({...prev, diente_pieza: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 appearance-none bg-white"
                >
                  <option value="">Seleccione una opción...</option>
                  {opcionesPiezas.map((grupo) => (
                    <optgroup key={grupo.grupo} label={grupo.grupo}>
                      {grupo.items.map(item => {
                        // Si es un número (diente), le concatenamos el nombre del grupo
                        const textoOpcion = grupo.grupo === "General" ? item : `${item} - ${grupo.grupo}`;
                        return (
                          <option key={textoOpcion} value={textoOpcion}>
                            {textoOpcion}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={cargando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Tratamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}