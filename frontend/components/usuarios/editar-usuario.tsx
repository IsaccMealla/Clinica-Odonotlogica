"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function EditarUsuario({ usuario, onSuccess }: { usuario: any, onSuccess: () => void }) {
  const [abierto, setAbierto] = useState(false)
  
  // 👇 ESTA ES LA LÍNEA QUE TE FALTA 👇
  const [cargando, setCargando] = useState(false) 
  
  const [formData, setFormData] = useState({ ...usuario })

  useEffect(() => {
    if (abierto) {
      setFormData({ ...usuario })
    }
  }, [abierto, usuario])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (['first_name', 'last_name'].includes(name)) {
      const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if (!soloLetras.test(value)) return;
      value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true) // Ahora sí funcionará

    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/usuarios/${usuario.id}/`, {
        method: "PATCH", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          rol: formData.rol,
        }),
      })

      if (res.ok) {
        setAbierto(false)
        onSuccess() 
      } else {
        const errorData = await res.json()
        alert(`Error al guardar: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error(error)
      alert("Error de conexión.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-amber-600 hover:bg-amber-50">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] border-t-8 border-t-amber-500">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Usuario</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">Nombres</Label>
                <Input id="first_name" name="first_name" value={formData.first_name || ""} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Apellidos</Label>
                <Input id="last_name" name="last_name" value={formData.last_name || ""} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} required />
            </div>

            <div className="space-y-1">
              <Label>Rol en el Sistema</Label>
              <Select onValueChange={(v) => setFormData({...formData, rol: v})} value={formData.rol}>
                <SelectTrigger><SelectValue placeholder="Seleccione rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                  <SelectItem value="DOCENTE">Docente / Odontólogo</SelectItem>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={cargando} className="bg-amber-600 hover:bg-amber-700 text-white">
              {cargando ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}