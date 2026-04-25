"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Box, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react"

// Componentes del Módulo
import CalendarioAgenda from "@/components/citas/CalendarioAgenda"
import ListaEsperaCard from "@/components/citas/ListaEsperaCard"
import { FormularioCita } from "@/components/citas/FormularioCita"
import Gabinetes3D from "@/components/citas/Gabinetes3D"
import ReporteProductividad from "@/components/citas/ReporteProductividad"
import { Cita } from "@/types/cita"

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("asignar")

  const fetchCitas = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://127.0.0.1:8000/api/citas/", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      const listaCitas = Array.isArray(data) ? data : (data.results || [])
      setCitas(listaCitas)
    } catch (error) {
      console.error('Error fetching citas:', error)
      setCitas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitas()
  }, [])

  // Filtrados lógicos para el tablero
  const citasEspera = citas.filter(c => c.estado === 'EN_ESPERA')
  const citasHoy = citas.filter(c => 
    c.fecha_hora.startsWith(new Date().toISOString().split('T')[0])
  )

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando Sistema de Gestión Clínica...</div>

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión Operativa de Citas</h1>
          <p className="text-muted-foreground">Monitoreo de gabinetes, flujo de pacientes y control de ausentismo.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {citasHoy.length} Citas hoy
          </Badge>
          {citasEspera.length > 0 && (
            <Badge variant="destructive" className="px-3 py-1 animate-bounce">
              {citasEspera.length} En espera
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
          <TabsTrigger value="asignar" className="gap-2">
            <LayoutDashboard className="w-4 h-4" /> Asignar
          </TabsTrigger>
          <TabsTrigger value="monitor-3d" className="gap-2">
            <Box className="w-4 h-4" /> Monitor 3D
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarIcon className="w-4 h-4" /> Agenda
          </TabsTrigger>
          <TabsTrigger value="reportes" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Reportes
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: ASIGNACIÓN Y FLUJO */}
        <TabsContent value="asignar" className="space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Programación de Práctica Clínica</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormularioCita onCitaCreated={fetchCitas} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <ListaEsperaCard citasEspera={citasEspera} onCheckIn={fetchCitas} />
            </div>
          </div>
        </TabsContent>

        {/* PESTAÑA 2: MONITOR 3D (GABINETES) */}
        <TabsContent value="monitor-3d">
          <Card className="min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Estado de Unidades Dentales</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Mapa en tiempo real de la clínica</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">🟢 Libre</span>
                <span className="flex items-center gap-1">🟠 Espera</span>
                <span className="flex items-center gap-1">🔴 Atendiendo</span>
              </div>
            </CardHeader>
            <CardContent>
              <Gabinetes3D citas={citasHoy} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 3: CALENDARIO COMPLETO */}
        <TabsContent value="calendario">
          <Card>
            <CardContent className="p-0">
              <CalendarioAgenda citas={citas} onCitaUpdate={fetchCitas} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 4: REPORTES Y AUSENTISMO */}
        <TabsContent value="reportes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2">
                <ReporteProductividad citas={citas} />
             </div>
             <Card className="border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Protocolo de Abandono
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-4">
                    Pacientes con 2 o más inasistencias detectadas. Se requiere seguimiento de Coordinación.
                  </p>
                  {/* Aquí mapearías los pacientes con inasistencias acumuladas */}
                  <div className="text-xs space-y-2">
                    <div className="p-2 bg-white rounded border border-red-200 flex justify-between">
                      <span>Juan Pérez</span>
                      <Badge variant="destructive">3 Faltas</Badge>
                    </div>
                  </div>
                </CardContent>
             </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}