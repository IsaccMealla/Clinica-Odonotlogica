"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"

export function EliminarUsuario({ id, nombre, onSuccess }: { id: number, nombre: string, onSuccess: () => void }) {
  
  const handleEliminar = async () => {
    try {
      const token = localStorage.getItem("access_token") // Recuperamos el token

      // Aplicamos Eliminación Lógica: is_active = false
      const res = await fetch(`http://127.0.0.1:8000/api/usuarios/${id}/`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ is_active: false }),
      });
      
      if (res.ok) {
        onSuccess(); // Recarga la tabla
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || "No se pudo desactivar al usuario."}`);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" title="Eliminar Usuario">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Enviar a la papelera?</AlertDialogTitle>
          <AlertDialogDescription>
            El usuario <strong>{nombre}</strong> será desactivado y perderá el acceso, pero podrás restaurarlo desde la papelera más tarde si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEliminar} className="bg-red-600 hover:bg-red-700">
            Desactivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}