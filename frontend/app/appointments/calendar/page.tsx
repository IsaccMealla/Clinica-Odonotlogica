"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { useAppointmentNotifications } from "@/hooks/use-appointment-notifications"

const queryClient = new QueryClient()

function CalendarPageContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Usar notifications y refrescar cuando llega una nueva cita
  useAppointmentNotifications(() => {
    // Invalidar queries para que el calendario se actualice
    queryClient.invalidateQueries({ queryKey: ["appointments"] })
    setRefreshTrigger(prev => prev + 1)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario de Citas</h1>
        <p className="text-muted-foreground mt-2">Vista de calendario para gestionar visualmente citas, recursos y disponibilidad.</p>
      </div>
      <AppointmentCalendar key={refreshTrigger} />
    </div>
  )
}

export default function AppointmentCalendarPage() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <CalendarPageContent />
    </QueryClientProvider>
  )
}
