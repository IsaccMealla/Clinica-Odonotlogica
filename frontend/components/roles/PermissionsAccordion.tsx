//# FILE: frontend/components/roles/PermissionsAccordion.tsx
"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, CheckSquare, XSquare } from 'lucide-react'

type Permission = {
  key: string
  label: string
  allowed?: boolean
}

type Section = {
  id: string
  title: string
  permissions: Permission[]
}

export const PERMISSION_MODULES: Section[] = [
  {
    id: 'm1',
    title: 'M1: Admisión de Pacientes',
    permissions: [
      { key: 'puede_crear_paciente', label: 'Crear Pacientes' },
      { key: 'puede_editar_paciente', label: 'Editar Datos del Paciente' },
      { key: 'puede_ver_iup', label: 'Ver Identificador Único (IUP)' },
    ]
  },
  {
    id: 'm2',
    title: 'M2: Historia Clínica',
    permissions: [
      { key: 'puede_editar_hcd', label: 'Editar Historias Clínicas' },
      { key: 'puede_ver_hcd', label: 'Ver Historias Clínicas' },
    ]
  },
  {
    id: 'm4',
    title: 'M4: Citas',
    permissions: [
      { key: 'puede_agendar_cita', label: 'Agendar Citas' },
      { key: 'puede_reprogramar_cita', label: 'Reprogramar Citas' },
    ]
  },
  {
    id: 'm5',
    title: 'M5: Radiografías e Imágenes',
    permissions: [
      { key: 'puede_subir_radiografia', label: 'Subir Radiografías' },
      { key: 'puede_ver_radiografias', label: 'Ver Radiografías' },
    ]
  },
  {
    id: 'm6',
    title: 'M6: Supervisión Docente',
    permissions: [
      { key: 'can_approve_docente', label: 'Aprobación de Procedimientos por Docente' },
      { key: 'puede_solicitar_supervision', label: 'Solicitar Supervisión' },
    ]
  },
  {
    id: 'm8',
    title: 'M8: Inventario',
    permissions: [
      { key: 'puede_consumir_insumo', label: 'Consumir Insumos' },
      { key: 'puede_solicitar_almacen', label: 'Solicitar Almacén' },
    ]
  }
]

  export default function PermissionsAccordion({initial, onChange}:{initial: Record<string, boolean>, onChange?: (state: Record<string, boolean>)=>void}){
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const [state, setState] = useState<Record<string, boolean>>(initial || {})

    // keep local state in sync when initial prop changes
    useEffect(()=>{
      setState(initial || {})
    }, [initial])

    // notify parent after state updates (avoid calling parent setter during render)
    useEffect(()=>{
      if(onChange) onChange(state)
    }, [state, onChange])

    const modules = PERMISSION_MODULES.map(section => ({
      ...section,
      permissions: section.permissions.map(p => ({ ...p, allowed: !!state[p.key] }))
    }))

  function toggleSection(id: string){
    setOpen(prev => ({...prev, [id]: !prev[id]}))
  }

  function togglePermission(key: string){
    setState(prev => ({...prev, [key]: !prev[key]}))
  }

  return (
    <div className="space-y-3">
      {modules.map(section => (
        <div key={section.id} className="border rounded-lg overflow-hidden">
          <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100">
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transform ${open[section.id] ? 'rotate-180' : ''}`} />
              <span className="font-semibold">{section.title}</span>
            </div>
            <span className="text-sm text-gray-500">{section.permissions.length} permisos</span>
          </button>
          {open[section.id] && (
            <div className="p-3 bg-white">
              {section.permissions.map(p => (
                <div key={p.key} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1 ${state[p.key] ? 'bg-clinica-secondary/10 text-clinica-secondary' : 'bg-red-50 text-red-600'}`}>
                      {state[p.key] ? <CheckSquare className="w-4 h-4"/> : <XSquare className="w-4 h-4"/>}
                    </div>
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-gray-500">{p.key}</div>
                    </div>
                  </div>
                  <div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={!!state[p.key]} onChange={() => togglePermission(p.key)} />
                      <div className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-offset-2 ${state[p.key] ? 'bg-green-400' : 'bg-red-300'} transition-colors`}></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
