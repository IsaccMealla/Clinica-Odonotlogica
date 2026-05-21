"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { ChevronDown, Folder, FolderOpen } from "lucide-react"

const API_URL = 'http://localhost:8000/api'

type PersonaRef = {
  id: string
  username?: string
}

type Registro = {
  id: string
  accion: string
  estudiante: PersonaRef | null
  estudiante_nombre?: string | null
  docente: PersonaRef | null
  docente_nombre?: string | null
  paciente: PersonaRef | null
  paciente_nombre?: string | null
  timestamp: string
  detalles?: Record<string, any>
}

interface Props {
  pacienteId?: string
}

interface PacienteFolder {
  id: string
  nombre: string
  registros: Registro[]
  isOpen: boolean
}

export default function HistorialAuditoriaTabla({ pacienteId: pacienteIdProp }: Props) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [pacienteId, setPacienteId] = useState(pacienteIdProp || '')
  const [query, setQuery] = useState('')
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())

  const fetchRegistros = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    const params = new URLSearchParams()
    if (pacienteId) params.set('paciente', pacienteId)
    if (query.trim()) params.set('q', query.trim())
    const response = await fetch(`${API_URL}/auditoria-imagenes/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      const data = await response.json()
      setRegistros(Array.isArray(data) ? data : data.results || [])
    }
  }, [pacienteId, query])

  useEffect(() => {
    if (pacienteIdProp && pacienteId !== pacienteIdProp) {
      setPacienteId(pacienteIdProp)
    }
  }, [pacienteIdProp, pacienteId])

  useEffect(() => {
    async function load() {
      await fetchRegistros()
    }
    void load()
  }, [fetchRegistros])

  const pacienteFolders: PacienteFolder[] = useMemo(() => {
    const folders: Record<string, Registro[]> = {}
    
    registros.forEach((reg) => {
      const pacId = reg.paciente?.id || 'sin-paciente'
      const pacName = reg.paciente_nombre || reg.paciente?.id || 'Sin Paciente'
      if (!folders[pacId]) folders[pacId] = []
      folders[pacId].push(reg)
    })

    return Object.entries(folders).map(([id, regs]) => ({
      id,
      nombre: Array.from(regs)[0]?.paciente_nombre || id,
      registros: regs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      isOpen: openFolders.has(id),
    }))
  }, [registros, openFolders])

  const toggleFolder = (id: string) => {
    const newOpen = new Set(openFolders)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      newOpen.add(id)
    }
    setOpenFolders(newOpen)
  }

  return (
    <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historial de Auditoría</h3>
          <p className="text-sm text-slate-500">Abre las carpetas de pacientes para ver el historial detallado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar nombre, paciente, estudiante o acción"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-3 py-2"
          />
          <button onClick={fetchRegistros} className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
            Buscar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {pacienteFolders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 italic">
            No hay registros de auditoría disponibles.
          </div>
        ) : (
          pacienteFolders.map((folder) => (
            <div key={folder.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left font-medium"
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${folder.isOpen ? 'rotate-180' : ''}`}
                />
                {folder.isOpen ? (
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                ) : (
                  <Folder className="w-5 h-5 text-slate-500" />
                )}
                <span className="flex-1">{folder.nombre}</span>
                <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-700">
                  {folder.registros.length} registros
                </span>
              </button>

              {folder.isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Acción</th>
                        <th className="px-3 py-2 text-left">Estudiante</th>
                        <th className="px-3 py-2 text-left">Docente</th>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Detalles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {folder.registros.map((registro) => (
                        <tr key={registro.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-blue-600">{registro.accion}</td>
                          <td className="px-3 py-2">{registro.estudiante_nombre || registro.estudiante?.username || '-'}</td>
                          <td className="px-3 py-2">{registro.docente_nombre || registro.docente?.username || '-'}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{new Date(registro.timestamp).toLocaleString()}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {registro.detalles && Object.keys(registro.detalles).length > 0 && (
                              <code className="bg-slate-100 px-2 py-1 rounded block truncate">
                                {JSON.stringify(registro.detalles).slice(0, 50)}...
                              </code>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
