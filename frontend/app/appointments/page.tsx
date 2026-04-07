"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppointmentForm } from "@/components/appointment-form"
import { AppointmentTable } from "@/components/appointment-table"

const queryClient = new QueryClient()

function AppointmentsPageContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAppointmentSaved = () => {
    // Refrescar todas las queries
    queryClient.invalidateQueries({ queryKey: ["appointments"] })
    queryClient.invalidateQueries({ queryKey: ["pacientes"] })
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda de citas</h1>
          <p className="text-muted-foreground mt-2">Gestiona programación, check-in y seguimiento de citas.</p>
        </div>
      </div>

      {/* Formulario de Nueva Cita */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Agendar Nueva Cita</h2>
        <AppointmentForm onSaved={handleAppointmentSaved} />
      </div>

      {/* Tabla de Citas */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Citas Programadas</h2>
        <AppointmentTable key={refreshTrigger} />
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AppointmentsPageContent />
    </QueryClientProvider>
  )
}


