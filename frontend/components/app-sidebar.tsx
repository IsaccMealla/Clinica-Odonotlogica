"use client"
import { Calendar, Home, Users, Settings, Syringe, BarChart3 } from "lucide-react"
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
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Tratamientos", url: "/tratamientos", icon: Syringe },
  { title: "Reportes 3D", url: "/reportes", icon: BarChart3 }, // <-- ¡AQUÍ ESTÁ LA MAGIA!
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