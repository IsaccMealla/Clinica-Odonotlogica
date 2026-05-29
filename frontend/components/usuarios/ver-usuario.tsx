"use client"

// 👇 1. Agregamos el ícono 'Shield' de lucide-react
import { Eye, UserCircle, Mail, Key, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function VerUsuario({ usuario }: { usuario: any }) {
  const nombreCompleto = usuario.first_name || usuario.last_name 
    ? `${usuario.first_name} ${usuario.last_name}` 
    : "Usuario sin nombre"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50" title="Ver Detalles">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-blue-600" />
            Perfil de Usuario
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
              {usuario.first_name ? usuario.first_name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3 className="font-semibold text-lg">{nombreCompleto}</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Correo Electrónico</p>
                <p>{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Username</p>
                <p className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{usuario.username}</p>
              </div>
            </div>
            {/* 👇 2. AQUÍ AGREGAMOS LA SECCIÓN DEL ROL 👇 */}
            <div className="flex items-center gap-3 text-sm mt-2 pt-2 border-t">
              <Shield className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Rol en el Sistema</p>
                <p className="capitalize font-medium text-amber-700 dark:text-amber-400">
                  {usuario.rol || "Sin rol asignado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}