"use client"

import FullCalendar from "@fullcalendar/react"
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid"
import resourceTimelinePlugin from "@fullcalendar/resource-timeline"
import interactionPlugin from "@fullcalendar/interaction"
import { FormEvent, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query"
import { parseISO } from "date-fns"
import { utcToZonedTime } from "date-fns-tz"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"
const TIMEZONE = "America/La_Paz"

const statusColors: Record<string, string> = {
  scheduled: "#2563eb",
  waiting: "#f59e0b",
  in_progress: "#8b5cf6",
  confirmed: "#0ea5e9",
  completed: "#16a34a",
  cancelled: "#ef4444",
  no_show: "#dc2626",
}

const queryClient = new QueryClient()

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Fetch failed")
  return res.json()
}

function normalizeArray<T>(data: any): T[] {
  return data?.results ?? data ?? []
}

type ResourceItem = {
  id: string
  name: string
  resource_type: string
}

type PatientItem = {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
}

type AppointmentData = {
  id: string
  procedure?: string
  reason?: string
  status: string
  patient?: PatientItem
  dentist?: { id: string; first_name?: string; last_name?: string }
  student?: { id: string; first_name?: string; last_name?: string }
  chair?: { id: string; name?: string }
  start_datetime: string
  end_datetime: string
  resource_ids: string[]
}

type AvailabilitySlot = {
  start: string
  end: string
}

function findResource(resources: ResourceItem[], id?: string) {
  return resources.find((resource) => resource.id === id)
}

function AppointmentCalendarInner() {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formValues, setFormValues] = useState({
    id: "",
    patient_id: "",
    dentist_id: "",
    student_id: "",
    chair_id: "",
    procedure: "",
    status: "scheduled",
    start_datetime: "",
    end_datetime: "",
  })

  const patientsQuery = useQuery({
  queryKey: ["patients"],
  queryFn: () => fetchJson(`${API_BASE}/pacientes/?page=1`),
  staleTime: 1000 * 60 * 5,
});

  const resourcesQuery = useQuery({
  queryKey: ["resources"],
  queryFn: () => fetchJson(`${API_BASE}/resources/?page=1`),
  staleTime: 1000 * 60 * 5,
})

  const appointmentsQuery = useQuery({
  queryKey: ["appointments"],
  queryFn: () => fetchJson(`${API_BASE}/appointments/?page=1`),
  staleTime: 1000 * 60 * 10,
})
 const availabilityQuery = useQuery({
  queryKey: ["availability", selectedResourceId],
  queryFn: () => fetchJson(`${API_BASE}/disponibilidad/?recurso=${selectedResourceId}&fecha=${new Date().toISOString().slice(0, 10)}`),
  enabled: Boolean(selectedResourceId),
  staleTime: 1000 * 60 * 5,
})

  const saveMutation = useMutation({
  mutationFn: async (payload: any) => {
    const url = payload.id ? `${API_BASE}/appointments/${payload.id}/` : `${API_BASE}/appointments/`
    const method = payload.id ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Could not save appointment")
    return res.json()
  },
  onSuccess() {
    toast.success("Cita guardada")
    queryClient.invalidateQueries({ queryKey: ["appointments"] }) // También cambió aquí
    setOpen(false)
  },
  onError() {
    toast.error("Error guardando la cita")
  },
})

const checkinMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await fetch(`${API_BASE}/appointments/${id}/checkin/`, { method: "POST" })
    if (!res.ok) throw new Error("Could not check in")
    return res.json()
  },
  onSuccess() {
    toast.success("Paciente llegado")
    queryClient.invalidateQueries({ queryKey: ["appointments"] })
    setOpen(false)
  },
  onError() {
    toast.error("Error al marcar llegada")
  },
})

  const resources: ResourceItem[] = useMemo(() => normalizeArray<ResourceItem>(resourcesQuery.data), [resourcesQuery.data])

  const calendarEvents = useMemo(() => {
    return normalizeArray<AppointmentData>(appointmentsQuery.data).map((appointment: AppointmentData) => ({
      id: appointment.id,
      title: appointment.patient
        ? `${appointment.patient.nombres} ${appointment.patient.apellido_paterno}`
        : appointment.procedure || "Cita",
      start: appointment.start_datetime,
      end: appointment.end_datetime,
      resourceIds: appointment.resource_ids,
      backgroundColor: statusColors[appointment.status] || "#3b82f6",
      borderColor: statusColors[appointment.status] || "#3b82f6",
    }))
  }, [appointmentsQuery.data])

  const availableSlots: AvailabilitySlot[] = availabilityQuery.data?.slots ?? []

  const handleSelect = (selectInfo: any) => {
    const resourceId = selectInfo.resource?.id ?? ""
    setEditing(false)
    setFormValues({
      id: "",
      patient_id: "",
      dentist_id: "",
      student_id: "",
      chair_id: resourceId,
      procedure: "",
      status: "scheduled",
      start_datetime: selectInfo.startStr,
      end_datetime: selectInfo.endStr,
    })
    setOpen(true)
  }

  const handleEventClick = (info: any) => {
    const appointment = normalizeArray<AppointmentData>(appointmentsQuery.data).find((item: AppointmentData) => item.id === info.event.id)
    if (!appointment) return

    setEditing(true)
    setFormValues({
      id: appointment.id,
      patient_id: appointment.patient?.id ?? "",
      dentist_id: appointment.dentist?.id ?? "",
      student_id: appointment.student?.id ?? "",
      chair_id: appointment.chair?.id ?? "",
      procedure: appointment.procedure ?? appointment.reason ?? "",
      status: appointment.status,
      start_datetime: appointment.start_datetime,
      end_datetime: appointment.end_datetime,
    })
    setOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate({
      id: formValues.id || undefined,
      patient_id: formValues.patient_id,
      dentist_id: formValues.dentist_id,
      student_id: formValues.student_id || null,
      chair_id: formValues.chair_id,
      procedure: formValues.procedure,
      status: formValues.status,
      start_datetime: formValues.start_datetime,
      end_datetime: formValues.end_datetime,
    })
  }

  const selectedResource = findResource(resources, selectedResourceId ?? undefined)

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Calendario de citas</h2>
          <p className="text-sm text-muted-foreground">Gestión de recursos, disponibilidad y programación en tiempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedResourceId ?? ""} onValueChange={(value) => setSelectedResourceId(value || null)}>
            <SelectTrigger className="w-64">
              <SelectValue>{selectedResource?.name ?? "Seleccionar recurso"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name} ({resource.resource_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">Nueva cita</Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar cita" : "Crear cita"}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Paciente</label>
                    <Select value={formValues.patient_id} onValueChange={(value) => setFormValues((prev) => ({ ...prev, patient_id: value }))}>
                      <SelectTrigger>
                        <SelectValue>{normalizeArray<PatientItem>(patientsQuery.data).find((patient: PatientItem) => patient.id === formValues.patient_id)?.nombres ?? "Selecciona paciente"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {normalizeArray<PatientItem>(patientsQuery.data).map((patient: PatientItem) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.nombres} {patient.apellido_paterno} {patient.apellido_materno}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Procedimiento</label>
                    <Input value={formValues.procedure} onChange={(event) => setFormValues((prev) => ({ ...prev, procedure: event.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Dentista</label>
                    <Select value={formValues.dentist_id} onValueChange={(value) => setFormValues((prev) => ({ ...prev, dentist_id: value }))}>
                      <SelectTrigger>
                        <SelectValue>{findResource(resources, formValues.dentist_id)?.name ?? "Selecciona dentista"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {resources.filter((resource) => resource.resource_type === "doctor").map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>{resource.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Estudiante</label>
                    <Select value={formValues.student_id} onValueChange={(value) => setFormValues((prev) => ({ ...prev, student_id: value }))}>
                      <SelectTrigger>
                        <SelectValue>{findResource(resources, formValues.student_id)?.name ?? "Selecciona estudiante"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {resources.filter((resource) => resource.resource_type === "student").map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>{resource.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Gabinete</label>
                    <Select value={formValues.chair_id} onValueChange={(value) => setFormValues((prev) => ({ ...prev, chair_id: value }))}>
                      <SelectTrigger>
                        <SelectValue>{findResource(resources, formValues.chair_id)?.name ?? "Selecciona gabinete"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {resources.filter((resource) => resource.resource_type === "chair").map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>{resource.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Inicio</label>
                    <Input type="datetime-local" value={formValues.start_datetime} onChange={(event) => setFormValues((prev) => ({ ...prev, start_datetime: event.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Fin</label>
                    <Input type="datetime-local" value={formValues.end_datetime} onChange={(event) => setFormValues((prev) => ({ ...prev, end_datetime: event.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Estado</label>
                  <Select value={formValues.status} onValueChange={(value) => setFormValues((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue>{formValues.status}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusColors).map((status) => (
                        <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  {editing && formValues.id ? (
                    <Button type="button" variant="outline" onClick={() => checkinMutation.mutate(formValues.id)}>
                      Marcar llegada
                    </Button>
                  ) : null}
                  <Button type="submit">Guardar cita</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="mb-4 rounded-lg border bg-slate-50 p-4">
        <p className="text-sm text-slate-600">Disponibilidad para {selectedResource?.name ?? 'todos los recursos'}</p>
        {availabilityQuery.isLoading ? (
          <p>Cargando disponibilidad…</p>
        ) : availabilityQuery.isError ? (
          <p className="text-destructive">No se pudo cargar la disponibilidad</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {availableSlots.slice(0, 8).map((slot) => {
              const start = utcToZonedTime(parseISO(slot.start), TIMEZONE)
              const end = utcToZonedTime(parseISO(slot.end), TIMEZONE)
              return (
                <div key={slot.start} className="rounded-lg border px-3 py-2 text-sm text-slate-700">
                  {start.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <FullCalendar
        plugins={[interactionPlugin, resourceTimeGridPlugin, resourceTimelinePlugin]}
        initialView="resourceTimeGridDay"
        selectable
        editable
        selectMirror
        eventResizableFromStart
        resourceAreaHeaderContent="Recursos"
        resources={resources.map((resource) => ({ id: resource.id, title: `${resource.name} (${resource.resource_type})` }))}
        events={calendarEvents}
        height={650}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'resourceTimeGridDay,resourceTimelineDay',
        }}
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={(info) => {
          const resourceIds = info.event.getResources().map((resource: any) => resource.id)
          saveMutation.mutate({
            id: info.event.id,
            start_datetime: info.event.startStr,
            end_datetime: info.event.endStr,
            chair_id: resourceIds[0],
            dentist_id: resourceIds[1],
            student_id: resourceIds[2],
          })
        }}
        eventResize={(info) => {
          saveMutation.mutate({
            id: info.event.id,
            start_datetime: info.event.startStr,
            end_datetime: info.event.endStr,
          })
        }}
      />
    </div>
  )
}

export function AppointmentCalendar() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppointmentCalendarInner />
    </QueryClientProvider>
  )
}
