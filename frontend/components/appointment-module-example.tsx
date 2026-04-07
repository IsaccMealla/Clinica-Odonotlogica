"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { playClinicalSound, playLocalSound } from "@/lib/sounds"
import { StatusBadge, StatusBadgeDot } from "@/components/status-badge"
import { ProcedureMedia } from "@/components/procedure-media"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Bell, Volume2, BarChart3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"

interface NoShowStats {
  day_statistics: Array<{
    day: string
    no_shows: number
    day_number: number
  }>
  total_no_shows: number
}

interface PatientNoShowStats {
  patient_statistics: Array<{
    patient_id: string
    patient_name: string
    total_no_shows: number
  }>
  total_patients_with_no_shows: number
}

export function AppointmentModuleExample() {
  const [selectedProcedure, setSelectedProcedure] = useState<"Limpieza" | "Cirugía">("Limpieza")
  const token = localStorage.getItem("token")

  // Fetch no-show statistics grouped by day of week
  const { data: dayStats } = useQuery<NoShowStats>({
    queryKey: ["no-show-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/no-show-statistics-by-day/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    enabled: !!token,
  })

  // Fetch no-show by patient
  const { data: patientStats } = useQuery<PatientNoShowStats>({
    queryKey: ["patient-no-show-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/no-show-statistics-by-patient/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    enabled: !!token,
  })

  // Handle appointment status change with sound
  const handleStatusChange = (status: "arrival" | "warning" | "checkin") => {
    playClinicalSound(status)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Alerts and Sounds Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas y Sonidos Clínicos
          </CardTitle>
          <CardDescription>Reproduce sonidos para eventos de citas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              onClick={() => handleStatusChange("arrival")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-xs">Llegada</span>
              <span className="text-xs text-muted-foreground">(Ding suave)</span>
            </Button>

            <Button
              onClick={() => handleStatusChange("checkin")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-xs">Check-In</span>
              <span className="text-xs text-muted-foreground">(Tono bajo)</span>
            </Button>

            <Button
              onClick={() => handleStatusChange("warning")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-xs">Advertencia</span>
              <span className="text-xs text-muted-foreground">(Alerta alta)</span>
            </Button>
          </div>

          {/* Status Badge Examples */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm">Estados de Cita</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="scheduled" />
              <StatusBadge status="waiting" />
              <StatusBadge status="sala_de_espera" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="confirmed" />
              <StatusBadge status="completed" />
              <StatusBadge status="cancelled" />
              <StatusBadge status="no_show" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Procedure Media Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preparación de Procedimientos</CardTitle>
          <CardDescription>Materiales necesarios y tutoriales de preparación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2">
            <Button
              onClick={() => setSelectedProcedure("Limpieza")}
              variant={selectedProcedure === "Limpieza" ? "default" : "outline"}
            >
              Limpieza
            </Button>
            <Button
              onClick={() => setSelectedProcedure("Cirugía")}
              variant={selectedProcedure === "Cirugía" ? "default" : "outline"}
            >
              Cirugía
            </Button>
          </div>

          <ProcedureMedia procedureType={selectedProcedure} />
        </CardContent>
      </Card>

      {/* No-Show Analytics Section */}
      <Tabs defaultValue="by-day" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-day" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Por Día
          </TabsTrigger>
          <TabsTrigger value="by-patient" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Por Paciente
          </TabsTrigger>
        </TabsList>

        {/* No-Shows by Day Chart */}
        <TabsContent value="by-day">
          <Card>
            <CardHeader>
              <CardTitle>Abandonos por Día de la Semana</CardTitle>
              <CardDescription>Distribución de no-shows a lo largo de la semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {dayStats?.day_statistics && dayStats.day_statistics.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={dayStats.day_statistics}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day"
                        stroke="#888"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#888"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="no_shows"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 4 }}
                        name="Abandonos"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Card className="bg-gradient-to-br from-red-50 to-red-100">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">
                            {dayStats.total_no_shows}
                          </div>
                          <div className="text-sm text-red-700">Total Abandonos</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {Math.max(0, ...dayStats.day_statistics.map(d => d.no_shows))}
                          </div>
                          <div className="text-sm text-blue-700">Pico Máximo</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-amber-600">
                            {(dayStats.total_no_shows / dayStats.day_statistics.length).toFixed(1)}
                          </div>
                          <div className="text-sm text-amber-700">Promedio/Día</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No hay datos de abandonos disponibles</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* No-Shows by Patient */}
        <TabsContent value="by-patient">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes con Más Abandonos</CardTitle>
              <CardDescription>Identifica patrones de incumplimiento</CardDescription>
            </CardHeader>
            <CardContent>
              {patientStats?.patient_statistics && patientStats.patient_statistics.length > 0 ? (
                <div className="space-y-3">
                  {patientStats.patient_statistics.slice(0, 10).map((patient, index) => (
                    <div
                      key={patient.patient_id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{patient.patient_name}</p>
                          <p className="text-xs text-muted-foreground">ID: {patient.patient_id}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-lg">
                        {patient.total_no_shows}
                      </Badge>
                    </div>
                  ))}

                  <Alert className="mt-4 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      Total de {patientStats.total_patients_with_no_shows} pacientes con
                      abandonos. Considera implementar recordatorios para estos pacientes.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No hay datos de pacientes con abandonos</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Instrucciones de Integración</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-3">
          <p>
            <strong>1. Sonidos:</strong> Importa la función <code>playClinicalSound</code> desde
            <code>@/lib/sounds</code> y llámala cuando ocurra un evento (check-in, espera, etc.)
          </p>
          <p>
            <strong>2. Status Badges:</strong> Usa <code>StatusBadge</code> para mostrar el estado
            actual de la cita con animación de pulso en estados de espera.
          </p>
          <p>
            <strong>3. Procedimientos:</strong> Integra <code>ProcedureMedia</code> en un panel
            lateral o modal antes de iniciar un procedimiento.
          </p>
          <p>
            <strong>4. No-Shows:</strong> Los endpoints retornan datos JSON listos para Recharts.
            Ejecuta <code>check_appointment_no_shows</code> cada 5 minutos via Celery Beat.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
