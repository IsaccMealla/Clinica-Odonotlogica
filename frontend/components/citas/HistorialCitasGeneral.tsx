"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Download, Printer, Search } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface RegistroAuditoria {
  id: string
  cita: string
  tipo_cambio: string
  usuario_nombre: string
  campos_modificados: string[]
  valores_anteriores: Record<string, any>
  valores_nuevos: Record<string, any>
  descripcion: string
  creado_en: string
}

interface Paciente {
  id: string
  nombres: string
  apellido_paterno: string
}

interface Usuario {
  id: string
  username: string
  first_name: string
  last_name: string
}

export function HistorialCitasGeneral() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [filtros, setFiltros] = useState({
    paciente: '',
    estudiante: '',
    fechaDesde: '',
    fechaHasta: '',
    searchTerm: ''
  })
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroAuditoria[]>([])

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [registros, filtros])

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('access_token')
      
      // Cargar historial general
      const historialResponse = await fetch('http://127.0.0.1:8000/api/historial-citas/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (historialResponse.ok) {
        const data = await historialResponse.json()
        setRegistros(Array.isArray(data) ? data : data.results || [])
      }

      // Cargar pacientes
      const pacientesResponse = await fetch('http://127.0.0.1:8000/api/pacientes/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (pacientesResponse.ok) {
        const data = await pacientesResponse.json()
        setPacientes(Array.isArray(data) ? data : data.results || [])
      }

      // Cargar estudiantes
      const estudiantesResponse = await fetch('http://127.0.0.1:8000/api/usuarios/estudiantes/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (estudiantesResponse.ok) {
        const data = await estudiantesResponse.json()
        setEstudiantes(Array.isArray(data) ? data : data.results || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const aplicarFiltros = () => {
    let filtered = registros

    if (filtros.paciente) {
      filtered = filtered.filter(r => 
        r.valores_nuevos?.paciente_id === filtros.paciente ||
        r.valores_anteriores?.paciente_id === filtros.paciente
      )
    }

    if (filtros.estudiante) {
      filtered = filtered.filter(r => 
        r.usuario_nombre?.toLowerCase().includes(filtros.estudiante.toLowerCase())
      )
    }

    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde)
      filtered = filtered.filter(r => new Date(r.creado_en) >= fechaDesde)
    }

    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta)
      fechaHasta.setHours(23, 59, 59, 999)
      filtered = filtered.filter(r => new Date(r.creado_en) <= fechaHasta)
    }

    if (filtros.searchTerm) {
      const term = filtros.searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.descripcion?.toLowerCase().includes(term) ||
        r.usuario_nombre?.toLowerCase().includes(term)
      )
    }

    setRegistrosFiltrados(filtered)
  }

  const formatFecha = (fecha: string) => {
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

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      'RESERVADA': { color: 'bg-clinica-primary/20 text-clinica-primary', label: '📅 Reservada' },
      'CONFIRMADA': { color: 'bg-green-100 text-green-800', label: '✓ Confirmada' },
      'EN_ESPERA': { color: 'bg-yellow-100 text-yellow-800', label: '⏳ En Espera' },
      'ATENDIENDO': { color: 'bg-purple-100 text-purple-800', label: '🏥 Atendiendo' },
      'FINALIZADO': { color: 'bg-clinica-secondary text-white', label: '✅ Finalizado' },
      'NO_ASISTIO': { color: 'bg-red-100 text-red-800', label: '❌ No Asistió' },
      'CANCELADA': { color: 'bg-gray-100 text-gray-800', label: '🚫 Cancelada' },
      'REPROGRAMADA': { color: 'bg-orange-100 text-orange-800', label: '🔄 Reprogramada' },
    }
    const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', label: estado }
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(16)
    doc.text('Historial General de Citas', pageWidth / 2, 15, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 22, { align: 'center' })
    doc.text(`Total de registros: ${registrosFiltrados.length}`, pageWidth / 2, 28, { align: 'center' })
    
    const tableData = registrosFiltrados.map(registro => [
      formatFecha(registro.creado_en),
      registro.valores_anteriores?.estado || 'N/A',
      registro.valores_nuevos?.estado || 'N/A',
      registro.usuario_nombre || 'Sistema',
      registro.descripcion || ''
    ])

    ;(doc as any).autoTable({
      head: [['Fecha/Hora', 'Estado Anterior', 'Nuevo Estado', 'Usuario', 'Descripción']],
      body: tableData,
      startY: 34,
      margin: { top: 34 },
      didDrawPage: function (data: any) {
        const pageSize = doc.internal.pageSize
        const pageHeight = pageSize.getHeight()
        const pageWidth = pageSize.getWidth()
        const pageCount = doc.internal.pages.length - 1
        
        doc.setFontSize(10)
        doc.text(
          `Página ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }
    })

    doc.save(`Historial_General_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const imprimirHistorial = () => {
    const ventana = window.open('', '', 'width=1000,height=700')
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Historial General de Citas</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .fecha { font-size: 0.85em; color: #666; }
              .total { text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Historial General de Citas</h1>
            <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
            <p><strong>Total de registros:</strong> ${registrosFiltrados.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Estado Anterior</th>
                  <th>Nuevo Estado</th>
                  <th>Usuario</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${registrosFiltrados.map(r => `
                  <tr>
                    <td class="fecha">${formatFecha(r.creado_en)}</td>
                    <td>${r.valores_anteriores?.estado || 'N/A'}</td>
                    <td>${r.valores_nuevos?.estado || 'N/A'}</td>
                    <td>${r.usuario_nombre || 'Sistema'}</td>
                    <td>${r.descripcion || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `)
      ventana.document.close()
      ventana.print()
    }
  }

  const limpiarFiltros = () => {
    setFiltros({
      paciente: '',
      estudiante: '',
      fechaDesde: '',
      fechaHasta: '',
      searchTerm: ''
    })
  }

  if (cargando) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Cargando datos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* FILTROS */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filtros.searchTerm}
                onChange={(e) => setFiltros({ ...filtros, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Paciente */}
            <Select value={filtros.paciente} onValueChange={(value) => setFiltros({ ...filtros, paciente: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los pacientes</SelectItem>
                {pacientes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.apellido_paterno} {p.nombres}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estudiante */}
            <Select value={filtros.estudiante} onValueChange={(value) => setFiltros({ ...filtros, estudiante: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estudiantes</SelectItem>
                {estudiantes.map(e => (
                  <SelectItem key={e.id} value={e.first_name}>
                    {e.first_name} {e.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Fecha Desde */}
            <Input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              placeholder="Desde"
            />

            {/* Fecha Hasta */}
            <Input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              placeholder="Hasta"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={limpiarFiltros}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* HISTORIAL */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial General ({registrosFiltrados.length} registros)</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={imprimirHistorial}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportarPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registrosFiltrados.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No hay registros con los filtros aplicados
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Estado Anterior</TableHead>
                    <TableHead>Nuevo Estado</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosFiltrados.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatFecha(registro.creado_en)}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(registro.valores_anteriores?.estado || 'N/A')}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(registro.valores_nuevos?.estado || 'N/A')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {registro.usuario_nombre || 'Sistema'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {registro.descripcion}
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
