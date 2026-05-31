"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle, AlertCircle } from "lucide-react"
import { useSoundPlayer } from "@/hooks/useSoundPlayer"
import { Paciente, Usuario, Tratamiento, Sillon, Cita } from "@/types/cita"

interface FormularioCitaProps {
  onCitaCreated: () => void
  citaEditar?: Cita
  citasExistentes?: Cita[]
}

export function FormularioCita({ onCitaCreated, citaEditar, citasExistentes = [] }: FormularioCitaProps) {
  const { playSound } = useSoundPlayer()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conflicto, setConflicto] = useState<string>('')
  const [advertencias, setAdvertencias] = useState<string[]>([])
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
  
  // Estados para detectar duplicados
  const [pacientesConCitas, setPacientesConCitas] = useState<Set<string>>(new Set())
  const [estudiantesConCitas, setEstudiantesConCitas] = useState<Set<string>>(new Set())
  const [docentesConCitas, setDocentesConCitas] = useState<Set<string>>(new Set())
  const [sillonesOcupados, setSillonesOcupados] = useState<Set<string>>(new Set())
  const [fechasOcupadas, setFechasOcupadas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      fetchData()
      analizarCitasExistentes()
      if (citaEditar) {
        setFormData({
          paciente: citaEditar.paciente?.toString() || '',
          estudiante: citaEditar.estudiante?.toString() || '',
          docente: citaEditar.docente?.toString() || '',
          gabinete: citaEditar.gabinete?.toString() || '',
          motivo: citaEditar.motivo?.toString() || '',
          fecha_hora: citaEditar.fecha_hora ? citaEditar.fecha_hora.slice(0, 16) : '',
          duracion_estimada: citaEditar.duracion_estimada || 30
        })
      }
    }
  }, [open, citaEditar])

  // Analizar citas existentes para detectar duplicados
  const analizarCitasExistentes = () => {
    const pacientes = new Set<string>()
    const estudiantes = new Set<string>()
    const docentes = new Set<string>()
    const sillones = new Set<string>()
    const fechas = new Set<string>()

    citasExistentes.forEach(cita => {
      if (cita.estado !== 'CANCELADA' && cita.estado !== 'NO_ASISTIO' && cita.estado !== 'FINALIZADO') {
        pacientes.add(cita.paciente?.toString() || '')
        estudiantes.add(cita.estudiante?.toString() || '')
        if (cita.docente) docentes.add(cita.docente?.toString() || '')
        sillones.add(cita.gabinete?.toString() || '')
        // Extraer solo la fecha sin la hora
        const fecha = cita.fecha_hora.split('T')[0]
        fechas.add(fecha)
      }
    })

    setPacientesConCitas(pacientes)
    setEstudiantesConCitas(estudiantes)
    setDocentesConCitas(docentes)
    setSillonesOcupados(sillones)
    setFechasOcupadas(fechas)
  }

  // Detectar advertencias en tiempo real
  useEffect(() => {
    const nuevasAdvertencias: string[] = []

    if (formData.paciente && pacientesConCitas.has(formData.paciente)) {
      nuevasAdvertencias.push('⚠️ Este paciente ya tiene citas programadas')
    }

    if (formData.estudiante && estudiantesConCitas.has(formData.estudiante)) {
      nuevasAdvertencias.push('⚠️ Este estudiante ya tiene citas programadas')
    }

    if (formData.docente && docentesConCitas.has(formData.docente)) {
      nuevasAdvertencias.push('⚠️ Este docente ya tiene citas programadas')
    }

    if (formData.gabinete && sillonesOcupados.has(formData.gabinete)) {
      nuevasAdvertencias.push('⚠️ Este gabinete ya tiene citas programadas')
    }

    if (formData.fecha_hora) {
      const fecha = formData.fecha_hora.split('T')[0]
      if (fechasOcupadas.has(fecha)) {
        nuevasAdvertencias.push('⚠️ Ya hay citas programadas para esta fecha')
      }
    }

    setAdvertencias(nuevasAdvertencias)
  }, [formData, pacientesConCitas, estudiantesConCitas, docentesConCitas, sillonesOcupados, fechasOcupadas])

  const normalizeList = (value: any) => {
    if (Array.isArray(value)) return value
    if (value && Array.isArray(value.results)) return value.results
    return []
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const [pacRes, estRes, docRes, tratRes, silRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/pacientes/', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=ESTUDIANTE', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=DOCENTE', { headers }),
        fetch('http://127.0.0.1:8000/api/tratamientos/', { headers }),
        fetch('http://127.0.0.1:8000/api/sillones/', { headers })
      ])

      setPacientes(normalizeList(await pacRes.json()))
      setEstudiantes(normalizeList(await estRes.json()))
      setDocentes(normalizeList(await docRes.json()).filter((u: Usuario) => u.rol === 'DOCENTE'))
      setTratamientos(normalizeList(await tratRes.json()))
      setSillones(normalizeList(await silRes.json()))
      
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // Validar conflictos de horario
  const validarConflictosHorario = () => {
    setConflicto('')
    
    if (!formData.paciente || !formData.estudiante || !formData.fecha_hora) {
      setConflicto('⚠️ Faltan campos obligatorios para agendar la cita.')
      return false
    }

    const citasParaValidar = citasExistentes.length > 0 ? citasExistentes : []

    const citaPaciente = citasParaValidar.find(cita => {
      if (citaEditar && cita.id === citaEditar.id) return false
      if (cita.estado === 'CANCELADA' || cita.estado === 'FINALIZADO' || cita.estado === 'NO_ASISTIO') return false
      const citaStart = new Date(cita.fecha_hora).getTime()
      const citaEnd = citaStart + ((cita.duracion_estimada || 30) * 60000)
      const nuevaStart = new Date(formData.fecha_hora).getTime()
      const nuevaEnd = nuevaStart + (formData.duracion_estimada * 60000)
      
      return cita.paciente?.toString() === formData.paciente && !(nuevaEnd <= citaStart || nuevaStart >= citaEnd)
    })

    const citaEstudiante = citasParaValidar.find(cita => {
      if (citaEditar && cita.id === citaEditar.id) return false
      if (cita.estado === 'CANCELADA' || cita.estado === 'FINALIZADO' || cita.estado === 'NO_ASISTIO') return false
      const citaStart = new Date(cita.fecha_hora).getTime()
      const citaEnd = citaStart + ((cita.duracion_estimada || 30) * 60000)
      const nuevaStart = new Date(formData.fecha_hora).getTime()
      const nuevaEnd = nuevaStart + (formData.duracion_estimada * 60000)
      
      return cita.estudiante?.toString() === formData.estudiante && !(nuevaEnd <= citaStart || nuevaStart >= citaEnd)
    })

    const citaGabinete = formData.gabinete ? citasParaValidar.find(cita => {
      if (citaEditar && cita.id === citaEditar.id) return false
      if (cita.estado === 'CANCELADA' || cita.estado === 'FINALIZADO' || cita.estado === 'NO_ASISTIO') return false
      const citaStart = new Date(cita.fecha_hora).getTime()
      const citaEnd = citaStart + ((cita.duracion_estimada || 30) * 60000)
      const nuevaStart = new Date(formData.fecha_hora).getTime()
      const nuevaEnd = nuevaStart + (formData.duracion_estimada * 60000)
      
      return cita.gabinete?.toString() === formData.gabinete && !(nuevaEnd <= citaStart || nuevaStart >= citaEnd)
    }) : null

    if (citaPaciente) {
      setConflicto(`🚫 El paciente ya tiene una cita en ese horario (${new Date(citaPaciente.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      return false
    }

    if (citaEstudiante) {
      setConflicto(`🚫 El estudiante ya tiene una cita en ese horario (${new Date(citaEstudiante.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      return false
    }

    if (citaGabinete) {
      setConflicto(`🚫 El gabinete ya está ocupado en ese horario (${new Date(citaGabinete.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarConflictosHorario()) return

    setLoading(true)
    
    console.log("Payload enviado:", formData)

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
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        playSound('exito')
        setOpen(false)
        setFormData({
          paciente: '',
          estudiante: '',
          docente: '',
          gabinete: '',
          motivo: '',
          fecha_hora: '',
          duracion_estimada: 30
        })
        setConflicto('')
        setAdvertencias([])
        onCitaCreated()
      } else {
        const errorData = await response.json()
        console.error("Error del servidor (Django):", errorData)
        setConflicto(`Error del servidor: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error saving cita:', error)
      setConflicto('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  // Helper para mostrar badges de estado en los select items
  const getPacienteLabel = (paciente: Paciente) => {
    const esDuplicado = pacientesConCitas.has(paciente.id.toString())
    return `${paciente.apellido_paterno} ${paciente.nombres}${esDuplicado ? ' 🔴 (con citas)' : ''}`
  }

  const getEstudianteLabel = (estudiante: Usuario) => {
    const esDuplicado = estudiantesConCitas.has(estudiante.id.toString())
    return `${estudiante.first_name} ${estudiante.last_name}${esDuplicado ? ' 🔴 (con citas)' : ''}`
  }

  const getDocenteLabel = (docente: Usuario) => {
    const esDuplicado = docentesConCitas.has(docente.id.toString())
    return `${docente.first_name} ${docente.last_name}${esDuplicado ? ' 🔴 (con citas)' : ''}`
  }

  const getSillonLabel = (sillon: Sillon) => {
    const esDuplicado = sillonesOcupados.has(sillon.id.toString())
    return `${sillon.nombre || `Gabinete ${sillon.id}`}${esDuplicado ? ' 🔴 (ocupado)' : ''} (${sillon.estado})`
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
          {/* ERRORES CRÍTICOS */}
          {conflicto && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-2 font-medium break-words">
                {conflicto}
              </AlertDescription>
            </Alert>
          )}

          {/* ADVERTENCIAS */}
          {advertencias.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 ml-2">
                <ul className="list-disc list-inside space-y-1">
                  {advertencias.map((adv, idx) => <li key={idx}>{adv}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PACIENTE */}
            <div className="space-y-1">
              <Label htmlFor="paciente" className="flex items-center gap-2">
                Paciente <span className="text-red-500">*</span>
                {formData.paciente && pacientesConCitas.has(formData.paciente) && (
                  <Badge variant="destructive" className="text-xs">Duplicado</Badge>
                )}
              </Label>
              <Select value={formData.paciente ?? ""} onValueChange={(value) => setFormData({...formData, paciente: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {getPacienteLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ESTUDIANTE */}
            <div className="space-y-1">
              <Label htmlFor="estudiante" className="flex items-center gap-2">
                Estudiante Asignado <span className="text-red-500">*</span>
                {formData.estudiante && estudiantesConCitas.has(formData.estudiante) && (
                  <Badge variant="destructive" className="text-xs">Duplicado</Badge>
                )}
              </Label>
              <Select value={formData.estudiante ?? ""} onValueChange={(value) => setFormData({...formData, estudiante: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante" />
                </SelectTrigger>
                <SelectContent>
                  {estudiantes.map(est => (
                    <SelectItem key={est.id} value={est.id.toString()}>
                      {getEstudianteLabel(est)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DOCENTE */}
            <div className="space-y-1">
              <Label htmlFor="docente" className="flex items-center gap-2">
                Docente Supervisor
                {formData.docente && docentesConCitas.has(formData.docente) && (
                  <Badge variant="destructive" className="text-xs">Ocupado</Badge>
                )}
              </Label>
              <Select value={formData.docente ?? ""} onValueChange={(value) => setFormData({...formData, docente: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map(doc => (
                    <SelectItem key={doc.id} value={doc.id.toString()}>
                      {getDocenteLabel(doc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GABINETE / SILLÓN */}
            <div className="space-y-1">
              <Label htmlFor="gabinete" className="flex items-center gap-2">
                Gabinete / Sillón
                {formData.gabinete && sillonesOcupados.has(formData.gabinete) && (
                  <Badge variant="destructive" className="text-xs">Ocupado</Badge>
                )}
              </Label>
              <Select value={formData.gabinete ?? ""} onValueChange={(value) => setFormData({...formData, gabinete: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={sillones.length > 0 ? "Seleccionar gabinete" : "Sin gabinetes"} />
                </SelectTrigger>
                <SelectContent>
                  {sillones.map(sillon => (
                    <SelectItem key={sillon.id} value={sillon.id.toString()}>
                      {getSillonLabel(sillon)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MOTIVO / TRATAMIENTO */}
            <div className="space-y-1">
              <Label htmlFor="motivo">Motivo (Tratamiento)</Label>
              <Input
                id="motivo"
                type="text"
                placeholder="Escribir el motivo o tratamiento..."
                value={formData.motivo ?? ""}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full"
              />
            </div>

            {/* FECHA Y HORA */}
            <div className="space-y-1">
              <Label htmlFor="fecha_hora" className="flex items-center gap-2">
                Fecha y Hora <span className="text-red-500">*</span>
                {formData.fecha_hora && fechasOcupadas.has(formData.fecha_hora.split('T')[0]) && (
                  <Badge variant="destructive" className="text-xs">Fecha Ocupada</Badge>
                )}
              </Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={formData.fecha_hora ?? ""}
                onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                required
              />
            </div>

            {/* DURACIÓN */}
            <div className="space-y-1">
              <Label htmlFor="duracion">Duración Estimada (min)</Label>
              <Input
                id="duracion"
                type="number"
                value={formData.duracion_estimada ?? 30}
                onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value) || 30})}
                min="15"
                max="180"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <DocenteAuthModal
              accion="Agendar Cita Clínica"
              onAprobado={(auditoriaInfo) => {
                // Inyectar auditoriaInfo en formData si hace falta y guardar
                const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                handleSubmit(fakeEvent);
              }}
            >
              <Button type="button" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
                {loading ? 'Procesando...' : (citaEditar ? 'Actualizar Cita' : 'Confirmar Cita')}
              </Button>
            </DocenteAuthModal>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}