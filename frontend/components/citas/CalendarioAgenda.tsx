"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Cita } from "@/types/cita"

interface CalendarioAgendaProps {
  citas: Cita[]
  onCitaUpdate: () => void
}

export default function CalendarioAgenda({ citas, onCitaUpdate }: CalendarioAgendaProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewType, setViewType] = useState<'diaria' | 'semanal' | 'mensual'>('diaria')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

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

  // Vista Diaria
  const citasDelDia = citas.filter(cita =>
    cita.fecha_hora.startsWith(selectedDate)
  ).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())

  // Vista Semanal
  const getWeekDates = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(d.setDate(diff))
    const dates = []
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(start)
      newDate.setDate(start.getDate() + i)
      dates.push(newDate)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)
  const citasWeek = citas.filter(cita => {
    const citaDate = new Date(cita.fecha_hora)
    return weekDates.some(d => d.toDateString() === citaDate.toDateString())
  })

  // Vista Mensual
  const getMonthlyCitasCount = (date: Date) => {
    return citas.filter(cita => {
      const citaDate = new Date(cita.fecha_hora)
      return citaDate.getFullYear() === date.getFullYear() &&
             citaDate.getMonth() === date.getMonth() &&
             citaDate.getDate() === date.getDate()
    }).length
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const renderCitaDiaria = (cita: Cita) => (
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
    </div>
  )

  const renderVistaDiaria = () => (
    <div className="space-y-4">
      {citasDelDia.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 italic">No hay citas programadas para esta fecha</p>
        </div>
      ) : (
        citasDelDia.map(cita => renderCitaDiaria(cita))
      )}
    </div>
  )

  const renderVistaSemanal = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDates.map((date, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs font-semibold text-muted-foreground">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]}</p>
            <p className="text-sm font-bold">{date.getDate()}</p>
          </div>
        ))}
      </div>
      {citasWeek.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 italic">No hay citas programadas esta semana</p>
        </div>
      ) : (
        citasWeek.sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()).map(cita => renderCitaDiaria(cita))
      )}
    </div>
  )

  const renderVistaMensual = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center p-2 font-semibold text-xs text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="p-2"></div>
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const countCitas = getMonthlyCitasCount(date)
            return (
              <div
                key={day}
                className="p-2 border rounded text-center cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setSelectedDate(date.toISOString().split('T')[0])
                  setViewType('diaria')
                }}
              >
                <p className="font-semibold text-sm">{day}</p>
                {countCitas > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {countCitas} cita{countCitas > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario de Citas
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewType === 'diaria' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('diaria')}
            >
              Diaria
            </Button>
            <Button
              variant={viewType === 'semanal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('semanal')}
            >
              Semanal
            </Button>
            <Button
              variant={viewType === 'mensual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('mensual')}
            >
              Mensual
            </Button>
          </div>
        </div>

        {viewType === 'diaria' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded p-2 text-sm bg-background"
            />
          </div>
        )}

        {viewType === 'semanal' && (
          <div className="flex items-center gap-2 justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold">
              {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {viewType === 'mensual' && (
          <div className="flex items-center gap-2 justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {viewType === 'diaria' && renderVistaDiaria()}
        {viewType === 'semanal' && renderVistaSemanal()}
        {viewType === 'mensual' && renderVistaMensual()}
      </CardContent>
    </Card>
  )
}