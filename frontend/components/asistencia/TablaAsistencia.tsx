"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Definimos la forma de los datos que nos manda Django
interface Registro {
  id: number
  usuario: number
  usuario_nombre: string
  usuario_username: string
  usuario_rol: string
  accion: "INGRESO" | "SALIDA" | "PAUSA"
  fecha_hora: string
  huella_id: number | null
  verificado: boolean
}

export function TablaAsistencia({ 
  registrosIniciales, 
  onRefresh 
}: { 
  registrosIniciales: Registro[],
  onRefresh: () => void 
}) {
  
  // Formateador de fecha para que se vea bonita (ej: "5 de mayo, 14:30")
  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString)
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(fecha)
  }

  // Función para darle color al Badge según la acción
  const getColorAccion = (accion: string) => {
    switch (accion) {
      case 'INGRESO': return "bg-green-500 hover:bg-green-600"
      case 'SALIDA': return "bg-orange-500 hover:bg-orange-600"
      case 'PAUSA': return "bg-yellow-500 hover:bg-yellow-600 text-black"
      default: return "bg-slate-500 hover:bg-slate-600"
    }
  }

  // Función para darle color al rol
  const getColorRol = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return "bg-red-100 text-red-800"
      case 'DOCENTE': return "bg-blue-100 text-blue-800"
      case 'ESTUDIANTE': return "bg-purple-100 text-purple-800"
      case 'RECEPCIONISTA': return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Hora de Registro</TableHead>
            <TableHead>Huella ID</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrosIniciales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No hay registros de asistencia hoy.
              </TableCell>
            </TableRow>
          ) : (
            registrosIniciales.map((registro) => (
              <TableRow key={registro.id}>
                <TableCell className="font-medium">{registro.usuario_nombre || 'Sin nombre'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{registro.usuario_username}</TableCell>
                <TableCell>
                  <Badge className={`text-xs font-semibold ${getColorRol(registro.usuario_rol)}`}>
                    {registro.usuario_rol}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getColorAccion(registro.accion)}>
                    {registro.accion}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatearFecha(registro.fecha_hora)}</TableCell>
                <TableCell className="text-center">
                  {registro.huella_id ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                      {registro.huella_id}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {registro.verificado ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Verificado
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">No verificado</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}