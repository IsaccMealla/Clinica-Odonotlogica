"use client"

import { useState } from "react"
import { UploadCloud, FileImage, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSoundPlayer } from "@/hooks/useSoundPlayer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocenteAuthModal } from "@/components/seguridad/DocenteAuthModal"
import { PanelRadiografiasMetadata } from "@/components/metadatos/MetadatosPanel"

interface Props {
  pacienteId: string
  onUploadSuccess: () => void
}

export default function ImageUpload({ pacienteId, onUploadSuccess }: Props) {
  const { playSound } = useSoundPlayer()
  const [file, setFile] = useState<File | null>(null)
  const [categoria, setCategoria] = useState<string>("")
  const [pieza, setPieza] = useState<string>("")
  const [subiendo, setSubiendo] = useState(false)
  const [metaRadio, setMetaRadio] = useState({})

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
        playSound("exito")
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
    <div className="space-y-5">
      {/* Área de Drop/Select Archivo */}
      <div className="group">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:border-blue-400 hover:bg-blue-100/50 transition-all duration-300 relative cursor-pointer">
          {!file ? (
            <>
              <div className="mb-3 p-3 bg-blue-200/30 rounded-full">
                <UploadCloud className="w-8 h-8 text-blue-600" />
              </div>
              <Label htmlFor="file-upload" className="cursor-pointer space-y-1 text-center">
                <p className="text-sm font-semibold text-blue-900">Haz clic o arrastra</p>
                <p className="text-xs text-blue-700">una radiografía o imagen</p>
              </Label>
              <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,.dcm" />
            </>
          ) : (
            <div className="flex items-center gap-3 w-full bg-white p-3 rounded-lg border border-green-300 shadow-sm">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileImage className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium truncate flex-1 text-slate-700">{file.name}</span>
              <button onClick={() => setFile(null)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categoría Obligatoria */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tipo de Imagen <span className="text-red-500">*</span></Label>
        <Select onValueChange={setCategoria} value={categoria}>
          <SelectTrigger className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="📷 Seleccionar tipo de imagen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FACIAL">👤 Fotografía Facial</SelectItem>
            <SelectItem value="INTRAORAL">🦷 Fotografía Intraoral</SelectItem>
            <SelectItem value="PSP">📊 Radiografía (PSP)</SelectItem>
            <SelectItem value="CBCT">🔬 Captura CBCT 3D</SelectItem>
            <SelectItem value="PROCESO">📈 Seguimiento Proceso</SelectItem>
            <SelectItem value="FINAL">✅ Resultado Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pieza Dental (Opcional para fotos de diagnóstico) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pieza Dental <span className="text-slate-400">(Opcional)</span></Label>
        <Input 
          type="text" 
          placeholder="Ej: 11, 24, 38..." 
          className="h-10 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500"
          value={pieza ?? ""}
          onChange={(e) => setPieza(e.target.value)}
        />
      </div>

      {categoria === "PSP" || categoria === "CBCT" ? (
        <PanelRadiografiasMetadata metadatos={metaRadio} setMetadatos={setMetaRadio} />
      ) : null}

      <DocenteAuthModal
        accion="Anexar Radiografía al Expediente"
        disabled={subiendo || !file || !categoria}
        onAprobado={(auditoria) => {
          handleUpload();
        }}
      >
        <Button
          type="button"
          disabled={subiendo || !file || !categoria}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-11 shadow-md font-semibold pointer-events-none"
        >
          {subiendo ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 mr-2" />
              Vincular al Expediente
            </>
          )}
        </Button>
      </DocenteAuthModal>
    </div>
  )
}