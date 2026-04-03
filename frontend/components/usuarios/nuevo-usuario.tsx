"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

// Corregimos la interfaz para evitar errores de TS
interface NuevoUsuarioProps {
  onUsuarioCreado?: () => void;
}

export function NuevoUsuario({ onUsuarioCreado }: NuevoUsuarioProps) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [formData, setFormData] = useState({
    email: "", 
    password: "", 
    first_name: "", 
    last_name: "", 
    rol: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (['first_name', 'last_name'].includes(name)) {
      const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if (!soloLetras.test(value)) return;
      value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)

    try {
      const token = localStorage.getItem("access_token"); // <--- TOKEN
      const res = await fetch("http://localhost:8000/api/usuarios/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // <--- HEADER
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setAbierto(false)
        setFormData({ email: "", password: "", first_name: "", last_name: "", rol: "" })
        if (onUsuarioCreado) onUsuarioCreado()
        else router.refresh()
      } else {
        const errorData = await res.json()
        alert(`Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button className="font-semibold bg-blue-600 hover:bg-blue-700 text-white">+ Nuevo Usuario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-t-8 border-t-blue-600">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">Registro de Personal y Estudiantes</DialogTitle>
            <DialogDescription>Crea un nuevo usuario asignándole un rol específico.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Apellidos *</Label>
                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rol en el Sistema *</Label>
              <Select onValueChange={(v) => handleSelectChange("rol", v)} required value={formData.rol}>
                <SelectTrigger><SelectValue placeholder="Seleccione el cargo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                  <SelectItem value="DOCENTE">Docente / Odontólogo</SelectItem>
                  <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-8 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={cargando} className="bg-blue-600 hover:bg-blue-700">
              {cargando ? "Guardando..." : "Guardar Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}