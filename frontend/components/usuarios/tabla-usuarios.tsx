"use client"

import { useState } from "react"
import { Search, UserX, History } from "lucide-react" // Agregamos History para el icono de papelera
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { VerUsuario } from "./ver-usuario"
import { EditarUsuario } from "./editar-usuario"
import { EliminarUsuario } from "./eliminar-usuario"

export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol?: string; 
  is_active?: boolean;
}

export function TablaUsuarios({ 
  usuariosIniciales, 
  onRefresh 
}: { 
  usuariosIniciales: Usuario[],
  onRefresh: () => void
}) {
  const [busqueda, setBusqueda] = useState("")

  // Solo mostramos los usuarios activos en esta tabla
  const usuariosActivos = usuariosIniciales.filter(u => u.is_active !== false);

  const usuariosFiltrados = usuariosActivos.filter((u) => {
    const termino = busqueda.toLowerCase()
    const nombreCompleto = `${u.first_name} ${u.last_name}`.toLowerCase()
    return (
      nombreCompleto.includes(termino) ||
      u.email?.toLowerCase().includes(termino) ||
      u.username?.toLowerCase().includes(termino) ||
      u.rol?.toLowerCase().includes(termino)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario, correo o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-950 shadow-sm border-blue-100"
          />
        </div>
        
        {/* Botón sugerido para ir a la papelera en el futuro */}
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
          <History className="h-4 w-4" />
          Papelera
        </Button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-bold">Nombre Completo</TableHead>
              <TableHead className="font-bold">Correo Electrónico</TableHead>
              <TableHead className="font-bold">Usuario</TableHead>
              <TableHead className="font-bold">Rol</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <UserX className="h-10 w-10 mb-2 opacity-20" />
                    <p>No se encontraron usuarios activos.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              usuariosFiltrados.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <TableCell className="px-4 py-3 font-medium">
                    {`${user.first_name} ${user.last_name}`}
                  </TableCell>
                  
                  <TableCell className="px-4 py-3 text-muted-foreground">{user.email}</TableCell>
                  
                  <TableCell className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      @{user.username}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                      {user.rol}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <VerUsuario usuario={user} />
                      <EditarUsuario usuario={user} onSuccess={onRefresh} />
                      <EliminarUsuario 
                        id={user.id} 
                        nombre={`${user.first_name} ${user.last_name}`} 
                        onSuccess={onRefresh} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}