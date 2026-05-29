"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fingerprint, UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

// 👇 CAMBIA ESTO POR LA IP QUE TE IMPRIMA EL ESP32 EN LA TERMINAL NEGRA 👇
const IP_ESP32 = "http://192.168.0.9" 

interface Usuario {
  id: number
  first_name: string
  last_name: string
  rol: string
  huella_id: number | null
}

export function AsignarHuella({ onAsignacionExitosa }: { onAsignacionExitosa?: () => void }) {
  const [open, setOpen] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>("")
  
  // Estados del escaneo
  const [escaneando, setEscaneando] = useState(false)
  const [mensajeSensor, setMensajeSensor] = useState("Listo para iniciar.")
  const [estadoSensor, setEstadoSensor] = useState(0) // 0 a 6 (basado en el enum de C++)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (open) {
      cargarUsuarios()
      resetState()
    } else {
      detenerEscaneo() // Si cerramos la ventana, liberamos al ESP32
    }
  }, [open])

  const resetState = () => {
    setEscaneando(false)
    setEstadoSensor(0)
    setMensajeSensor("Selecciona un usuario y presiona 'Iniciar Escáner'")
    setUsuarioSeleccionado("")
  }

  const cargarUsuarios = async () => {
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
    }
  }

  // 1. Iniciar el proceso de escaneo en el hardware
  const iniciarEscaneo = async () => {
    if (!usuarioSeleccionado) return
    setEscaneando(true)
    setMensajeSensor("Conectando con el sensor biométrico...")
    
    try {
      // Le ordenamos al ESP32 que empiece
      const res = await fetch(`${IP_ESP32}/registrar`)
      if (res.ok) {
        // Empezamos a preguntarle al ESP32 cada 1 segundo cómo va
        pollInterval.current = setInterval(verificarEstadoSensor, 1000)
      } else {
        throw new Error("Sensor ocupado o no disponible")
      }
    } catch (error) {
      setEstadoSensor(6) // Error
      setMensajeSensor("Error: No se pudo contactar al ESP32. ¿Está encendido?")
      setEscaneando(false)
    }
  }

  // 2. Preguntar al ESP32 constantemente qué está pasando
  const verificarEstadoSensor = async () => {
    try {
      const res = await fetch(`${IP_ESP32}/estado`)
      const data = await res.json()
      
      setEstadoSensor(data.codigo_estado)
      setMensajeSensor(data.mensaje)

      if (data.codigo_estado === 5) { // 5 = REGISTRO_EXITOSO en C++
        clearInterval(pollInterval.current!)
        vincularHuellaADjango(data.id_registrado)
      } else if (data.codigo_estado === 6) { // 6 = REGISTRO_ERROR en C++
        clearInterval(pollInterval.current!)
        setEscaneando(false)
      }
    } catch (error) {
      console.error("Error contactando ESP32", error)
    }
  }

  // 3. Cuando el ESP32 termina, guardamos el ID en Django automáticamente
  const vincularHuellaADjango = async (nuevoIdHuella: number) => {
    try {
      const token = localStorage.getItem("access_token") || ""
      const res = await fetch(`http://localhost:8000/api/usuarios/${usuarioSeleccionado}/`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ huella_id: nuevoIdHuella })
      })

      if (res.ok) {
        setMensajeSensor(`¡Perfecto! Huella ID #${nuevoIdHuella} vinculada al usuario.`)
        if (onAsignacionExitosa) onAsignacionExitosa()
        setTimeout(() => setOpen(false), 3000) // Cerramos después de 3 segundos
      }
    } catch (error) {
      console.error(error)
      setMensajeSensor("Huella guardada en el sensor, pero falló al guardar en servidor.")
    } finally {
      detenerEscaneo()
    }
  }

  // Liberar el sensor
  const detenerEscaneo = () => {
    if (pollInterval.current) clearInterval(pollInterval.current)
    fetch(`${IP_ESP32}/volver`).catch(()=>console.log("Ignorando error al resetear ESP"))
    setEscaneando(false)
  }

  // Función gráfica para el color del estado
  const getColorPorEstado = () => {
    if (estadoSensor === 5) return "text-green-500 bg-green-50 border-green-200"
    if (estadoSensor === 6) return "text-red-500 bg-red-50 border-red-200"
    if (escaneando) return "text-blue-500 bg-blue-50 border-blue-200"
    return "text-slate-500 bg-slate-50 border-slate-200"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-200 hover:bg-blue-50 text-blue-700 transition-all shadow-sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Nueva Huella
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Fingerprint className="mr-2 h-6 w-6 text-blue-600" />
            Enrolamiento Biométrico
          </DialogTitle>
          <DialogDescription>
            Sincroniza el sensor hardware para registrar una nueva huella en vivo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Seleccionar Usuario</label>
            <Select value={usuarioSeleccionado} onValueChange={setUsuarioSeleccionado} disabled={escaneando}>
              <SelectTrigger>
                <SelectValue placeholder="¿De quién es esta huella?" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name} - {user.rol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VISUALIZADOR DE ESTADO GRÁFICO */}
          <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center min-h-[120px] transition-colors duration-500 ${getColorPorEstado()}`}>
            
            {estadoSensor === 5 && <CheckCircle2 className="w-12 h-12 mb-2 text-green-500 animate-in zoom-in" />}
            {estadoSensor === 6 && <AlertCircle className="w-12 h-12 mb-2 text-red-500" />}
            {escaneando && estadoSensor > 0 && estadoSensor < 5 && (
              <div className="relative w-12 h-12 mb-2">
                <Fingerprint className="absolute w-full h-full text-blue-500/30" />
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-scan"></div>
              </div>
            )}
            
            <p className="text-center font-medium animate-pulse">{mensajeSensor}</p>
          </div>

          <Button 
            onClick={escaneando ? detenerEscaneo : iniciarEscaneo} 
            className={`w-full ${escaneando ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`} 
            disabled={!usuarioSeleccionado || estadoSensor === 5}
          >
            {escaneando ? "Cancelar Escaneo" : "Iniciar Escáner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}