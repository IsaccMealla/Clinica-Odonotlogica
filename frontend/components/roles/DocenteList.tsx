"use client"

import { useState, useEffect, useMemo } from 'react'
import { Pencil, Save, X, Plus, Search, CheckCircle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function DocenteList() {
  const [docentes, setDocentes] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([])
  
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
      
      const [resDocentes, resMaterias, resAsig] = await Promise.all([
        fetch('http://localhost:8000/api/usuarios/?rol=DOCENTE', { headers }),
        fetch('http://localhost:8000/api/materias/', { headers }),
        fetch('http://localhost:8000/api/materia-docente/', { headers })
      ])

      if (resDocentes.ok) {
        const data = await resDocentes.json()
        setDocentes(data.results || data)
      }
      if (resMaterias.ok) {
        const data = await resMaterias.json()
        setMaterias(data.results || data)
      }
      if (resAsig.ok) {
        const data = await resAsig.json()
        setAsignaciones(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleEdit = (docenteId: string) => {
    setEditingId(docenteId)
    // Find current assigned subjects
    const current = asignaciones.filter(a => a.docente === docenteId && a.activo).map(a => a.materia)
    setSelectedMaterias(current)
  }

  const toggleMateria = (materiaId: string) => {
    setSelectedMaterias(prev => {
      if (prev.includes(materiaId)) {
        return prev.filter(id => id !== materiaId)
      } else {
        if (prev.length >= 3) {
          alert("Un docente solo puede llevar como máximo 3 materias.")
          return prev
        }
        return [...prev, materiaId]
      }
    })
  }

  const handleSave = async (docenteId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }

      // We should ideally sync the exact list, but for simplicity, let's just loop and create/delete
      // Find current active assignments for this teacher
      const currentAsignaciones = asignaciones.filter(a => a.docente === docenteId && a.activo)
      const currentMateriaIds = currentAsignaciones.map(a => a.materia)

      // To Delete (was in current, not in selected)
      const toDelete = currentAsignaciones.filter(a => !selectedMaterias.includes(a.materia))
      
      // To Add (is in selected, not in current)
      const toAdd = selectedMaterias.filter(id => !currentMateriaIds.includes(id))

      await Promise.all([
        ...toDelete.map(a => 
          fetch(`http://localhost:8000/api/materia-docente/${a.id}/`, {
            method: 'DELETE',
            headers
          })
        ),
        ...toAdd.map(materiaId =>
          fetch(`http://localhost:8000/api/materia-docente/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ docente: docenteId, materia: materiaId, activo: true })
          })
        )
      ])

      // Reload
      await fetchData()
      setEditingId(null)
    } catch (error) {
      console.error("Error saving assignments", error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filtrado
  const filteredDocentes = useMemo(() => {
    return docentes.filter(doc => {
      const full = `${doc.first_name || ''} ${doc.last_name || ''}`.toLowerCase()
      const user = (doc.username || '').toLowerCase()
      const ci = (doc.ci || '').toLowerCase()
      const search = searchTerm.toLowerCase()
      return full.includes(search) || user.includes(search) || ci.includes(search)
    })
  }, [docentes, searchTerm])

  const paginatedDocentes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredDocentes.slice(startIndex, startIndex + pageSize)
  }, [filteredDocentes, currentPage, pageSize])

  const totalPages = Math.ceil(filteredDocentes.length / pageSize) || 1

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  const getMateriasForDocente = (docenteId: string) => {
    const asig = asignaciones.filter(a => a.docente === docenteId && a.activo)
    if (asig.length === 0) return <span className="text-gray-400 italic">Sin materias asignadas</span>
    
    return asig.map(a => (
      <span key={a.id} className="mr-2 mb-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-clinica-primary/20 text-clinica-primary px-2 py-1">
        {a.materia_nombre || a.materia_codigo || 'Materia'}
      </span>
    ))
  }

  return (
    <div className="p-6 mt-8 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Asignación de Materias a Docentes</h2>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select 
            value={pageSize} 
            onChange={e => setPageSize(Number(e.target.value))}
            className="border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:ring-clinica-primary focus:border-clinica-primary"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por CI, nombre..." 
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materias Asignadas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedDocentes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron docentes.
                </td>
              </tr>
            )}
            {paginatedDocentes.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {doc.first_name} {doc.last_name} 
                  <div className="text-xs text-gray-500 font-normal mt-0.5">
                    {doc.ci && <span className="font-semibold text-slate-700 mr-2">CI: {doc.ci}</span>}
                    {doc.email || doc.username}
                  </div>
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingId === doc.id ? (
                    <div className="max-h-96 overflow-y-auto border rounded p-3 bg-gray-50 flex flex-col gap-4">
                      {[5, 6, 7, 8, 9, 10].map(semestre => {
                        const materiasSemestre = materias.filter(m => m.semestre === semestre).sort((a,b) => a.codigo.localeCompare(b.codigo))
                        if (materiasSemestre.length === 0) return null
                        
                        return (
                          <div key={semestre} className="bg-white p-3 rounded shadow-sm border">
                            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Semestre {semestre}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {materiasSemestre.map(m => (
                                <label key={m.id} className="flex items-center space-x-2 text-xs cursor-pointer p-1 hover:bg-slate-50 rounded">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedMaterias.includes(m.id)}
                                    onChange={() => toggleMateria(m.id)}
                                    className="rounded text-clinica-primary focus:ring-clinica-primary"
                                  />
                                  <span className="truncate font-semibold">{m.codigo} - {m.nombre}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {getMateriasForDocente(doc.id)}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === doc.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleSave(doc.id)} className="text-clinica-secondary hover:text-green-900 bg-clinica-secondary/10 p-1.5 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(doc.id)} className="text-clinica-primary hover:text-blue-900 bg-clinica-primary/10 p-1.5 rounded" title="Asignar Materias">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Mostrando {filteredDocentes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredDocentes.length)} de {filteredDocentes.length} docentes
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium py-1.5 px-3 bg-gray-100 rounded-md">
            Página {currentPage} de {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
