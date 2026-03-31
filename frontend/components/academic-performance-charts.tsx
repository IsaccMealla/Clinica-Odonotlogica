"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

type StudentPerformance = {
  student__id: string
  student__first_name: string
  student__last_name: string
  total: number
  completed: number
  pending: number
}

type StudentPerformanceResponse = {
  students: StudentPerformance[]
}

type TeacherSupervision = {
  supervising_teacher__id: string
  supervising_teacher__first_name: string
  supervising_teacher__last_name: string
  total: number
  pending: number
}

type TeacherSupervisionResponse = {
  teachers: TeacherSupervision[]
}

export function AcademicPerformanceCharts() {
  const [students, setStudents] = useState<StudentPerformanceResponse | null>(null)
  const [teachers, setTeachers] = useState<TeacherSupervisionResponse | null>(null)

  useEffect(() => {
    void (async () => {
      const [studentsRes, teachersRes] = await Promise.all([
        fetch("/api/reports/students/performance/"),
        fetch("/api/reports/teachers/supervision/"),
      ])
      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (teachersRes.ok) setTeachers(await teachersRes.json())
    })()
  }, [])

  if (!students || !teachers) return <div>Cargando indicadores académicos...</div>

  const studentData = students.students.map((item) => ({ key: `${item.student__first_name} ${item.student__last_name}`, total: item.total, completed: item.completed, pending: item.pending }))
  const teacherData = teachers.teachers.map((item) => ({ key: `${item.supervising_teacher__first_name} ${item.supervising_teacher__last_name}`, total: item.total, pending: item.pending }))

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Pacientes por estudiante</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#0ea5e9" />
              <Bar dataKey="completed" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supervisión docente</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teacherData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8b5cf6" />
              <Bar dataKey="pending" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
