"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts"

type AppointmentSummary = {
  daily: Array<{ appointment_date: string; total: number }>
  completed: number
  no_shows: number
}

type AppointmentByDentist = {
  by_dentist: Array<{ dentist__id: string; dentist__first_name: string; dentist__last_name: string; total: number }>
}

export function AppointmentReportCharts() {
  const [appointments, setAppointments] = useState<AppointmentSummary | null>(null)
  const [byDentist, setByDentist] = useState<AppointmentByDentist | null>(null)

  useEffect(() => {
    void (async () => {
      const [aRes, dRes] = await Promise.all([
        fetch("/api/reports/appointments/"),
        fetch("/api/reports/appointments/by-dentist/"),
      ])
      if (aRes.ok) setAppointments(await aRes.json())
      if (dRes.ok) setByDentist(await dRes.json())
    })()
  }, [])

  if (!appointments || !byDentist) return <div>Cargando datos de citas...</div>

  const lineData = appointments.daily.map((item) => ({ date: item.appointment_date, total: item.total }))
  const barData = byDentist.by_dentist.map((item) => ({ name: `${item.dentist__first_name} ${item.dentist__last_name}`, total: item.total }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Citas por día</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Citas por dentista</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
