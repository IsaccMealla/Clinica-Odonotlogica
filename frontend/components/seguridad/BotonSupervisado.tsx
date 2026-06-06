"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ShieldCheck, ShieldAlert, Clock, CheckCircle2, Send } from "lucide-react"

interface BotonSupervisadoProps {
  modulo: string // 'M2_DIAGNOSTICO' | 'M3_TRATAMIENTO' | 'M4_CITAS' | 'M5_RADIOGRAFIA'
  accionLabel: string // Texto visible del botón, ej: "Guardar Diagnóstico"
  accionDescripcion: string // Descripción corta para la solicitud
  onAccionPermitida: () => void // Callback que se ejecuta si el docente ya dio permiso
  disabled?: boolean
  className?: string
  pacienteId?: string
  pacienteNombre?: string
  children?: React.ReactNode // Contenido del botón
}

export function BotonSupervisado({
  modulo,
  accionLabel,
  accionDescripcion,
  onAccionPermitida,
  disabled = false,
  className = "",
  pacienteId = "",
  pacienteNombre = "",
  children
}: BotonSupervisadoProps) {
  const [estado, setEstado] = useState<'BLOQUEADO' | 'SOLICITUD_PENDIENTE' | 'PERMISO_VIGENTE'>('BLOQUEADO')
  const [showModal, setShowModal] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [minutosRestantes, setMinutosRestantes] = useState(0)

  const esAdmin = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      const isSuperuser = localStorage.getItem('is_superuser') === 'true'
      return isSuperuser || role === 'ADMIN'
    } catch { return false }
  }, [])

  const esDocente = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      return role === 'DOCENTE'
    } catch { return false }
  }, [])

  const esRecepcionista = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      return role === 'RECEPCIONISTA'
    } catch { return false }
  }, [])

  const verificarPermiso = useCallback(async () => {
    // BYPASS ADMIN/DOCENTE/RECEPCIONISTA
    if (esAdmin() || esDocente() || esRecepcionista()) {
      setEstado('PERMISO_VIGENTE')
      return
    }

    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` }
      const res = await fetch(`http://localhost:8000/api/solicitud-guardado/verificar_permiso/?tipo=${modulo}&paciente_id=${pacienteId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.tiene_permiso) {
          setEstado('PERMISO_VIGENTE')
          setMinutosRestantes(Math.round(data.minutos_restantes))
        } else {
          // Check if there's a pending request
          const resPendientes = await fetch(`http://localhost:8000/api/solicitud-guardado/pendientes/`, { headers })
          if (resPendientes.ok) {
            const pendientes = await resPendientes.json()
            const myPending = pendientes.find((p: any) => p.tipo_guardado === modulo && (pacienteId ? p.paciente == pacienteId : true))
            if (myPending) {
              setEstado('SOLICITUD_PENDIENTE')
            } else {
              setEstado('BLOQUEADO')
            }
          } else {
             setEstado('BLOQUEADO')
          }
        }
      }
    } catch (e) {
      console.error("Error verificando permiso", e)
    }
  }, [modulo, esAdmin, esDocente, esRecepcionista, pacienteId])

  useEffect(() => {
    verificarPermiso()
    const interval = setInterval(verificarPermiso, 5000)
    return () => clearInterval(interval)
  }, [verificarPermiso])

  const handleClick = () => {
    if (esAdmin() || esDocente() || esRecepcionista()) {
      onAccionPermitida()
      return
    }

    if (estado === 'PERMISO_VIGENTE') {
      onAccionPermitida()
    } else if (estado === 'SOLICITUD_PENDIENTE') {
      setShowModal(true)
    } else {
      setShowModal(true)
      setEnviado(false)
    }
  }

  const enviarSolicitud = async () => {
    setEnviado(true)
    try {
      // Find teacher assigned to my current subject
      const materiaActivaId = localStorage.getItem("estudiante_materia_id")
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
      
      // We first need the teacher ID. For simplicity if the API auto-routes, or we must pass docente ID.
      // Wait, in my models_materias I said SolicitudGuardado needs a docente.
      // Let's get the teacher from MateriaEstudiante for this student and materia.
      const resMat = await fetch(`http://localhost:8000/api/materia-estudiante/mis_materias/`, { headers })
      const materias = await resMat.json()
      const miMateria = materias.find((m: any) => m.materia == materiaActivaId) || materias[0]
      const docenteId = miMateria?.docente_asignado

      if (!docenteId) {
        alert("No tienes docente asignado en esta materia.")
        setEnviado(false)
        setShowModal(false)
        return
      }

      const body = {
        docente: docenteId,
        materia: materiaActivaId,
        paciente: pacienteId || null,
        tipo_guardado: modulo,
        descripcion: accionDescripcion
      }

      const res = await fetch(`http://localhost:8000/api/solicitud-guardado/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setEstado('SOLICITUD_PENDIENTE')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const renderBoton = () => {
    if (esAdmin() || esDocente() || esRecepcionista()) {
      return (
        <Button disabled={disabled} onClick={handleClick} className={`bg-clinica-secondary hover:bg-clinica-secondary/90 text-white ring-2 ring-green-300 ring-offset-1 ${className}`}>
          <CheckCircle2 className="w-4 h-4 mr-2" /> {children || accionLabel}
        </Button>
      )
    }

    if (estado === 'SOLICITUD_PENDIENTE') {
      return (
        <Button disabled={disabled} onClick={handleClick} className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}>
          <Clock className="w-4 h-4 mr-2 animate-pulse" /> Esperando Aprobación...
        </Button>
      )
    }

    if (estado === 'PERMISO_VIGENTE') {
      return (
        <Button disabled={disabled} onClick={handleClick} className={`bg-clinica-secondary hover:bg-clinica-secondary/90 text-white ring-2 ring-green-300 ring-offset-1 ${className}`}>
          <CheckCircle2 className="w-4 h-4 mr-2" /> {children || accionLabel} ({minutosRestantes}m)
        </Button>
      )
    }

    return (
      <Button disabled={disabled} onClick={handleClick} className={`bg-slate-400 hover:bg-slate-500 text-white relative ${className}`}>
        <ShieldAlert className="w-4 h-4 mr-2" /> {children || accionLabel}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      </Button>
    )
  }

  return (
    <>
      {renderBoton()}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="w-5 h-5" /> Acción Supervisada
            </DialogTitle>
          </DialogHeader>

          {estado === 'SOLICITUD_PENDIENTE' || enviado ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-amber-700 text-center">Solicitud Enviada al Docente Supervisor</h3>
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Tu solicitud para <strong>{accionDescripcion}</strong> ha sido registrada.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 text-red-800 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>La acción <strong>"{accionDescripcion}"</strong> requiere autorización del Docente Supervisor antes de ser ejecutada.</p>
              </div>
              <Button onClick={enviarSolicitud} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                <Send className="w-4 h-4 mr-2" /> Enviar Solicitud al Docente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
