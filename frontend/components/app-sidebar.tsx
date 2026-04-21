"use client"

import { useEffect, useState } from "react"
import { 
  Calendar, Home, Users, Settings, Syringe, 
  BarChart3, UserCog, ClipboardList, UserCheck, Wrench
} from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  { title: "Inicio", url: "/dashboard", icon: Home, roles: ["ADMIN", "DOCENTE", "ESTUDIANTE", "RECEPCIONISTA"] },
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: ["ADMIN", "DOCENTE", "RECEPCIONISTA"] },
  { title: "Mis Pacientes", url: "/mis-pacientes", icon: UserCheck, roles: ["ESTUDIANTE"] },
  { title: "Asignaciones", url: "/asignacion", icon: ClipboardList, roles: ["ADMIN", "DOCENTE"] },
  { title: "Agenda", url: "/agenda", icon: Calendar, roles: ["ADMIN", "DOCENTE", "RECEPCIONISTA", "ESTUDIANTE"] },
  { title: "Tratamientos", url: "/tratamientos", icon: Syringe, roles: ["ADMIN", "DOCENTE", "ESTUDIANTE"] },
  { title: "Reportes 3D", url: "/reportes", icon: BarChart3, roles: ["ADMIN", "DOCENTE"] },
  { title: "Mantenimiento", url: "/mantenimiento", icon: Wrench, roles: ["ADMIN", "DOCENTE", "ESTUDIANTE", "RECEPCIONISTA"] },
  { title: "Usuarios", url: "/usuarios", icon: UserCog, roles: ["ADMIN"] }, 
  { title: "Configuración", url: "/configuracion", icon: Settings, roles: ["ADMIN", "DOCENTE", "ESTUDIANTE", "RECEPCIONISTA"] },
]

export function AppSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // 1. Obtenemos el rol
    const role = localStorage.getItem("user_role")
    
    // 2. LOG DE DEPURACIÓN: Abre la consola del navegador (F12) y mira qué imprime esto
    console.log("Rol detectado en Sidebar:", role)

    if (role) {
      // Normalizamos a MAYÚSCULAS para que coincida con el array 'roles'
      setUserRole(role.toUpperCase())
    }
  }, [])

  // Si aún está cargando el rol, mostramos los items básicos que todos ven (como Inicio)
  // o simplemente esperamos a que userRole tenga valor.
  const menuFiltrado = items.filter(item => {
    if (!userRole) return item.roles.includes("ESTUDIANTE"); // Fallback temporal para que no se vea vacía
    return item.roles.includes(userRole)
  })

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary mb-4 mt-2">
            Clinica Dental Pro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuFiltrado.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="text-base py-5">
                      <item.icon className={`w-5 h-5 ${item.title === "Mis Pacientes" ? "text-blue-500" : ""}`} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}