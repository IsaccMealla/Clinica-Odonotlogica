"use client"

// FILE: frontend/components/app-sidebar.tsx
import { useEffect, useState } from "react"
import { loadMe } from '@/lib/permissions'
import { 
  Calendar, Home, Users, Settings, Syringe, 
  BarChart3, UserCog, ClipboardList, UserCheck, Wrench, Shield, BookOpen
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
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: ["ADMIN", "DOCENTE"] },
  { title: "Mis Pacientes", url: "/mis-pacientes", icon: UserCheck, roles: ["ESTUDIANTE"] },
  { title: "Asignaciones", url: "/asignacion", icon: ClipboardList, roles: ["ADMIN", "DOCENTE"] },
  { title: "Agenda", url: "/citas", icon: Calendar, roles: ["ADMIN", "DOCENTE", "RECEPCIONISTA"] },
  { title: "Tratamientos", url: "/tratamientos", icon: Syringe, roles: ["ADMIN", "DOCENTE"] },
  { title: "Supervisión", url: "/supervision", icon: Shield, roles: ["ADMIN", "DOCENTE"] },
  { title: "Reportes 3D", url: "/reportes", icon: BarChart3, roles: ["ADMIN", "DOCENTE"] },
  { title: "Récord Académico", url: "/academico", icon: BookOpen, roles: ["ADMIN", "ESTUDIANTE"] },
  { title: "Mantenimiento", url: "/mantenimiento", icon: Wrench, roles: ["ADMIN", "DOCENTE"] },
  { title: "Usuarios", url: "/usuarios", icon: UserCog, roles: ["ADMIN"] }, 
  { title: "Configuración", url: "/configuracion", icon: Settings, roles: ["ADMIN", "DOCENTE"] },
  { title: "Gestión de Roles", url: "/gestion-roles", icon: Shield, roles: ["ADMIN"] },
]

export function AppSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Intenta cargar datos del usuario desde backend y actualizar localStorage
    (async ()=>{
      const me = await loadMe()
      const role = me?.rol || localStorage.getItem('user_role')
      console.log('Rol detectado en Sidebar:', role)
      if(role) setUserRole(role.toUpperCase())
    })()
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