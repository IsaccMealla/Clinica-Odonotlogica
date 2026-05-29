"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle } from "lucide-react"
import { Cita } from "@/types/cita"

interface ListaEsperaCardProps {
  citasEspera: Cita[]
  onCheckIn: () => void
}

// 1. IMPORTANTE: Envolver todo en la función del componente
export default function ListaEsperaCard({ citasEspera, onCheckIn }: ListaEsperaCardProps) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<{[key: string]: number}>({})

  useEffect(() => {
    // Función para calcular los tiempos inmediatamente y luego en el intervalo
    const calcularTiempos = () => {
      const now = new Date()
      const nuevosTiempos: {[key: string]: number} = {}

      citasEspera.forEach(cita => {
        if (cita.check_in_time) {
          const checkIn = new Date(cita.check_in_time)
          const diff = Math.floor((now.getTime() - checkIn.getTime()) / (1000 * 60))
          nuevosTiempos[cita.id.toString()] = diff
        }
      })
      setTiempoTranscurrido(nuevosTiempos)
    }

    calcularTiempos() // Ejecutar al montar
    const interval = setInterval(calcularTiempos, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [citasEspera])

  const handleCheckIn = async (citaId: string | number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/citas/${citaId}/check_in/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        onCheckIn()
      }
    } catch (error) {
      console.error('Error en check-in:', error)
    }
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Sala de Espera
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citasEspera.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay pacientes en espera</p>
          ) : (
            citasEspera.map((cita) => {
              const tiempo = tiempoTranscurrido[cita.id.toString()] || 0
              const alertaRoja = tiempo > 15

              return (
                <div 
                  key={cita.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    alertaRoja ? 'border-red-500 bg-red-50 animate-pulse' : 'bg-card'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{cita.paciente_nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Check-in: {cita.check_in_time ? new Date(cita.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pendiente'}
                      </p>
                    </div>
                    {alertaRoja && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        ¡Alerta Roja!
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Clock className={`w-4 h-4 ${alertaRoja ? 'text-red-600' : 'text-muted-foreground'}`} />
                    <span className={alertaRoja ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                      {tiempo} minutos en espera
                    </span>
                  </div>

                  {!cita.check_in_time && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleCheckIn(cita.id)}
                    >
                      Marcar Check-in
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}