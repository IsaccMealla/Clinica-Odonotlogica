"use client"

import { useEffect, useState } from "react"
import { TablaAsignacion } from "@/components/docente/tabla-asignacion"
import { Loader2, ClipboardList, ShieldCheck } from "lucide-react"

export default function AsignacionesPage() {
  const [token, setToken] = useState<string | null>(null)
  const [rol, setRol] = useState<string | null>(null)

  useEffect(() => {
    // Recuperamos credenciales del localStorage
    const storedToken = localStorage.getItem("access_token")
    const storedRol = localStorage.getItem("user_role")
    
    setToken(storedToken)
    setRol(storedRol?.toUpperCase() || null)
  }, [])

  // 1. Estado de Carga Inicial
  if (!token) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground animate-pulse">Verificando credenciales...</p>
      </div>
    )
  }

  // 2. Validación de Acceso (Seguridad en Frontend)
  const tieneAcceso = rol === "ADMIN" || rol === "DOCENTE"

  if (!tieneAcceso) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-4">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <ShieldCheck className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Acceso Restringido</h3>
        <p className="text-muted-foreground max-w-xs">
          No tienes permisos para gestionar asignaciones. Esta sección es exclusiva para Administradores y Docentes.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 min-h-screen">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Control de Asignaciones
            </h2>
          </div>
          <p className="text-muted-foreground">
            Vincula estudiantes con pacientes para el seguimiento de historias clínicas.
          </p>
        </div>
      </div>
      
      {/* Contenedor de la Tabla CRUD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <TablaAsignacion token={token} />
      </div>
    </div>
  )
}