"use client"

import { useState } from "react"
import { RotateCcw, Trash2, UserX, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol?: string;
  is_active?: boolean;
}

export function PapeleraUsuario({ 
  usuarios, 
  onRefresh 
}: { 
  usuarios: Usuario[], 
  onRefresh: () => void 
}) {
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(false)

  // Filtramos solo los usuarios que están desactivados (eliminación lógica)
  const usuariosEliminados = usuarios.filter(u => u.is_active === false)

  const filtrados = usuariosEliminados.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleRestaurar = async (id: number) => {
    setCargando(true)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/usuarios/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: true })
      })

      if (res.ok) {
        onRefresh()
      } else {
        alert("No se pudo restaurar el usuario.")
      }
    } catch (error) {
      alert("Error de conexión.")
    } finally {
      setCargando(false)
    }
  }

  const handleEliminarPermanente = async (id: number) => {
    if (!confirm("¿Estás seguro? Esta acción no se puede deshacer y borrará al usuario definitivamente de la base de datos.")) return
    
    setCargando(true)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://127.0.0.1:8000/api/usuarios/${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        onRefresh()
      } else {
        alert("Error al eliminar permanentemente.")
      }
    } catch (error) {
      alert("Error de conexión.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-amber-200 hover:bg-amber-50 text-amber-700">
          <Trash2 className="h-4 w-4" />
          Ver Papelera ({usuariosEliminados.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trash2 className="h-6 w-6 text-red-500" />
            Papelera de Usuarios
          </DialogTitle>
          <DialogDescription>
            Aquí puedes restaurar usuarios desactivados o eliminarlos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en la papelera..."
            className="pl-10"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    La papelera está vacía.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded italic">
                        {user.rol}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleRestaurar(user.id)}
                        disabled={cargando}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleEliminarPermanente(user.id)}
                        disabled={cargando}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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