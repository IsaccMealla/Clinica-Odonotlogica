"use client"
import { Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

export function EliminarPaciente({ id, nombre, esLogico = true }: { id: string, nombre: string, esLogico?: boolean }) {
  const router = useRouter()

  const handleEliminar = async () => {
    const url = esLogico 
      ? `http://localhost:8000/api/pacientes/${id}/` // PATCH activo=false
      : `http://localhost:8000/api/pacientes/${id}/`; // DELETE físico
    
    const method = esLogico ? "PATCH" : "DELETE";
    const body = esLogico ? JSON.stringify({ activo: false }) : null;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body
    });
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            {esLogico 
              ? `El paciente ${nombre} se moverá a la papelera.` 
              : `Esta acción eliminará permanentemente a ${nombre} de la base de datos.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEliminar} className="bg-red-600">Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}