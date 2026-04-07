"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api"
const queryClient = new QueryClient()

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

function RecursosContent() {
  const [chairs, setChairs] = useState<DentalChair[]>([])
  const [gabinetes, setGabinetes] = useState<Gabinete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecursos = async () => {
      try {
        setLoading(true)
        const [chairsRes, gabineteRes] = await Promise.all([
          fetch(`${API_BASE}/chairs/`),
          fetch(`${API_BASE}/ninja/gabinetes/`)
        ])

        if (chairsRes.ok) {
          const data = await chairsRes.json()
          const chairsList = data.results || data || []
          setChairs(Array.isArray(chairsList) ? chairsList : [])
          console.log('Chairs loaded:', chairsList)
        }

        if (gabineteRes.ok) {
          const data = await gabineteRes.json()
          console.log('Raw gabinete data from /api/ninja/gabinetes/:', data)
          // Django Ninja retorna un array directamente
          const gabList = Array.isArray(data) ? data : (data.results || data || [])
          console.log('Processed gabinete list:', gabList)
          setGabinetes(gabList)
        }
      } catch (err) {
        console.error(err)
        toast.error("Error cargando recursos")
      } finally {
        setLoading(false)
      }
    }

    loadRecursos()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Cargando recursos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Sillas Dentales */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Sillas Dentales</h2>
          <p className="text-muted-foreground">Total: {chairs.length} sillas disponibles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {chairs.map((chair) => (
            <Card
              key={chair.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                chair.is_busy ? "opacity-60 bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{chair.name}</CardTitle>
                    {chair.gabinete && (
                      <CardDescription className="text-sm mt-1">{chair.gabinete.nombre}</CardDescription>
                    )}
                  </div>
                  <Badge variant={chair.is_busy ? "destructive" : "default"}>
                    {chair.is_busy ? "OCUPADA" : "LIBRE"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">ID:</span> {chair.id.slice(0, 8)}...
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={chair.is_busy}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {chairs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay sillas disponibles</p>
          </div>
        )}
      </div>

      {/* Gabinetes */}
      <div className="border-t pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Gabinetes Dentales</h2>
          <p className="text-muted-foreground">Total: {gabinetes.length} gabinetes disponibles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gabinetes.map((gab) => (
            <Card
              key={gab.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                gab.is_busy ? "opacity-60 bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{gab.nombre}</CardTitle>
                    {gab.descripcion && (
                      <CardDescription className="text-sm mt-1">{gab.descripcion}</CardDescription>
                    )}
                  </div>
                  <Badge variant={gab.is_busy ? "destructive" : "secondary"}>
                    {gab.is_busy ? "OCUPADO" : "LIBRE"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground">CAPACIDAD</span>
                      <p className="text-lg font-bold">{gab.capacidad}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground">ESTADO</span>
                      <p className="text-sm capitalize">{gab.estado}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={gab.is_busy}
                  >
                    Asignar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {gabinetes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay gabinetes disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RecursosPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recursos</h1>
          <p className="text-muted-foreground mt-2">Administra sillas dentales y gabinetes disponibles</p>
        </div>

        <RecursosContent />
      </div>
    </QueryClientProvider>
  )
}
