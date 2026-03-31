"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"

type TreatmentReportData = {
  common_treatments: Array<{ reason: string; count: number }>
  by_student: Array<{ student__first_name: string; student__last_name: string; total: number }>
  monthly: Array<{ month: string; total: number }>
  success_rate: number
}

const COLORS = ["#3b82f6", "#6366f1", "#ec4899", "#f97316", "#14b8a6"]

export function TreatmentReportCharts() {
  const [data, setData] = useState<TreatmentReportData | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/reports/treatments/")
      if (res.ok) setData(await res.json())
    })()
  }, [])

  if (!data) return <div>Cargando datos de tratamientos...</div>

  const common = data.common_treatments.map((item) => ({ name: item.reason || 'No especificado', value: item.count }))
  const byStudent = data.by_student.map((item) => ({ name: `${item.student__first_name} ${item.student__last_name}`, value: item.total }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Tratamientos más comunes</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={common} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} fill="#8884d8" label>
                {common.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tratamientos por estudiante</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStudent}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tasa de éxito</CardTitle>
          <p className="text-sm text-muted-foreground">{data.success_rate}% de tratamientos completados</p>
        </CardHeader>
      </Card>
    </div>
  )
}
