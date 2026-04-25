"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Paciente, Usuario, Tratamiento, Sillon, Cita } from "@/types/cita"

interface FormularioCitaProps {
  onCitaCreated: () => void
  citaEditar?: Cita
}

export function FormularioCita({ onCitaCreated, citaEditar }: FormularioCitaProps) {
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (open) {
      fetchData()
      if (citaEditar) {
        setFormData({
          paciente: citaEditar.paciente,
          estudiante: citaEditar.estudiante,
          docente: citaEditar.docente,
          gabinete: citaEditar.gabinete,
          motivo: citaEditar.motivo,
          fecha_hora: citaEditar.fecha_hora.slice(0, 16), // formato datetime-local
          duracion_estimada: citaEditar.duracion_estimada
        })
      }
    }
  }, [open, citaEditar])

  const normalizeList = (value: any) => {
    if (Array.isArray(value)) return value
    if (value && Array.isArray(value.results)) return value.results
    return []
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const [pacRes, estRes, docRes, tratRes, silRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/pacientes/', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=ESTUDIANTE', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=DOCENTE', { headers }),
        fetch('http://127.0.0.1:8000/api/tratamientos/', { headers }),
        fetch('http://127.0.0.1:8000/api/sillones/', { headers })
      ])

      // Validar respuestas antes de parsejar JSON
      const pacJson = pacRes.ok ? await pacRes.json() : {}
      const estJson = estRes.ok ? await estRes.json() : {}
      const docJson = docRes.ok ? await docRes.json() : {}
      const tratJson = tratRes.ok ? await tratRes.json() : {}
      const silJson = silRes.ok ? await silRes.json() : {}

      if (!pacRes.ok) console.error('Pacientes fetch failed:', pacRes.status)
      if (!estRes.ok) console.error('Estudiantes fetch failed:', estRes.status)
      if (!docRes.ok) console.error('Docentes fetch failed:', docRes.status)
      if (!tratRes.ok) console.error('Tratamientos fetch failed:', tratRes.status)
      if (!silRes.ok) console.error('Sillones fetch failed:', silRes.status)

      setPacientes(normalizeList(pacJson))
      setEstudiantes(normalizeList(estJson))
      setDocentes(normalizeList(docJson).filter((u: Usuario) => u.rol === 'DOCENTE'))
      setTratamientos(normalizeList(tratJson))
      setSillones(normalizeList(silJson))
    } catch (error) {
      console.error('Error fetching data:', error)
      setPacientes([])
      setEstudiantes([])
      setDocentes([])
      setTratamientos([])
      setSillones([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = citaEditar
        ? `http://127.0.0.1:8000/api/citas/${citaEditar.id}/`
        : 'http://127.0.0.1:8000/api/citas/'

      const method = citaEditar ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
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
        onCitaCreated()
      }
    } catch (error) {
      console.error('Error saving cita:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {citaEditar ? 'Editar Cita' : 'Nueva Cita'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{citaEditar ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paciente">Paciente</Label>
              <Select value={formData.paciente} onValueChange={(value) => setFormData({...formData, paciente: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(paciente => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.apellido_paterno} {paciente.nombres}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estudiante">Estudiante</Label>
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

            <div>
              <Label htmlFor="docente">Docente</Label>
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

            <div>
              <Label htmlFor="gabinete">Gabinete</Label>
              <Select value={formData.gabinete} onValueChange={(value) => setFormData({...formData, gabinete: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gabinete" />
                </SelectTrigger>
                <SelectContent>
                  {sillones.map(sillon => (
                    <SelectItem key={sillon.id} value={sillon.id.toString()}>
                      {sillon.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo (Tratamiento)</Label>
              <Select value={formData.motivo} onValueChange={(value) => setFormData({...formData, motivo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {tratamientos.map(trat => (
                    <SelectItem key={trat.id} value={trat.id}>
                      {trat.nombre_tratamiento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_hora">Fecha y Hora</Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={formData.fecha_hora}
                onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="duracion">Duración Estimada (min)</Label>
              <Input
                id="duracion"
                type="number"
                value={formData.duracion_estimada}
                onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value)})}
                min="15"
                max="120"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {citaEditar ? 'Actualizar' : 'Crear'} Cita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}