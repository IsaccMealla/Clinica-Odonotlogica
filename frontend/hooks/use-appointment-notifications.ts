import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface AppointmentNotification {
  type: 'new_appointment' | 'appointment_cancelled' | 'patient_arrived'
  appointment_id: string
  patient_name: string
  patient_arrived_at?: string
  message: string
}

export function useAppointmentNotifications(onNewAppointment?: () => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 2

  const playNotificationSound = useCallback(() => {
    try {
      // Usar Web Audio API para crear un sonido
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch {
      // Silencio si falla
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/ws/appointments/`
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected para notificaciones')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data: AppointmentNotification = JSON.parse(event.data)
          
          if (data.type === 'new_appointment') {
            playNotificationSound()
            toast.success(`🆕 ${data.patient_name}`, {
              description: data.message,
              duration: 5000,
            })
            onNewAppointment?.()
          } else if (data.type === 'patient_arrived') {
            playNotificationSound()
            toast.info(`👋 ${data.patient_name}`, {
              description: data.message,
              duration: 4000,
            })
          }
        } catch {
          // Ignorar errores de parsing
        }
      }

      ws.onerror = () => {
        // WebSocket error - ignorar silenciosamente
      }

      ws.onclose = () => {
        wsRef.current = null
        
        // Reintentar solo una o dos veces
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 5000)
        }
      }

      wsRef.current = ws
    } catch {
      // Falló la conexión - no es crítico
    }
  }, [onNewAppointment, playNotificationSound])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    // Conectar de forma silenciosa
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return { connected: wsRef.current?.readyState === WebSocket.OPEN }
}

