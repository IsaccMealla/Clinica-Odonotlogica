"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Fingerprint, RefreshCcw } from "lucide-react"

// 👇 OJO: LA MISMA IP QUE USASTE EN EL OTRO COMPONENTE 👇
const IP_ESP32 = "http://192.168.0.X" 

interface Usuario {
  id: number
  username: string
  first_name: string
  last_name: string
  rol: string
  huella_id: number | null
}

export function GestionHuellas() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)

  const cargarUsuarios = async () => {
    setCargando(true)
    try {
      const token = localStorage.getItem("access_token") || ""
      const res = await fetch("http://localhost:8000/api/usuarios/", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data.results || data)
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  // Función para ELIMINAR huella de la DB y del ESP32
  const eliminarHuella = async (usuario: Usuario) => {
    if (!usuario.huella_id) return
    
    const confirmar = window.confirm(`¿Estás seguro de eliminar la huella del usuario ${usuario.first_name}?`)
    if (!confirmar) return

    setProcesandoId(usuario.id)

    try {
      // 1. Mandar orden al ESP32 para que la borre de su memoria física
      const resEsp = await fetch(`${IP_ESP32}/borrar?id=${usuario.huella_id}`)
      if (!resEsp.ok) {
        console.warn("No se pudo contactar al ESP32 o la huella no estaba en el sensor, pero la borraremos de la BD de todos modos.")
      }

      // 2. Borrar (desvincular) en Django
      const token = localStorage.getItem("access_token") || ""
      const resDjango = await fetch(`http://localhost:8000/api/usuarios/${usuario.id}/`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ huella_id: null }) // Le quitamos el ID
      })

      if (resDjango.ok) {
        cargarUsuarios() // Refrescamos la tabla
      }
    } catch (error) {
      console.error("Error en la eliminación:", error)
      alert("Hubo un error al intentar eliminar la huella.")
    } finally {
      setProcesandoId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Fingerprint className="mr-2 h-5 w-5 text-blue-600" />
            Directorio de Huellas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los datos biométricos del personal y estudiantes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarUsuarios} disabled={cargando}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-center">Estado Biométrico</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length === 0 && !cargando && (
             <TableRow>
               <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                 No se encontraron usuarios en el sistema.
               </TableCell>
             </TableRow>
          )}
          
          {usuarios.map((user) => (
            <TableRow key={user.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <TableCell className="font-medium">
                {user.first_name} {user.last_name}
                <div className="text-xs text-muted-foreground">{user.username}</div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800">
                  {user.rol}
                </Badge>
              </TableCell>
              
              <TableCell className="text-center">
                {user.huella_id ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                    <Fingerprint className="w-3 h-3 mr-1" />
                    ID: {user.huella_id}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-slate-500 bg-slate-100 border-slate-200">
                    Sin Registrar
                  </Badge>
                )}
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Si TIENE huella, mostramos botón de eliminar */}
                  {user.huella_id && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => eliminarHuella(user)}
                      disabled={procesandoId === user.id}
                      className="h-8 shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Si NO TIENE huella (o queremos editarla), idealmente aquí llamaríamos 
                      al modal que creamos antes, pero pre-seleccionando a este usuario.
                      Por ahora, podemos indicarle al usuario que use el botón de arriba. */}
                  {!user.huella_id && (
                     <span className="text-xs text-muted-foreground italic flex items-center h-8">
                       Usar botón "Nueva Huella"
                     </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}