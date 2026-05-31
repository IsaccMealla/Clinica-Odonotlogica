// FILE: frontend/components/radiografias/RadiographGrid.tsx
"use client"

import React, { useState } from 'react'
import Lightbox from './Lightbox'
import { Trash2 } from 'lucide-react'

type Img = { id: string | number, url: string, date?: string, alt?: string }

export default function RadiographGrid({ images, onDelete }: { images: Img[], onDelete?: (id: string|number)=>Promise<void>|void }){
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Img | null>(null)
  const [filters, setFilters] = useState<string>('')

  function openImage(img: Img){ setSelected(img); setOpen(true) }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map(img=> (
          <div key={img.id} className="bg-white rounded-lg overflow-hidden shadow-sm relative">
            <div className="w-full h-48 overflow-hidden relative">
              <img
                src={img.url}
                alt={img.alt || 'radiografia'}
                className={`w-full h-48 object-cover rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${filters}`}
                onDoubleClick={()=> openImage(img)}
              />
              <button title="Eliminar imagen" onClick={async()=>{ if(confirm('Eliminar imagen?')){ await onDelete?.(img.id) } }} className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 text-xs text-muted-foreground">{img.date}</div>
          </div>
        ))}
      </div>

      {open && selected && (
        <Lightbox src={selected.url} alt={selected.alt} onClose={()=>setOpen(false)} filters={filters} setFilters={setFilters} />
      )}
    </div>
  )
}