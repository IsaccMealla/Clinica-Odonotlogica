"use client"

import { useState, useEffect } from 'react'
import { Pencil, Save, X } from 'lucide-react'

// Dummy store para docentes (simulado con localStorage)
const DEFAULT_DOCENTES = [
  { id: '1', nombre: 'Dr. Roberto Jaimes', materia: 'Clínica de Operatoria I' },
  { id: '2', nombre: 'Dra. María Fernández', materia: 'Ortodoncia' },
  { id: '3', nombre: 'Dr. Carlos Mendoza', materia: 'Cirugía Bucal' },
]

function getDocentesDemo(): any[] {
  if (typeof window === 'undefined') return DEFAULT_DOCENTES
  try {
    const stored = localStorage.getItem('docentes_demo')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('docentes_demo', JSON.stringify(DEFAULT_DOCENTES))
    return DEFAULT_DOCENTES
  } catch {
    return DEFAULT_DOCENTES
  }
}

function saveDocentesDemo(docentes: any[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('docentes_demo', JSON.stringify(docentes))
  }
}

export function DocenteList() {
  const [docentes, setDocentes] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMateria, setEditMateria] = useState("")

  useEffect(() => {
    setDocentes(getDocentesDemo())
  }, [])

  const handleEdit = (doc: any) => {
    setEditingId(doc.id)
    setEditMateria(doc.materia)
  }

  const handleSave = (id: string) => {
    const updated = docentes.map(d => d.id === id ? { ...d, materia: editMateria } : d)
    setDocentes(updated)
    saveDocentesDemo(updated)
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  return (
    <div className="p-6 mt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Asignación de Materias a Docentes</h2>
      
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia Clínica Asignada</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docentes.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === doc.id ? (
                    <select 
                      className="border-gray-300 rounded-md shadow-sm text-sm p-1.5 focus:border-blue-500 focus:ring-blue-500"
                      value={editMateria}
                      onChange={(e) => setEditMateria(e.target.value)}
                    >
                      <option value="Clínica de Operatoria I">Clínica de Operatoria I</option>
                      <option value="Clínica de Endodoncia">Clínica de Endodoncia</option>
                      <option value="Cirugía Bucal">Cirugía Bucal</option>
                      <option value="Ortodoncia">Ortodoncia</option>
                      <option value="Periodoncia I">Periodoncia I</option>
                    </select>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {doc.materia}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === doc.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleSave(doc.id)} className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(doc)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
