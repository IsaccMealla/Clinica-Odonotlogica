"use client"

import { Download } from "lucide-react"

type ExportType = "pdf" | "excel"

interface ExportReportButtonProps {
  type: ExportType
  endpoint: string
  label?: string
}

export function ExportReportButton({ type, endpoint, label }: ExportReportButtonProps) {
  const handleExport = () => {
    window.open(endpoint, "_blank")
  }

  return (
    <button
      type="button"
      className="btn btn-outline gap-2"
      onClick={handleExport}
    >
      <Download className="h-4 w-4" />
      {label ?? `Exportar ${type.toUpperCase()}`}
    </button>
  )
}
