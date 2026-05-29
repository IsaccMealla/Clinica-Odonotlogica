"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Registro {
  id: number
  usuario_rol: string
  accion: string
}

export function GraficosAsistencia({ registros }: { registros: Registro[] }) {
  // Procesamos los datos para el gráfico
  const datosGrafico = useMemo(() => {
    const conteo: Record<string, number> = {
      'ADMIN': 0, 'DOCENTE': 0, 'ESTUDIANTE': 0, 'RECEPCIONISTA': 0
    }
    
    registros.forEach(reg => {
      if (conteo[reg.usuario_rol] !== undefined) {
        conteo[reg.usuario_rol]++
      }
    })

    return [
      { name: 'Administradores', cantidad: conteo['ADMIN'], color: '#ef4444' }, // Red
      { name: 'Docentes', cantidad: conteo['DOCENTE'], color: '#3b82f6' },      // Blue
      { name: 'Estudiantes', cantidad: conteo['ESTUDIANTE'], color: '#a855f7' }, // Purple
      { name: 'Recepción', cantidad: conteo['RECEPCIONISTA'], color: '#22c55e' }, // Green
    ]
  }, [registros])

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Actividad por Roles
        </CardTitle>
        <CardDescription>Distribución de ingresos y salidas registrados hoy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
              <YAxis axisLine={false} tickLine={false} className="text-xs" />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} animationDuration={1500}>
                {datosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}