"use client"

import { useEffect, useState } from "react"
import { ImageCard } from "@/components/image-card"
import { ImageUploader } from "@/components/image-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type ImageEntity = {
  id: string
  file_url: string
  image_type: string
  description?: string
  uploaded_at: string
  patient: { id: string }
}

export function PatientImageGallery() {
  const [images, setImages] = useState<ImageEntity[]>([])
  const [patientId, setPatientId] = useState("all")
  const [category, setCategory] = useState("all")
  const [patients, setPatients] = useState<{ id: string; nombres: string; apellido_paterno: string }[]>([])

  const fetchImages = async () => {
    try {
      const qs = new URLSearchParams()
      if (patientId && patientId !== 'all') qs.set('patient', patientId)
      if (category && category !== 'all') qs.set('image_type', category)
      const res = await fetch(`http://localhost:8000/api/images/?${qs.toString()}`)
      if (!res.ok) throw new Error('cannot fetch images')
      const data = await res.json()
      setImages(data)
    } catch (e) {
      toast.error('No se pudieron cargar imágenes')
    }
  }

  useEffect(() => {
    fetch("http://localhost:8000/api/pacientes/?page=1")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPatients(data))
      .catch(() => toast.error('No se pudieron cargar pacientes'))

    fetchImages()
  }, [])

  return (
    <div className="space-y-6">
      <ImageUploader onUpload={fetchImages} />

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={patientId} onValueChange={(v) => setPatientId(v)}>
            <SelectTrigger><SelectValue placeholder="Filtrar por paciente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombres} {p.apellido_paterno}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(v) => setCategory(v)}>
            <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="dicom">DICOM</SelectItem>
              <SelectItem value="xray">X-ray</SelectItem>
              <SelectItem value="intraoral_photo">Intraoral</SelectItem>
              <SelectItem value="extraoral_photo">Extraoral</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchImages}>Aplicar filtros</Button>
        </div>

        {images.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No hay imágenes. Agrega una arriba.</div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {images.map((img) => (
              <ImageCard key={img.id} {...img} onDeleted={fetchImages} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
