"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Gabinete {
  id: string
  nombre: string
  estado: string
}

interface Cita {
  id: string
  gabinete: string
  fecha_hora: string
  paciente: { nombres: string }
  estado: string
}

export function VistaCargaGabinetes() {
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const [silRes, citRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/sillones/', { headers }),
        fetch('http://127.0.0.1:8000/api/citas/?estado=EN_ESPERA,ATENDIENDO', { headers })
      ])

      if (silRes.ok) setGabinetes(await silRes.json() || [])
      if (citRes.ok) setCitas(await citRes.json() || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOcupacionGabinete = (gabineteId: string) => {
    return citas.filter(c => c.gabinete === gabineteId).length
  }

  const getEstadoBadge = (estado: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      'operativo': 'default',
      'revision': 'secondary',
      'falla': 'destructive'
    }
    return variants[estado] || 'default'
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Carga de Gabinetes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gabinetes.map(gabinete => {
          const ocupacion = getOcupacionGabinete(gabinete.id)
          const porcentaje = (ocupacion / 5) * 100
          
          return (
            <Card key={gabinete.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{gabinete.nombre}</CardTitle>
                  <Badge variant={getEstadoBadge(gabinete.estado)}>
                    {gabinete.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Ocupación</span>
                    <span>{ocupacion}/5 citas</span>
                  </div>
                  <Progress value={porcentaje} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
