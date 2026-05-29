"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertTriangle } from "lucide-react"
import { useSoundPlayer } from "@/hooks/useSoundPlayer"
import { Paciente, Usuario, Tratamiento, Sillon, Cita } from "@/types/cita"

interface FormularioCitaProps {
  onCitaCreated: () => void
  citaEditar?: Cita
  citasExistentes?: Cita[]
}

// 🔐 Función para decodificar JWT
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    console.error("Error al decodificar JWT:", e);
    return null;
  }
}

export function FormularioCita({ onCitaCreated, citaEditar, citasExistentes = [] }: FormularioCitaProps) {
  const { playSound } = useSoundPlayer()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conflicto, setConflicto] = useState<string>('')
  
  // Estados de usuario
  const [usuarioActual, setUsuarioActual] = useState({ rol: "", id: "" })
  const [esEstudiante, setEsEstudiante] = useState(false)
  
  const [formData, setFormData] = useState({
    paciente: '',
    estudiante: '',
    docente: '',
    gabinete: '',
    motivo: '',
    fecha_hora: '',
    duracion_estimada: 30
  })

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([])
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [sillones, setSillones] = useState<Sillon[]>([])

  // 1. NUEVO EFECTO: Obtenemos el rol y el ID apenas carga el componente
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("access_token");

    let finalId = userId || "";

    // Si no tenemos el ID en localStorage, lo intentamos sacar del JWT
    if (!finalId && token) {
      const decoded = parseJwt(token);
      finalId = decoded?.user_id || decoded?.id || "";
    }

    // Tratamos de obtener el rol del localStorage o del token como respaldo
    let rolCrudo = role || "";
    if (!rolCrudo && token) {
      const decoded = parseJwt(token);
      rolCrudo = decoded?.rol || decoded?.role || "";
    }

    if (rolCrudo) {
      const rolNormalizado = String(rolCrudo).toUpperCase().trim();
      setUsuarioActual({ rol: rolNormalizado, id: finalId });
      setEsEstudiante(rolNormalizado.includes("ESTUDIANTE"));

      // Pre-asignar el estudiante si aplica
      if (rolNormalizado.includes("ESTUDIANTE")) {
        setFormData(prev => ({ ...prev, estudiante: finalId }));
      }
    }
  }, []);

  // 2. EFECTO: Cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      cargarDatos()
      if (citaEditar) {
        setFormData(prev => ({
          ...prev, // Mantenemos el estudiante autoasignado si aplica
          paciente: citaEditar.paciente?.toString() || '',
          estudiante: esEstudiante ? usuarioActual.id : (citaEditar.estudiante?.toString() || ''),
          docente: citaEditar.docente?.toString() || '',
          gabinete: citaEditar.gabinete?.toString() || '',
          motivo: citaEditar.motivo?.toString() || '',
          fecha_hora: citaEditar.fecha_hora ? citaEditar.fecha_hora.slice(0, 16) : '',
          duracion_estimada: citaEditar.duracion_estimada || 30
        }))
      }
    }
  }, [open, citaEditar])

  const normalizeList = (value: any) => {
    if (Array.isArray(value)) return value
    if (value && Array.isArray(value.results)) return value.results
    return []
  }

  // 3. FUNCIÓN LIMPIA: Solo hace peticiones a la API
  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const headers: HeadersInit = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      
      // Usamos el rol que ya calculamos en el estado (o el localStorage como respaldo)
      const rolActual = usuarioActual.rol || localStorage.getItem("user_role")?.toUpperCase().trim() || "";

      const [pacRes, tratRes, silRes, docRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/pacientes/mis_asignaciones/', { headers }),
        fetch('http://127.0.0.1:8000/api/tratamientos/', { headers }),
        fetch('http://127.0.0.1:8000/api/sillones/', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=DOCENTE', { headers })
      ])

      const pacData = await pacRes.json()
      const tratData = await tratRes.json()
      const silData = await silRes.json()
      const docData = await docRes.json()

      setPacientes(normalizeList(pacData))
      setTratamientos(normalizeList(tratData))
      setSillones(normalizeList(silData))
      setDocentes(normalizeList(docData).filter((u: Usuario) => u.rol === 'DOCENTE'))
      
      // Solo cargar todos los estudiantes si NO es estudiante
      if (!rolActual.includes("ESTUDIANTE")) {
        const estRes = await fetch('http://127.0.0.1:8000/api/usuarios/?rol=ESTUDIANTE', { headers })
        const estData = await estRes.json()
        setEstudiantes(normalizeList(estData))
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  // Validar conflictos de horario
  const validarConflictosHorario = () => {
    setConflicto('')
    
    const camposObligatorios = esEstudiante 
      ? !formData.paciente || !formData.fecha_hora
      : !formData.paciente || !formData.estudiante || !formData.fecha_hora

    if (camposObligatorios) {
      setConflicto('⚠️ Faltan campos obligatorios para agendar la cita.')
      return false
    }

    const citasParaValidar = citasExistentes.length > 0 ? citasExistentes : []

    const citaPaciente = citasParaValidar.find(cita => {
      if (citaEditar && cita.id === citaEditar.id) return false
      const citaStart = new Date(cita.fecha_hora).getTime()
      const citaEnd = citaStart + ((cita.duracion_estimada || 30) * 60000)
      const nuevaStart = new Date(formData.fecha_hora).getTime()
      const nuevaEnd = nuevaStart + (formData.duracion_estimada * 60000)
      
      return cita.paciente?.toString() === formData.paciente && !(nuevaEnd <= citaStart || nuevaStart >= citaEnd)
    })

    const citaEstudiante = citasParaValidar.find(cita => {
      if (citaEditar && cita.id === citaEditar.id) return false
      const citaStart = new Date(cita.fecha_hora).getTime()
      const citaEnd = citaStart + ((cita.duracion_estimada || 30) * 60000)
      const nuevaStart = new Date(formData.fecha_hora).getTime()
      const nuevaEnd = nuevaStart + (formData.duracion_estimada * 60000)
      
      return cita.estudiante?.toString() === formData.estudiante && !(nuevaEnd <= citaStart || nuevaStart >= citaEnd)
    })

    if (citaPaciente) {
      setConflicto(`⚠️ El paciente ya tiene una cita en ese horario (${new Date(citaPaciente.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      return false
    }

    if (citaEstudiante) {
      setConflicto(`⚠️ El estudiante ya tiene una cita en ese horario (${new Date(citaEstudiante.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarConflictosHorario()) return

    setLoading(true)
    
    // 🧹 LIMPIEZA DE DATOS: Convertimos los textos vacíos a null
    const datosAEnviar = {
      paciente: formData.paciente,
      fecha_hora: formData.fecha_hora,
      duracion_estimada: formData.duracion_estimada,
      estudiante: esEstudiante ? usuarioActual.id : formData.estudiante,
      docente: formData.docente === "" ? null : formData.docente,
      gabinete: formData.gabinete === "" ? null : formData.gabinete,
      motivo: formData.motivo === "" ? null : formData.motivo,
    }

    console.log("Enviando cita:", datosAEnviar)

    try {
      const url = citaEditar
        ? `http://127.0.0.1:8000/api/citas/${citaEditar.id}/`
        : 'http://127.0.0.1:8000/api/citas/'

      const response = await fetch(url, {
        method: citaEditar ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(datosAEnviar)
      })

      if (response.ok) {
        playSound('exito')
        setOpen(false)
        setFormData(prev => ({
          paciente: '',
          estudiante: esEstudiante ? usuarioActual.id : '',
          docente: '',
          gabinete: '',
          motivo: '',
          fecha_hora: '',
          duracion_estimada: 30
        }))
        setConflicto('')
        onCitaCreated()
      } else {
        const errorData = await response.json()
        console.error("Error del servidor:", errorData)
        setConflicto(`Error: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error saving cita:', error)
      setConflicto('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {citaEditar ? 'Editar Cita' : 'Nueva Cita'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{citaEditar ? 'Editar Cita Clínica' : 'Programar Nueva Cita'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {conflicto && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-2 font-medium break-words">
                {conflicto}
              </AlertDescription>
            </Alert>
          )}

          {/* FORMULARIO SIMPLIFICADO PARA ESTUDIANTES */}
          {esEstudiante ? (
            <div className="space-y-4">
              {/* PACIENTE */}
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente <span className="text-red-500">*</span></Label>
                <Select value={formData.paciente} onValueChange={(value) => setFormData({...formData, paciente: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.apellido_paterno} {p.nombres}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600">Tus pacientes asignados</p>
              </div>

              {/* FECHA Y HORA */}
              <div className="space-y-2">
                <Label htmlFor="fecha_hora">Fecha y Hora <span className="text-red-500">*</span></Label>
                <Input
                  id="fecha_hora"
                  type="datetime-local"
                  value={formData.fecha_hora}
                  onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                  required
                />
              </div>

              {/* DURACIÓN */}
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración Estimada (min)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={formData.duracion_estimada}
                  onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value) || 30})}
                  min="15"
                  max="180"
                />
              </div>
            </div>
          ) : (
            /* FORMULARIO COMPLETO PARA ADMIN/DOCENTES */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PACIENTE */}
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente <span className="text-red-500">*</span></Label>
                <Select value={formData.paciente} onValueChange={(value) => setFormData({...formData, paciente: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.apellido_paterno} {p.nombres}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ESTUDIANTE */}
              <div className="space-y-2">
                <Label htmlFor="estudiante">Estudiante <span className="text-red-500">*</span></Label>
                <Select value={formData.estudiante} onValueChange={(value) => setFormData({...formData, estudiante: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map(est => (
                      <SelectItem key={est.id} value={est.id.toString()}>
                        {est.first_name} {est.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DOCENTE */}
              <div className="space-y-2">
                <Label htmlFor="docente">Docente Supervisor</Label>
                <Select value={formData.docente} onValueChange={(value) => setFormData({...formData, docente: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(doc => (
                      <SelectItem key={doc.id} value={doc.id.toString()}>
                        {doc.first_name} {doc.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GABINETE */}
              <div className="space-y-2">
                <Label htmlFor="gabinete">Gabinete / Sillón</Label>
                <Select value={formData.gabinete} onValueChange={(value) => setFormData({...formData, gabinete: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={sillones.length > 0 ? "Seleccionar gabinete" : "Sin gabinetes"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sillones.map(sillon => (
                      <SelectItem key={sillon.id} value={sillon.id.toString()}>
                        {sillon.nombre || `Gabinete ${sillon.numero}`} {sillon.estado ? `(${sillon.estado})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MOTIVO */}
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (Tratamiento)</Label>
                <Select value={formData.motivo} onValueChange={(value) => setFormData({...formData, motivo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tratamientos.map(trat => (
                      <SelectItem key={trat.id} value={trat.id.toString()}>
                        {trat.nombre_tratamiento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FECHA Y HORA */}
              <div className="space-y-2">
                <Label htmlFor="fecha_hora">Fecha y Hora <span className="text-red-500">*</span></Label>
                <Input
                  id="fecha_hora"
                  type="datetime-local"
                  value={formData.fecha_hora}
                  onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                  required
                />
              </div>

              {/* DURACIÓN */}
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={formData.duracion_estimada}
                  onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value) || 30})}
                  min="15"
                  max="180"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
              {loading ? 'Procesando...' : (citaEditar ? 'Actualizar' : 'Agendar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}