//# FILE: frontend/components/roles/RoleModal.tsx
"use client"

import { useState } from 'react'
import { X } from 'lucide-react'

export default function RoleModal({open, onClose, onCreate}:{open:boolean, onClose:()=>void, onCreate:(name:string)=>void}){
  const [name, setName] = useState('')

  if(!open) return null

  function submit(){
    if(name.trim().length === 0) return
    // intentar crear en backend
    fetch('/api/roles/', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: name.trim(), permissions: {}})})
      .then(r=>{
        if(!r.ok) throw new Error('create failed')
        return r.json()
      })
      .then(data=> onCreate(name.trim()))
      .catch(()=> onCreate(name.trim()))
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md z-10 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Crear nuevo rol</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4"/></button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Nombre del rol</div>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Ej: ASISTENTE" />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
            <button onClick={submit} className="px-4 py-2 bg-clinica-secondary/100 text-white rounded">Crear</button>
          </div>
        </div>
      </div>
    </div>
  )
}
