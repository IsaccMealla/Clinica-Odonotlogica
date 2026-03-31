"use client"

import { AppointmentReportCharts } from "@/components/appointment-report-charts"
import { ExportReportButton } from "@/components/export-report-button"

export default function ReportsAppointmentsPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Reportes de Citas</h1>
        <p className="text-muted-foreground">Estadísticas de citas y desempeño de dentistas.</p>
      </div>

      <div className="flex gap-3">
        <ExportReportButton type="pdf" endpoint="/api/reports/export/pdf/" />
        <ExportReportButton type="excel" endpoint="/api/reports/export/excel/" />
      </div>

      <AppointmentReportCharts />
    </div>
  )
}
