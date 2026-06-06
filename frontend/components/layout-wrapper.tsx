"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion" 
import { BotonAsistencia } from "@/components/boton-asistencia"

import { AlertaAsistencia } from "@/components/alerta-asistencia"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "Usuario Clínico")
    setUserRole(localStorage.getItem("user_role") || "Invitado")
  }, [pathname])
  
  // Aquí definimos en qué páginas NO queremos que salga el menú lateral
  const isPublicPage = pathname === "/login" || pathname === "/recuperar-password"

  // Si es el login, solo devolvemos el contenido (sin sidebar ni headers)
  if (isPublicPage) {
    return <main className="flex-1 w-full">{children}</main>
  }

  // Si es cualquier otra página, mostramos el diseño completo con el menú
  return (
    <SidebarProvider>
      <AlertaAsistencia />
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          
          {/* Lado Izquierdo: Botón del menú lateral */}
          <SidebarTrigger />
          
          {/* Lado Derecho: Controles de usuario agrupados */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{userName}</span>
              <span className="text-xs text-clinica-primary dark:text-clinica-secondary font-semibold">{userRole}</span>
            </div>
            <BotonAsistencia />
            <ModeToggle />
            <BotonCerrarSesion />
          </div>

        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}