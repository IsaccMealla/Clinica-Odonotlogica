"use client"
import { Calendar, Home, Users, Settings, Syringe, BarChart3, ShieldCheck } from "lucide-react"
import Link from "next/link" // <-- Esto es vital para Next.js
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
  { title: "Inicio", url: "/", icon: Home },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Citas", url: "/appointments", icon: Calendar },
  { title: "Calendario", url: "/appointments/calendar", icon: Calendar },
  { title: "Imágenes", url: "/images", icon: Calendar },
  { title: "Animaciones clínicas", url: "/clinical-animations", icon: Calendar },
  { title: "Tratamientos", url: "/tratamientos", icon: Syringe },
  { title: "Reportes Pacientes", url: "/reports/patients", icon: BarChart3 },
  { title: "Reportes Citas", url: "/reports/appointments", icon: BarChart3 },
  { title: "Reportes Tratamientos", url: "/reports/treatments", icon: BarChart3 },
  { title: "Reportes Académicos", url: "/reports/academic", icon: BarChart3 },
  { title: "Dashboard Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Academia - Grupos", url: "/academic/groups", icon: Users },
  { title: "Academia - Asignaciones", url: "/academic/assignments", icon: Users },
  { title: "Academia - Aprobaciones", url: "/academic/approvals", icon: Users },
  { title: "Reportes 3D", url: "/reportes", icon: BarChart3 },
  { title: "Dashboard Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Admin Usuarios", url: "/admin/users", icon: Users },
  { title: "Admin Auditoría", url: "/admin/audit", icon: BarChart3 },
  { title: "Admin Seguridad", url: "/admin/security", icon: ShieldCheck },
  { title: "Configuración", url: "/configuracion", icon: Settings },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary mb-4 mt-2">
            Dental Pro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {/* Usamos el Link especial de Next.js */}
                    <Link href={item.url} className="text-base py-5">
                      <item.icon className="w-5 h-5" />
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