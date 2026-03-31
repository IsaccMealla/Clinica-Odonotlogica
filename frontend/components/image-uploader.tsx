"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function ImageUploader({ onUpload }: { onUpload?: () => void }) {
  const [patients, setPatients] = useState<{ id: string; nombres: string; apellido_paterno: string }[]>([])
  const [patientId, setPatientId] = useState("")
  const [imageType, setImageType] = useState("xray")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetch("http://localhost:8000/api/pacientes/?page=1")
      .then(res => res.ok ? res.json() : Promise.resolve([]))
      .then((data) => setPatients(data))
      .catch(() => toast.error("No se pudieron cargar los pacientes"))
  }, [])

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    if (!event.dataTransfer.files.length) return
    setFile(event.dataTransfer.files[0])
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!patientId || !file) {
      toast.error("Selecciona paciente y archivo")
      return
    }

    const form = new FormData()
    form.append('patient', patientId)
    form.append('file', file)
    form.append('image_type', imageType)
    form.append('description', description)

    const res = await fetch("http://localhost:8000/api/images/", { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.text()
      toast.error("Error subiendo imagen")
      console.error(err)
      return
    }

    toast.success("Imagen subida con éxito")
    setFile(null)
    setDescription("")
    onUpload?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4 shadow-sm bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Paciente</Label>
          <Select value={patientId} onValueChange={(v) => setPatientId(v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nombres} {p.apellido_paterno}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Imagen</Label>
          <Select value={imageType} onValueChange={(v) => setImageType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dicom">DICOM</SelectItem>
              <SelectItem value="xray">X-ray</SelectItem>
              <SelectItem value="intraoral_photo">Intraoral Photo</SelectItem>
              <SelectItem value="extraoral_photo">Extraoral Photo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas sobre la imagen" />
        </div>

        <div>
          <Label>Archivo</Label>
          <div
            className={`rounded-lg border p-4 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true)}}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false)}}
            onDrop={onDrop}
          >
            <p>{file ? file.name : 'Arrastra y suelta el archivo aquí, o selecciona uno'}</p>
            <Input type="file" accept=".dcm,image/png,image/jpeg,video/mp4,video/webm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2" />
          </div>
          <Button type="button" variant="secondary" onClick={() => { setImageType('xray'); toast.success('PSP mode: imagen X-ray seleccionada') }} className="mt-2">Importar PSP Image</Button>
        </div>
      </div>

      <Button type="submit">Subir imagen</Button>
    </form>
  )
}
