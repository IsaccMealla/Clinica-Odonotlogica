"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

const roleOptions = [
  { value: "student", label: "Estudiante" },
  { value: "teacher", label: "Docente" },
  { value: "dentist", label: "Odontólogo" },
  { value: "receptionist", label: "Recepcionista" },
  { value: "admin", label: "Administrador" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("student")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido"
    }
    if (!email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido"
    }
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`¡Bienvenido! Tu cuenta como ${roleOptions.find(r => r.value === role)?.label} ha sido creada.`)
        
        // Guardar tokens si están disponibles
        if (data.access) {
          localStorage.setItem("access_token", data.access)
          if (data.refresh) localStorage.setItem("refresh_token", data.refresh)
        }
        
        router.push("/login")
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al registrar. Intenta nuevamente.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = () => {
    const selected = roleOptions.find(r => r.value === role)
    return selected?.label || "Rol"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Círculos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30"></div>

      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-white/50 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 items-center text-center pt-8 pb-6">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-extrabold text-slate-800">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Únete al sistema de gestión clínica
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-semibold flex items-center gap-2">
                Nombre Completo
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez García"
                className={`h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all ${
                  errors.name ? "border-red-500" : ""
                }`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({ ...errors, name: "" })
                }}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                Correo Electrónico
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.email@clinica.com"
                className={`h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all ${
                  errors.email ? "border-red-500" : ""
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: "" })
                }}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-700 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Rol o Puesto
                <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:bg-white">
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                Contraseña
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all ${
                  errors.password ? "border-red-500" : ""
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: "" })
                }}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold flex items-center gap-2">
                Confirmar Contraseña
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={`h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" })
                }}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Botón Registrar */}
            <Button
              type="submit"
              className="w-full h-11 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 pb-6 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
