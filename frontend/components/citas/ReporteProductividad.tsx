"use client"

import { useMemo } from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cita } from "@/types/cita"

interface Props {
  citas?: Cita[] // Hacemos las citas opcionales para evitar errores de carga
}

const isFinalizada = (estado: string) =>
  estado === "FINALIZADA" || estado === "COMPLETADA"

const isInasistencia = (estado: string) =>
  estado === "NO_ASISTIO" || estado === "AUSENTE"

export default function ReporteProductividad({ citas = [] }: Props) {
  // 1. Procesar datos para gráfico de barras: Citas por Estudiante
  const dataEstudiantes = useMemo(() => {
    // Si no hay citas, devolvemos array vacío
    if (!citas || citas.length === 0) return []
    
    const conteo: { [key: string]: number } = {}
    citas.forEach(cita => {
      // Validamos que el estado sea el correcto y que exista el nombre
      if (isFinalizada(cita.estado)) {
        const nombre = cita.estudiante_nombre || "Sin Nombre"
        conteo[nombre] = (conteo[nombre] || 0) + 1
      }
    })
    return Object.entries(conteo).map(([name, total]) => ({ name, total }))
  }, [citas])

  // 2. Procesar datos para gráfico de pastel: Estados de Citas (Ausentismo)
  const dataEstados = useMemo(() => {
    if (!citas) return []

    const finalizadas = citas.filter(c => isFinalizada(c.estado)).length
    const inasistencias = citas.filter(c => isInasistencia(c.estado)).length
    const otras = citas.length - (finalizadas + inasistencias)

    return [
      { name: 'Finalizadas', value: finalizadas, color: '#22c55e' },
      { name: 'Inasistencias', value: inasistencias, color: '#ef4444' },
      { name: 'Otras / Pendientes', value: otras > 0 ? otras : 0, color: '#94a3b8' },
    ]
  }, [citas])

  // Cálculos de métricas con protección contra división por cero
  const totalCitas = citas?.length || 0
  const finalizadasCount = citas?.filter(c => isFinalizada(c.estado)).length || 0
  const inasistenciasCount = citas?.filter(c => isInasistencia(c.estado)).length || 0
  
  const efectividad = totalCitas > 0 ? ((finalizadasCount / totalCitas) * 100).toFixed(1) : "0"
  const tasaAbandono = totalCitas > 0 ? ((inasistenciasCount / totalCitas) * 100).toFixed(1) : "0"
  
  // Cálculo de horas (convertido a número de forma segura)
  const totalMinutos = citas?.reduce((acc, curr) => {
    return acc + (isFinalizada(curr.estado) ? (Number(curr.duracion_estimada) || 0) : 0)
  }, 0) || 0

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Citas Finalizadas por Estudiante</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dataEstudiantes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataEstudiantes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No hay datos de productividad disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pastel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribución de Asistencia</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {totalCitas > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin registros de asistencia
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Métricas de Rendimiento Clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Citas</p>
              <p className="text-2xl font-bold">{totalCitas}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs text-green-700 uppercase font-bold">Efectividad</p>
              <p className="text-2xl font-bold text-green-700">{efectividad}%</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-700 uppercase font-bold">Tasa de Abandono</p>
              <p className="text-2xl font-bold text-red-700">{tasaAbandono}%</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 uppercase font-bold">Horas Clínicas</p>
              <p className="text-2xl font-bold text-blue-700">{(totalMinutos / 60).toFixed(1)}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}