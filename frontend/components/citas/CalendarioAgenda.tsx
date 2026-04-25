"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { Cita } from "@/types/cita"

interface CalendarioAgendaProps {
  citas: Cita[]
  onCitaUpdate: () => void
}


export default function CalendarioAgenda({ citas, onCitaUpdate }: CalendarioAgendaProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const citasDelDia = citas.filter(cita =>
    cita.fecha_hora.startsWith(selectedDate)
  )

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'RESERVADA': return 'bg-yellow-500'
      case 'CONFIRMADA': return 'bg-blue-500'
      case 'EN_ESPERA': return 'bg-orange-500'
      case 'ATENDIENDO': return 'bg-green-500'
      case 'NO_ASISTIO': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendario de Citas
        </CardTitle>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-2 text-sm bg-background"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citasDelDia.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 italic">No hay citas programadas para esta fecha</p>
            </div>
          ) : (
            citasDelDia.map((cita) => (
              <div key={cita.id} className="border rounded-lg p-4 bg-card shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1">{cita.paciente_nombre}</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                        Estudiante: {cita.estudiante_nombre}
                      </p>
                      <p className="text-xs text-primary font-semibold">
                        Gabinete: {cita.gabinete_nombre}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getEstadoColor(cita.estado)} text-white border-none`}>
                    {cita.estado.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(cita.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{cita.duracion_estimada} min</span>
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3">
                  <Button size="sm" variant="outline" className="flex-1">Editar</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Ver Detalles</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}