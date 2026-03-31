"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, CheckCircle2, AlertCircle } from "lucide-react"

export default function DashboardAnalyticsPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    treatmentsCompleted: 0,
    pendingApprovals: 0,
  })

  type PatientSummaryResponse = { total_patients: number }
  type AppointmentDaily = { appointment_date: string; total: number }
  type AppointmentSummaryResponse = { daily: AppointmentDaily[] }
  type TreatmentsReportResponse = { success_rate: number }
  type StudentPerformanceResponse = { students: { pending: number }[] }

  useEffect(() => {
    void (async () => {
      const [patientsRes, appointmentsRes, treatmentsRes, approvalsRes] = await Promise.all([
        fetch("/api/reports/patients/summary/"),
        fetch("/api/reports/appointments/?"),
        fetch("/api/reports/treatments/"),
        fetch("/api/reports/students/performance/"),
      ])
      const patients = patientsRes.ok ? (await patientsRes.json()) as PatientSummaryResponse : null
      const appointments = appointmentsRes.ok ? (await appointmentsRes.json()) as AppointmentSummaryResponse : null
      const treatments = treatmentsRes.ok ? (await treatmentsRes.json()) as TreatmentsReportResponse : null
      const approvals = approvalsRes.ok ? (await approvalsRes.json()) as StudentPerformanceResponse : null

      const todayString = new Date().toISOString().slice(0, 10)
      const appointmentToday = appointments?.daily?.find((d) => d.appointment_date === todayString)?.total ?? 0
      const pendingApprovals = approvals?.students?.reduce((sum, item) => sum + item.pending, 0) ?? 0

      setStats({
        totalPatients: patients?.total_patients ?? 0,
        appointmentsToday: appointmentToday,
        treatmentsCompleted: treatments?.success_rate ?? 0,
        pendingApprovals: pendingApprovals,
      })
    })()
  }, [])

  const metricCards = [
    { title: 'Total de pacientes', value: stats.totalPatients, icon: Users, color: 'bg-blue-100 text-blue-700' },
    { title: 'Citas hoy', value: stats.appointmentsToday, icon: Activity, color: 'bg-violet-100 text-violet-700' },
    { title: 'Tratamientos finalizados (%)', value: `${stats.treatmentsCompleted.toFixed(1)}%`, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
    { title: 'Aprobaciones pendientes', value: stats.pendingApprovals, icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Analytics</h1>
        <p className="text-muted-foreground">Presentación de KPIs, filtros y actividades recientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => (
          <Card key={idx} className="shadow-sm">
            <CardContent className="flex items-start gap-3">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Eventos y alertas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✔ 15 asignaciones nuevas esta semana</li>
              <li>✔ 9 aprobaciones pendientes por docentes</li>
              <li>✔ 3 no-shows registrados hoy</li>
              <li>✔ 27 tratamientos finalizados ayer</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximas acciones</CardTitle>
            <CardDescription>Filtros y exportaciones cruzadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Selecciona un periodo en el panel derecho para actualizar estas métricas.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
