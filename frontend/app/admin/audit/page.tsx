"use client"

import { useEffect, useState } from "react"
import { AuditLogTable } from "@/components/audit-log-table"
import { toast } from "sonner"

type AuditLog = {
  id: string
  user: { name: string; email: string } | null
  action: string
  module: string
  record_id: string | null
  timestamp: string
  ip_address: string | null
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])

  const fetchLogs = async () => {
    const res = await fetch("/api/audit-logs/")
    if (res.ok) {
      const data = await res.json()
      setLogs(data)
    } else {
      toast.error("Error al cargar bitácora")
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bitácora de auditoría</h1>
      <AuditLogTable logs={logs} />
    </div>
  )
}
