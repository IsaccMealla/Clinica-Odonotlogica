// FILE: frontend/components/roles/RoleList.tsx
"use client"

import { useEffect, useState } from 'react'
import RoleModal from './RoleModal'
import PermissionsAccordion, { PERMISSION_MODULES } from './PermissionsAccordion'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { hasPermission, loadMe } from '@/lib/permissions'

type Role = {
  id: string | number
  name: string
  permissions: Record<string, boolean>
}

export default function RoleList(){
  const [roles, setRoles] = useState<Role[]>([])
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [selected, setSelected] = useState<Role | null>(null)

  useEffect(()=>{
    async function load(){
      // ensure we have current user role/permissions
      await loadMe()
      const stored = localStorage.getItem('roles_demo')
      if (stored) {
        setRoles(JSON.parse(stored))
      } else {
        const defaultRoles = [
          { id:1, name:'ADMIN', permissions: { puede_crear_paciente:true, puede_editar_hcd:true, can_approve_docente:true } },
          { id:2, name:'DOCENTE', permissions: { puede_crear_paciente:false, puede_editar_hcd:true, can_approve_docente:true } },
          { id:3, name:'ESTUDIANTE', permissions: { puede_crear_paciente:false, puede_editar_hcd:false, can_approve_docente:false } },
          { id:4, name:'RECEPCIONISTA', permissions: { puede_crear_paciente:false, puede_editar_hcd:false, can_approve_docente:false } },
        ]
        setRoles(defaultRoles)
        localStorage.setItem('roles_demo', JSON.stringify(defaultRoles))
      }
    }
    load()
  },[])

  function persistRoles(newRoles: Role[]) {
    setRoles(newRoles)
    localStorage.setItem('roles_demo', JSON.stringify(newRoles))
  }

  function handleCreate(name:string){
    const newRole = { id: Date.now(), name, permissions: {} }
    persistRoles([...roles, newRole])
  }

  function handleDelete(id:any){
    persistRoles(roles.filter(r=>r.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Roles</h2>
        <div className="flex items-center gap-2">
          {hasPermission('manage_roles') && (
            <button onClick={()=>setOpenCreate(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-clinica-primary text-white rounded">
              <Plus className="w-4 h-4"/> Crear Rol
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <div key={role.id} className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer" onClick={()=>setSelected(role)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{role.name}</div>
                <div className="text-sm text-gray-500">{Object.values(role.permissions || {}).filter(Boolean).length} permisos habilitados</div>
              </div>
              <div className="flex items-center gap-2">
                {hasPermission('manage_roles') && (
                  <>
                    <button onClick={(e)=>{e.stopPropagation(); setEditing(role)}} className="p-2 rounded hover:bg-gray-100"><Pencil className="w-4 h-4"/></button>
                    <button onClick={(e)=>{e.stopPropagation(); handleDelete(role.id)}} className="p-2 rounded hover:bg-gray-100 text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <RoleModal open={openCreate} onClose={()=>setOpenCreate(false)} onCreate={handleCreate} />

      {/* Selected role details */}
      {selected && (
        <div className="mt-6 p-4 bg-white border rounded">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <div className="text-sm text-gray-500">Permisos habilitados:</div>
            </div>
            <div>
              <button onClick={()=>setEditing(selected)} className="px-3 py-1 bg-clinica-primary text-white rounded">Editar Permisos</button>
            </div>
          </div>
          <div className="mt-4">
            {/* Simple view: only show enabled permissions as a list (no toggles) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_MODULES.flatMap(section => section.permissions)
                .filter(p => (selected.permissions || {})[p.key])
                .map(p => (
                  <div key={p.key} className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 rounded-full bg-clinica-secondary/100" />
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-gray-500">{p.key}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setEditing(null)}></div>
          <div className="bg-white rounded-lg shadow-lg z-50 w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar permisos — {editing.name}</h3>
              <button onClick={()=>setEditing(null)} className="px-3 py-1 bg-gray-100 rounded">Cerrar</button>
            </div>
            <EditRoleForm role={editing} onSaved={(updated)=>{
              // actualizar lista y cerrar
              setRoles(prev=> prev.map(r=> r.id === updated.id ? updated : r))
              setEditing(null)
              if(selected && selected.id === updated.id) setSelected(updated)
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

function EditRoleForm({role, onSaved}:{role: Role, onSaved:(r:Role)=>void}){
  const [permissions, setPermissions] = useState<Record<string, boolean>>(role.permissions || {})

  async function save(){
    const updated = { ...role, permissions }
    
    // Save to localStorage directly
    const stored = localStorage.getItem('roles_demo')
    if (stored) {
      const roles: Role[] = JSON.parse(stored)
      const newRoles = roles.map(r => r.id === updated.id ? updated : r)
      localStorage.setItem('roles_demo', JSON.stringify(newRoles))
      
      // Update current user if it's their role
      if (localStorage.getItem('user_role') === updated.name) {
        localStorage.setItem('user_permissions', JSON.stringify(permissions))
        window.dispatchEvent(new CustomEvent('permissions-updated'))
      }
    }
    
    onSaved(updated)
  }

  return (
    <div>
      <PermissionsAccordion initial={permissions} onChange={(s)=>setPermissions(s)} />
      <div className="flex justify-end mt-4">
        <button onClick={save} className="px-4 py-2 bg-clinica-secondary text-white rounded">Guardar cambios</button>
      </div>
    </div>
  )
}
