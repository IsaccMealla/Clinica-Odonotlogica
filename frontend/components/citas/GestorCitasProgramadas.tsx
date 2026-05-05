"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  Trash2, 
  Edit3, 
  Bell, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Activity,
  CheckCheck,
  History
} from "lucide-react"
import { Cita, Usuario, RegistroAuditoria } from "@/types/cita"
import { useSoundPlayer } from "@/hooks/useSoundPlayer"

interface GestorCitasProgramadasProps {
  citas: Cita[]
  onCitasActualizadas: () => void
}

type EstadoCita = 'RESERVADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'ATENDIENDO' | 'FINALIZADO' | 'NO_ASISTIO' | 'CANCELADA' | 'REPROGRAMADA'

export function GestorCitasProgramadas({ citas, onCitasActualizadas }: GestorCitasProgramadasProps) {
  const { playSound } = useSoundPlayer()
  const [filteredCitas, setFilteredCitas] = useState<Cita[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoCita | 'TODAS'>('TODAS')
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)
  const [showReprogramarDialog, setShowReprogramarDialog] = useState(false)
  const [showCancelarDialog, setShowCancelarDialog] = useState(false)
  const [showNotificacionDialog, setShowNotificacionDialog] = useState(false)
  const [showAtendiensoDialog, setShowAtendiensoDialog] = useState(false)
  const [showFinalizadoDialog, setShowFinalizadoDialog] = useState(false)
  const [showNoAsistioDialog, setShowNoAsistioDialog] = useState(false)
  const [showAuditoriaDialog, setShowAuditoriaDialog] = useState(false)
  const [razonCancelacion, setRazonCancelacion] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState<'PACIENTE' | 'ESTUDIANTE' | 'DOCENTE' | 'MANTENIMIENTO' | 'OTRA'>('OTRA')
  const [nuevaFechaHora, setNuevaFechaHora] = useState('')
  const [cargando, setCargando] = useState(false)
  const [notificacionEnviada, setNotificacionEnviada] = useState(false)
  const [registrosAuditoria, setRegistrosAuditoria] = useState<RegistroAuditoria[]>([])

  useEffect(() => {
    filtrarCitas()
  }, [citas, searchTerm, filtroEstado])

  const filtrarCitas = () => {
    let result = citas

    // Filtrar por estado (excluir canceladas por defecto)
    if (filtroEstado !== 'TODAS') {
      result = result.filter(c => c.estado === filtroEstado)
    } else {
      result = result.filter(c => c.estado !== 'CANCELADA')
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(c =>
        (c.paciente_nombre?.toLowerCase().includes(term)) ||
        (c.estudiante_nombre?.toLowerCase().includes(term)) ||
        (c.gabinete_nombre?.toLowerCase().includes(term)) ||
        (c.motivo_nombre?.toLowerCase().includes(term))
      )
    }

    setFilteredCitas(result)
  }

  const getEstadoBadge = (estado: EstadoCita) => {
    const estados: Record<EstadoCita, { label: string; variant: any; color: string }> = {
      'RESERVADA': { label: '📅 Reservada', variant: 'secondary', color: 'bg-blue-100' },
      'CONFIRMADA': { label: '✓ Confirmada', variant: 'outline', color: 'bg-green-100' },
      'EN_ESPERA': { label: '⏳ En Espera', variant: 'outline', color: 'bg-yellow-100' },
      'ATENDIENDO': { label: '🏥 Atendiendo', variant: 'default', color: 'bg-purple-100' },
      'FINALIZADO': { label: '✓ Finalizado', variant: 'default', color: 'bg-green-600' },
      'NO_ASISTIO': { label: '✗ No Asistió', variant: 'destructive', color: 'bg-red-100' },
      'CANCELADA': { label: '✗ Cancelada', variant: 'secondary', color: 'bg-gray-100' },
      'REPROGRAMADA': { label: '🔄 Reprogramada', variant: 'outline', color: 'bg-orange-100' },
    }
    return estados[estado] || { label: estado, variant: 'secondary', color: 'bg-gray-100' }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCancelar = async () => {
    if (!selectedCita || !razonCancelacion) return

    setCargando(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://127.0.0.1:8000/api/citas/${selectedCita.id}/cancelar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razon: motivoCancelacion,
          motivo: razonCancelacion
        })
      })

      if (response.ok) {
        playSound('success')
        setShowCancelarDialog(false)
        setRazonCancelacion('')
        setMotivoCancelacion('OTRA')
        setSelectedCita(null)
        onCitasActualizadas()
      } else {
        playSound('error')
        alert('Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error:', error)
      playSound('error')
      alert('Error al cancelar la cita')
    } finally {
      setCargando(false)
    }
  }

  const handleReprogramar = async (nuevoEstado?: EstadoCita) => {
    if (!selectedCita || !nuevaFechaHora) return

    setCargando(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://127.0.0.1:8000/api/citas/${selectedCita.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha_hora: nuevaFechaHora,
          estado: nuevoEstado || 'RESERVADA'
        })
      })

      if (response.ok) {
        playSound('success')
        setShowReprogramarDialog(false)
        setNuevaFechaHora('')
        setSelectedCita(null)
        onCitasActualizadas()
      } else {
        playSound('error')
        alert('Error al reprogramar la cita')
      }
    } catch (error) {
      console.error('Error:', error)
      playSound('error')
      alert('Error al reprogramar la cita')
    } finally {
      setCargando(false)
    }
  }

  const handleNotificarLlegada = async () => {
    if (!selectedCita) return

    setCargando(true)
    setNotificacionEnviada(false)

    try {
      const token = localStorage.getItem('access_token')
      
      // 1. Actualizar estado de cita a EN_ESPERA o ATENDIENDO
      const updateCitaResponse = await fetch(`http://127.0.0.1:8000/api/citas/${selectedCita.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: 'EN_ESPERA',
          check_in_time: new Date().toISOString()
        })
      })

      if (!updateCitaResponse.ok) throw new Error('Error al actualizar cita')

      // 2. Enviar notificación al estudiante
      const notificacionResponse = await fetch('http://127.0.0.1:8000/api/notificaciones/crear/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: selectedCita.estudiante,
          titulo: '🔔 Paciente Llegó a la Clínica',
          mensaje: `${selectedCita.paciente_nombre} ha llegado para su cita a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
          tipo: 'NOTIFICACION_LLEGADA',
          referencia_cita: selectedCita.id
        })
      })

      // Reproducir sonido de notificación
      playSound('notification')

      setNotificacionEnviada(true)
      onCitasActualizadas()

      // Cerrar después de 2 segundos
      setTimeout(() => {
        setShowNotificacionDialog(false)
        setSelectedCita(null)
        setNotificacionEnviada(false)
      }, 2000)

    } catch (error) {
      console.error('Error:', error)
      playSound('error')
      alert('Error al notificar al estudiante')
    } finally {
      setCargando(false)
    }
  }

  const handleCambiarEstado = async (nuevoEstado: EstadoCita) => {
    if (!selectedCita) return

    setCargando(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Actualizar estado de cita
      const updateCitaResponse = await fetch(`http://127.0.0.1:8000/api/citas/${selectedCita.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado
        })
      })

      if (!updateCitaResponse.ok) throw new Error('Error al actualizar cita')

      // Registrar en auditoría
      const auditoriAResponse = await fetch('http://127.0.0.1:8000/api/auditoria-citas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cita: selectedCita.id,
          tipo_cambio: 'CAMBIO_ESTADO',
          campos_modificados: ['estado'],
          valores_anteriores: { estado: selectedCita.estado },
          valores_nuevos: { estado: nuevoEstado },
          descripcion: `Cambio de estado de ${selectedCita.estado} a ${nuevoEstado}`
        })
      })

      if (!auditoriAResponse.ok) console.warn('Error al registrar auditoría')

      playSound('success')
      
      // Cerrar diálogos
      if (nuevoEstado === 'ATENDIENDO') setShowAtendiensoDialog(false)
      if (nuevoEstado === 'FINALIZADO') setShowFinalizadoDialog(false)
      if (nuevoEstado === 'NO_ASISTIO') setShowNoAsistioDialog(false)
      
      setSelectedCita(null)
      onCitasActualizadas()
    } catch (error) {
      console.error('Error:', error)
      playSound('error')
      alert(`Error al cambiar el estado: ${error}`)
    } finally {
      setCargando(false)
    }
  }

  const cargarAuditoria = async (citaId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://127.0.0.1:8000/api/auditoria-citas/?cita=${citaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const registros = Array.isArray(data) ? data : data.results || []
        // Transformar registros para mostrar estado_anterior y estado_nuevo
        const registrosFormateados = registros.map((r: any) => ({
          id: r.id,
          cita: r.cita,
          estado_anterior: r.valores_anteriores?.estado || r.estado_anterior || 'Desconocido',
          estado_nuevo: r.valores_nuevos?.estado || r.estado_nuevo || 'Desconocido',
          usuario: r.usuario,
          usuario_nombre: r.usuario_nombre,
          timestamp: r.creado_en,
          comentario: r.descripcion
        }))
        setRegistrosAuditoria(registrosFormateados)
      }
    } catch (error) {
      console.error('Error al cargar auditoría:', error)
    }
  }

  const formatFechaAuditoria = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, estudiante, motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filtroEstado} onValueChange={(value: any) => setFiltroEstado(value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas las citas</SelectItem>
            <SelectItem value="RESERVADA">Reservada</SelectItem>
            <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
            <SelectItem value="EN_ESPERA">En Espera</SelectItem>
            <SelectItem value="ATENDIENDO">Atendiendo</SelectItem>
            <SelectItem value="NO_ASISTIO">No Asistió</SelectItem>
            <SelectItem value="REPROGRAMADA">Reprogramada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLA DE CITAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Citas Programadas ({filteredCitas.length})</span>
            <Badge variant="outline">{new Date().toLocaleDateString('es-ES')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCitas.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No hay citas con los criterios de búsqueda especificados
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Gabinete</TableHead>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCitas.map((cita) => (
                    <TableRow key={cita.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {cita.paciente_nombre}
                        </div>
                      </TableCell>
                      <TableCell>{cita.estudiante_nombre}</TableCell>
                      <TableCell>{cita.docente_nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{cita.gabinete_nombre}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {formatFecha(cita.fecha_hora)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadge(cita.estado as EstadoCita).variant}>
                          {getEstadoBadge(cita.estado as EstadoCita).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {/* Botón: Notificar Llegada */}
                          {(cita.estado === 'RESERVADA' || cita.estado === 'CONFIRMADA') && (
                            <Dialog open={showNotificacionDialog && selectedCita?.id === cita.id} 
                                    onOpenChange={(open) => {
                                      setShowNotificacionDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Bell className="w-3 h-3" />
                                  Llegó
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Notificar Llegada del Paciente</DialogTitle>
                                </DialogHeader>
                                {notificacionEnviada ? (
                                  <div className="text-center space-y-3 py-6">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
                                    <p className="font-semibold text-green-600">
                                      ¡Notificación enviada! 🔔
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      El estudiante ha sido notificado de que {cita.paciente_nombre} llegó a la clínica
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <Alert>
                                      <AlertDescription>
                                        Se notificará al estudiante <strong>{cita.estudiante_nombre}</strong> que <strong>{cita.paciente_nombre}</strong> ha llegado a la clínica
                                      </AlertDescription>
                                    </Alert>
                                    <div className="flex gap-2">
                                      <Button 
                                        onClick={handleNotificarLlegada}
                                        disabled={cargando}
                                        className="flex-1"
                                      >
                                        {cargando ? '⏳ Enviando...' : '✓ Confirmar'}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => setShowNotificacionDialog(false)}
                                        disabled={cargando}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Botón: Cambiar a ATENDIENDO */}
                          {cita.estado === 'EN_ESPERA' && (
                            <Dialog open={showAtendiensoDialog && selectedCita?.id === cita.id}
                                    onOpenChange={(open) => {
                                      setShowAtendiensoDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1 bg-purple-50 hover:bg-purple-100">
                                  <Activity className="w-3 h-3" />
                                  Atendiendo
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cambiar Estado a Atendiendo</DialogTitle>
                                </DialogHeader>
                                <Alert>
                                  <AlertDescription>
                                    Se cambiarán el estado de <strong>{cita.paciente_nombre}</strong> a <strong>ATENDIENDO</strong> y se registrará en la auditoría
                                  </AlertDescription>
                                </Alert>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowAtendiensoDialog(false)}
                                    disabled={cargando}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    onClick={() => handleCambiarEstado('ATENDIENDO')}
                                    disabled={cargando}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {cargando ? '⏳ Actualizando...' : '✓ Confirmar'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Botón: Cambiar a FINALIZADO */}
                          {(cita.estado === 'ATENDIENDO' || cita.estado === 'EN_ESPERA') && (
                            <Dialog open={showFinalizadoDialog && selectedCita?.id === cita.id}
                                    onOpenChange={(open) => {
                                      setShowFinalizadoDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1 bg-green-50 hover:bg-green-100">
                                  <CheckCheck className="w-3 h-3" />
                                  Finalizado
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Finalizar Cita</DialogTitle>
                                </DialogHeader>
                                <Alert>
                                  <AlertDescription>
                                    Se cambiará el estado de <strong>{cita.paciente_nombre}</strong> a <strong>FINALIZADO</strong> y se registrará en la auditoría
                                  </AlertDescription>
                                </Alert>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowFinalizadoDialog(false)}
                                    disabled={cargando}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    onClick={() => handleCambiarEstado('FINALIZADO')}
                                    disabled={cargando}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {cargando ? '⏳ Finalizando...' : '✓ Confirmar'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Botón: Ver Auditoría */}
                          <Dialog open={showAuditoriaDialog && selectedCita?.id === cita.id}
                                  onOpenChange={(open) => {
                                    setShowAuditoriaDialog(open)
                                    if (open) {
                                      setSelectedCita(cita)
                                      cargarAuditoria(cita.id)
                                    }
                                  }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="gap-1">
                                <History className="w-3 h-3" />
                                Historial
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[600px] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Historial de Cambios - {cita.paciente_nombre}</DialogTitle>
                              </DialogHeader>
                              {registrosAuditoria.length === 0 ? (
                                <Alert>
                                  <AlertDescription>
                                    No hay registros de cambios para esta cita
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <div className="space-y-3">
                                  {registrosAuditoria.map((registro) => (
                                    <div key={registro.id} className="border rounded-lg p-3 bg-gray-50">
                                      <div className="flex justify-between items-start gap-2 mb-1">
                                        <div className="flex gap-2 items-center">
                                          <Badge variant="outline">{registro.estado_anterior}</Badge>
                                          <span className="text-sm">→</span>
                                          <Badge>{registro.estado_nuevo}</Badge>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        👤 {registro.usuario_nombre}
                                      </p>
                                      <p className="text-xs text-muted-foreground mb-1">
                                        🕐 {formatFechaAuditoria(registro.timestamp)}
                                      </p>
                                      {registro.comentario && (
                                        <p className="text-xs text-gray-600">
                                          📝 {registro.comentario}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Botón: Paciente No Vino */}
                          {(cita.estado === 'RESERVADA' || cita.estado === 'CONFIRMADA' || cita.estado === 'EN_ESPERA') && (
                            <Dialog open={showNoAsistioDialog && selectedCita?.id === cita.id}
                                    onOpenChange={(open) => {
                                      setShowNoAsistioDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="gap-1">
                                  ❌
                                  No Vino
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-red-600">Paciente No Asistió</DialogTitle>
                                </DialogHeader>
                                <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    Se registrará que el paciente <strong>{cita.paciente_nombre}</strong> NO ASISTIÓ a su cita
                                  </AlertDescription>
                                </Alert>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowNoAsistioDialog(false)}
                                    disabled={cargando}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleCambiarEstado('NO_ASISTIO')}
                                    disabled={cargando}
                                  >
                                    {cargando ? '⏳ Registrando...' : '✓ Confirmar'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Botón: Cambiar a REPROGRAMADA */}
                          {cita.estado !== 'CANCELADA' && cita.estado !== 'FINALIZADO' && cita.estado !== 'NO_ASISTIO' && (
                            <Dialog open={showReprogramarDialog && selectedCita?.id === cita.id}
                                    onOpenChange={(open) => {
                                      setShowReprogramarDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1 bg-orange-50 hover:bg-orange-100">
                                  🔄
                                  Reprogramar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reprogramar Cita</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Cita Actual:</p>
                                    <Alert>
                                      <AlertDescription>
                                        <strong>{cita.paciente_nombre}</strong> - {formatFecha(cita.fecha_hora)}
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                  <div>
                                    <Label htmlFor="nueva-fecha">Nueva Fecha y Hora</Label>
                                    <Input
                                      id="nueva-fecha"
                                      type="datetime-local"
                                      value={nuevaFechaHora}
                                      onChange={(e) => setNuevaFechaHora(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowReprogramarDialog(false)}
                                    disabled={cargando}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    onClick={() => handleReprogramar('REPROGRAMADA')}
                                    disabled={cargando || !nuevaFechaHora}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    {cargando ? '⏳ Guardando...' : '✓ Reprogramar'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Botón: Cancelar */}
                          {cita.estado !== 'CANCELADA' && cita.estado !== 'FINALIZADO' && (
                            <Dialog open={showCancelarDialog && selectedCita?.id === cita.id}
                                    onOpenChange={(open) => {
                                      setShowCancelarDialog(open)
                                      if (open) setSelectedCita(cita)
                                    }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="gap-1">
                                  <Trash2 className="w-3 h-3" />
                                  Cancelar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-red-600">Cancelar Cita</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      ¿Estás seguro de que deseas cancelar la cita de <strong>{cita.paciente_nombre}</strong>?
                                    </AlertDescription>
                                  </Alert>

                                  <div>
                                    <Label htmlFor="motivo-cancelacion">Razón de Cancelación</Label>
                                    <Select value={motivoCancelacion} onValueChange={(value: any) => setMotivoCancelacion(value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una razón" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PACIENTE">Paciente</SelectItem>
                                        <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                                        <SelectItem value="DOCENTE">Docente</SelectItem>
                                        <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                                        <SelectItem value="OTRA">Otra</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="detalle-cancelacion">Detalles (opcional)</Label>
                                    <Textarea
                                      id="detalle-cancelacion"
                                      placeholder="Motivo adicional o comentarios..."
                                      value={razonCancelacion}
                                      onChange={(e) => setRazonCancelacion(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowCancelarDialog(false)}
                                    disabled={cargando}
                                  >
                                    No, Mantener Cita
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={handleCancelar}
                                    disabled={cargando}
                                  >
                                    {cargando ? '⏳ Cancelando...' : '✓ Cancelar Cita'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
