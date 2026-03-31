"use client"

import { useEffect, useState } from "react"
import { SessionTable } from "@/components/session-table"
import { toast } from "sonner"

type Session = {
  id: string
  user: { name: string; email: string }
  login_time: string
  ip_address: string | null
  status: string
}

export default function AdminSecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([])

  const fetchSessions = async () => {
    const res = await fetch("/api/user-sessions/")
    if (res.ok) {
      const data = await res.json()
      setSessions(data)
    } else {
      toast.error("No se pudieron cargar sesiones")
    }
  }

  const forceLogout = async (id: string) => {
    try {
      const res = await fetch(`/api/user-sessions/${id}/force_logout/`, { method: 'POST' })
      if (res.ok) {
        toast.success("Sesión finalizada")
        fetchSessions()
      } else {
        toast.error("No se pudo cerrar sesión")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de red")
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Seguridad y sesiones</h1>
      <p className="mb-4 text-slate-700">Monitoreo de sesiones activas y gestión de cierre forzado.</p>
      <SessionTable sessions={sessions} onForceLogout={forceLogout} />
    </div>
  )
}
