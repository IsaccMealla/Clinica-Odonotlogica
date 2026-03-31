"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (res.ok) {
        toast.success("Registro exitoso. Ingresa al sistema.")
        router.push("/login")
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al registrar")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg bg-white shadow-lg rounded-lg">
        <CardHeader className="text-center py-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-blue-500 text-white rounded-full">
            <UserPlus className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-extrabold mt-4">Crear cuenta</CardTitle>
          <CardDescription>Regístrate como administrador, docente o estudiante</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="border rounded p-2 w-full">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="dentist">Dentist</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="inline mr-1" /> Ya tengo cuenta
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
