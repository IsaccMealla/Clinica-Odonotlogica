"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  ReactCompareSlider, 
  ReactCompareSliderImage 
} from 'react-compare-slider'
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Columns, 
  FileCode2 
} from "lucide-react"
import DicomViewer from "./DicomViewer"

interface Props {
  imagenes: any[] // Lista de imágenes del paciente (IUP)
}

export default function VisorRadiologico({ imagenes }: { imagenes: any[] }) {
  const [index, setIndex] = useState(0)
  const [imgPre, setImgPre] = useState<string | null>(null)
  const [imgPost, setImgPost] = useState<string | null>(null)

  const siguiente = () => setIndex((prev) => (prev + 1) % imagenes.length)
  const anterior = () => setIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)

  return (
    <Card className="w-full shadow-xl border-slate-200">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-primary" /> 
          Centro de Diagnóstico por Imagen
        </CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="carrusel" className="p-4">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="carrusel" className="gap-2">
            <ChevronRight className="w-4 h-4" /> Carrusel
          </TabsTrigger>
          <TabsTrigger value="comparar" className="gap-2">
            <Columns className="w-4 h-4" /> Antes y Después
          </TabsTrigger>
          <TabsTrigger value="dicom" className="gap-2">
            <FileCode2 className="w-4 h-4" /> Vista DICOM (PSP)
          </TabsTrigger>
        </TabsList>

        {/* --- VISTA 1: CARRUSEL --- */}
        <TabsContent value="carrusel" className="relative group">
          <div className="flex flex-col items-center bg-black rounded-xl overflow-hidden min-h-[500px] justify-center">
            {imagenes.length > 0 ? (
              <>
                <img 
                  src={imagenes[index].archivo} 
                  className="max-h-[500px] object-contain transition-all duration-500"
                  alt="Radiografía/Foto"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-3 rounded-lg backdrop-blur-sm text-white">
                  <p className="font-bold">{imagenes[index].categoria}</p>
                  <p className="text-xs opacity-80">Fecha: {new Date(imagenes[index].fecha_adquisicion).toLocaleDateString()}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500">No hay imágenes cargadas para este paciente.</p>
            )}
            
            <Button 
              variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={anterior}
            >
              <ChevronLeft />
            </Button>
            <Button 
              variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={siguiente}
            >
              <ChevronRight />
            </Button>
          </div>
        </TabsContent>

        {/* --- VISTA 2: COMPARACIÓN ANTES Y DESPUÉS --- */}
        <TabsContent value="comparar" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="space-y-2">
              <label className="font-semibold">Imagen Inicial (Pre):</label>
              <select className="w-full border p-2 rounded" onChange={(e) => setImgPre(e.target.value)}>
                <option value="">Seleccionar...</option>
                {imagenes.map(img => <option key={img.id} value={img.archivo}>{img.categoria} - {img.fecha_adquisicion}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-semibold">Imagen Final (Post):</label>
              <select className="w-full border p-2 rounded" onChange={(e) => setImgPost(e.target.value)}>
                <option value="">Seleccionar...</option>
                {imagenes.map(img => <option key={img.id} value={img.archivo}>{img.categoria} - {img.fecha_adquisicion}</option>)}
              </select>
            </div>
          </div>

          {imgPre && imgPost ? (
            <div className="border-4 border-slate-100 rounded-xl overflow-hidden shadow-inner">
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={imgPre} />}
                itemTwo={<ReactCompareSliderImage src={imgPost} />}
                style={{ height: '500px', width: '100%' }}
              />
            </div>
          ) : (
            <div className="h-[400px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 italic">
              Selecciona dos imágenes para comparar el progreso clínico.
            </div>
          )}
        </TabsContent>

        {/* --- VISTA 3: DICOM VIEWER --- */}
        <TabsContent value="dicom" className="bg-black rounded-xl h-[600px] border-4 border-slate-900 overflow-hidden">
          {imagenes.length > 0 ? (
            <DicomViewer 
              imageIds={imagenes.map(img => img.archivo)} 
              patientName={imagenes[0]?.paciente_nombre || "Paciente Anónimo"}
              enableSync={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <FileCode2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-bold">Visor DICOM Profesional</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  No hay imágenes cargadas para este paciente.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}