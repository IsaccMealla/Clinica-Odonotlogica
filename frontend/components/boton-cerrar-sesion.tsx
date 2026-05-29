"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function BotonCerrarSesion() {
  const router = useRouter()

  const handleCerrarSesion = () => {
    // 1. Eliminamos los tokens del almacenamiento local
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token") // Bórralo también si lo estás usando
    
    // Opcional: Si quieres borrar TODO el rastro del usuario de una vez:
    // localStorage.clear() 

    // 2. Redirigimos a la página de login (Ajusta la ruta si tu login es "/")
    router.push("/login") 
    
    // 3. (Opcional) Forzar recarga para limpiar cualquier estado residual en memoria
    // router.refresh() 
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