"use client"

import { useEffect, useState } from "react"
import { UserTable } from "@/components/user-table"
import { UserForm } from "@/components/user-form"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    const res = await fetch("/api/users/")
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async (payload: { name: string; email: string; password: string; role: string }) => {
    setLoading(true)
    try {
      const res = await fetch("/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success("Usuario creado")
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.detail || "Error creando usuario")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const deactivateUser = async (id: string) => {
    try {
      await fetch(`/api/users/${id}/`, { method: "DELETE" })
      toast.success("Usuario desactivado")
      fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error("Error al desactivar")
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Administración de usuarios</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Crear usuario</h2>
          <UserForm onSubmit={createUser} isLoading={loading} />
        </div>
        <div>
          <h2 className="font-semibold mb-2">Usuarios existentes</h2>
          <UserTable users={users} onDelete={deactivateUser} />
        </div>
      </div>
    </div>
  )
}
