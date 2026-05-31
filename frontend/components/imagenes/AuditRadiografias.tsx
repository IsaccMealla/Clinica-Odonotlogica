"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Clock, User, Activity } from "lucide-react"

interface AuditEntry {
  imageId: string | number
  action: string
  by: string
  at: string
  attempted?: boolean
}

export default function AuditRadiografias() {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('radiografia_audit') || '[]'
      setEntries(JSON.parse(stored))
    } catch (error) {
      console.error("Error cargando auditoría:", error)
      setEntries([])
    }
  }, [])

  const limpiarAuditoria = () => {
    if (confirm("¿Estás seguro de que deseas limpiar el historial de auditoría?")) {
      localStorage.setItem('radiografia_audit', '[]')
      setEntries([])
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Eliminado</Badge>
      case 'upload':
        return <Badge className="bg-green-100 text-green-800">Cargado</Badge>
      case 'view':
        return <Badge className="bg-blue-100 text-blue-800">Visualizado</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-800">{action}</Badge>
    }
  }

  const getStatusIcon = (attempted?: boolean) => {
    return attempted === false ? (
      <span className="text-yellow-600" title="Pendiente de sincronización">⚠️</span>
    ) : (
      <span className="text-green-600" title="Sincronizado">✓</span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-700">
              <Activity className="w-5 h-5" />
              <span className="font-semibold">Total de Eventos</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{entries.length}</p>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              <span className="font-semibold">Eliminaciones</span>
            </div>
            <p className="text-3xl font-bold text-red-900">
              {entries.filter(e => e.action === 'delete').length}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Último Evento</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {entries.length > 0 ? new Date(entries[0].at).toLocaleString('es-ES') : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabla de auditoría */}
      {entries.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-slate-100 p-4 border-b font-semibold text-slate-800 grid grid-cols-5 gap-4">
              <div>Fecha y Hora</div>
              <div>Usuario</div>
              <div>Acción</div>
              <div>ID Imagen</div>
              <div>Estado</div>
            </div>
            
            <div className="divide-y">
              {entries.map((entry, index) => (
                <div key={index} className="p-4 grid grid-cols-5 gap-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">
                      {new Date(entry.at).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.at).toLocaleTimeString('es-ES')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">{entry.by}</span>
                  </div>
                  
                  <div>
                    {getActionBadge(entry.action)}
                  </div>
                  
                  <div className="text-sm font-mono text-slate-600">
                    {entry.imageId}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(entry.attempted)}
                    <span className="text-xs text-slate-600">
                      {entry.attempted === false ? 'Pendiente' : 'Completado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={limpiarAuditoria}
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Historial de Auditoría
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="space-y-4">
            <Clock className="w-16 h-16 mx-auto text-slate-300" />
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Sin eventos registrados</h3>
              <p className="text-sm text-slate-500">Los eventos de auditoría aparecerán aquí</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
