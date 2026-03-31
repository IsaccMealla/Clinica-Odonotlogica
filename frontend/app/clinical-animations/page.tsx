"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ClinicalAnimationsPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      const query = new URLSearchParams()
      if (filter) query.set('category', filter)
      const res = await fetch(`http://localhost:8000/api/clinical-animations/?${query.toString()}`)
      if (!res.ok) throw new Error('Error fetch')
      const data: Array<{id:string;title:string;description?:string;video_url:string;category:string;created_at:string}> = await res.json()
      setVideos(data)
    } catch (err) {
      toast.error('No se pudieron cargar animaciones')
    }
  }

  useEffect(() => { fetchData() }, [filter])

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const filtered = videos.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Animaciones Clínicas</h1>
        <p className="text-muted-foreground">Mira y filtra videos de tratamientos para explicar a los pacientes.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar por título/descripción" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={filter} onValueChange={(v) => setFilter(v)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="implant">Implante</SelectItem>
            <SelectItem value="orthodontics">Ortodoncia</SelectItem>
            <SelectItem value="cleaning">Limpieza</SelectItem>
            <SelectItem value="extraction">Extracción</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchData}>Recargar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((video) => (
          <div key={video.id} className="rounded-lg border bg-white shadow-sm p-4">
            <h2 className="font-semibold">{video.title}</h2>
            <p className="text-xs text-muted-foreground mb-2">{video.category}</p>
            <p className="text-sm text-muted-foreground mb-3">{video.description || 'Sin descripción'}</p>
            <video controls className="w-full max-h-60">
              <source src={video.video_url} type="video/mp4" />
              <source src={video.video_url} type="video/webm" />
              Tu navegador no soporta video HTML5.
            </video>
          </div>
        ))}
      </div>
    </div>
  )
}
