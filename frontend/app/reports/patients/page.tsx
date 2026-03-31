"use client"

import { PatientReportCharts } from "@/components/patient-report-charts"
import { ExportReportButton } from "@/components/export-report-button"

export default function ReportsPatientsPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Reportes de Pacientes</h1>
        <p className="text-muted-foreground">Análisis de actividad demográfica de pacientes.</p>
      </div>

      <div className="flex gap-3">
        <ExportReportButton type="pdf" endpoint="/api/reports/export/pdf/" />
        <ExportReportButton type="excel" endpoint="/api/reports/export/excel/" />
      </div>

      <PatientReportCharts />
    </div>
  )
}
