"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Calendar } from "lucide-react"

interface CitaRecurrenteFormProps {
  onCitaCreated: () => void
}

export function FormularioCitaRecurrente({ onCitaCreated }: CitaRecurrenteFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    paciente: '',
    estudiante: '',
    docente: '',
    gabinete: '',
    motivo: '',
    frecuencia: 'SEMANAL',
    hora: '09:00',
    dias_semana: '0',
    duracion_estimada: 30,
    fecha_inicio: '',
    fecha_fin: '',
    max_ocurrencias: 10
  })

  const [pacientes, setPacientes] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [docentes, setDocentes] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [sillones, setSillones] = useState([])

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const [pacRes, estRes, docRes, tratRes, silRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/pacientes/', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=ESTUDIANTE', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=DOCENTE', { headers }),
        fetch('http://127.0.0.1:8000/api/tratamientos/', { headers }),
        fetch('http://127.0.0.1:8000/api/sillones/', { headers })
      ])

      if (pacRes.ok) setPacientes(await pacRes.json() || [])
      if (estRes.ok) setEstudiantes(await estRes.json() || [])
      if (docRes.ok) setDocentes(await docRes.json() || [])
      if (tratRes.ok) setTratamientos(await tratRes.json() || [])
      if (silRes.ok) setSillones(await silRes.json() || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/citas-recurrentes/', {
        method: 'POST',
        headers,
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
          frecuencia: 'SEMANAL',
          hora: '09:00',
          dias_semana: '0',
          duracion_estimada: 30,
          fecha_inicio: '',
          fecha_fin: '',
          max_ocurrencias: 10
        })
        onCitaCreated()
      } else {
        alert('Error al crear cita recurrente')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear cita recurrente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Nueva Cita Recurrente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Cita Recurrente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Paciente *</Label>
              <Select value={formData.paciente} onValueChange={(val) => setFormData({...formData, paciente: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombres}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Frecuencia *</Label>
              <Select value={formData.frecuencia} onValueChange={(val) => setFormData({...formData, frecuencia: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIARIA">Diaria</SelectItem>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hora *</Label>
              <Input type="time" value={formData.hora} onChange={(e) => setFormData({...formData, hora: e.target.value})} />
            </div>

            <div>
              <Label>Duración (minutos) *</Label>
              <Input type="number" min="15" step="15" value={formData.duracion_estimada} onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value)})} />
            </div>

            <div>
              <Label>Fecha Inicio *</Label>
              <Input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} required />
            </div>

            <div>
              <Label>Fecha Fin</Label>
              <Input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} />
            </div>

            <div>
              <Label>Máx Ocurrencias</Label>
              <Input type="number" min="1" value={formData.max_ocurrencias} onChange={(e) => setFormData({...formData, max_ocurrencias: parseInt(e.target.value)})} />
            </div>

            <div>
              <Label>Día de Semana</Label>
              <Select value={formData.dias_semana} onValueChange={(val) => setFormData({...formData, dias_semana: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Lunes</SelectItem>
                  <SelectItem value="1">Martes</SelectItem>
                  <SelectItem value="2">Miércoles</SelectItem>
                  <SelectItem value="3">Jueves</SelectItem>
                  <SelectItem value="4">Viernes</SelectItem>
                  <SelectItem value="5">Sábado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">Crear Cita Recurrente</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
