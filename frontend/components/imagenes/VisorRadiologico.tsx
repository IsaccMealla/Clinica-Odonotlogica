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
  FileCode2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  History,
  Brain
} from "lucide-react"
import DicomViewer from "./DicomViewer"
import HistorialAuditoriaTabla from "./HistorialAuditoriaTabla"
import AnalizadorRadiografia from "./AnalizadorRadiografia"

interface Props {
  imagenes: any[]
  pacienteId: string
}

export default function VisorRadiologico({ imagenes, pacienteId }: Props) {
  const [index, setIndex] = useState(0)
  const [imgPre, setImgPre] = useState<string | null>(null)
  const [imgPost, setImgPost] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [viewMode, setViewMode] = useState<'carrusel' | 'grid' | 'timeline'>('carrusel')

  const siguiente = () => setIndex((prev) => (prev + 1) % imagenes.length)
  const anterior = () => setIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  const zoomIn = () => setZoom((z) => Math.min(z + 10, 200))
  const zoomOut = () => setZoom((z) => Math.max(z - 10, 50))
  const rotateImage = () => setRotation((r) => (r + 90) % 360)

  const sortedImages = [...imagenes].sort((a, b) => 
    new Date(a.fecha_adquisicion).getTime() - new Date(b.fecha_adquisicion).getTime()
  )

  return (
    <Card className="w-full shadow-xl border-slate-200">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-primary" /> 
          Centro de Diagnóstico por Imagen
        </CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="carrusel" className="p-4">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="carrusel" className="gap-2">
            <ChevronRight className="w-4 h-4" /> Carrusel
          </TabsTrigger>
          <TabsTrigger value="comparar" className="gap-2">
            <Columns className="w-4 h-4" /> Antes y Después
          </TabsTrigger>
          <TabsTrigger value="analizar" className="gap-2">
            <Brain className="w-4 h-4" /> Análisis IA
          </TabsTrigger>
          <TabsTrigger value="dicom" className="gap-2">
            <FileCode2 className="w-4 h-4" /> Vista DICOM (PSP)
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <FileCode2 className="w-4 h-4" /> Auditoría
          </TabsTrigger>
        </TabsList>

        {/* --- VISTA 1: CARRUSEL CON MODOS --- */}
        <TabsContent value="carrusel" className="space-y-4">
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={viewMode === 'carrusel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('carrusel')}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" /> Carrusel
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Grid className="w-4 h-4" /> Galería
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="gap-2"
            >
              <History className="w-4 h-4" /> Línea de Tiempo
            </Button>
          </div>

          {viewMode === 'carrusel' && (
            <div className="space-y-4">
              <div className="flex gap-2 bg-slate-100 p-2 rounded-lg flex-wrap">
                <Button size="sm" variant="secondary" onClick={zoomOut} className="gap-1">
                  <ZoomOut className="w-4 h-4" /> {zoom}%
                </Button>
                <Button size="sm" variant="secondary" onClick={zoomIn} className="gap-1">
                  <ZoomIn className="w-4 h-4" /> Zoom +
                </Button>
                <Button size="sm" variant="secondary" onClick={rotateImage} className="gap-1">
                  <RotateCw className="w-4 h-4" /> {rotation}°
                </Button>
              </div>

              <div className="flex flex-col items-center bg-black rounded-xl overflow-hidden min-h-[500px] justify-center group relative">
                {imagenes.length > 0 ? (
                  <>
                    <img 
                      src={imagenes[index].archivo} 
                      className="object-contain transition-all duration-300"
                      style={{
                        maxHeight: '500px',
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                      }}
                      alt="Radiografía/Foto"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-3 rounded-lg backdrop-blur-sm text-white">
                      <p className="font-bold">{imagenes[index].categoria}</p>
                      <p className="text-xs opacity-80">Imagen {index + 1} de {imagenes.length} | Fecha: {new Date(imagenes[index].fecha_adquisicion).toLocaleDateString()}</p>
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
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {imagenes.map((img, idx) => (
                  <div
                    key={img.id}
                    onDoubleClick={() => setViewMode('carrusel')}
                    onClick={() => setIndex(idx)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      index === idx ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <img src={img.archivo} className="w-full h-24 object-cover hover:scale-110 transition-transform" alt={img.categoria} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <span className="text-xs text-white font-semibold">{img.categoria}</span>
                      <span className="text-xs text-gray-300 mt-1">Doble click para ampliar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 overflow-hidden">
              <style>{`
                @keyframes slideIn {
                  from {
                    opacity: 0;
                    transform: translateX(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                @keyframes pulse-ring {
                  0% {
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                  }
                  70% {
                    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                  }
                  100% {
                    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
                  }
                }
                @keyframes float-up {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(-8px);
                  }
                }
                .timeline-item {
                  animation: slideIn 0.5s ease-out forwards;
                }
                .timeline-item:nth-child(n) {
                  animation-delay: calc(0.05s * var(--index));
                }
                .timeline-selected {
                  animation: pulse-ring 2s infinite;
                }
                .timeline-thumb-hover {
                  animation: float-up 2s ease-in-out infinite;
                }
              `}</style>
              <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" style={{
                scrollBehavior: 'smooth'
              }}>
                {sortedImages.map((img, idx) => {
                  const isSelected = imagenes[index]?.id === img.id
                  return (
                    <div
                      key={img.id}
                      onClick={() => setIndex(imagenes.findIndex(i => i.id === img.id))}
                      className="flex-shrink-0 snap-start group timeline-item"
                      style={{ '--index': idx } as React.CSSProperties}
                    >
                      <div className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 scale-110 z-10 shadow-2xl shadow-blue-500/50 timeline-selected' 
                          : 'hover:scale-125 z-0 group-hover:timeline-thumb-hover'
                      }`}
                      style={{
                        width: isSelected ? '160px' : '120px',
                        height: isSelected ? '160px' : '120px'
                      }}
                      >
                        <img 
                          src={img.archivo} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                          alt={img.categoria} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-2">
                          <span className="text-xs text-white font-semibold text-center px-2">{img.categoria}</span>
                          <span className="text-xs text-gray-300 mt-1">{new Date(img.fecha_adquisicion).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center text-xs text-slate-400 italic flex items-center justify-center gap-2">
                <span>← Desliza horizontalmente →</span>
                <span className="text-slate-500">•</span>
                <span>Hover para ampliar</span>
                <span className="text-slate-500">•</span>
                <span>Click para seleccionar</span>
              </div>
            </div>
          )}
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

        {/* --- VISTA 3: ANÁLISIS CON IA --- */}
        <TabsContent value="analizar" className="space-y-4">
          {imagenes.length > 0 ? (
            <AnalizadorRadiografia 
              radiografiaId={imagenes[index]?.id || ''} 
              pacienteId={pacienteId}
            />
          ) : (
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-8 text-center text-slate-600">
                No hay imágenes cargadas para analizar.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --- VISTA 4: DICOM VIEWER --- */}
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

        <TabsContent value="auditoria" className="space-y-4">
          <HistorialAuditoriaTabla pacienteId={pacienteId} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}