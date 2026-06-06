"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { loadMe } from "@/lib/permissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BotonAsistencia() {
  const [role, setRole] = useState<string | null>(null)
  const [presente, setPresente] = useState(false)
  const [materiaId, setMateriaId] = useState("")
  const [materiaName, setMateriaName] = useState("")
  const [materiasDisponibles, setMateriasDisponibles] = useState<any[]>([])
  
  useEffect(() => {
    (async () => {
      try {
        const me = await loadMe()
        const r = me?.rol || localStorage.getItem("user_role")
        if (r) setRole(r.toUpperCase())
        
        // Cargar las materias (estudiante o docente)
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
        const resMaterias = await fetch('http://localhost:8000/api/materia-estudiante/mis_materias/', { headers })
        
        if (resMaterias.ok) {
          const m = await resMaterias.json()
          setMateriasDisponibles(m)
        }

        const isPresente = localStorage.getItem("estudiante_presente") === "true"
        const savedMateriaId = localStorage.getItem("estudiante_materia_id") || ""
        const savedMateriaName = localStorage.getItem("estudiante_materia") || ""
        
        setPresente(isPresente)
        setMateriaId(savedMateriaId)
        setMateriaName(savedMateriaName)
      } catch (error) {
        console.error("Error loading assistance state", error)
      }
    })()
  }, [])

  if (role !== "ESTUDIANTE" && role !== "DOCENTE") return null

  const handleSelectChange = (val: string) => {
    setMateriaId(val)
    const mat = materiasDisponibles.find(m => (m.materia || m.materia_id) == val)
    if (mat) {
      setMateriaName(mat.materia_nombre || mat.materia_codigo)
    }
  }

  const toggleAsistencia = async () => {
    if (!materiaId && !presente) {
      alert("Por favor selecciona la materia en la que ingresarás hoy.")
      return
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
    }

    if (!presente) {
      // Registrar ingreso
      const res = await fetch('http://localhost:8000/api/asistencia/registrar_ingreso/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ materia_id: materiaId })
      })
      if (res.ok) {
        setPresente(true)
        localStorage.setItem("estudiante_presente", "true")
        localStorage.setItem("estudiante_materia_id", materiaId)
        localStorage.setItem("estudiante_materia", materiaName)
        localStorage.setItem("estudiante_nombre", localStorage.getItem("user_name") || "Usuario")
      }
    } else {
      // Registrar salida
      const res = await fetch('http://localhost:8000/api/asistencia/registrar_salida/', {
        method: 'POST',
        headers
      })
      if (res.ok) {
        setPresente(false)
        setMateriaId("")
        setMateriaName("")
        localStorage.setItem("estudiante_presente", "false")
        localStorage.removeItem("estudiante_materia_id")
        localStorage.removeItem("estudiante_materia")
        localStorage.removeItem("estudiante_nombre")
      }
    }
  }

  return (
    <div className="flex items-center gap-2 mr-4">
      <Select value={materiaId} onValueChange={async (val) => {
        handleSelectChange(val)
        if (presente) {
          // Si ya está presente y cambia de materia, registramos la salida y el nuevo ingreso
          try {
            const headers = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
            }
            // 1. Salida de la materia actual
            await fetch('http://localhost:8000/api/asistencia/registrar_salida/', { method: 'POST', headers })
            
            // 2. Ingreso a la nueva materia
            const res = await fetch('http://localhost:8000/api/asistencia/registrar_ingreso/', {
              method: 'POST',
              headers,
              body: JSON.stringify({ materia_id: val })
            })
            
            if (res.ok) {
              const mat = materiasDisponibles.find(m => (m.materia || m.materia_id) == val)
              const newName = mat?.materia_nombre || mat?.materia_codigo || "Materia"
              setMateriaName(newName)
              localStorage.setItem("estudiante_materia_id", val)
              localStorage.setItem("estudiante_materia", newName)
              // Disparar storage para otros componentes
              window.dispatchEvent(new Event('storage'))
              window.location.reload()
            }
          } catch (e) {
            console.error(e)
          }
        }
      }}>
        <SelectTrigger className="w-[250px] bg-white text-slate-800 border-slate-200">
          <SelectValue placeholder="Selecciona materia..." />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {materiasDisponibles.map((m: any) => (
            <SelectItem key={m.materia || m.id} value={m.materia?.toString() || m.id?.toString()}>
              {m.materia_nombre || m.materia_codigo || "Materia"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={toggleAsistencia} 
        variant={presente ? "default" : "outline"}
        className={presente ? "bg-red-500 hover:bg-red-600 text-white" : "border-clinica-secondary text-clinica-secondary hover:bg-clinica-secondary/10"}
      >
        {presente ? "🔴 Finalizar Turno" : "🟢 Iniciar Turno"}
      </Button>
    </div>
  )
}
