"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface ConfiguracionAlertas {
  id: number
  minutos_espera_alerta: number
  inasistencias_alerta_abandono: number
  dias_notificacion_previa: number
  activa: boolean
}

export function ConfiguracionAlertasComponent() {
  const [config, setConfig] = useState<ConfiguracionAlertas | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/configuracion-alertas/', { headers })
      if (response.ok) {
        const data = await response.json()
        setConfig(Array.isArray(data) ? data[0] : data)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/configuracion-alertas/${config.id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (!config) return <div>No hay configuración disponible</div>

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Configuración de Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="minutos">Minutos de Espera antes de Alerta Roja</Label>
          <Input
            id="minutos"
            type="number"
            min="5"
            step="5"
            value={config.minutos_espera_alerta}
            onChange={(e) => setConfig({...config, minutos_espera_alerta: parseInt(e.target.value)})}
          />
          <p className="text-sm text-gray-500">
            Si un paciente espera más de este tiempo, se genera una alerta roja
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inasistencias">Inasistencias para Alerta de Abandono</Label>
          <Input
            id="inasistencias"
            type="number"
            min="1"
            max="10"
            value={config.inasistencias_alerta_abandono}
            onChange={(e) => setConfig({...config, inasistencias_alerta_abandono: parseInt(e.target.value)})}
          />
          <p className="text-sm text-gray-500">
            Número de no asistencias que activan el protocolo de abandono
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dias">Días de Notificación Previa</Label>
          <Input
            id="dias"
            type="number"
            min="1"
            max="7"
            value={config.dias_notificacion_previa}
            onChange={(e) => setConfig({...config, dias_notificacion_previa: parseInt(e.target.value)})}
          />
          <p className="text-sm text-gray-500">
            Días antes de la cita para enviar notificación al paciente
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-green-100 text-green-700 rounded">
            Configuración guardada exitosamente
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  )
}
