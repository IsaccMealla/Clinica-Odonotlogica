"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
// 1. Importamos el nuevo botón
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion" 

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Aquí definimos en qué páginas NO queremos que salga el menú lateral
  const isPublicPage = pathname === "/login" || pathname === "/recuperar-password"

  // Si es el login, solo devolvemos el contenido (sin sidebar ni headers)
  if (isPublicPage) {
    return <main className="flex-1 w-full">{children}</main>
  }

  // Si es cualquier otra página, mostramos el diseño completo con el menú
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          
          {/* Lado Izquierdo: Botón del menú lateral */}
          <SidebarTrigger />
          
          {/* Lado Derecho: Controles de usuario agrupados */}
          <div className="flex items-center gap-2">
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