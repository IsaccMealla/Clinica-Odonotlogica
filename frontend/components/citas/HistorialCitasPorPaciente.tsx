"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface HistorialCitasPorPacienteProps {
  pacienteId: string
  pacienteNombre: string
}

export function HistorialCitasPorPaciente({ pacienteId, pacienteNombre }: HistorialCitasPorPacienteProps) {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [pacienteId])

  const cargarHistorial = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://127.0.0.1:8000/api/historial-citas/por_paciente/?paciente_id=${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRegistros(Array.isArray(data.cambios) ? data.cambios : [])
      }
    } catch (error) {
      console.error('Error al cargar historial:', error)
    } finally {
      setCargando(false)
    }
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
    
    // Título
    doc.setFontSize(16)
    doc.text(`Historial de Citas - ${pacienteNombre}`, pageWidth / 2, 15, { align: 'center' })
    
    // Fecha de generación
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, 22, { align: 'center' })
    
    // Tabla
    const tableData = registros.map(registro => [
      formatFecha(registro.creado_en),
      registro.valores_anteriores?.estado || 'N/A',
      registro.valores_nuevos?.estado || 'N/A',
      registro.usuario_nombre || 'Sistema',
      registro.descripcion || ''
    ])

    ;(doc as any).autoTable({
      head: [['Fecha/Hora', 'Estado Anterior', 'Nuevo Estado', 'Usuario', 'Descripción']],
      body: tableData,
      startY: 28,
      margin: { top: 28 },
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

    doc.save(`Historial_${pacienteNombre.replace(/\s+/g, '_')}.pdf`)
  }

  const imprimirHistorial = () => {
    const ventana = window.open('', '', 'width=900,height=600')
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Historial de Citas - ${pacienteNombre}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .fecha { font-size: 0.9em; color: #666; }
            </style>
          </head>
          <body>
            <h1>Historial de Citas - ${pacienteNombre}</h1>
            <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
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
                ${registros.map(r => `
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

  if (cargando) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Cargando historial...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historial de Cambios - {pacienteNombre}</CardTitle>
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
        {registros.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No hay registro de cambios para este paciente
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
                {registros.map((registro) => (
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
  )
}
