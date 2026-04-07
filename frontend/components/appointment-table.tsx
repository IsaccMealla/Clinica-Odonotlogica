"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"

type Appointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  reason?: string
  status: string
  patient?: { nombres?: string; apellido_paterno?: string }
  dentist?: { id:string; first_name?: string; last_name?: string }
  chair?: { id:string; name?: string }
  student?: { id:string; first_name?: string; last_name?: string }
}

export function AppointmentTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState("")
  const [filterDentist, setFilterDentist] = useState("")
  const [filterChair, setFilterChair] = useState("")
  const [filterStudent, setFilterStudent] = useState("")

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments/?cache=no-store`)
      if (!res.ok) throw new Error("Error al cargar citas")
      const data = await res.json()
      setAppointments(data)
    } catch (err) {
      console.error(err)
      toast.error("No se pudo cargar las citas")
    }
  }

  useEffect(() => { fetchAppointments() }, [])

  const filtered = useMemo(() => {
    return appointments.filter((item) => {
      const term = search.toLowerCase()
      const matchSearch = !term || [item.reason, item.patient?.nombres, item.patient?.apellido_paterno, item.dentist?.first_name, item.chair?.name].some((v) => typeof v === 'string' && v.toLowerCase().includes(term))
      const matchDent = !filterDentist || item.dentist?.id === filterDentist
      const matchChair = !filterChair || item.chair?.id === filterChair
      const matchStud = !filterStudent || item.student?.id === filterStudent
      return matchSearch && matchDent && matchChair && matchStud
    })
  }, [appointments, search, filterDentist, filterChair, filterStudent])

  const onCheckIn = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/checkin/`, { method: 'POST' })
      if (!res.ok) throw new Error('Checkin failed')
      const data = await res.json()
      toast.success('Paciente marcado como llegado')
      if (data.alert) {
        new Audio('/sounds/warning.mp3').play().catch(() => {})
        toast.error(data.alert)
      } else {
        new Audio('/sounds/checkin.mp3').play().catch(() => {})
      }
      fetchAppointments()
    } catch (err) {
      console.error(err)
      toast.error('Error de check-in')
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm('Eliminar esta cita?')) return
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Eliminar error')
      toast.success('Cita eliminada')
      fetchAppointments()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar cita')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Buscar cita, paciente, dentista..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full md:w-96" />
      </div>

      <div className="rounded-xl border bg-white p-3 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Dentista</TableHead>
              <TableHead>Sillón</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8">No hay citas</TableCell></TableRow>
            )}
            {filtered.map((item)=> (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell>{item.appointment_date}</TableCell>
                <TableCell>{item.start_time} - {item.end_time}</TableCell>
                <TableCell>{item.patient?.nombres} {item.patient?.apellido_paterno}</TableCell>
                <TableCell>{item.dentist?.first_name} {item.dentist?.last_name}</TableCell>
                <TableCell>{item.chair?.name}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=>onCheckIn(item.id)}><Check className="w-4 h-4" /> Check-in</Button>
                    <Button variant="destructive" size="sm" onClick={()=>onDelete(item.id)}><Trash2 className="w-4 h-4" /> Eliminar</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
