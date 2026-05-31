// FILE: frontend/components/radiografias/RadiographDetail.tsx
"use client"

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function RadiographDetail({ src, alt, onDelete, id }: { src: string, alt?: string, onDelete?: (id: string|number)=>Promise<void>|void, id?: string|number }){
  const [filters, setFilters] = useState<string>('')

  return (
    <div className="bg-white rounded-md shadow-sm p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex items-center justify-center">
        <img src={src} alt={alt} className={`max-w-full max-h-[600px] object-contain transition-all duration-300 ${filters}`} />
      </div>

      <div className="w-full md:w-64 flex-shrink-0">
        <div className="space-y-2">
          <h3 className="font-semibold">Herramientas de Imagen</h3>
          <button onClick={()=>setFilters('invert')} className="w-full btn">Invertir Colores</button>
          <button onClick={()=>setFilters('contrast-150')} className="w-full btn">Alto Contraste</button>
          <button onClick={()=>setFilters('grayscale brightness-110')} className="w-full btn">Modo Hueso</button>
          <button onClick={()=>setFilters('')} className="w-full btn btn-outline">Restablecer</button>
          <div className="pt-2">
            <button onClick={async()=>{ if(id && confirm('Eliminar imagen?')) await onDelete?.(id) }} className="w-full btn btn-destructive">Eliminar Imagen</button>
          </div>
        </div>
      </div>
    </div>
  )
}