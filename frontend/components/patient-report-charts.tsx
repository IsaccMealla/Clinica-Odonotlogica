"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"

type PatientSummary = {
  total_patients: number
  monthly: Array<{ month: string; count: number }>
  age_groups: Record<string, number>
  gender_groups: Array<{ sexo: string; count: number }>
}

const COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#eab308", "#ec4899"]

export function PatientReportCharts() {
  const [summary, setSummary] = useState<PatientSummary | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/reports/patients/summary/")
      if (res.ok) setSummary(await res.json())
    })()
  }, [])

  if (!summary) return <div>Cargando datos de pacientes...</div>

  const ageData = Object.entries(summary.age_groups).map(([name, value]) => ({ name, value }))
  const genderData = summary.gender_groups.map((item) => ({ name: item.sexo || "Sin género", value: item.count }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total de pacientes: {summary.total_patients}</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.monthly.map((item: any) => ({ mes: new Date(item.month).toLocaleDateString("es-ES", { month: "short", year: "numeric" }), count: item.count }))}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por rango de edad</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#6366f1" label>
                {ageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Distribución por género</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
