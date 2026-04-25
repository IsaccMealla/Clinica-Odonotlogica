"use client"

import { useState } from "react"
import { UploadCloud, FileImage, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  pacienteId: string
  onUploadSuccess: () => void
}

export default function ImageUpload({ pacienteId, onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [categoria, setCategoria] = useState<string>("")
  const [pieza, setPieza] = useState<string>("")
  const [subiendo, setSubiendo] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !categoria) {
      alert("Por favor selecciona un archivo y una categoría")
      return
    }

    setSubiendo(true)
    const formData = new FormData()
    formData.append("archivo", file)
    formData.append("categoria", categoria)
    formData.append("paciente", pacienteId)
    formData.append("tipo_evidencia", categoria); // Usamos la categoría como tipo
    formData.append("avance", "1"); // O el ID del avance clínico relacionado
    if (pieza) formData.append("pieza_dental", pieza)

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch("http://localhost:8000/api/imagenes/", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        setFile(null)
        setCategoria("")
        setPieza("")
        onUploadSuccess() // Refresca el visor automáticamente
      } else {
        const errorTexto = await res.text();
      try {
        const errorJson = JSON.parse(errorTexto);
        console.error("Errores de validación:", errorJson);
      } catch (e) {
        console.error("Error del servidor (HTML):", errorTexto);
      }
      alert("Error al guardar. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error de red:", error)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de Drop/Select Archivo */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors relative">
        {!file ? (
          <>
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <Label htmlFor="file-upload" className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
              Seleccionar archivo
            </Label>
            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,.dcm" />
          </>
        ) : (
          <div className="flex items-center gap-2 w-full bg-white p-2 rounded border">
            <FileImage className="w-5 h-5 text-blue-500" />
            <span className="text-xs truncate flex-1">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Categoría Obligatoria */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold text-slate-500">Tipo de Imagen *</Label>
        <Select onValueChange={setCategoria} value={categoria}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FACIAL">Fotografía Facial</SelectItem>
            <SelectItem value="INTRAORAL">Fotografía Intraoral</SelectItem>
            <SelectItem value="PSP">Radiografía (PSP)</SelectItem>
            <SelectItem value="CBCT">Captura CBCT</SelectItem>
            <SelectItem value="PROCESO">Seguimiento Proceso</SelectItem>
            <SelectItem value="FINAL">Resultado Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pieza Dental (Opcional para fotos de diagnóstico) */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold text-slate-500">Pieza Dental (Opcional)</Label>
        <Input 
          type="number" 
          placeholder="Ej: 11, 24, 38..." 
          className="h-9"
          value={pieza}
          onChange={(e) => setPieza(e.target.value)}
        />
      </div>

      <Button 
        onClick={handleUpload} 
        disabled={subiendo || !file || !categoria}
        className="w-full bg-blue-600 hover:bg-blue-700 h-10 shadow-sm"
      >
        {subiendo ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
        ) : (
          "Vincular al Expediente"
        )}
      </Button>
    </div>
  )
}