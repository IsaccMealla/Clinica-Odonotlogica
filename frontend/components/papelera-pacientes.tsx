"use client"

import { useState } from "react"
import { Trash2, RotateCcw, Trash, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function PapeleraPacientes() {
  const [eliminados, setEliminados] = useState([])
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  // Función para obtener los pacientes con activo=False
  const cargarEliminados = async () => {
    setCargando(true)
    try {
      const res = await fetch("http://localhost:8000/api/pacientes/papelera/")
      if (res.ok) {
        const data = await res.json()
        setEliminados(data)
      }
    } catch (error) {
      console.error("Error al cargar papelera:", error)
    } finally {
      setCargando(false)
    }
  }

  // Función para restaurar (POST al endpoint de Django)
  const handleRestaurar = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/pacientes/${id}/restaurar/`, {
        method: "POST",
      })
      if (res.ok) {
        cargarEliminados() // Refrescar la lista de la papelera
        router.refresh()   // Refrescar la tabla principal de fondo
      }
    } catch (error) {
      alert("No se pudo restaurar al paciente")
    }
  }

  // Función para eliminación FÍSICA (DELETE definitivo)
  const handleEliminarPermanente = async (id: string, nombre: string) => {
    const confirmar = confirm(`¿Estás seguro de eliminar permanentemente a ${nombre}? Esta acción NO se puede deshacer.`)
    if (!confirmar) return

    try {
      const res = await fetch(`http://localhost:8000/api/pacientes/${id}/`, {
        method: "DELETE",
      })
      if (res.ok) {
        cargarEliminados()
      }
    } catch (error) {
      alert("Error al eliminar definitivamente")
    }
  }

  return (
    <Dialog onOpenChange={(open) => open && cargarEliminados()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed border-zinc-400 hover:bg-zinc-100">
          <Trash2 className="mr-2 h-4 w-4 text-zinc-500" /> 
          Papelera
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <DialogTitle>Pacientes en Papelera</DialogTitle>
          </div>
          <DialogDescription>
            Registros eliminados lógicamente. Puedes restaurarlos a la lista activa o borrarlos para siempre.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead>CI</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Cargando papelera...</TableCell>
                </TableRow>
              ) : eliminados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      <p>La papelera está vacía.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                eliminados.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.ci}</TableCell>
                    <TableCell className="font-medium">
                      {p.nombres} {p.apellido_paterno}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Botón Restaurar */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleRestaurar(p.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                        </Button>
                        
                        {/* Botón Borrado Físico */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleEliminarPermanente(p.id, p.nombres)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}