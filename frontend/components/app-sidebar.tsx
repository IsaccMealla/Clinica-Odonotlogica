"use client"
import { Calendar, Home, Users, Settings, Syringe, BarChart3, ShieldCheck, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

const groups = [
  {
    title: "General",
    items: [{ title: "Inicio", url: "/", icon: Home }],
  },
  {
    title: "Pacientes",
    items: [{ title: "Pacientes", url: "/pacientes", icon: Users }],
  },
  {
    title: "Citas",
    items: [
      { title: "Citas", url: "/appointments", icon: Calendar },
      { title: "Calendario", url: "/appointments/calendar", icon: Calendar },
    ],
  },
  {
    title: "Clínica",
    items: [
      { title: "Imágenes", url: "/images", icon: Calendar },
      { title: "Animaciones clínicas", url: "/clinical-animations", icon: Calendar },
      { title: "Tratamientos", url: "/tratamientos", icon: Syringe },
    ],
  },
  {
    title: "Reportes",
    items: [
      { title: "Pacientes", url: "/reports/patients", icon: BarChart3 },
      { title: "Citas", url: "/reports/appointments", icon: BarChart3 },
      { title: "Tratamientos", url: "/reports/treatments", icon: BarChart3 },
      { title: "Académicos", url: "/reports/academic", icon: BarChart3 },
      { title: "3D", url: "/reportes", icon: BarChart3 },
    ],
  },
  {
    title: "Academia",
    items: [
      { title: "Grupos", url: "/academic/groups", icon: Users },
      { title: "Asignaciones", url: "/academic/assignments", icon: Users },
      { title: "Aprobaciones", url: "/academic/approvals", icon: Users },
    ],
  },
  {
    title: "Administración",
    items: [
      { title: "Dashboard", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "Usuarios", url: "/admin/users", icon: Users },
      { title: "Auditoría", url: "/admin/audit", icon: BarChart3 },
      { title: "Seguridad", url: "/admin/security", icon: ShieldCheck },
      { title: "Configuración", url: "/configuracion", icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () =>
      groups.reduce((acc, group) => {
        acc[group.title] = true
        return acc
      }, {} as Record<string, boolean>)
  )

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((current) => ({
      ...current,
      [groupTitle]: !current[groupTitle],
    }))
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary mb-4 mt-2">
            Dental Pro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => (
                <SidebarMenuItem key={group.title}>
                  <SidebarMenuButton
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="justify-between"
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-150 ${
                        openGroups[group.title] ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {openGroups[group.title] && (
                    <SidebarMenuSub>
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url} className="flex w-full items-center gap-2">
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}