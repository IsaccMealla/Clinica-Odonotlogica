"use client"

import { ShieldAlert } from "lucide-react"

export function AccesoDenegado() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Acceso Denegado</h1>
      <p className="text-slate-500 max-w-md">
        No tienes los permisos necesarios para ver esta sección. Si crees que esto es un error, contacta al administrador de la clínica.
      </p>
    </div>
  )
}
