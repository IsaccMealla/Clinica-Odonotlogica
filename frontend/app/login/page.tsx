"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, User, Activity, Stethoscope, HeartPulse, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
    rememberMe: false
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (status === "error") setStatus("idle")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      // Simulación de conexión al backend
      const res = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        
        setStatus("success")
        toast.success("¡Acceso concedido! Bienvenido.")
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setStatus("error")
        setErrorMessage("Usuario o contraseña incorrectos. Intenta de nuevo.")
      }
    } catch (error) {
      console.error("Error:", error)
      setStatus("error")
      setErrorMessage("No se pudo conectar con el servidor de la clínica.")
    }
  }

  const pupilMoveX = mousePosition.x * 12
  const pupilMoveY = mousePosition.y * 12

  const getByteMessage = () => {
    if (status === "error") return "¡Ups! Revisa tus datos 😅";
    if (status === "loading") return "Verificando... 🔍";
    if (status === "success") return "¡Todo listo! 🚀";
    return "¡Hola! Soy Byte 😀";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      
      {/* Fondo Parallax */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-teal-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: mousePosition.x * -40, y: mousePosition.y * -40 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute top-20 left-[15%]">
          <Activity className="w-32 h-32 text-blue-500 opacity-10 -rotate-12" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * 60, y: mousePosition.y * 60 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute bottom-24 left-[10%]">
          <Stethoscope className="w-48 h-48 text-teal-500 opacity-10 rotate-12" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * -80, y: mousePosition.y * 80 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute top-32 right-[15%]">
          <HeartPulse className="w-40 h-40 text-blue-400 opacity-10 rotate-[30deg]" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * 30, y: mousePosition.y * -30 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute bottom-32 right-[12%]">
          <Plus className="w-24 h-24 text-teal-600 opacity-10 -rotate-12" />
        </motion.div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-white/60 bg-white/80 backdrop-blur-md">
        <CardHeader className="space-y-2 items-center text-center pt-10 pb-2">
          
          {/* CONTENEDOR DE BYTE Y SU NUBE */}
          <div className="relative flex justify-center mt-6 mb-4">
            
            {/* NUBE DE TEXTO DE BYTE */}
            <AnimatePresence mode="wait">
              <motion.div
                key={status} // Fuerza la animación cuando cambia el status
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute -top-12 z-20 bg-white px-4 py-2 rounded-2xl shadow-lg border border-slate-100 text-sm font-bold text-slate-700 whitespace-nowrap"
              >
                {getByteMessage()}
                {/* Triángulo inferior de la burbuja */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-100 rotate-45"></div>
              </motion.div>
            </AnimatePresence>

            {/* BYTE (EL DIENTE) */}
            <motion.div 
              animate={status === "error" ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="h-24 w-24 bg-gradient-to-br from-blue-100 to-teal-50 rounded-full flex items-center justify-center shadow-inner border-2 border-white relative overflow-hidden z-10"
            >
              <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-md">
                <path 
                  d="M 30 20 C 30 5, 70 5, 70 20 C 70 45, 85 70, 75 85 C 65 100, 55 85, 50 70 C 45 85, 35 100, 25 85 C 15 70, 30 45, 30 20 Z" 
                  fill="white" 
                  stroke="#cbd5e1" 
                  strokeWidth="3"
                />
                
                {status === "error" ? (
                  <g stroke="#334155" strokeWidth="3" strokeLinecap="round">
                    <line x1="35" y1="35" x2="45" y2="45" />
                    <line x1="45" y1="35" x2="35" y2="45" />
                    <line x1="55" y1="35" x2="65" y2="45" />
                    <line x1="65" y1="35" x2="55" y2="45" />
                  </g>
                ) : (
                  <g>
                    <circle cx={40 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#334155" />
                    <circle cx={60 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#334155" />
                  </g>
                )}
              </svg>
            </motion.div>
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

        <CardContent className="px-8 pt-2">
          
          <AnimatePresence>
            {status === "error" && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-semibold">Usuario</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Escribe tu usuario..." 
                  className={`pl-11 h-12 bg-white/50 focus:bg-white focus:ring-2 transition-all text-md ${status === 'error' ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'}`}
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
                  className={`pl-11 h-12 bg-white/50 focus:bg-white focus:ring-2 transition-all text-md ${status === 'error' ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'}`}
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
                className="h-5 w-5 data-[state=checked]:bg-blue-600 border-slate-300"
              />
              <Label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                Mantener sesión iniciada
              </Label>
            </div>

            <Button 
              type="submit" 
              disabled={status === "loading" || status === "success"}
              className={`w-full h-12 text-lg font-bold shadow-md hover:shadow-xl transition-all duration-300 rounded-xl mt-4 relative overflow-hidden
                ${status === 'success' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : status === 'error'
                  ? 'bg-slate-800 hover:bg-slate-900'
                  : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600'
                }`} 
            >
              {(status === "idle" || status === "error") && (
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1 }}
                  className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-12 pointer-events-none"
                />
              )}

              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.span key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    Ingresar al Sistema
                  </motion.span>
                )}
                {status === "error" && (
                  <motion.span key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    Intentar Nuevamente
                  </motion.span>
                )}
                {status === "loading" && (
                  <motion.span key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                  </motion.span>
                )}
                {status === "success" && (
                  <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> ¡Acceso Concedido!
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-4">
          <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Lock className="w-3 h-3" /> Seguridad cifrada de extremo a extremo
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}