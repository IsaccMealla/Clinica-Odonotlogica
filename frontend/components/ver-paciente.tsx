"use  client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Recibimos los datos de UN solo paciente
export function VerPaciente({ paciente }: { paciente: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* El botón es un icono sin fondo que se pinta al pasar el mouse */}
        <Button variant="ghost" size="icon" className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver detalles</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl border-b pb-4">Ficha Clínica</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Tarjeta Superior (Resumen) */}
          <div className="flex items-center space-x-4 p-4 bg-muted/40 rounded-lg border">
            {/* Círculo con iniciales (Avatar) */}
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold uppercase">
              {paciente.nombres?.charAt(0)}{paciente.apellido_paterno?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno || ""}
              </h3>
              <p className="text-sm text-muted-foreground">CI: {paciente.ci}</p>
            </div>
          </div>

          {/* Grilla de todos los detalles */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm px-2">
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase">Sexo</p> 
              <p>{paciente.sexo || "No especificado"}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase">Nacimiento</p> 
              <p>{paciente.fecha_nacimiento}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase">Celular</p> 
              <p>{paciente.celular || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase">Teléfono Fijo</p> 
              <p>{paciente.telefono || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold text-muted-foreground text-xs uppercase">Dirección</p> 
              <p>{paciente.direccion || "No registrada"}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold text-muted-foreground text-xs uppercase">Ocupación</p> 
              <p>{paciente.ocupacion || "No registrada"}</p>
            </div>
            <div className="col-span-2 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-100 dark:border-red-900">
              <p className="font-semibold text-red-600 dark:text-red-400 text-xs uppercase mb-1">Contacto de Emergencia</p> 
              <p>{paciente.contacto_emergencia || "No especificado"} {paciente.telefono_emergencia ? `(${paciente.telefono_emergencia})` : ""}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}