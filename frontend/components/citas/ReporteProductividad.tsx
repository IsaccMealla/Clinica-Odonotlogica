"use client"

import { useMemo } from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cita } from "@/types/cita"

interface Props {
  citas: Cita[]
}

export default function ReporteProductividad({ citas }: Props) {
  // 1. Procesar datos para gráfico de barras: Citas por Estudiante
  const dataEstudiantes = useMemo(() => {
    const conteo: { [key: string]: number } = {}
    citas.forEach(cita => {
      if (cita.estado === 'FINALIZADA') {
        conteo[cita.estudiante_nombre] = (conteo[cita.estudiante_nombre] || 0) + 1
      }
    })
    return Object.entries(conteo).map(([name, total]) => ({ name, total }))
  }, [citas])

  // 2. Procesar datos para gráfico de pastel: Estados de Citas (Ausentismo)
  const dataEstados = useMemo(() => {
    const estados = {
      Finalizadas: citas.filter(c => c.estado === 'FINALIZADA').length,
      Inasistencias: citas.filter(c => c.estado === 'NO_ASISTIO').length,
      Canceladas: citas.filter(c => c.estado === 'RESERVADA').length, // Simplificado
    }
    return [
      { name: 'Finalizadas', value: estados.Finalizadas, color: '#22c55e' },
      { name: 'Inasistencias', value: estados.Inasistencias, color: '#ef4444' },
      { name: 'Otras', value: estados.Canceladas, color: '#94a3b8' },
    ]
  }, [citas])

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Barras: Productividad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Citas Finalizadas por Estudiante</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataEstudiantes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pastel: Control de Ausentismo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribución de Asistencia (No-Show)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEstados}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Resumen Operativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Métricas de Rendimiento Clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Citas</p>
              <p className="text-2xl font-bold">{citas.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 uppercase font-bold">Efectividad</p>
              <p className="text-2xl font-bold text-green-700">
                {citas.length > 0 
                  ? ((citas.filter(c => c.estado === 'FINALIZADA').length / citas.length) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700 uppercase font-bold">Tasa de Abandono</p>
              <p className="text-2xl font-bold text-red-700">
                {citas.length > 0 
                  ? ((citas.filter(c => c.estado === 'NO_ASISTIO').length / citas.length) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 uppercase font-bold">Horas Clínicas</p>
              <p className="text-2xl font-bold text-blue-700">
                {citas.reduce((acc, curr) => acc + (curr.estado === 'FINALIZADA' ? curr.duracion_estimada : 0), 0) / 60}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}