"use client"

import { useState } from "react"
import { Plus, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useSoundPlayer } from "@/hooks/useSoundPlayer" // Importamos tu hook de sonido

interface Props {
  pacientes: any[];
  estudiantes: any[];
  token: string;
  onSuccess: () => void;
}

export function NuevaAsignacion({ pacientes, estudiantes, token, onSuccess }: Props) {
  const { playSound } = useSoundPlayer() // Inicializamos el reproductor
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [formData, setFormData] = useState({ pacienteId: "", estudianteId: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.pacienteId || !formData.estudianteId) {
      alert("Por favor, selecciona ambos campos.")
      return
    }

    setCargando(true)
    try {
      const res = await fetch(`http://localhost:8000/api/pacientes/${formData.pacienteId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ estudiante_asignado: parseInt(formData.estudianteId) }),
      })

      if (res.ok) {
        // REPRODUCIR SONIDO DE ÉXITO
        playSound('exito') 
        
        setAbierto(false)
        setFormData({ pacienteId: "", estudianteId: "" })
        onSuccess() // Refresca la tabla
      } else {
        const err = await res.json()
        console.error("Error de API:", err)
        alert("Error al guardar la asignación.")
      }
    } catch (error) {
      console.error("Error de red:", error)
      alert("Error de conexión con el servidor.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Nueva Asignación
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px]"> 
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar Estudiante</DialogTitle>
            <DialogDescription>
              Selecciona un paciente y el estudiante que se hará cargo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="paciente" className="text-sm font-semibold">Paciente</Label>
              <select 
                id="paciente"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.pacienteId}
                onChange={(e) => setFormData({...formData, pacienteId: e.target.value})}
                required
              >
                <option value="">-- Seleccionar Paciente --</option>
                {pacientes.filter(p => !p.estudiante_asignado).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estudiante" className="text-sm font-semibold">Estudiante</Label>
              <select 
                id="estudiante"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.estudianteId}
                onChange={(e) => setFormData({...formData, estudianteId: e.target.value})}
                required
              >
                <option value="">-- Seleccionar Estudiante --</option>
                {estudiantes.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={cargando} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {cargando ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}