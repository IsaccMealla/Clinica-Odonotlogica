"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, LogIn, Clock } from "lucide-react"

export function AlertaAsistencia() {
  const [mostrar, setMostrar] = useState(false)
  
  useEffect(() => {
    const role = localStorage.getItem('user_role')?.toUpperCase()
    const isPresente = localStorage.getItem('estudiante_presente') === 'true'
    const later = sessionStorage.getItem('asistencia_later') === 'true'
    
    if (role === 'ESTUDIANTE' && !isPresente && !later) {
      setMostrar(true)
    }
  }, [])

  const handleMarcar = () => {
    // Focus or trigger the attendance button in the header
    // Or just open it here
    const botonHeader = document.querySelector('button:has(text("Marcar Ingreso"))') as HTMLButtonElement;
    if(botonHeader) {
        botonHeader.click();
    } else {
        alert("Utiliza el selector en la parte superior para marcar tu ingreso a sala.");
    }
    setMostrar(false)
  }

  const handleMasTarde = () => {
    sessionStorage.setItem('asistencia_later', 'true')
    setMostrar(false)
  }

  if (!mostrar) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-clinica-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-clinica-secondary" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4">Registro de Asistencia Requerido</h2>
        <p className="text-slate-600 mb-8 text-lg">
          Para acceder a los módulos clínicos y que tu docente pueda autorizar tus procedimientos, debes registrar tu ingreso a la sala de clínicas e indicar la materia.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleMasTarde}
            variant="outline" 
            className="border-slate-300 text-slate-600 hover:bg-slate-100 py-6 px-6 text-base"
          >
            <Clock className="w-5 h-5 mr-2" /> Recordarme más tarde
          </Button>
          <Button 
            onClick={handleMarcar}
            className="bg-clinica-secondary hover:bg-clinica-secondary/90 text-white py-6 px-6 text-base shadow-lg shadow-clinica-secondary/30"
          >
            <LogIn className="w-5 h-5 mr-2" /> Marcar Ingreso Ahora
          </Button>
        </div>
      </div>
    </div>
  )
}
