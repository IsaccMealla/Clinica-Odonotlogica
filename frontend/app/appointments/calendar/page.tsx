import { AppointmentCalendar } from "@/components/appointment-calendar"

export default function AppointmentCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario de Citas</h1>
        <p className="text-muted-foreground mt-2">Vista de calendario para gestionar visualmente citas, recursos y disponibilidad.</p>
      </div>
      <AppointmentCalendar />
    </div>
  )
}
