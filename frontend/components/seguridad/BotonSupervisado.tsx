// FILE: components/seguridad/BotonSupervisado.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ShieldCheck, ShieldAlert, Clock, CheckCircle2, Send } from "lucide-react"
import {
  verificarAccesoModulo,
  crearSolicitud,
  type SolicitudDocente
} from "@/lib/supervision-store"

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
  const [estado, setEstado] = useState<'BLOQUEADO' | 'PERMISO_PROACTIVO' | 'SOLICITUD_PENDIENTE' | 'SOLICITUD_APROBADA'>('BLOQUEADO')
  const [showModal, setShowModal] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [estudianteId, setEstudianteId] = useState("")

  // ========================================
  // BYPASS ADMIN — CORTOCIRCUITO TOTAL
  // Si el usuario es Administrador/Admin, acceso irrestricto inmediato.
  // NO muestra modal de "Pedir Permiso" ni congela botones.
  // El flujo de bloqueo académico es EXCLUSIVO para el rol 'Estudiante'.
  // ========================================
  const esAdmin = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      const rolAlt = (localStorage.getItem('user_rol') || '').toUpperCase().trim()
      const isSuperuser = localStorage.getItem('is_superuser') === 'true'
      return isSuperuser || role === 'ADMIN' || role === 'ADMINISTRADOR' || rolAlt === 'ADMIN' || rolAlt === 'ADMINISTRADOR'
    } catch { return false }
  }, [])

  const esDocente = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      const rolAlt = (localStorage.getItem('user_rol') || '').toUpperCase().trim()
      return role === 'DOCENTE' || rolAlt === 'DOCENTE'
    } catch { return false }
  }, [])

  const esRecepcionista = useCallback((): boolean => {
    try {
      const role = (localStorage.getItem('user_role') || '').toUpperCase().trim()
      const rolAlt = (localStorage.getItem('user_rol') || '').toUpperCase().trim()
      return role === 'RECEPCIONISTA' || rolAlt === 'RECEPCIONISTA'
    } catch { return false }
  }, [])

  const verificar = useCallback(() => {
    // BYPASS ADMIN/DOCENTE/RECEPCIONISTA: acceso directo sin modal
    if (esAdmin() || esDocente() || esRecepcionista()) {
      setEstado('PERMISO_PROACTIVO')
      return
    }
    // Solo estudiantes pasan por el flujo de supervisión
    const id = localStorage.getItem("user_id") || "4"
    setEstudianteId(id)
    const acceso = verificarAccesoModulo(id, modulo)
    setEstado(acceso)
  }, [modulo, esAdmin, esDocente, esRecepcionista])

  useEffect(() => {
    verificar()
    const handler = () => verificar()
    window.addEventListener('supervision-update', handler)
    // Polling cada 2s para "simular tiempo real" en la demo
    const interval = setInterval(verificar, 2000)
    return () => {
      window.removeEventListener('supervision-update', handler)
      clearInterval(interval)
    }
  }, [verificar])

  const handleClick = () => {
    // BYPASS: Admin/Docente/Recepcionista siempre ejecuta directamente
    if (esAdmin() || esDocente() || esRecepcionista()) {
      onAccionPermitida()
      return
    }

    if (estado === 'PERMISO_PROACTIVO' || estado === 'SOLICITUD_APROBADA') {
      // El docente ya dio permiso, ejecutar la acción directamente
      onAccionPermitida()
    } else if (estado === 'SOLICITUD_PENDIENTE') {
      // Ya hay una solicitud, mostrar modal de espera
      setShowModal(true)
    } else {
      // Bloqueado: mostrar modal para enviar solicitud
      setShowModal(true)
      setEnviado(false)
    }
  }

  const enviarSolicitud = () => {
    const nombreEstudiante = localStorage.getItem("user_name") || "Estudiante Actual"
    crearSolicitud({
      estudianteId,
      estudianteNombre: nombreEstudiante,
      pacienteId,
      pacienteNombre,
      modulo,
      accion: accionDescripcion,
    })
    setEnviado(true)
    verificar()
  }

  // Renderizado dinámico del botón según estado
  const renderBoton = () => {
    // BYPASS: Admin/Docente siempre ve el botón verde desbloqueado
    if (esAdmin() || esDocente() || esRecepcionista()) {
      return (
        <Button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          className={`bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-300 ring-offset-1 ${className}`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {children || accionLabel}
        </Button>
      )
    }

    if (estado === 'SOLICITUD_PENDIENTE') {
      return (
        <Button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}
        >
          <Clock className="w-4 h-4 mr-2 animate-pulse" />
          Esperando Aprobación...
        </Button>
      )
    }

    if (estado === 'PERMISO_PROACTIVO' || estado === 'SOLICITUD_APROBADA') {
      return (
        <Button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          className={`bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-300 ring-offset-1 ${className}`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {children || accionLabel}
        </Button>
      )
    }

    // BLOQUEADO — Solo para estudiantes
    return (
      <Button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={`bg-slate-400 hover:bg-slate-500 text-white relative ${className}`}
      >
        <ShieldAlert className="w-4 h-4 mr-2" />
        {children || accionLabel}
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
              <ShieldAlert className="w-5 h-5" />
              Acción Supervisada
            </DialogTitle>
          </DialogHeader>

          {estado === 'SOLICITUD_PENDIENTE' || enviado ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-amber-700 text-center">
                Solicitud Enviada al Docente Supervisor
              </h3>
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Tu solicitud para <strong>{accionDescripcion}</strong> ha sido registrada. El docente será notificado en su bandeja de supervisión.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 w-full text-center">
                <p className="font-semibold">Estado: ⏳ Esperando Aprobación</p>
                <p className="text-[10px] mt-1 text-amber-600">El botón se desbloqueará automáticamente cuando el docente apruebe.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 text-red-800 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>La acción <strong>"{accionDescripcion}"</strong> requiere autorización del Docente Supervisor antes de ser ejecutada.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Detalles de la solicitud:</p>
                <p className="text-xs text-slate-500">• Módulo: <strong>{modulo.replace('_', ' ')}</strong></p>
                <p className="text-xs text-slate-500">• Acción: <strong>{accionDescripcion}</strong></p>
                {pacienteNombre && <p className="text-xs text-slate-500">• Paciente: <strong>{pacienteNombre}</strong></p>}
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
