"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Lock, User, Activity, Stethoscope, HeartPulse, Plus, 
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Smile, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

// --- BASE DE DATOS DE CHISTES Y CURIOSIDADES ---
const byteCuriosities = [
  "¿Cuál es el diente más divertido? ¡El muelarrisa! 😂",
  "El esmalte dental es el tejido más duro de todo el cuerpo. 💎",
  "¿Qué hace un diente en un parque? ¡Montar en la montaña rrrrusa! 🎢",
  "Producimos suficiente saliva en la vida para llenar 2 piscinas. 🏊‍♂️",
  "Los mosquitos tienen 47 dientes... ¡Imagina usar hilo dental ahí! 🦟",
  "Antes de los cepillos, la gente usaba ramitas masticadas para limpiarse. 🌿",
  "¡Tus dientes son tan únicos como tus huellas dactilares! ☝️"
]

export default function LoginPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showPassword, setShowPassword] = useState(false)
  
  // Estados de funciones de UI
  const [activeJoke, setActiveJoke] = useState<string | null>(null)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [byteClickCount, setByteClickCount] = useState(0)
  const [isSuperMode, setIsSuperMode] = useState(false)
  const [superParticles, setSuperParticles] = useState<{id: number, x: number, y: number, color: string, scale: number}[]>([])
  
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
    rememberMe: false
  })

  // Detector de movimiento del mouse y detector global de Mayúsculas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      })
    }
    
    const checkCapsLock = (e: KeyboardEvent) => {
      if (e.getModifierState && e.getModifierState("CapsLock")) {
        setCapsLockOn(true)
      } else {
        setCapsLockOn(false)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("keydown", checkCapsLock)
    window.addEventListener("keyup", checkCapsLock)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("keydown", checkCapsLock)
      window.removeEventListener("keyup", checkCapsLock)
    }
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (status === "error") setStatus("idle")
  }

  // --- LÓGICA DE SALUD DE CONTRASEÑA ---
  let passLevel = 0
  let passLabel = ""
  let passColor = "bg-slate-700"
  
  const pass = formData.password
  if (pass.length > 0) {
    const hasNumber = /\d/.test(pass)
    const hasUpper = /[A-Z]/.test(pass)
    const isLongEnough = pass.length >= 8

    if (pass.length < 5) {
      passLevel = 33
      passLabel = "Caries de Seguridad (Muy débil)"
      passColor = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
    } else if (!isLongEnough || !hasNumber || !hasUpper) {
      passLevel = 66
      passLabel = "Placa Detectada (Intermedia)"
      passColor = "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]"
    } else {
      passLevel = 100
      passLabel = "¡Sonrisa Radiante! (Fuerte) ✨"
      passColor = "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
    }
  }

  // --- LÓGICA DEL EASTER EGG (SUPER MODO) ---
  const handleByteClick = () => {
    if (isSuperMode) return
    
    const newCount = byteClickCount + 1
    setByteClickCount(newCount)

    if (newCount === 5) {
      setIsSuperMode(true)
      
      const colors = ['#06b6d4', '#10b981', '#3b82f6', '#c026d3', '#facc15']
      const explosion = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * window.innerWidth * 1.5,
        y: (Math.random() - 0.5) * window.innerHeight * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: Math.random() * 2 + 0.5,
      }))
      setSuperParticles(explosion)
      
      toast.success("¡MODO SUPER LIMPIEZA ACTIVADO! 😎💥")

      setTimeout(() => {
        setIsSuperMode(false)
        setByteClickCount(0)
        setSuperParticles([])
      }, 5000)
    }
  }

  const tellAJoke = (e: React.MouseEvent) => {
    e.preventDefault()
    const randomJoke = byteCuriosities[Math.floor(Math.random() * byteCuriosities.length)]
    setActiveJoke(randomJoke)
    setTimeout(() => setActiveJoke(null), 6000)
  }

  // --- LÓGICA DE CONEXIÓN REAL AL BACKEND ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setActiveJoke(null)

    try {
      // Conexión a tu backend
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
        
        // Guardamos los tokens
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        
        setStatus("success")
        toast.success("¡Acceso concedido! Bienvenido.")
        
        // Redirección
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

  // Coordenadas para paralax y pupilas
  const pupilMoveX = mousePosition.x * 12
  const pupilMoveY = mousePosition.y * 12

  // Jerarquía de mensajes de Byte
  const getByteMessage = () => {
    if (isSuperMode) return "¡SISTEMA IMPECABLE! 😎✨";
    if (capsLockOn) return "¡Cuidado! Mayúsculas encendidas ⚠️";
    if (activeJoke) return activeJoke; 
    if (status === "error") return "¡Ups! Revisa tus datos 😅";
    if (status === "loading") return "Verificando identidad... 🔍";
    if (status === "success") return "¡Acceso Autorizado! 🚀";
    if (isPasswordFocused && !showPassword) return "¡No estoy mirando! 🫣";
    return "¡Hola! Soy Byte 😀";
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${isSuperMode ? 'bg-slate-900' : 'bg-slate-100 dark:bg-[#020617]'}`}>
      
      {/* EXPLOSIÓN VISUAL DEL EASTER EGG */}
      <AnimatePresence>
        {isSuperMode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center"
          >
            <motion.div 
              animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 2] }} 
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-cyan-500/20 mix-blend-screen"
            />
            {superParticles.map(p => (
              <motion.div
                key={`exp-${p.id}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: Math.random() * 360 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute shadow-[0_0_20px_currentColor]"
                style={{ color: p.color }}
              >
                <Plus className="w-8 h-8" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FONDOS DINÁMICOS --- */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
      
      <motion.div 
        animate={isSuperMode ? { scale: [1, 2], opacity: [0.8, 0], rotate: 180 } : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: isSuperMode ? 1 : 8, repeat: isSuperMode ? 0 : Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/40 rounded-full filter blur-[120px] pointer-events-none"
      />

      {/* --- ICONOS FLOTANTES CON PARALAX --- */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isSuperMode ? 'opacity-30' : 'opacity-100'}`}>
        <motion.div animate={{ x: mousePosition.x * -40, y: mousePosition.y * -40 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute top-20 left-[15%]">
          <Activity className="w-32 h-32 text-cyan-500 opacity-20 dark:opacity-10 -rotate-12" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * 60, y: mousePosition.y * 60 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute bottom-24 left-[10%]">
          <Stethoscope className="w-48 h-48 text-teal-500 opacity-20 dark:opacity-10 rotate-12" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * -80, y: mousePosition.y * 80 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute top-32 right-[15%]">
          <HeartPulse className="w-40 h-40 text-cyan-600 opacity-20 dark:opacity-10 rotate-[30deg]" />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * 30, y: mousePosition.y * -30 }} transition={{ type: "spring", stiffness: 75, damping: 20 }} className="absolute bottom-32 right-[12%]">
          <Plus className="w-24 h-24 text-teal-600 opacity-20 dark:opacity-10 -rotate-12" />
        </motion.div>
      </div>

      {/* --- TARJETA PRINCIPAL --- */}
      <motion.div 
        animate={isSuperMode ? { y: [-10, 10, -10, 10, 0], scale: [1, 1.05, 1] } : {}} 
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className={`w-full relative shadow-[0_20px_70px_-15px_rgba(6,182,212,0.4)] border bg-[#0f172a]/95 backdrop-blur-2xl rounded-3xl overflow-visible transition-all duration-500 ${isSuperMode ? 'border-cyan-400 shadow-[0_0_100px_rgba(6,182,212,0.8)]' : 'border-cyan-500/30'}`}>
          <CardHeader className="space-y-2 items-center text-center pt-12 pb-4">
            
            <div className="relative flex justify-center mt-4 mb-6">
              {/* NUBE DE BYTE */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={getByteMessage()} 
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`absolute -top-16 z-20 px-4 py-2 rounded-2xl shadow-xl border text-sm font-bold max-w-[280px] text-center
                    ${capsLockOn ? 'bg-yellow-500 text-yellow-950 border-yellow-400'
                    : isSuperMode ? 'bg-cyan-400 text-slate-900 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]'
                    : status === 'error' && !activeJoke ? 'bg-red-950/90 text-red-400 border-red-900/50' 
                    : status === 'success' && !activeJoke ? 'bg-emerald-950/90 text-emerald-400 border-emerald-900/50'
                    : 'bg-slate-800 text-cyan-50 border-cyan-500/30 shadow-cyan-500/20'}`}
                >
                  {getByteMessage()}
                  <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-b border-r rotate-45
                    ${capsLockOn ? 'bg-yellow-500 border-yellow-400'
                    : isSuperMode ? 'bg-cyan-400 border-cyan-300'
                    : status === 'error' && !activeJoke ? 'bg-red-950 border-red-900/50' 
                    : status === 'success' && !activeJoke ? 'bg-emerald-950 border-emerald-900/50'
                    : 'bg-slate-800 border-cyan-500/30'}`}>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* CONTENEDOR DEL DIENTE */}
              <div className="relative">
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  onClick={handleByteClick}
                  className="cursor-pointer"
                >
                  <motion.div 
                    animate={status === "error" ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`h-24 w-24 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] border-2 relative overflow-hidden z-10 transition-colors duration-500
                      ${isSuperMode ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 shadow-[0_0_50px_rgba(34,211,238,1)]'
                      : status === 'success' ? 'bg-gradient-to-br from-emerald-900/80 to-teal-900/40 border-emerald-500/50'
                      : status === 'error' ? 'bg-gradient-to-br from-red-900/80 to-orange-900/40 border-red-500/50'
                      : 'bg-gradient-to-br from-cyan-900/80 to-blue-900/40 border-cyan-500/50'}`}
                  >
                    <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      <path 
                        d="M 30 20 C 30 5, 70 5, 70 20 C 70 45, 85 70, 75 85 C 65 100, 55 85, 50 70 C 45 85, 35 100, 25 85 C 15 70, 30 45, 30 20 Z" 
                        fill="#ffffff" 
                        stroke={isSuperMode ? '#22d3ee' : status === 'error' ? '#fca5a5' : status === 'success' ? '#6ee7b7' : '#67e8f9'} 
                        strokeWidth="2"
                      />
                      {/* OJOS DE BYTE */}
                      {isSuperMode ? (
                        <g>
                          <rect x="30" y="38" width="18" height="10" rx="2" fill="#0f172a" />
                          <rect x="52" y="38" width="18" height="10" rx="2" fill="#0f172a" />
                          <line x1="48" y1="42" x2="52" y2="42" stroke="#0f172a" strokeWidth="3" />
                          <path d="M 35 55 Q 50 65 65 55" stroke="#0f172a" strokeWidth="3" fill="none" />
                        </g>
                      ) : status === "error" ? (
                        <g stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                          <line x1="35" y1="35" x2="45" y2="45" />
                          <line x1="45" y1="35" x2="35" y2="45" />
                          <line x1="55" y1="35" x2="65" y2="45" />
                          <line x1="65" y1="35" x2="55" y2="45" />
                        </g>
                      ) : status === "success" ? (
                        <g stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none">
                          <path d="M 35 45 Q 50 55 65 45" />
                          <path d="M 35 38 Q 40 33 45 38" />
                          <path d="M 55 38 Q 60 33 65 38" />
                        </g>
                      ) : isPasswordFocused && !showPassword ? (
                        <g stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none">
                          <path d="M 32 42 Q 40 45 48 42" />
                          <path d="M 52 42 Q 60 45 68 42" />
                        </g>
                      ) : (
                        <g>
                          <circle cx={40 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#0f172a" />
                          <circle cx={60 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#0f172a" />
                        </g>
                      )}
                    </svg>
                  </motion.div>
                </motion.div>

                {/* BOTÓN DE CHISTES */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={tellAJoke}
                  type="button"
                  className="absolute -right-3 -bottom-2 bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] border-2 border-[#0f172a] z-30 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-3xl font-extrabold tracking-tight text-white">
                Clínica <span className="text-cyan-400">Pro</span>
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-400">
                Sistema Biométrico Odontológico
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pt-2">
            {/* ALERTA DE ERROR DEL SERVIDOR */}
            <AnimatePresence>
              {status === "error" && errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 font-semibold">Usuario</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Escribe tu usuario..." 
                    className="pl-11 h-12 bg-slate-900/50 text-white placeholder:text-slate-600 focus:bg-slate-900 border-slate-700 focus:ring-2 focus:ring-cyan-500/50 transition-all text-md"
                    required
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 font-semibold">Contraseña</Label>
                  <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-3 top-3 h-5 w-5 z-10 transition-colors ${capsLockOn ? 'text-yellow-500' : 'text-slate-500 group-focus-within:text-cyan-400'}`} />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`pl-11 pr-20 h-12 bg-slate-900/50 text-white placeholder:text-slate-600 focus:bg-slate-900 border-slate-700 focus:ring-2 transition-all text-md ${capsLockOn ? 'focus:ring-yellow-500/50 border-yellow-500/30' : 'focus:ring-cyan-500/50'}`}
                    required
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  
                  <div className="absolute right-3 top-3 flex items-center gap-2 z-10">
                    <AnimatePresence>
                      {capsLockOn && (
                        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
                          <ShieldAlert className="h-5 w-5 text-yellow-500" title="Mayúsculas activadas" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* BARRA DE SALUD DENTAL (Contraseña) */}
                <AnimatePresence>
                  {formData.password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: "auto" }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-1 overflow-hidden"
                    >
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all duration-500 ease-out ${passColor}`} 
                          style={{ width: `${passLevel}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${passLevel === 100 ? 'text-emerald-400' : passLevel === 66 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {passLabel}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Checkbox 
                  id="remember" 
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleChange("rememberMe", checked as boolean)}
                  className="h-5 w-5 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 border-slate-600"
                />
                <Label htmlFor="remember" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                  Mantener sesión iniciada
                </Label>
              </div>

              <div className="relative pt-2">
                <Button 
                  type="submit" 
                  disabled={status === "loading" || status === "success"}
                  className={`w-full h-12 text-lg font-bold shadow-lg transition-all duration-500 rounded-xl relative overflow-hidden border
                    ${status === 'success' 
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                      : status === 'error'
                      ? 'bg-red-900 text-white border-red-700 shadow-red-900/50'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-50 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    }`} 
                >
                  <AnimatePresence mode="wait">
                    {status === "idle" && (
                      <motion.span key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-cyan-400" /> Ingresar al Sistema
                      </motion.span>
                    )}
                    {status === "loading" && (
                      <motion.span key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> Autenticando...
                      </motion.span>
                    )}
                    {status === "success" && (
                      <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Acceso Autorizado
                      </motion.span>
                    )}
                    {status === "error" && (
                      <motion.span key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                         Intentar Nuevamente
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-8 pt-4 border-t border-slate-800/50 mt-4">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-600" /> Encriptación Biométrica Nivel 4
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}