"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function RecuperarPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Petición REAL a tu backend de Django
      const res = await fetch("/api/auth/reset-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      })

      if (res.ok) {
        setEnviado(true)
        toast.success("Enlace enviado con éxito")
      } else {
        toast.error("Hubo un problema al enviar el correo")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 relative overflow-hidden">
      
      {/* Círculos decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-white/50 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-4 items-center text-center pt-10 pb-4">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3 hover:-rotate-6 transition-transform">
            <KeyRound className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-800">
              Recuperar Contraseña
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">
              {enviado 
                ? "Revisa tu bandeja de entrada" 
                : "Ingresa tu correo y te enviaremos un enlace seguro"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8">
          {!enviado ? (
            <form onSubmit={handleRecuperar} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Electrónico</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="doctor@clinica.com" 
                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-md"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 text-md font-bold shadow-md transition-all hover:shadow-lg rounded-xl mt-4" 
                disabled={loading}
              >
                {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <p className="text-slate-600">
                Hemos enviado las instrucciones a <strong>{email}</strong>. Por favor, revisa tu correo.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => setEnviado(false)}
              >
                Intentar con otro correo
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pb-8 pt-4">
          <Link href="/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}