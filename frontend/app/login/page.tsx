"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
    rememberMe: false
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Conexión real con tu backend en Django
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        
        // Guardamos las llaves de seguridad en el navegador
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        
        toast.success("¡Acceso concedido! Bienvenido.")
        router.push("/dashboard") // Te enviará al sistema principal
      } else {
        toast.error("Usuario o contraseña incorrectos. Intenta de nuevo.")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 relative overflow-hidden">
      
      {/* Círculos decorativos de fondo (Diseño moderno) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-white/50 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-4 items-center text-center pt-10 pb-4">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-800">
              Clínica Pro
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">
              Sistema de Gestión Odontológica Avanzada
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-semibold">Usuario</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Escribe tu usuario..." 
                  className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                  required
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña</Label>
                <a href="/recuperar-password" className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Checkbox 
                id="remember" 
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleChange("rememberMe", checked as boolean)}
                className="h-5 w-5 data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                Mantener sesión iniciada
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 text-lg font-bold shadow-md transition-all hover:shadow-lg rounded-xl mt-4" 
              disabled={loading}
            >
              {loading ? "Verificando credenciales..." : "Ingresar al Sistema"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-4">
          <p className="text-sm font-medium text-slate-400">
            Seguridad cifrada de extremo a extremo
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}