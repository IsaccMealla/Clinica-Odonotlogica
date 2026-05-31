"use client"

import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import PaginatedTable from '@/components/common/PaginatedTable'

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
  const usuariosActivos = usuariosIniciales.filter(u => u.is_active !== false);

  const searchFields = [
    { key: 'fullName', label: 'Nombre completo', accessor: (u: Usuario) => `${u.first_name} ${u.last_name}` },
    { key: 'email', label: 'Correo electrónico', accessor: (u: Usuario) => u.email || '' },
    { key: 'username', label: 'Usuario', accessor: (u: Usuario) => u.username || '' },
    { key: 'rol', label: 'Rol', accessor: (u: Usuario) => u.rol || '' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div />
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
          <History className="h-4 w-4" />
          Papelera
        </Button>
      </div>

      <PaginatedTable
        data={usuariosActivos}
        searchFields={searchFields}
        emptyMessage="No se encontraron usuarios activos"
        header={
          <tr className="bg-slate-50 dark:bg-zinc-900/50">
            <th className="font-bold px-4 py-3 text-left">Nombre Completo</th>
            <th className="font-bold px-4 py-3 text-left">Correo Electrónico</th>
            <th className="font-bold px-4 py-3 text-left">Usuario</th>
            <th className="font-bold px-4 py-3 text-left">Rol</th>
            <th className="text-right font-bold px-4 py-3">Acciones</th>
          </tr>
        }
        renderRow={(user: Usuario) => (
          <>
            <td className="px-4 py-4 font-medium">{`${user.first_name} ${user.last_name}`}</td>
            <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
            <td className="px-4 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">@{user.username}</span></td>
            <td className="px-4 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">{user.rol}</span></td>
            <td className="px-4 py-4 text-right">
              <div className="flex justify-end gap-1 flex-wrap">
                <VerUsuario usuario={user} />
                <EditarUsuario usuario={user} onSuccess={onRefresh} />
                <EliminarUsuario id={user.id} nombre={`${user.first_name} ${user.last_name}`} onSuccess={onRefresh} />
              </div>
            </td>
          </>
        )}
      />
    </div>
  )
}