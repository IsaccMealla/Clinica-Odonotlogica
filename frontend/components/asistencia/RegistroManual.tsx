"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fingerprint, PlusCircle } from "lucide-react"

export function RegistroManual({ onRegistroExitoso }: { onRegistroExitoso: () => void }) {
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [accion, setAccion] = useState("INGRESO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    try {
      const token = localStorage.getItem("access_token") || ""
      
      // Aquí enviamos el POST a Django (DRF permite crear usando la misma ruta base)
      const res = await fetch("http://localhost:8000/api/asistencia/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // OJO: Aquí deberías tener un selector de usuario real. 
          // Por ahora quemamos el ID 1 (tu superusuario) para la prueba
          usuario: 1, 
          accion: accion,
          verificado: false // Es manual, no pasó por la huella
        })
      })

      if (res.ok) {
        setOpen(false) // Cerramos el modal
        onRegistroExitoso() // Refrescamos la tabla
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all hover:scale-105">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registro Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-white/90">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Fingerprint className="mr-2 h-6 w-6 text-indigo-600" />
            Ingreso Manual
          </DialogTitle>
          <DialogDescription>
            Registra una asistencia si el sensor biométrico no está disponible.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Acción</label>
            <Select value={accion} onValueChange={setAccion}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INGRESO">Ingreso (Entrada)</SelectItem>
                <SelectItem value="SALIDA">Salida</SelectItem>
                <SelectItem value="PAUSA">Pausa / Descanso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar Registro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}