"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function BotonCerrarSesion() {
  const router = useRouter()

  const handleCerrarSesion = async () => {
    // Si estaba presente, registrar salida automáticamente
    if (localStorage.getItem("estudiante_presente") === "true") {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
        await fetch('http://localhost:8000/api/asistencia/registrar_salida/', {
          method: 'POST',
          headers
        })
      } catch (e) {
        console.error("Error al registrar salida automática", e)
      }
    }

    // 1. Eliminamos los tokens y estados del almacenamiento local
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("estudiante_presente")
    localStorage.removeItem("estudiante_materia_id")
    localStorage.removeItem("estudiante_materia")
    localStorage.removeItem("estudiante_nombre")
    localStorage.removeItem("user_role")

    // 2. Redirigimos a la página de login
    router.push("/login") 
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleCerrarSesion}
      className="w-full flex items-center justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      <span>Cerrar Sesión</span>
    </Button>
  )
}