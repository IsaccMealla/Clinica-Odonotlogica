"use client"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EliminarAsignacion({ pacienteId, token, onSuccess }: { pacienteId: string, token: string, onSuccess: () => void }) {
  const handleRemove = async () => {
    if (!confirm("¿Quitar la asignación de este estudiante?")) return
    
    try {
      const res = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estudiante_asignado: null }),
      })
      if (res.ok) onSuccess()
    } catch (e) { console.error(e) }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleRemove} className="text-red-500 hover:text-red-700 hover:bg-red-50">
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}