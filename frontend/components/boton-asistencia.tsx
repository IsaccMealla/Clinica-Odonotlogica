"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { loadMe } from "@/lib/permissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BotonAsistencia() {
  const [role, setRole] = useState<string | null>(null)
  const [presente, setPresente] = useState(false)
  const [materia, setMateria] = useState("")

  useEffect(() => {
    (async () => {
      const me = await loadMe()
      const r = me?.rol || localStorage.getItem("user_role")
      if (r) setRole(r.toUpperCase())
      
      const isPresente = localStorage.getItem("estudiante_presente") === "true"
      const materiaGuardada = localStorage.getItem("estudiante_materia") || ""
      setPresente(isPresente)
      setMateria(materiaGuardada)
    })()
  }, [])

  if (role !== "ESTUDIANTE") return null

  const toggleAsistencia = () => {
    if (!materia && !presente) {
      alert("Por favor selecciona la materia en la que operarás hoy.")
      return
    }
    const nuevoEstado = !presente
    setPresente(nuevoEstado)
    localStorage.setItem("estudiante_presente", nuevoEstado.toString())
    if (!nuevoEstado) {
      localStorage.removeItem("estudiante_materia")
      localStorage.removeItem("estudiante_nombre")
      setMateria("")
    } else {
      localStorage.setItem("estudiante_materia", materia)
      localStorage.setItem("estudiante_nombre", localStorage.getItem("user_name") || "Estudiante Local")
    }
  }

  return (
    <div className="flex items-center gap-2 mr-4">
      {!presente && (
        <Select value={materia} onValueChange={setMateria}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Materia actual..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Clínica de Operatoria I">Clínica de Operatoria I</SelectItem>
            <SelectItem value="Clínica de Endodoncia">Clínica de Endodoncia</SelectItem>
            <SelectItem value="Cirugía Bucal">Cirugía Bucal</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button 
        onClick={toggleAsistencia} 
        variant={presente ? "default" : "outline"}
        className={presente ? "bg-green-600 hover:bg-green-700 text-white" : "border-red-500 text-red-500 hover:bg-red-50"}
      >
        {presente ? "🟢 Presente en Sala" : "🔴 Marcar Ingreso"}
      </Button>
    </div>
  )
}
