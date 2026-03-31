"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Option = { id: string; label: string }

type AppointmentPayload = {
  patient: string
  dentist: string
  student?: string
  chair: string
  appointment_date: string
  start_time: string
  end_time: string
  reason?: string
}

const defaultAppointment: AppointmentPayload = {
  patient: "",
  dentist: "",
  student: "",
  chair: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
  reason: "",
}

export function AppointmentForm({ onSaved }: { onSaved?: () => void }) {
  const [appointment, setAppointment] = useState(defaultAppointment)
  const [patients, setPatients] = useState<Option[]>([]) 
  const [dentists, setDentists] = useState<Option[]>([])
  const [students, setStudents] = useState<Option[]>([])
  const [chairs, setChairs] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [p, d, s, c] = await Promise.all([
        fetch("http://localhost:8000/api/pacientes/?page=1").then((r) => r.ok ? r.json() : []),
        fetch("http://localhost:8000/api/dentists/").then((r) => r.ok ? r.json() : []),
        fetch("http://localhost:8000/api/students/").then((r) => r.ok ? r.json() : []),
        fetch("http://localhost:8000/api/chairs/").then((r) => r.ok ? r.json() : []),
      ])

      type Patient = { id: string; nombres?: string; apellido_paterno?: string; first_name?: string; last_name?: string }
      type Worker = { id: string; first_name: string; last_name: string }
      type Chair = { id: string; name: string }

      setPatients((p as Patient[]).map((it) => ({ id: it.id, label: `${it.nombres ?? it.first_name ?? ''} ${it.apellido_paterno ?? it.last_name ?? ''}` })))
      setDentists((d as Worker[]).map((it) => ({ id: it.id, label: `${it.first_name} ${it.last_name}` })))
      setStudents((s as Worker[]).map((it) => ({ id: it.id, label: `${it.first_name} ${it.last_name}` })))
      setChairs((c as Chair[]).map((it) => ({ id: it.id, label: it.name })))
    }
    load().catch((err) => console.error(err))
  }, [])

  const isValid = useMemo(() => {
    return appointment.patient && appointment.dentist && appointment.chair && appointment.appointment_date && appointment.start_time && appointment.end_time
  }, [appointment])

  const onChange = (key: string, value: string) => {
    setAppointment((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      })
      if (!res.ok) {
        const err = await res.json()
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
          <Select value={appointment.patient} onValueChange={(v) => onChange('patient', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Dentista (required)</Label>
          <Select value={appointment.dentist} onValueChange={(v) => onChange('dentist', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar dentista" /></SelectTrigger>
            <SelectContent>
              {dentists.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Estudiante</Label>
          <Select value={appointment.student || undefined} onValueChange={(v) => onChange('student', v || "")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar estudiante (opcional)" /></SelectTrigger>
            <SelectContent>
              {students.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sillón (required)</Label>
          <Select value={appointment.chair} onValueChange={(v) => onChange('chair', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar silla" /></SelectTrigger>
            <SelectContent>
              {chairs.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
            </SelectContent>
          </Select>
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
