"use client"

import { useState, useEffect, useCallback } from "react"
import { NuevoUsuario } from "@/components/usuarios/nuevo-usuario"
import { TablaUsuarios, Usuario } from "@/components/usuarios/tabla-usuarios"
import { Loader2, UserPlus } from "lucide-react"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)

  // Usamos useCallback para que la función sea estable y no cause re-renders infinitos
  const fetchUsuarios = useCallback(async () => {
    try {
      setCargando(true)
      
      const token = localStorage.getItem("access_token")
      
      if (!token) {
        console.error("No se encontró el token de acceso.")
        return
      }

      const res = await fetch('http://127.0.0.1:8000/api/usuarios/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        // IMPORTANTE: Manejamos si Django envía la lista pura [] o paginada { results: [] }
        setUsuarios(Array.isArray(data) ? data : data.results || [])
      } else {
        console.error("Error al obtener usuarios. Status:", res.status)
      }
    } catch (error) {
      console.error("Error de red al conectar con Django:", error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra los roles de estudiantes, docentes y administradores del sistema.
          </p>
        </div>
        
        {/* Pasamos la función fetchUsuarios para que el modal refresque la tabla al guardar */}
        <NuevoUsuario onUsuarioCreado={fetchUsuarios} />
      </div>

      {/* Área de Contenido */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="animate-pulse">Sincronizando con el servidor dental...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay usuarios</h3>
          <p className="text-gray-500">Comienza registrando al primer personal o estudiante.</p>
        </div>
      ) : (
        <TablaUsuarios usuariosIniciales={usuarios} onRefresh={fetchUsuarios} />
      )}
    </div>
  )
}