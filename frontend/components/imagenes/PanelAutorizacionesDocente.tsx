"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { AlertCircle, CheckCircle, Clock, MessageSquare, X, Volume2 } from "lucide-react"

const API_URL = 'http://localhost:8000/api'

type Autorizacion = {
  id: string
  estudiante: { id: string; username: string } | string
  estudiante_nombre?: string
  paciente: { id: string; nombre: string } | string
  paciente_nombre?: string
  estado: string
  fecha_solicitud: string
  mensaje_rechazo?: string
  expiracion?: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export default function PanelAutorizacionesDocente() {
  const [items, setItems] = useState<Autorizacion[]>([])
  const [duration, setDuration] = useState(60)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==')
    }
    audioRef.current.play().catch(() => {})
  }, [])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', withSound = false) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    if (withSound) playNotificationSound()
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [playNotificationSound])

  const fetchList = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/autorizaciones-docente/?estado=PENDIENTE`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const results = Array.isArray(data) ? data : data.results || []
        const newItems = results.filter((r: any) => !items.find((i) => i.id === r.id))
        if (newItems.length > 0) {
          setItems(results)
          showToast(`🔔 ${newItems.length} nuevas solicitudes de autorización`, 'info', true)
        } else if (results.length > 0) {
          setItems(results)
        }
      }
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'error')
    }
  }, [items, showToast])

  useEffect(() => {
    fetchList()
    pollIntervalRef.current = setInterval(fetchList, 5000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchList])

  const aprobarIndividual = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/autorizaciones-docente/${id}/aprobar_individual/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration_minutes: duration }),
      })
      if (response.ok) {
        showToast('✅ Solicitud aprobada correctamente', 'success')
        await fetchList()
      } else {
        showToast('❌ No se pudo aprobar la solicitud', 'error')
      }
    } catch (error) {
      showToast(`❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'error')
    }
  }

  const rechazarSolicitud = async (id: string) => {
    if (!rejectMessage.trim()) {
      showToast('Ingresa un motivo de rechazo', 'warning')
      return
    }
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/autorizaciones-docente/${id}/rechazar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensaje_rechazo: rejectMessage }),
      })
      if (response.ok) {
        showToast('✅ Solicitud rechazada', 'success')
        setRejectingId(null)
        setRejectMessage('')
        await fetchList()
      } else {
        showToast('❌ Error al rechazar', 'error')
      }
    } catch (error) {
      showToast(`❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'error')
    }
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const bgColor = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-amber-500',
          }[toast.type]
          const Icon = {
            success: CheckCircle,
            error: AlertCircle,
            info: AlertCircle,
            warning: AlertCircle,
          }[toast.type]
          return (
            <div key={toast.id} className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300`}>
              <Icon className="w-5 h-5" />
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Panel de Autorizaciones</h3>
          <p className="text-sm text-slate-500">Aprobación o rechazo de solicitudes de envío de radiografías.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>Duración (min)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded border border-slate-300 px-2 py-1"
            />
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400 italic">
          No hay solicitudes pendientes de aprobación.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-lg">
                    {item.estudiante_nombre || (typeof item.estudiante === 'string' ? item.estudiante : item.estudiante.username)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Paciente: <span className="font-semibold">{item.paciente_nombre || (typeof item.paciente === 'string' ? item.paciente : item.paciente.nombre)}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Solicitado: {new Date(item.fecha_solicitud).toLocaleString()}
                  </p>
                </div>

                {rejectingId === item.id ? (
                  <div className="flex-1 md:flex-none space-y-2">
                    <input
                      type="text"
                      placeholder="Motivo del rechazo..."
                      value={rejectMessage}
                      onChange={(e) => setRejectMessage(e.target.value)}
                      className="w-full border border-red-300 rounded px-3 py-2 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => rechazarSolicitud(item.id)}
                        className="flex-1 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        Confirmar Rechazo
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null)
                          setRejectMessage('')
                        }}
                        className="rounded bg-slate-300 px-3 py-2 text-sm hover:bg-slate-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => aprobarIndividual(item.id)}
                      className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => setRejectingId(item.id)}
                      className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
