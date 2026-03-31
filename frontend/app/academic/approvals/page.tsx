/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"

interface Assignment {
  id: string
  patient: string
  student: string
  supervising_teacher?: string
  treatment_area: string
  status: string
}

interface Dentist {
  id: string
  first_name: string
  last_name: string
}

interface Approval {
  id: string
  assignment: string
  teacher?: string
  approval_status: string
  approval_date?: string
  digital_signature?: string
  comments?: string
}

export default function AcademicApprovalsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])

  const [selected, setSelected] = useState({ assignment: "", teacher: "", status: "pending", digital_signature: "", comments: "" })

  const fetchData = async () => {
    const [assignmentsResp, dentistsResp, approvalsResp] = await Promise.all([
      fetch("/api/assignments?status=active"),
      fetch("/api/dentists"),
      fetch("/api/approvals"),
    ])

    if (assignmentsResp.ok) setAssignments(await assignmentsResp.json())
    if (dentistsResp.ok) setDentists(await dentistsResp.json())
    if (approvalsResp.ok) setApprovals(await approvalsResp.json())
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const createApproval = async () => {
    const resp = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    })

    if (resp.ok) {
      setSelected({ assignment: "", teacher: "", status: "pending", digital_signature: "", comments: "" })
      await fetchData()
    }
  }

  const setApproval = async (id: string, status: string) => {
    const found = approvals.find((a) => a.id === id)
    if (!found) return

    const resp = await fetch(`/api/approvals/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...found, approval_status: status }),
    })

    if (resp.ok) await fetchData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprobaciones de Docentes</h1>
        <p className="text-muted-foreground mt-2">Revisa y firma digitalmente los tratamientos.</p>
      </div>

      <section className="p-4 rounded-lg border">
        <h2 className="font-bold">Registrar aprobación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <select value={selected.assignment} onChange={(e) => setSelected({ ...selected, assignment: e.target.value })} className="select w-full">
            <option value="">Selecciona asignación</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>{assignment.patient} - {assignment.student} ({assignment.treatment_area})</option>
            ))}
          </select>
          <select value={selected.teacher} onChange={(e) => setSelected({ ...selected, teacher: e.target.value })} className="select w-full">
            <option value="">Selecciona docente</option>
            {dentists.map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
          <select value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })} className="select w-full">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input className="input w-full" placeholder="Firma digital" value={selected.digital_signature} onChange={(e) => setSelected({ ...selected, digital_signature: e.target.value })} />
          <textarea className="textarea w-full md:col-span-2" placeholder="Comentarios" value={selected.comments} onChange={(e) => setSelected({ ...selected, comments: e.target.value })} />
          <button className="btn btn-primary w-full md:col-span-2" onClick={createApproval}>Enviar aprobación</button>
        </div>
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-bold">Aprobaciones pendientes</h2>
        <div className="overflow-x-auto mt-3">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Asignación</th>
                <th>Docente</th>
                <th>Estado</th>
                <th>Firma</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.id}>
                  <td>{approval.assignment}</td>
                  <td>{approval.teacher}</td>
                  <td>{approval.approval_status}</td>
                  <td>{approval.digital_signature}</td>
                  <td>
                    <button className="btn btn-xs mr-1" onClick={() => void setApproval(approval.id, 'approved')}>Approbar</button>
                    <button className="btn btn-xs" onClick={() => void setApproval(approval.id, 'rejected')}>Rechazar</button>
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
