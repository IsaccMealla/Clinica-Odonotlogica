"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function PanelRecepcion() {
  const [estudiantes, setEstudiantes] = useState<{ nombre: string; materia: string; presente: boolean }[]>([])

  useEffect(() => {
    // Simularemos la recolección del estado de los estudiantes (idealmente esto viene por WebSockets o polling)
    const checkAsistencia = () => {
      const presente = localStorage.getItem("estudiante_presente") === "true"
      const materia = localStorage.getItem("estudiante_materia") || ""
      const nombre = localStorage.getItem("estudiante_nombre") || "Estudiante Local"
      
      const lista = []
      if (presente) {
        lista.push({ nombre, materia, presente })
      }
      
      lista.push(
        { nombre: "Juan Pérez", materia: "Clínica de Operatoria I", presente: true },
        { nombre: "María Gómez", materia: "Clínica de Endodoncia", presente: true }
      )
      
      setEstudiantes(lista)
    }

    checkAsistencia()
    const interval = setInterval(checkAsistencia, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 space-y-6 z-50 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Panel de Recepción</h1>
        <p className="text-slate-300">Monitoreo en tiempo real de clínica y asignación de sillones.</p>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-clinica-secondary/100 animate-pulse"></span>
            Estudiantes Presentes en Clínica Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estudiantes.length === 0 ? (
            <p className="text-slate-400">No hay estudiantes presentes en sala.</p>
          ) : (
            <div className="space-y-4">
              {estudiantes.map((est, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{est.nombre}</h3>
                    <p className="text-sm text-clinica-secondary">{est.materia}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="bg-clinica-primary hover:bg-cyan-700 text-white border-0">
                      Asignar Paciente de Sala
                    </Button>
                    <Button variant="outline" className="border-clinica-secondary text-clinica-secondary hover:bg-clinica-secondary/20">
                      Agendar en Sillón Libre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
