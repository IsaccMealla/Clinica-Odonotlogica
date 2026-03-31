/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"

interface Paciente {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno?: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
}

interface Dentist {
  id: string
  first_name: string
  last_name: string
}

interface Assignment {
  id: string
  patient: string
  student: string
  supervising_teacher?: string
  treatment_area: string
  assigned_date: string
  status: string
}

export default function AcademicAssignmentsPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [form, setForm] = useState({
    patient: "",
    student: "",
    supervising_teacher: "",
    treatment_area: "",
    status: "active",
  })
  const [filter, setFilter] = useState({ student: "", teacher: "" })

  const fetchAll = async () => {
    const [pacientesResp, studentsResp, dentistsResp, assignmentsResp] = await Promise.all([
      fetch("/api/pacientes"),
      fetch("/api/students"),
      fetch("/api/dentists"),
      fetch(`/api/assignments?student=${filter.student}&teacher=${filter.teacher}`),
    ])

    if (pacientesResp.ok) setPacientes(await pacientesResp.json())
    if (studentsResp.ok) setStudents(await studentsResp.json())
    if (dentistsResp.ok) setDentists(await dentistsResp.json())
    if (assignmentsResp.ok) setAssignments(await assignmentsResp.json())
  }

  useEffect(() => {
    void fetchAll()
  }, [filter])

  const createAssignment = async () => {
    const resp = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (resp.ok) {
      setForm({ patient: "", student: "", supervising_teacher: "", treatment_area: "", status: "active" })
      await fetchAll()
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return

    const resp = await fetch(`/api/assignments/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...assignment, status }),
    })
    if (resp.ok) {
      await fetchAll()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asignaciones Paciente-Estudiante</h1>
        <p className="text-muted-foreground mt-2">Asigna pacientes a estudiantes con tutoría docente.</p>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border">
          <h2 className="font-bold">Nueva asignación</h2>
          <div className="space-y-2 mt-3">
            <select value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} className="select w-full">
              <option value="">Selecciona paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.apellido_paterno} {p.nombres}</option>
              ))}
            </select>
            <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} className="select w-full">
              <option value="">Selecciona estudiante</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
            <select value={form.supervising_teacher} onChange={(e) => setForm({ ...form, supervising_teacher: e.target.value })} className="select w-full">
              <option value="">Selecciona tutor</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
              ))}
            </select>
            <input className="input w-full" placeholder="Área de tratamiento" value={form.treatment_area} onChange={(e) => setForm({ ...form, treatment_area: e.target.value })} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select w-full">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-primary w-full" onClick={createAssignment}>Crear asignación</button>
          </div>
        </div>

        <div className="p-4 rounded-lg border">
          <h2 className="font-bold">Filtros</h2>
          <div className="space-y-2 mt-3">
            <select value={filter.student} onChange={(e) => setFilter({ ...filter, student: e.target.value })} className="select w-full">
              <option value="">Todos los estudiantes</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
            <select value={filter.teacher} onChange={(e) => setFilter({ ...filter, teacher: e.target.value })} className="select w-full">
              <option value="">Todos los tutores</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
              ))}
            </select>
            <button className="btn btn-secondary w-full" onClick={() => setFilter({ student: "", teacher: "" })}>Limpiar filtro</button>
          </div>
        </div>
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-bold">Asignaciones</h2>
        <div className="overflow-x-auto mt-3">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Estudiante</th>
                <th>Tutor</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.patient}</td>
                  <td>{a.student}</td>
                  <td>{a.supervising_teacher}</td>
                  <td>{a.treatment_area}</td>
                  <td>{a.status}</td>
                  <td className="space-x-2">
                    <button className="btn btn-xs" onClick={() => void updateStatus(a.id, 'completed')}>Completar</button>
                    <button className="btn btn-xs" onClick={() => void updateStatus(a.id, 'cancelled')}>Cancelar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
