"use client"

import { useState, useEffect, useMemo } from 'react'
import { Pencil, Save, X, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MALLA_ODONTOLOGIA } from "@/lib/malla-curricular-store"

export function EstudianteList() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [inscripciones, setInscripciones] = useState<any[]>([])
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [materiaEstados, setMateriaEstados] = useState<Record<string, string>>({})
  
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
      
      const [resEstudiantes, resMaterias, resInsc] = await Promise.all([
        fetch('http://localhost:8000/api/usuarios/?rol=ESTUDIANTE', { headers }),
        fetch('http://localhost:8000/api/materias/', { headers }),
        fetch('http://localhost:8000/api/materia-estudiante/', { headers })
      ])

      if (resEstudiantes.ok) {
        const data = await resEstudiantes.json()
        setEstudiantes(data.results || data)
      }
      if (resMaterias.ok) {
        const data = await resMaterias.json()
        setMaterias(data.results || data)
      }
      if (resInsc.ok) {
        const data = await resInsc.json()
        setInscripciones(data.results || data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleEdit = (estudianteId: string) => {
    setEditingId(estudianteId)
    const currentEstados: Record<string, string> = {}
    inscripciones.filter(i => i.estudiante === estudianteId).forEach(i => {
      currentEstados[i.materia] = i.estado
    })
    setMateriaEstados(currentEstados)
  }

  const toggleMateria = (materiaId: string) => {
    setMateriaEstados(prev => {
      const next = { ...prev }
      if (next[materiaId]) {
        delete next[materiaId]
      } else {
        next[materiaId] = 'CURSANDO'
      }
      return next
    })
  }

  const changeEstado = (materiaId: string, estado: string) => {
    setMateriaEstados(prev => ({ ...prev, [materiaId]: estado }))
  }

  const handleSave = async (estudianteId: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }

      const currentInscripciones = inscripciones.filter(i => i.estudiante === estudianteId)
      
      const toDelete = currentInscripciones.filter(i => !materiaEstados[i.materia])
      const toUpdate = currentInscripciones.filter(i => materiaEstados[i.materia] && materiaEstados[i.materia] !== i.estado)
      const toAdd = Object.keys(materiaEstados).filter(id => !currentInscripciones.some(i => i.materia === id))

      await Promise.all([
        ...toDelete.map(i => 
          fetch(`http://localhost:8000/api/materia-estudiante/${i.id}/`, {
            method: 'DELETE',
            headers
          })
        ),
        ...toUpdate.map(i => 
          fetch(`http://localhost:8000/api/materia-estudiante/${i.id}/`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ estado: materiaEstados[i.materia] })
          })
        ),
        ...toAdd.map(materiaId =>
          fetch(`http://localhost:8000/api/materia-estudiante/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ estudiante: estudianteId, materia: materiaId, estado: materiaEstados[materiaId] })
          })
        )
      ])

      await fetchData()
      setEditingId(null)
    } catch (error) {
      console.error("Error saving inscriptions", error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  // Filtrado
  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter(est => {
      const full = `${est.first_name || ''} ${est.last_name || ''}`.toLowerCase()
      const user = (est.username || '').toLowerCase()
      const ci = (est.ci || '').toLowerCase()
      const search = searchTerm.toLowerCase()
      return full.includes(search) || user.includes(search) || ci.includes(search)
    })
  }, [estudiantes, searchTerm])

  const paginatedEstudiantes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredEstudiantes.slice(startIndex, startIndex + pageSize)
  }, [filteredEstudiantes, currentPage, pageSize])

  const totalPages = Math.ceil(filteredEstudiantes.length / pageSize) || 1

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  const getMateriasForEstudiante = (estudianteId: string) => {
    const insc = inscripciones.filter(i => i.estudiante === estudianteId)
    if (insc.length === 0) return <span className="text-gray-400 italic">Sin materias inscritas</span>
    
    return insc.map(i => (
      <span key={i.id} className={`mr-2 mb-1 inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${i.estado === 'APROBADA' ? 'bg-green-100 text-green-800' : 'bg-clinica-primary/20 text-clinica-primary'}`}>
        {i.materia_nombre || i.materia_codigo || 'Materia'}
      </span>
    ))
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inscripción de Materias a Estudiantes</h2>
          <p className="text-slate-500">Asigna materias a los estudiantes para que puedan acceder a la clínica.</p>
        </div>
        
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materias Inscritas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedEstudiantes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron estudiantes.
                </td>
              </tr>
            )}
            {paginatedEstudiantes.map((est) => (
              <tr key={est.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {est.first_name} {est.last_name} 
                  <div className="text-xs text-gray-500 font-normal mt-0.5">
                    {est.ci && <span className="font-semibold text-slate-700 mr-2">CI: {est.ci}</span>}
                    {est.email || est.username}
                  </div>
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingId === est.id ? (
                    <div className="max-h-96 overflow-y-auto border rounded p-3 bg-gray-50 flex flex-col gap-4">
                      {[5, 6, 7, 8, 9, 10].map(semestre => {
                        const materiasSemestre = materias.filter(m => m.semestre === semestre).sort((a,b) => a.codigo.localeCompare(b.codigo))
                        if (materiasSemestre.length === 0) return null
                        
                        return (
                          <div key={semestre} className="bg-white p-3 rounded shadow-sm border">
                            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Semestre {semestre}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {materiasSemestre.map(m => {
                                const mallaData = MALLA_ODONTOLOGIA.find(item => item.id === m.codigo)
                                const prerequisitos = mallaData?.prerequisitos || []
                                
                                const canTake = prerequisitos.every(reqId => {
                                  const reqMateria = materias.find(mat => mat.codigo === reqId)
                                  return reqMateria && materiaEstados[reqMateria.id] === 'APROBADA'
                                })

                                const isChecked = Boolean(materiaEstados[m.id])
                                const disabled = !canTake && !isChecked
                                
                                return (
                                  <div key={m.id} className={`flex flex-col p-1.5 rounded border ${disabled ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'} transition-all`}>
                                    <label className={`flex items-start space-x-2 text-xs ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} title={disabled ? `Prerrequisitos faltantes: ${prerequisitos.join(', ')}` : ''}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => toggleMateria(m.id)}
                                        disabled={disabled}
                                        className="rounded text-clinica-primary focus:ring-clinica-primary mt-0.5"
                                      />
                                      <div className="flex flex-col w-full">
                                        <span className="truncate font-semibold text-slate-800">{m.codigo} - {m.nombre}</span>
                                        {prerequisitos.length > 0 && (
                                          <span className="text-[10px] text-slate-500">Req: {prerequisitos.join(', ')}</span>
                                        )}
                                        {disabled && !isChecked && <span className="text-[10px] text-red-500 font-bold mt-1">Bloqueada (Faltan previas)</span>}
                                      </div>
                                    </label>
                                    
                                    {isChecked && (
                                      <div className="mt-2 ml-5">
                                        <select 
                                          value={materiaEstados[m.id]}
                                          onChange={(e) => changeEstado(m.id, e.target.value)}
                                          className="text-xs border-gray-300 rounded focus:ring-clinica-primary focus:border-clinica-primary py-1 px-2 w-full"
                                        >
                                          <option value="CURSANDO">Cursando</option>
                                          <option value="APROBADA">Aprobada</option>
                                          <option value="REPROBADA">Reprobada</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {getMateriasForEstudiante(est.id)}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === est.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleSave(est.id)} className="text-clinica-secondary hover:text-green-900 bg-clinica-secondary/10 p-1.5 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(est.id)} className="text-clinica-primary hover:text-blue-900 bg-clinica-primary/10 p-1.5 rounded" title="Inscribir Materias">
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
          Mostrando {filteredEstudiantes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredEstudiantes.length)} de {filteredEstudiantes.length} estudiantes
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
