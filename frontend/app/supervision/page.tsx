// FILE: app/supervision/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Loader2, ShieldCheck, Shield } from "lucide-react"
import { PanelDocenteSupervision } from "@/components/seguridad/PanelDocenteSupervision"

export default function SupervisionPage() {
  const [token, setToken] = useState<string | null>(null)
  const [rol, setRol] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token")
    const storedRol = localStorage.getItem("user_role")
    setToken(storedToken)
    setRol(storedRol?.toUpperCase() || null)
  }, [])

  if (!token) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-clinica-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Verificando credenciales...</p>
      </div>
    )
  }

  const tieneAcceso = rol === "ADMIN" || rol === "DOCENTE"

  if (!tieneAcceso) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-4">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <ShieldCheck className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Acceso Restringido</h3>
        <p className="text-muted-foreground max-w-xs">
          Esta sección es exclusiva para Docentes Supervisores y Administradores.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-clinica-bg min-h-screen">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-clinica-secondary p-2.5 rounded-lg shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Supervisión Docente
            </h2>
          </div>
          <p className="text-muted-foreground">
            Gestión bidireccional de permisos clínicos, solicitudes y monitoreo de sillones.
          </p>
        </div>
      </div>

      {/* Panel de Control Principal */}
      <PanelDocenteSupervision />
    </div>
  )
}
