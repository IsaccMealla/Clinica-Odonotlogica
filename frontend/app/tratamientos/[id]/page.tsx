"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Calendar, FileText, User, GraduationCap, Clock, Image as ImageIcon, Trash2, Edit, CheckCircle, AlertCircle, RefreshCw, X } from "lucide-react"

// Importaciones según tu arquitectura
import { NuevoAvance } from "@/components/tratamientos/nuevo-avance"
import { EditarAvance } from "@/components/tratamientos/editar-avance" 
import { EvaluarAvance } from "@/components/tratamientos/evaluar-avance" 

// ------------------------------------------------------------------
// SUBCOMPONENTE NUEVO: Modal para Cambiar Estado del Tratamiento
// ------------------------------------------------------------------
function ModalCambiarEstadoTratamiento({ 
  tratamientoId, 
  estadoActual, 
  onClose, 
  onActualizado 
}: { 
  tratamientoId: string, 
  estadoActual: string, 
  onClose: () => void, 
  onActualizado: () => void 
}) {
  const [nuevoEstado, setNuevoEstado] = useState(estadoActual || 'EN_PROGRESO')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/tratamientos/${tratamientoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (res.ok) {
        onActualizado()
        onClose()
      } else {
        alert("Error al cambiar el estado")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-gray-900">Estado del Tratamiento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Selecciona el nuevo estado:</label>
            <select 
              value={nuevoEstado} 
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="EN_PROGRESO">🔄 En Progreso</option>
              <option value="FINALIZADO">✅ Finalizado con Éxito</option>
              <option value="DERIVADO">↗️ Derivado a otro estudiante</option>
              <option value="ABANDONADO">❌ Abandonado por el paciente</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ------------------------------------------------------------------
// SUBCOMPONENTE: Tarjeta de Sesión
// ------------------------------------------------------------------
function TarjetaSesion({ avance, onActualizar, rolUsuario }: { avance: any, onActualizar: () => void, rolUsuario: string }) {
  const [imagenes, setImagenes] = useState<any[]>([])
  const [cargandoImgs, setCargandoImgs] = useState(true)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [modalEvaluarAbierto, setModalEvaluarAbierto] = useState(false) 

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "Fecha no registrada"
    try {
      const date = new Date(fechaStr + 'T00:00:00')
      if (isNaN(date.getTime())) return fechaStr
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return fechaStr
    }
  }

  useEffect(() => {
    const fetchEvidencias = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const res = await fetch(`http://127.0.0.1:8000/api/evidencias/?avance_clinico=${avance.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setImagenes(Array.isArray(data) ? data : data.results || [])
        }
      } catch (error) {
        console.error("Error cargando imágenes:", error)
      } finally {
        setCargandoImgs(false)
      }
    }
    fetchEvidencias()
  }, [avance.id, modalEditarAbierto])

  const handleEliminar = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta sesión?")) return
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/avances-clinicos/${avance.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) onActualizar()
    } catch (error) {
      console.error("Error eliminando:", error)
    }
  }

  return (
    <>
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-gray-800 capitalize">
              {formatearFecha(avance.fecha_sesion || avance.fecha)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {avance.estado_academico === 'APROBADO' && (
              <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded font-bold uppercase">✅ Aprobado</span>
            )}
            {avance.estado_academico === 'RECHAZADO' && (
              <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded font-bold uppercase">❌ Rechazado</span>
            )}
            {(!avance.estado_academico || avance.estado_academico === 'BORRADOR' || avance.estado_academico === 'REVISION') && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded font-bold uppercase">Pendiente Firma</span>
                {(rolUsuario === "ADMIN" || rolUsuario === "DOCENTE") && (
                  <button 
                    onClick={() => setModalEvaluarAbierto(true)}
                    className="flex items-center gap-1 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-bold uppercase hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-3 h-3" /> Evaluar
                  </button>
                )}
              </div>
            )}
            
            <div className="flex gap-1 ml-2 border-l pl-2">
              <button onClick={() => setModalEditarAbierto(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={handleEliminar} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">{avance.descripcion_procedimiento}</p>

        {avance.comentarios_docente && avance.estado_academico === 'RECHAZADO' && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-gray-800 shadow-sm">
            <strong className="text-red-900 flex items-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4 text-red-600" /> Observaciones del docente:
            </strong> 
            <p className="ml-5 whitespace-pre-wrap">{avance.comentarios_docente}</p>
          </div>
        )}

        {!cargandoImgs && imagenes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Evidencias adjuntas
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {imagenes.map((img: any) => {
                const urlImagen = img.archivo?.startsWith('http') ? img.archivo : `http://127.0.0.1:8000${img.archivo}`;
                return (
                  <a key={img.id} href={urlImagen} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-start">
                    <img src={urlImagen} alt="Evidencia" className="h-20 w-20 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <EditarAvance avance={avance} isOpen={modalEditarAbierto} onClose={() => setModalEditarAbierto(false)} onActualizar={onActualizar} />
      {modalEvaluarAbierto && <EvaluarAvance avance={avance} onClose={() => setModalEvaluarAbierto(false)} onEvaluacionCompletada={onActualizar} />}
    </>
  )
}

// ------------------------------------------------------------------
// PÁGINA PRINCIPAL
// ------------------------------------------------------------------
export default function DetalleTratamientoPage() {
  const params = useParams()
  const router = useRouter()
  const tratamientoId = params.id as string

  const [tratamiento, setTratamiento] = useState<any>(null)
  const [avances, setAvances] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false)
  
  const [rolUsuario, setRolUsuario] = useState("")

  useEffect(() => {
    const rol = String(localStorage.getItem("user_role") || "").toUpperCase().trim()
    setRolUsuario(rol)
  }, [])

  const fetchDatosTratamiento = useCallback(async () => {
    try {
      setCargando(true)
      const token = localStorage.getItem("access_token")
      if (!token) return

      const resTrat = await fetch(`http://127.0.0.1:8000/api/tratamientos/${tratamientoId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (resTrat.ok) {
        let dataTrat = await resTrat.json()
        let nombrePaciente = dataTrat.paciente
        let nombreEstudiante = `ID: ${dataTrat.estudiante}`

        try {
          if (dataTrat.paciente) {
            const resPac = await fetch(`http://127.0.0.1:8000/api/pacientes/${dataTrat.paciente}/`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (resPac.ok) {
              const dPac = await resPac.json()
              nombrePaciente = `${dPac.nombres || ''} ${dPac.apellido_paterno || ''}`.trim() || dataTrat.paciente
            }
          }
          if (dataTrat.estudiante) {
            const resEst = await fetch(`http://127.0.0.1:8000/api/usuarios/${dataTrat.estudiante}/`, { headers: { 'Authorization': `Bearer ${token}` } })
            if (resEst.ok) {
              const dEst = await resEst.json()
              nombreEstudiante = `${dEst.first_name || ''} ${dEst.last_name || ''}`.trim() || nombreEstudiante
            }
          }
        } catch (e) { console.error("Error al obtener nombres", e) }

        setTratamiento({ ...dataTrat, nombre_paciente_real: nombrePaciente, nombre_estudiante_real: nombreEstudiante })
      }

      const resAvances = await fetch(`http://127.0.0.1:8000/api/avances-clinicos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (resAvances.ok) {
        const dataAvances = await resAvances.json()
        const todosLosAvances = Array.isArray(dataAvances) ? dataAvances : dataAvances.results || []
        const avancesFiltrados = todosLosAvances.filter((av: any) => av.tratamiento.toString() === tratamientoId.toString())
        const avancesOrdenados = avancesFiltrados.sort((a: any, b: any) => new Date(b.fecha_sesion || b.fecha || b.created_at).getTime() - new Date(a.fecha_sesion || a.fecha || a.created_at).getTime())
        
        setAvances(avancesOrdenados)
      }

    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }, [tratamientoId])

  useEffect(() => {
    if (tratamientoId) fetchDatosTratamiento()
  }, [tratamientoId, fetchDatosTratamiento])

  // Lógica de colores para los estados
  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'FINALIZADO': return { color: 'bg-green-100 text-green-700', texto: 'Finalizado' }
      case 'DERIVADO': return { color: 'bg-purple-100 text-purple-700', texto: 'Derivado' }
      case 'ABANDONADO': return { color: 'bg-gray-200 text-gray-700', texto: 'Abandonado' }
      default: return { color: 'bg-blue-100 text-blue-700', texto: 'En Progreso' }
    }
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-500 font-medium">Cargando expediente...</p>
    </div>
  )

  if (!tratamiento) return <div className="p-8 text-center text-gray-500">Tratamiento no encontrado.</div>

  const badgeInfo = getBadgeEstado(tratamiento.estado)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-gray-900 capitalize">{tratamiento.nombre_tratamiento || 'Tratamiento'}</h1>
              <span className={`${badgeInfo.color} px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider`}>
                {badgeInfo.texto}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-2 mt-1 font-medium text-sm">
              <User className="w-4 h-4 text-blue-500" /> 
              {tratamiento.nombre_paciente_real} 
              <span className="text-gray-300">|</span> Pieza: {tratamiento.diente_pieza || 'N/A'}
            </p>
          </div>
        </div>

        {/* BOTÓN CAMBIAR ESTADO */}
        <button 
          onClick={() => setModalEstadoAbierto(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
          Cambiar Estado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200 gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Sesiones Clínicas
            </h2>
            {/* Solo permitimos nuevos avances si está EN_PROGRESO */}
            {tratamiento.estado === 'EN_PROGRESO' && (
              <NuevoAvance tratamientoId={tratamientoId} onAvanceCreado={fetchDatosTratamiento} />
            )}
          </div>

          {avances.length === 0 ? (
            <div className="py-20 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aún no hay sesiones registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {avances.map((av) => (
                <TarjetaSesion key={av.id} avance={av} onActualizar={fetchDatosTratamiento} rolUsuario={rolUsuario} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 border-b pb-3">
              <FileText className="w-5 h-5 text-blue-600" /> Resumen del Caso
            </h3>
            <div className="space-y-5 text-sm">
              <div className="flex flex-col gap-1 border-b border-gray-50 pb-3">
                <span className="text-gray-400 text-xs font-semibold tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Fecha de Inicio
                </span>
                <span className="font-bold text-gray-800">
                   {tratamiento.creado_en ? new Date(tratamiento.creado_en).toLocaleDateString() : 'No registrada'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs font-semibold tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Estudiante Asignado
                </span>
                <span className="font-bold text-blue-700 capitalize">
                   {tratamiento.nombre_estudiante_real}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Render */}
      {modalEstadoAbierto && (
        <ModalCambiarEstadoTratamiento 
          tratamientoId={tratamientoId}
          estadoActual={tratamiento.estado}
          onClose={() => setModalEstadoAbierto(false)}
          onActualizado={fetchDatosTratamiento}
        />
      )}
    </div>
  )
}