"use client"

import { useState, useEffect } from 'react'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { 
  FileText, Shield, Clock, Users, Database,
  Search, Download, Filter, RefreshCcw
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AuditoriaPage() {
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    cargarAsistencias()
  }, [])

  const cargarAsistencias = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem('access_token') || ''
      const res = await fetch('http://localhost:8000/api/asistencia/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAsistencias(data.results || data)
      }
    } catch (e) {
      console.error("Error cargando asistencias", e)
    } finally {
      setCargando(false)
    }
  }

  const formatFecha = (fechaStr: string | null) => {
    if (!fechaStr) return '---'
    try {
      const date = new Date(fechaStr)
      return format(date, "dd MMM yyyy, HH:mm", { locale: es })
    } catch (e) {
      return fechaStr
    }
  }

  const filteredAsistencias = asistencias.filter(a => 
    a.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.materia_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.usuario_rol?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-clinica-secondary" />
              Módulo de Auditoría
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Control de accesos, asistencia y registros del sistema</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={cargarAsistencias} disabled={cargando}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button className="bg-clinica-secondary hover:bg-clinica-secondary/90">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Tablas de Reportes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-clinica-primary" />
                Control de Asistencia General
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar por usuario, rol o materia..." 
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Usuario</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  <th className="px-6 py-4 font-semibold">Materia Clínica</th>
                  <th className="px-6 py-4 font-semibold text-center">Ingreso</th>
                  <th className="px-6 py-4 font-semibold text-center">Salida</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-clinica-secondary" />
                      Cargando registros...
                    </td>
                  </tr>
                ) : filteredAsistencias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron registros de asistencia.
                    </td>
                  </tr>
                ) : (
                  filteredAsistencias.map((registro: any) => (
                    <tr key={registro.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {registro.usuario_nombre}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-full ${
                          registro.usuario_rol === 'DOCENTE' ? 'bg-blue-100 text-blue-700' : 
                          registro.usuario_rol === 'ESTUDIANTE' ? 'bg-emerald-100 text-emerald-700' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {registro.usuario_rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{registro.materia_codigo}</span>
                          <span className="text-xs text-slate-500">{registro.materia_nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-600 font-medium">
                          {formatFecha(registro.hora_ingreso)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {registro.hora_salida ? (
                          <span className="text-slate-600 font-medium">
                            {formatFecha(registro.hora_salida)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">En curso...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {registro.activo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            FINALIZADO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
