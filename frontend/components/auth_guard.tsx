"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    // 1. Buscamos la llave en el navegador
    const token = localStorage.getItem("access_token")
    
    // 2. Si NO hay token y NO está en la página de login -> Lo mandamos al login
    if (!token && pathname !== "/login") {
      router.push("/login")
    } 
    // 3. Si SÍ hay token y trata de entrar al login -> Lo mandamos al sistema
    else if (token && pathname === "/login") {
      router.push("/usuarios") // O a tu /dashboard cuando lo tengas
    } 
    // 4. Todo en orden -> Le damos permiso de ver la pantalla
    else {
      setAutorizado(true)
    }
  }, [pathname, router])

  // Mientras decide si lo deja pasar o no, mostramos un loading
  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // ¡AQUÍ ESTÁ LA MAGIA!
  // Borramos el menú oscuro de prueba. Ahora el guardián SOLO 
  // deja pasar el contenido hacia el LayoutWrapper.
  return <>{children}</>
}