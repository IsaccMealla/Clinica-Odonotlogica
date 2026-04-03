"use client"

import { useState } from "react"
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

// 👇 Interfaz
interface EditarPacienteProps {
  paciente: any;
  onRefresh?: () => void;
}

export function EditarPaciente({ paciente, onRefresh }: EditarPacienteProps) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [formData, setFormData] = useState({ ...paciente })

  const hoy = new Date().toISOString().split("T")[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (['nombres', 'apellido_paterno', 'apellido_materno', 'lugar_nacimiento', 'ocupacion', 'contacto_emergencia'].includes(name)) {
      const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if (!soloLetras.test(value)) return;
      value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    if (name === "ci") {
      const ciRegex = /^[a-zA-Z0-9]*$/;
      if (!ciRegex.test(value)) return;
      value = value.toUpperCase();
    }

    if (['celular', 'telefono', 'telefono_emergencia'].includes(name)) {
      const soloTel = /^[0-9\+\-\s]*$/;
      if (!soloTel.test(value)) return;
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
      const token = localStorage.getItem("access_token") || "";

      const res = await fetch(`http://localhost:8000/api/pacientes/${paciente.id}/`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setAbierto(false)
        if (onRefresh) onRefresh();
      } else {
        alert("Error al actualizar los datos.")
      }
    } catch (error) {
      alert("Error de conexión con el servidor.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto border-t-8 border-t-amber-500">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Expediente</DialogTitle>
            <DialogDescription>
              Modifica la información de {paciente.nombres}. Recuerda mantener la integridad de los datos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            {/* --- SECCIÓN 1: IDENTIDAD --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-sm font-bold text-amber-600 uppercase border-b pb-1">Identificación y Nombres</div>
              <div className="space-y-1">
                <Label htmlFor="ci_edit">CI *</Label>
                <Input id="ci_edit" name="ci" value={formData.ci} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombres_edit">Nombres *</Label>
                <Input id="nombres_edit" name="nombres" value={formData.nombres} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="paterno_edit">Apellido Paterno *</Label>
                <Input id="paterno_edit" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="materno_edit">Apellido Materno</Label>
                <Input id="materno_edit" name="apellido_materno" value={formData.apellido_materno || ""} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 2: DATOS PERSONALES --- */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 text-sm font-bold text-amber-600 uppercase border-b pb-1">Datos Personales</div>
              <div className="space-y-1">
                <Label>Sexo *</Label>
                <Select onValueChange={(v) => handleSelectChange("sexo", v)} defaultValue={formData.sexo}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nacimiento_edit">F. Nacimiento *</Label>
                <Input id="nacimiento_edit" name="fecha_nacimiento" type="date" max={hoy} value={formData.fecha_nacimiento} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label>Estado Civil</Label>
                <Select onValueChange={(v) => handleSelectChange("estado_civil", v)} defaultValue={formData.estado_civil}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                    <SelectItem value="Casado/a">Casado/a</SelectItem>
                    <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                    <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                    <SelectItem value="Unión Libre">Unión Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lugar_edit">Lugar Nacimiento</Label>
                <Input id="lugar_edit" name="lugar_nacimiento" value={formData.lugar_nacimiento || ""} onChange={handleChange} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ocupacion_edit">Ocupación</Label>
                <Input id="ocupacion_edit" name="ocupacion" value={formData.ocupacion || ""} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 3: CONTACTO --- */}
            <div className="grid grid-cols-2 gap-4 border-l-2 border-l-amber-200 pl-4">
              <div className="col-span-2 text-sm font-bold text-amber-600 uppercase border-b pb-1">Ubicación y Contacto</div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="direccion_edit">Dirección</Label>
                <Input id="direccion_edit" name="direccion" value={formData.direccion || ""} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cel_edit">Celular</Label>
                <Input id="cel_edit" name="celular" type="tel" value={formData.celular || ""} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tel_edit">Teléfono Fijo</Label>
                <Input id="tel_edit" name="telefono" type="tel" value={formData.telefono || ""} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 4: EMERGENCIA --- */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-dashed">
              <div className="col-span-2 text-sm font-bold text-zinc-500 uppercase border-b pb-1">Contacto de Emergencia</div>
              <div className="space-y-1">
                <Label htmlFor="emergencia_nombre_edit">Nombre Contacto</Label>
                <Input id="emergencia_nombre_edit" name="contacto_emergencia" value={formData.contacto_emergencia || ""} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emergencia_tel_edit">Teléfono Emergencia</Label>
                <Input id="emergencia_tel_edit" name="telefono_emergencia" type="tel" value={formData.telefono_emergencia || ""} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={cargando} className="bg-amber-600 hover:bg-amber-700 px-8">
              {cargando ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}