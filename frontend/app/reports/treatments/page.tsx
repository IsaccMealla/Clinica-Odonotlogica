"use client"

import { TreatmentReportCharts } from "@/components/treatment-report-charts"
import { ExportReportButton } from "@/components/export-report-button"

export default function ReportsTreatmentsPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Reportes de Tratamientos</h1>
        <p className="text-muted-foreground">Análisis de las intervenciones clínicas realizadas.</p>
      </div>

      <div className="flex gap-3">
        <ExportReportButton type="pdf" endpoint="/api/reports/export/pdf/" />
        <ExportReportButton type="excel" endpoint="/api/reports/export/excel/" />
      </div>

      <TreatmentReportCharts />
    </div>
  )
}
