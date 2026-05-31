// FILE: frontend/components/radiografias/RadiographTimeline.tsx
"use client"

import React, { useMemo, useState } from 'react'
import Lightbox from './Lightbox'
import { Trash2 } from 'lucide-react'

type Img = { id: string | number, url: string, date?: string, alt?: string }

export default function RadiographTimeline({ images, onDelete }: { images: Img[], onDelete?: (id: string|number)=>Promise<void>|void }){
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Img | null>(null)
  const [filters, setFilters] = useState<string>('')

  const sorted = useMemo(()=>{
    return [...images].sort((a,b)=> {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return da - db
    })
  }, [images])

  return (
    <div className="space-y-4">
      {sorted.map(img=> (
        <div key={img.id} className="flex items-center gap-4 p-2 rounded transition-all duration-300 hover:bg-gray-50 relative">
          <div className="w-28 flex-shrink-0 relative">
            <img src={img.url} alt={img.alt} className={`w-full h-20 object-cover rounded-md shadow-sm ${filters}`} />
            <button title="Eliminar imagen" onClick={async(e)=>{ e.stopPropagation(); if(confirm('Eliminar imagen?')) await onDelete?.(img.id) }} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1" onDoubleClick={()=>{ setSelected(img); setOpen(true) }}>
            <div className="font-medium">{img.alt || 'Radiografía'}</div>
            <div className="text-xs text-muted-foreground">{img.date}</div>
          </div>
        </div>
      ))}

      {open && selected && (
        <Lightbox src={selected.url} alt={selected.alt} onClose={()=>setOpen(false)} filters={filters} setFilters={setFilters} />
      )}
    </div>
  )
}