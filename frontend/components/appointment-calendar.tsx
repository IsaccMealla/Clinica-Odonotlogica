"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type EventItem = {
  id: string
  title: string
  start: string
  end: string
  color: string
}

type AppointmentData = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  patient?: { nombres?: string }
  dentist?: { first_name?: string }
}

export function AppointmentCalendar() {
  const [events, setEvents] = useState<EventItem[]>([])

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/appointments/?page=1")
      if (!res.ok) throw new Error('Error cargando eventos')
      const data: AppointmentData[] = await res.json()
      setEvents(data.map((a) => ({
        id: a.id,
        title: `${a.patient?.nombres ?? 'Paciente'} - ${a.dentist?.first_name ?? 'Dentista'}`,
        start: `${a.appointment_date}T${a.start_time}`,
        end: `${a.appointment_date}T${a.end_time}`,
        color: a.status === 'no_show' ? '#ef4444' : a.status === 'completed' ? '#22c55e' : '#3b82f6',
      })))
    } catch (err) {
      toast.error('No se pudo cargar el calendario')
      console.error(err)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xl font-semibold">Calendario de citas</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        height={650}
        eventClick={(info) => {
          toast(`Cita: ${info.event.title}`)
        }}
      />
    </div>
  )
}
