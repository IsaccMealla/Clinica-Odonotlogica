"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DentalChairSelector3D } from "@/components/DentalChairSelector3D"
import { GabineteSelector3D } from "@/components/GabineteSelector3D"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"

interface DentalChair {
  id: string
  name: string
  gabinete?: { id: string; nombre: string }
  is_busy: boolean
}

interface Gabinete {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  capacidad: number
  is_busy: boolean
}

export function Resources3DViewer() {
  const [chairs, setChairs] = useState<DentalChair[]>([])
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([])

  const chairsQuery = useQuery({
    queryKey: ["chairs"],
    queryFn: () => fetch(`${API_BASE}/chairs/`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const gabineteQuery = useQuery({
    queryKey: ["gabinetes"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/ninja/gabinetes/`)
        if (!res.ok) throw new Error('Failed to fetch gabinetes')
        const data = await res.json()
        console.log('Raw gabinete API response:', data, typeof data)
        return data
      } catch (err) {
        console.error('Error fetching gabinetes:', err)
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (chairsQuery.data) {
      const chairsList = chairsQuery.data.results || chairsQuery.data || []
      setChairs(Array.isArray(chairsList) ? chairsList : [])
    }
  }, [chairsQuery.data])

  useEffect(() => {
    if (gabineteQuery.data) {
      console.log('Processing gabinete data:', gabineteQuery.data)
      
      let gabList: any[] = []
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(gabineteQuery.data)) {
        gabList = gabineteQuery.data
      } else if (gabineteQuery.data.results && Array.isArray(gabineteQuery.data.results)) {
        gabList = gabineteQuery.data.results
      } else if (typeof gabineteQuery.data === 'object') {
        // Si es un objeto individual, convertir a array
        gabList = [gabineteQuery.data]
      }
      
      console.log('Gabinete list after processing:', gabList)
      
      // Mapear y añadir is_busy
      const gabinertesWithStatus = gabList.map((gab: any) => {
        const is_busy = gab.is_busy !== undefined ? gab.is_busy : gab.estado === 'ocupado'
        return {
          id: gab.id || gab.uuid || Math.random().toString(),
          nombre: gab.nombre || 'Sin nombre',
          descripcion: gab.descripcion || '',
          estado: gab.estado || 'disponible',
          capacidad: gab.capacidad || 1,
          is_busy
        }
      })
      
      console.log('Final gabinetes with status:', gabinertesWithStatus)
      setGabinetes(gabinertesWithStatus)
    }
  }, [gabineteQuery.data])

  if (chairsQuery.isLoading || gabineteQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando recursos 3D...</p>
      </div>
    )
  }

  if (chairsQuery.isError || gabineteQuery.isError) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <p className="text-red-500">Error cargando recursos</p>
        {chairsQuery.isError && <p className="text-xs text-red-400">Error en sillas</p>}
        {gabineteQuery.isError && <p className="text-xs text-red-400">Error en gabinetes: {gabineteQuery.error?.message}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Sillas Dentales 3D */}
      <Card>
        <CardHeader>
          <CardTitle>Sillas Dentales (3D)</CardTitle>
          <CardDescription>
            {chairs.length} sillas disponibles - Rota para ver todos los ángulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chairs.length > 0 ? (
            <DentalChairSelector3D
              chairs={chairs}
              onSelect={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <p className="text-muted-foreground">No hay sillas disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gabinetes 3D */}
      <Card>
        <CardHeader>
          <CardTitle>Gabinetes Dentales (3D)</CardTitle>
          <CardDescription>
            {gabinetes.length} gabinetes disponibles - Rota para ver todos los ángulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gabinetes.length > 0 ? (
            <GabineteSelector3D
              gabinetes={gabinetes}
              onSelect={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <p className="text-muted-foreground">No hay gabinetes disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
