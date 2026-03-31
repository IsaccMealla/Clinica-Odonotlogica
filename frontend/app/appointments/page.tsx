"use client"

import { AppointmentForm } from "@/components/appointment-form"
import { AppointmentTable } from "@/components/appointment-table"

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda de citas</h1>
          <p className="text-muted-foreground mt-2">Gestiona programación, check-in y seguimiento de citas.</p>
        </div>
      </div>

      <AppointmentForm onSaved={() => window.location.reload()} />
      <AppointmentTable />
    </div>
  )
}

