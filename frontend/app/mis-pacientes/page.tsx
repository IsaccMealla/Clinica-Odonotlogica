"use client"
import { useEffect, useState } from "react"
import { TablaMisPacientes } from "@/components/estudiante/tabla-mis-pacientes"

export default function MisPacientesPage() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token")
    setToken(storedToken)
    setLoading(false)
  }, [])

  if (loading) return <div className="p-6">Verificando sesión...</div>
  if (!token) return <div className="p-6">No hay sesión activa.</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mis Pacientes Asignados</h1>
      <TablaMisPacientes token={token} />
    </div>
  )
}