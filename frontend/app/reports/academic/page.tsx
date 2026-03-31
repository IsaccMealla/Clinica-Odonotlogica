"use client"

import { AcademicPerformanceCharts } from "@/components/academic-performance-charts"
import { ExportReportButton } from "@/components/export-report-button"

export default function ReportsAcademicPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Reportes Académicos</h1>
        <p className="text-muted-foreground">Seguimiento de desempeño estudiantil y tutoría docente.</p>
      </div>

      <div className="flex gap-3">
        <ExportReportButton type="pdf" endpoint="/api/reports/export/pdf/" />
        <ExportReportButton type="excel" endpoint="/api/reports/export/excel/" />
      </div>

      <AcademicPerformanceCharts />
    </div>
  )
}
