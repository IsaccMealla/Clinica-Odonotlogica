"use client"

import { useState } from "react"
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
interface NuevoPacienteProps {
  onPacienteCreado?: () => void;
}

export function NuevoPaciente({ onPacienteCreado }: NuevoPacienteProps) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [formData, setFormData] = useState({
    ci: "", nombres: "", apellido_paterno: "", apellido_materno: "", 
    sexo: "", fecha_nacimiento: "", lugar_nacimiento: "", 
    estado_civil: "", ocupacion: "", direccion: "", celular: "", 
    telefono: "", contacto_emergencia: "", telefono_emergencia: "", 
    fecha_ultima_consulta: "", motivo_ultima_consulta: ""
  })

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

    const dataToSend = { ...formData };
    if (!dataToSend.fecha_ultima_consulta) delete dataToSend.fecha_ultima_consulta;

    try {
      // 👇 Obtenemos el token
      const token = localStorage.getItem("access_token") || "";

      const res = await fetch("http://localhost:8000/api/pacientes/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Lo enviamos
        },
        body: JSON.stringify(dataToSend),
      })

      if (res.ok) {
        setAbierto(false)
        // 👇 Llamamos a la recarga de tabla en vez de router.refresh()
        if (onPacienteCreado) {
          onPacienteCreado();
        }
        
        setFormData({
          ci: "", nombres: "", apellido_paterno: "", apellido_materno: "", sexo: "", fecha_nacimiento: "",
          lugar_nacimiento: "", estado_civil: "", ocupacion: "", direccion: "", celular: "", telefono: "",
          contacto_emergencia: "", telefono_emergencia: "", fecha_ultima_consulta: "", motivo_ultima_consulta: ""
        })
      } else {
        alert("Error al guardar en el servidor.");
      }
    } catch (error) {
      alert("Error de conexión. ¿Django está encendido?");
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button className="font-semibold">+ Nuevo Paciente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto border-t-8 border-t-blue-600">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">Ficha de Registro de Paciente</DialogTitle>
            <DialogDescription>Complete todos los campos para el historial clínico electrónico.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* --- SECCIÓN 1: DATOS DE IDENTIDAD --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-sm font-bold text-blue-600 uppercase border-b pb-1">Identificación y Nombres</div>
              <div className="space-y-1">
                <Label htmlFor="ci">Cédula de Identidad (CI) *</Label>
                <Input id="ci" name="ci" value={formData.ci} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
                <Input id="apellido_paterno" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="apellido_materno">Apellido Materno</Label>
                <Input id="apellido_materno" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 2: DATOS PERSONALES --- */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 text-sm font-bold text-blue-600 uppercase border-b pb-1">Datos Personales</div>
              <div className="space-y-1">
                <Label>Sexo *</Label>
                <Select onValueChange={(v) => handleSelectChange("sexo", v)} required>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" max={hoy} value={formData.fecha_nacimiento} onChange={handleChange} required />
              </div>
              <div className="space-y-1">
                <Label>Estado Civil</Label>
                <Select onValueChange={(v) => handleSelectChange("estado_civil", v)}>
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
                <Label htmlFor="lugar_nacimiento">Lugar de Nacimiento</Label>
                <Input id="lugar_nacimiento" name="lugar_nacimiento" value={formData.lugar_nacimiento} onChange={handleChange} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ocupacion">Ocupación / Profesión</Label>
                <Input id="ocupacion" name="ocupacion" value={formData.ocupacion} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 3: CONTACTO --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 text-sm font-bold text-blue-600 uppercase border-b pb-1">Ubicación y Contacto</div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="direccion">Dirección Domiciliaria</Label>
                <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="celular">Celular</Label>
                <Input id="celular" name="celular" type="tel" value={formData.celular} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono">Teléfono Fijo</Label>
                <Input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} />
              </div>
            </div>

            {/* --- SECCIÓN 4: EMERGENCIA --- */}
            <div className="grid grid-cols-2 gap-4 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <div className="col-span-2 text-sm font-bold text-red-600 uppercase border-b border-red-200 pb-1">En caso de Emergencia</div>
              <div className="space-y-1">
                <Label htmlFor="contacto_emergencia">Nombre de Contacto</Label>
                <Input id="contacto_emergencia" name="contacto_emergencia" className="bg-white dark:bg-black" value={formData.contacto_emergencia} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
                <Input id="telefono_emergencia" name="telefono_emergencia" type="tel" className="bg-white dark:bg-black" value={formData.telefono_emergencia} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-8 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={cargando} className="bg-blue-600 hover:bg-blue-700 px-8">
              {cargando ? "Guardando..." : "Guardar Expediente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}