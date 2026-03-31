/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"

interface Subject {
  id: string
  name: string
  description?: string
  semester: string
}

interface AcademicGroup {
  id: string
  subject: string
  group_name: string
  teacher?: string
  semester: string
  created_at: string
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

export default function AcademicGroupsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<AcademicGroup[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])

  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", semester: "" })
  const [groupForm, setGroupForm] = useState({ subject: "", group_name: "", teacher: "", semester: "" })
  const [addStudentGroup, setAddStudentGroup] = useState({ groupId: "", student: "" })

  const fetchData = async () => {
    const [subjectsResp, groupsResp, studentsResp, dentistsResp] = await Promise.all([
      fetch("/api/subjects"),
      fetch("/api/groups"),
      fetch("/api/students"),
      fetch("/api/dentists"),
    ])

    if (subjectsResp.ok) setSubjects(await subjectsResp.json())
    if (groupsResp.ok) setGroups(await groupsResp.json())
    if (studentsResp.ok) setStudents(await studentsResp.json())
    if (dentistsResp.ok) setDentists(await dentistsResp.json())
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const createSubject = async () => {
    const resp = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subjectForm),
    })

    if (resp.ok) {
      setSubjectForm({ name: "", description: "", semester: "" })
      await fetchData()
    }
  }

  const createGroup = async () => {
    const resp = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupForm),
    })

    if (resp.ok) {
      setGroupForm({ subject: "", group_name: "", teacher: "", semester: "" })
      await fetchData()
    }
  }

  const addStudentToGroup = async () => {
    if (!addStudentGroup.groupId || !addStudentGroup.student) return

    const resp = await fetch(`/api/groups/${addStudentGroup.groupId}/add-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student: addStudentGroup.student }),
    })

    if (resp.ok) {
      setAddStudentGroup({ groupId: "", student: "" })
      await fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supervisión Académica</h1>
        <p className="text-muted-foreground mt-2">Gestiona asignaturas, grupos y estudiantes.</p>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <article className="p-4 rounded-lg border">
          <h2 className="font-bold">Crear Asignatura</h2>
          <div className="space-y-2 mt-2">
            <input className="input w-full" placeholder="Nombre" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            <input className="input w-full" placeholder="Semestre" value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })} />
            <textarea className="textarea w-full" placeholder="Descripción" value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} />
            <button onClick={createSubject} className="btn btn-primary w-full">Guardar Asignatura</button>
          </div>
        </article>

        <article className="p-4 rounded-lg border">
          <h2 className="font-bold">Crear Grupo</h2>
          <div className="space-y-2 mt-2">
            <select value={groupForm.subject} onChange={(e) => setGroupForm({ ...groupForm, subject: e.target.value })} className="select w-full">
              <option value="">Selecciona asignatura</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input className="input w-full" placeholder="Nombre de grupo" value={groupForm.group_name} onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })} />
            <select value={groupForm.teacher} onChange={(e) => setGroupForm({ ...groupForm, teacher: e.target.value })} className="select w-full">
              <option value="">Selecciona docente</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
              ))}
            </select>
            <input className="input w-full" placeholder="Semestre" value={groupForm.semester} onChange={(e) => setGroupForm({ ...groupForm, semester: e.target.value })} />
            <button onClick={createGroup} className="btn btn-primary w-full">Crear Grupo</button>
          </div>
        </article>
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-bold">Asignar Estudiante a Grupo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
          <select value={addStudentGroup.groupId} onChange={(e) => setAddStudentGroup({ ...addStudentGroup, groupId: e.target.value })} className="select w-full">
            <option value="">Selecciona grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name} - {g.semester}</option>
            ))}
          </select>
          <select value={addStudentGroup.student} onChange={(e) => setAddStudentGroup({ ...addStudentGroup, student: e.target.value })} className="select w-full">
            <option value="">Selecciona estudiante</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
          <button onClick={addStudentToGroup} className="btn btn-primary">Agregar</button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <article className="p-4 rounded-lg border">
          <h3 className="font-bold">Asignaturas</h3>
          <ul className="mt-2 space-y-1">
            {subjects.map((subject) => (
              <li key={subject.id} className="text-sm border rounded p-2">{subject.name} ({subject.semester})</li>
            ))}
          </ul>
        </article>

        <article className="p-4 rounded-lg border">
          <h3 className="font-bold">Grupos</h3>
          <ul className="mt-2 space-y-1">
            {groups.map((group) => (
              <li key={group.id} className="text-sm border rounded p-2">
                {group.group_name} / {group.semester}<br />
                <small>Asignatura: {group.subject}</small>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}
