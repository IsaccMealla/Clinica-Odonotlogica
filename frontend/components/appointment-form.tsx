"use client"

import { useEffect, useMemo, useState, FormEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GabineteSelector3D } from "@/components/GabineteSelector3D"
import { DentalChairSelector3D } from "@/components/DentalChairSelector3D"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"

type Option = { id: string; label: string }

type Gabinete = {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  capacidad: number
  is_busy: boolean
}

type Paginated<T> = {
  results: T[]
}

type AppointmentPayload = {
  patient_id: string
  dentist_id: string
  student_id?: string
  chair_id: string
  gabinete: string
  appointment_date: string
  start_time: string
  end_time: string
  reason?: string
}

const defaultAppointment: AppointmentPayload = {
  patient_id: "",
  dentist_id: "",
  student_id: "",
  chair_id: "",
  gabinete: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
  reason: "",
}

type Patient = { id: string; nombres?: string; apellido_paterno?: string; first_name?: string; last_name?: string }
type Worker = { id: string; first_name: string; last_name: string }
type DentalChair = { id: string; name: string; gabinete?: { id: string; nombre: string }; is_busy: boolean }

type Normalizable<T> = T[] | Paginated<T>

function normalizeList<T>(data: Normalizable<T>): T[] {
  if (Array.isArray(data)) return data
  if ('results' in data && Array.isArray(data.results)) return data.results
  return []
}

export function AppointmentForm({ onSaved }: { onSaved?: () => void }) {
  const [appointment, setAppointment] = useState(defaultAppointment)
  const [loading, setLoading] = useState(false)

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => fetch(`${API_BASE}/pacientes/?page=1`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const dentistsQuery = useQuery({
    queryKey: ["dentists"],
    queryFn: () => fetch(`${API_BASE}/dentists/`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: () => fetch(`${API_BASE}/students/`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const chairsQuery = useQuery({
    queryKey: ["chairs"],
    queryFn: () => fetch(`${API_BASE}/chairs/`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const patients = useMemo(() => normalizeList<Patient>(patientsQuery.data as Normalizable<Patient> || []), [patientsQuery.data])
  const dentists = useMemo(() => normalizeList<Worker>(dentistsQuery.data as Normalizable<Worker> || []), [dentistsQuery.data])
  const students = useMemo(() => normalizeList<Worker>(studentsQuery.data as Normalizable<Worker> || []), [studentsQuery.data])
  const chairs = useMemo(() => normalizeList<DentalChair>(chairsQuery.data as Normalizable<DentalChair> || []), [chairsQuery.data])

  const [gabinetes, setGabinetes] = useState<Gabinete[]>([])

  useEffect(() => {
    const loadGabinetes = async () => {
      const query = new URLSearchParams()
      if (appointment.appointment_date) query.set('fecha', appointment.appointment_date)
      if (appointment.start_time) query.set('hora', appointment.start_time)
      const url = `${API_BASE}/ninja/gabinetes/${query.toString() ? `?${query.toString()}` : ''}`
      try {
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          console.log('Gabinetes from API:', data)
          // Manejar ambos formatos: array directo o array dentro de 'results'
          const gabList = Array.isArray(data) ? data : (data.results || [])
          setGabinetes(normalizeList<Gabinete>(gabList as Normalizable<Gabinete>))
        }
      } catch (err) {
        console.error('Error loading gabinetes:', err)
      }
    }

    loadGabinetes()
  }, [appointment.appointment_date, appointment.start_time])

  const isValid = useMemo(() => {
    return (
      appointment.patient_id &&
      appointment.dentist_id &&
      appointment.chair_id &&
      appointment.gabinete &&
      appointment.appointment_date &&
      appointment.start_time &&
      appointment.end_time
    )
  }, [appointment])

  const onChange = (key: string, value: string) => {
    setAppointment((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setLoading(true)
    try {
      const payload = {
        patient_id: appointment.patient_id,
        dentist_id: appointment.dentist_id,
        chair_id: appointment.chair_id,
        gabinete_id: appointment.gabinete || null,
        student_id: appointment.student_id ? appointment.student_id : null,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        reason: appointment.reason,
      }
      const res = await fetch(`${API_BASE}/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        let err
        if (contentType?.includes('application/json')) {
          err = await res.json()
        } else {
          const text = await res.text()
          err = { error: `Server error (${res.status}): ${text.substring(0, 200)}` }
        }
        console.error('API Error:', err)
        throw new Error(JSON.stringify(err))
      }
      toast.success("Cita creada correctamente")
      setAppointment(defaultAppointment)
      onSaved?.()
    } catch (error) {
      toast.error("No se pudo crear la cita. Revisa horarios y recursos.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold">Nueva cita</h2>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <Label>Paciente (required)</Label>
          <Select value={appointment.patient_id} onValueChange={(v) => onChange('patient_id', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map((p) => <SelectItem key={p.id} value={p.id}>{`${p.nombres ?? p.first_name ?? ''} ${p.apellido_paterno ?? p.last_name ?? ''}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Dentista (required)</Label>
          <Select value={appointment.dentist_id} onValueChange={(v) => onChange('dentist_id', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar dentista" /></SelectTrigger>
            <SelectContent>
              {dentists.map((d) => <SelectItem key={d.id} value={d.id}>{`${d.first_name} ${d.last_name}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Estudiante</Label>
          <Select value={appointment.student_id || ""} onValueChange={(v) => onChange('student_id', v || "") }>
            <SelectTrigger><SelectValue placeholder="Seleccionar estudiante (opcional)" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => <SelectItem key={s.id} value={s.id}>{`${s.first_name} ${s.last_name}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label>Seleccionar Silla Dental (3D)</Label>
          <DentalChairSelector3D
            chairs={chairs}
            selectedChairId={appointment.chair_id}
            onSelect={(id) => onChange('chair_id', id)}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Gabinete (required)</Label>
          <GabineteSelector3D
            gabinetes={gabinetes}
            selectedGabineteId={appointment.gabinete}
            onSelect={(id) => onChange('gabinete', id)}
          />
        </div>

        <div>
          <Label>Fecha (required)</Label>
          <Input type="date" value={appointment.appointment_date} onChange={(e) => onChange('appointment_date', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Inicio (required)</Label>
            <Input type="time" value={appointment.start_time} onChange={(e) => onChange('start_time', e.target.value)} />
          </div>
          <div>
            <Label>Fin (required)</Label>
            <Input type="time" value={appointment.end_time} onChange={(e) => onChange('end_time', e.target.value)} />
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Motivo</Label>
          <Input value={appointment.reason} onChange={(e) => onChange('reason', e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={!isValid || loading}>{loading ? 'Guardando...' : 'Guardar cita'}</Button>
    </form>
  )
}
