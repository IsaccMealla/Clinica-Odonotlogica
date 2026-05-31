// FILE: frontend/components/radiografias/Lightbox.tsx
"use client"

import React, { useEffect } from 'react'

type Props = {
  src: string
  alt?: string
  onClose: ()=>void
  filters?: string
  setFilters?: (f:string)=>void
}

export default function Lightbox({ src, alt="Radiografía", onClose, filters, setFilters }: Props){
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative max-w-6xl w-full h-full p-4 flex flex-col">
        <button onClick={onClose} className="absolute right-4 top-4 z-50 text-white bg-black/40 rounded-full p-2">X</button>

        <div className="flex-1 flex items-center justify-center">
          <img src={src} alt={alt} className={`max-h-full max-w-full object-contain transition-all duration-300 ${filters||''}`} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={()=> setFilters && setFilters('invert')} className="btn">Invertir Colores</button>
          <button onClick={()=> setFilters && setFilters('contrast-150')} className="btn">Alto Contraste</button>
          <button onClick={()=> setFilters && setFilters('grayscale brightness-110')} className="btn">Modo Hueso</button>
          <button onClick={()=> setFilters && setFilters('')} className="btn btn-outline">Restablecer</button>
        </div>
      </div>
    </div>
  )
}