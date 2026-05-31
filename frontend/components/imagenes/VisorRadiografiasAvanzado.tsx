"use client"

import { useState, useEffect } from "react"
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
  ImageIcon,
  History,
  Zap,
  X,
  ChevronDown
} from "lucide-react"
import DicomViewer from "./DicomViewer"
import EditorDiagnosticos from "./EditorDiagnosticos"
import { loadMe } from '@/lib/permissions'

interface Diagnosis {
  id: string
  type: 'circle' | 'rectangle' | 'line' | 'freehand'
  color: string
  label: string
  points: { x: number; y: number }[]
  timestamp: string
}

interface ViewMode {
  id: 'galeria' | 'comparar' | 'album' | 'timeline'
  nombre: string
  icon: React.ReactNode
}

interface Props {
  imagenes: any[]
}

const VIEW_MODES: ViewMode[] = [
  { id: 'galeria', nombre: 'Galería', icon: <ChevronRight className="w-4 h-4" /> },
  { id: 'comparar', nombre: 'Antes y Después', icon: <Columns className="w-4 h-4" /> },
  { id: 'album', nombre: 'Álbum', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'timeline', nombre: 'Línea de Tiempo', icon: <History className="w-4 h-4" /> },
]

export default function VisorRadiografiasAvanzado({ imagenes }: Props) {
  const [index, setIndex] = useState(0)
  const [imagenesState, setImagenesState] = useState<any[]>(imagenes || [])
  const [viewMode, setViewMode] = useState<ViewMode['id']>('galeria')
  const [autoPlay, setAutoPlay] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0)
  const [fullscreenScale, setFullscreenScale] = useState(1)
  const [fullscreenPan, setFullscreenPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [diagnosticosPorImagen, setDiagnosticosPorImagen] = useState<Record<string, Diagnosis[]>>({})
  const [snapshots, setSnapshots] = useState<Record<string, string>>({})
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [compareIndex1, setCompareIndex1] = useState(0)
  const [compareIndex2, setCompareIndex2] = useState(0)

  useEffect(() => {
    setImagenesState(imagenes || [])
    if (imagenes && imagenes.length >= 2) {
      setCompareIndex2(imagenes.length - 1)
    }
  }, [imagenes])

  useEffect(() => {
    loadMe().catch(() => {})
  }, [])

  useEffect(() => {
    if (!autoPlay || imagenesState.length <= 1 || viewMode !== 'galeria') return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % imagenesState.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [autoPlay, imagenesState.length, viewMode])

  const siguiente = () => setIndex((prev) => (prev + 1) % Math.max(1, imagenesState.length))
  const anterior = () => setIndex((prev) => (prev - 1 + Math.max(1, imagenesState.length)) % Math.max(1, imagenesState.length))
  const handleDoubleClick = () => { 
    setFullscreen(true); 
    setFullscreenImageIndex(index);
    setFullscreenScale(1);
    setFullscreenPan({ x: 0, y: 0 });
  }
  
  const handleSaveDiagnosticos = (diagnosticos: Diagnosis[], snapshotDataUrl?: string) => {
    const imagenId = imagenesState[index]?.id.toString()
    if (imagenId) {
      setDiagnosticosPorImagen(prev => ({ ...prev, [imagenId]: diagnosticos }))
      if (snapshotDataUrl) {
        setSnapshots(prev => ({ ...prev, [imagenId]: snapshotDataUrl }))
      }
    }
  }
  const currentDiagnosticos = diagnosticosPorImagen[imagenesState[index]?.id?.toString()] || []

  // Zoom y Paneo para Pantalla Completa
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.005;
    setFullscreenScale(prev => Math.max(1, Math.min(prev + delta, 15)));
  }

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true)
    setPanStart({ x: e.clientX - fullscreenPan.x, y: e.clientY - fullscreenPan.y })
  }
  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setFullscreenPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }
  const handlePanEnd = () => setIsPanning(false)

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="visor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-white border shadow-md rounded-xl p-1">
          <TabsTrigger value="visor" className="text-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300">
            <Maximize2 className="h-4 w-4 mr-2" /> Visor Estándar
          </TabsTrigger>
          <TabsTrigger value="dicom" className="text-md data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-md transition-all duration-300">
            <Zap className="h-4 w-4 mr-2" /> Visor DICOM
          </TabsTrigger>
          <TabsTrigger value="diagnosticos" className="text-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all duration-300">
            <ImageIcon className="h-4 w-4 mr-2" /> Diagnósticos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visor" className="mt-6 space-y-4">
          <Card className="shadow-lg border border-slate-200 rounded-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <Maximize2 className="w-5 h-5 text-blue-600" /> Centro de Diagnóstico por Imagen
                </CardTitle>
                {viewMode === 'galeria' && (
                  <Button size="sm" variant={autoPlay ? "default" : "outline"} onClick={() => setAutoPlay(!autoPlay)} className="animate-pulse">
                    {autoPlay ? '⏸' : '▶'} Auto
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as ViewMode['id'])} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100 rounded-lg p-1 h-auto">
                  {VIEW_MODES.map(mode => (
                    <TabsTrigger key={mode.id} value={mode.id} className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-md gap-2 py-2 transition-all duration-300 hover:bg-slate-200">
                      {mode.icon} {mode.nombre}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* GALERÍA */}
                <TabsContent value="galeria" className="relative group">
                  <div className="flex flex-col items-center bg-gradient-to-b from-slate-900 to-black rounded-lg overflow-hidden shadow-lg border border-slate-700 animate-fade-in" style={{ minHeight: '550px' }}>
                    {imagenesState.length > 0 ? (
                      <>
                        <div className="w-full bg-black/50 px-6 pt-4">
                          <div className="relative">
                            <Button onClick={() => setShowImageSelector(!showImageSelector)} className="w-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-between">
                              <span>📷 {imagenesState[index]?.categoria || 'Imagen'}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${showImageSelector ? 'rotate-180' : ''}`} />
                            </Button>
                            {showImageSelector && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {imagenesState.map((img, idx) => (
                                  <button key={img.id} onClick={() => { setIndex(idx); setShowImageSelector(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${index === idx ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                                    {idx + 1}. {img.categoria} - {img.pieza_dental ? `Pieza ${img.pieza_dental}` : 'N/A'}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative w-full flex-1 flex items-center justify-center bg-slate-950 p-6 min-h-[480px]">
                          <div className="w-full h-full max-w-md max-h-md flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-xl cursor-pointer hover:border-blue-500 transition-all" onDoubleClick={handleDoubleClick} title="Doble clic para pantalla completa">
                            <img src={imagenesState[index]?.archivo} className="w-full h-full object-contain transition-all duration-500 hover:scale-110" alt="Radiografía" />
                          </div>
                        </div>
                        
                        <div className="w-full bg-gradient-to-t from-black via-black/50 to-transparent p-6 backdrop-blur-sm space-y-3 animate-slide-up">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold text-white text-lg">{imagenesState[index]?.categoria || 'Sin categoría'}</p>
                              <p className="text-xs text-slate-300">🦷 Pieza: {imagenesState[index]?.pieza_dental || 'No especificada'}</p>
                            </div>
                            <div className="text-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-700">
                              <p className="text-sm font-bold text-blue-400">{index + 1}/{imagenesState.length}</p>
                              <p className="text-xs text-slate-400">Imagen</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400 bg-black/30 px-3 py-2 rounded-lg">
                            <span>📅 {imagenesState[index]?.fecha_adquisicion ? new Date(imagenesState[index].fecha_adquisicion).toLocaleDateString('es-ES') : 'Fecha no disponible'}</span>
                            <span>⏱️ {imagenesState[index]?.fecha_adquisicion ? new Date(imagenesState[index].fecha_adquisicion).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : ''}</span>
                          </div>
                          {currentDiagnosticos.length > 0 && (
                            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded px-3 py-2">
                              <p className="text-xs text-emerald-200">✓ {currentDiagnosticos.length} diagnóstico(s) guardado(s)</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full text-center space-y-4 animate-fade-in">
                        <ImageIcon className="w-20 h-20 text-slate-600 animate-bounce" />
                        <div className="space-y-2">
                          <p className="text-slate-300 text-xl font-semibold">No hay radiografías cargadas</p>
                          <p className="text-slate-500 text-sm">Sube imágenes desde el panel de adquisición de imagen</p>
                        </div>
                      </div>
                    )}
                    
                    {imagenesState.length > 1 && (
                      <>
                        <Button variant="secondary" size="icon" className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-blue-600/70 hover:bg-blue-700 text-white transform hover:-translate-x-2 shadow-lg" onClick={anterior}>
                          <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button variant="secondary" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-blue-600/70 hover:bg-blue-700 text-white transform hover:translate-x-2 shadow-lg" onClick={siguiente}>
                          <ChevronRight className="w-6 h-6" />
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* COMPARAR */}
                <TabsContent value="comparar" className="animate-fade-in">
                  {imagenesState.length >= 2 ? (
                    <div className="space-y-4">
                      {/* Selectores */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Imagen Izquierda (Antes)</label>
                          <select className="w-full text-sm border-slate-300 rounded p-2" value={compareIndex1} onChange={e => setCompareIndex1(Number(e.target.value))}>
                            {imagenesState.map((img, idx) => <option key={img.id} value={idx}>{img.categoria} - {img.fecha_adquisicion ? new Date(img.fecha_adquisicion).toLocaleDateString('es-ES') : ''}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Imagen Derecha (Después)</label>
                          <select className="w-full text-sm border-slate-300 rounded p-2" value={compareIndex2} onChange={e => setCompareIndex2(Number(e.target.value))}>
                            {imagenesState.map((img, idx) => <option key={img.id} value={idx}>{img.categoria} - {img.fecha_adquisicion ? new Date(img.fecha_adquisicion).toLocaleDateString('es-ES') : ''}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="relative bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg p-4 shadow-md border border-slate-200 overflow-hidden">
                        <ReactCompareSlider itemOne={<ReactCompareSliderImage src={imagenesState[compareIndex1]?.archivo} alt="Antes" />} itemTwo={<ReactCompareSliderImage src={imagenesState[compareIndex2]?.archivo} alt="Después" />} className="rounded-lg shadow-lg border-2 border-slate-300" style={{ height: '500px' }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 animate-slide-up">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 cursor-pointer" onDoubleClick={() => { setIndex(compareIndex1); handleDoubleClick() }}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-blue-800 flex items-center gap-2"><span className="text-xl">📅</span> Antes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-blue-700 font-semibold">{imagenesState[compareIndex1]?.fecha_adquisicion ? new Date(imagenesState[compareIndex1].fecha_adquisicion).toLocaleDateString('es-ES') : 'N/A'}</p>
                            <p className="text-xs text-blue-600 mt-1">Categoría: {imagenesState[compareIndex1]?.categoria}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105 cursor-pointer" onDoubleClick={() => { setIndex(compareIndex2); handleDoubleClick() }}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-green-800 flex items-center gap-2"><span className="text-xl">✅</span> Después</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-green-700 font-semibold">{imagenesState[compareIndex2]?.fecha_adquisicion ? new Date(imagenesState[compareIndex2].fecha_adquisicion).toLocaleDateString('es-ES') : 'N/A'}</p>
                            <p className="text-xs text-green-600 mt-1">Categoría: {imagenesState[compareIndex2]?.categoria}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 p-6 shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-yellow-900">Se necesitan al menos 2 imágenes para comparar</p>
                          <p className="text-xs text-yellow-700 mt-1">Carga más radiografías desde el panel de adquisición</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* ÁLBUM */}
                <TabsContent value="album" className="animate-fade-in">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagenesState.map((imagen, idx) => (
                        <div key={imagen.id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer animate-fade-in" onClick={() => setIndex(idx)} onDoubleClick={handleDoubleClick} style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="w-full h-48 bg-slate-200 overflow-hidden flex items-center justify-center relative">
                            <img src={imagen.archivo} alt={`Radiografía ${idx + 1}`} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <div className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">{idx + 1}</div>
                            </div>
                            {diagnosticosPorImagen[imagen.id?.toString()]?.length > 0 && (
                              <div className="absolute top-1 right-1 bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                {diagnosticosPorImagen[imagen.id?.toString()].length}
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-xs font-semibold text-slate-700 truncate">{imagen.categoria}</p>
                            <p className="text-xs text-slate-500">{imagen.fecha_adquisicion && new Date(imagen.fecha_adquisicion).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* LÍNEA DE TIEMPO */}
                <TabsContent value="timeline" className="animate-fade-in">
                  <div className="space-y-4">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
                      {imagenesState.length > 0 ? (
                        <div className="space-y-6">
                          {imagenesState.map((imagen, idx) => {
                            const diags = diagnosticosPorImagen[imagen.id?.toString()] || []
                            return (
                              <div key={imagen.id} className="relative pl-4 group cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }} onClick={() => setIndex(idx)}>
                                <div className="absolute -left-5 top-1 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg group-hover:scale-125 transition-transform duration-300 animate-pulse-glow flex items-center justify-center">
                                  {diags.length > 0 && <span className="text-xs text-white font-bold">{diags.length}</span>}
                                </div>
                                <Card className={`border-l-4 ${diags.length > 0 ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-transparent' : 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent'} hover:shadow-lg transition-all duration-300 transform group-hover:translate-x-2`}>
                                  <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <CardTitle className="text-sm text-slate-800">{imagen.categoria}</CardTitle>
                                        <p className="text-xs text-slate-600">Pieza: {imagen.pieza_dental || 'No especificada'}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-bold text-blue-600">{idx + 1}/{imagenesState.length}</p>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="text-xs text-slate-600 space-y-2">
                                    <p>📅 {imagen.fecha_adquisicion ? new Date(imagen.fecha_adquisicion).toLocaleDateString('es-ES') : 'Fecha no disponible'}</p>
                                    <p>⏱️ {imagen.fecha_adquisicion ? new Date(imagen.fecha_adquisicion).toLocaleTimeString('es-ES') : ''}</p>
                                    {diags.length > 0 && (
                                      <details className="group mt-2 border border-emerald-200 rounded-lg bg-white overflow-hidden">
                                        <summary className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 cursor-pointer flex justify-between items-center hover:bg-emerald-100 transition-colors">
                                          <span>Ver Diagnósticos ({diags.length})</span>
                                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="p-3 bg-emerald-50/30 space-y-2 border-t border-emerald-100">
                                          {snapshots[imagen.id?.toString()] && (
                                            <div className="w-full bg-black max-h-[300px] overflow-hidden rounded border-2 border-emerald-200 mb-4 flex items-center justify-center cursor-pointer" onClick={() => { setFullscreenImageIndex(idx); setFullscreen(true); }}>
                                              <img src={snapshots[imagen.id?.toString()]} alt="Captura Diagnóstico" className="max-w-full max-h-full object-contain" />
                                            </div>
                                          )}
                                          {diags.map(diag => (
                                            <div key={diag.id} className="flex items-center gap-3 text-xs text-slate-700 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: diag.color }}></div>
                                              <div className="flex-1">
                                                <p className="font-semibold">{diag.label}</p>
                                                <p className="text-[10px] text-slate-500">{diag.timestamp}</p>
                                              </div>
                                              <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 capitalize">
                                                {diag.type}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">No hay imágenes en la línea de tiempo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DICOM */}
        <TabsContent value="dicom" className="mt-6">
          <Card className="shadow-lg border border-slate-200 rounded-lg overflow-hidden animate-slide-up">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-800">
                <Zap className="w-5 h-5 text-purple-600" /> Visor DICOM Avanzado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {imagenesState.length > 0 ? (
                <div className="bg-slate-900 rounded-lg p-4">
                  <DicomViewer imageIds={imagenesState.map(img => img.archivo)} patientName={`Paciente`} enableSync={true} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                  <p className="text-slate-500 text-lg">No hay imágenes DICOM disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIAGNÓSTICOS */}
        <TabsContent value="diagnosticos" className="mt-6">
          <Card className="shadow-lg border border-slate-200 rounded-lg animate-slide-down">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-800">
                <ImageIcon className="w-5 h-5 text-emerald-600" /> Editor de Diagnósticos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {imagenesState.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">📸 Imagen a diagnosticar:</label>
                    <select 
                      className="flex-1 border-slate-300 rounded p-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-emerald-500" 
                      value={index} 
                      onChange={e => setIndex(Number(e.target.value))}
                    >
                      {imagenesState.map((img, idx) => (
                        <option key={img.id} value={idx}>{idx + 1}. {img.categoria} {img.pieza_dental ? ` - Pieza: ${img.pieza_dental}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <EditorDiagnosticos imageUrl={imagenesState[index]?.archivo || ''} diagnosticos={currentDiagnosticos} onSave={handleSaveDiagnosticos} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No hay imágenes cargadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FULLSCREEN */}
      {fullscreen && imagenesState[fullscreenImageIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 animate-fade-in overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            <p className="font-semibold">Modo Lupa</p>
            <p className="text-slate-300 text-xs mt-1">Usa la rueda del ratón para Zoom: {Math.round(fullscreenScale * 100)}%</p>
            <p className="text-slate-300 text-xs">Arrastra para mover la imagen</p>
          </div>

          <Button onClick={() => setFullscreen(false)} variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-50">
            <X className="w-6 h-6" />
          </Button>

          <div className="flex-1 flex items-center justify-center relative cursor-grab active:cursor-grabbing w-full h-full overflow-hidden">
            <img 
              src={imagenesState[fullscreenImageIndex]?.archivo} 
              alt="Pantalla completa" 
              className="max-w-none transition-transform duration-75"
              style={{
                transform: `translate(${fullscreenPan.x}px, ${fullscreenPan.y}px) scale(${fullscreenScale})`,
                width: 'auto',
                height: '100%',
                objectFit: 'contain'
              }}
              draggable={false}
            />
          </div>
          {imagenesState.length > 1 && (
            <>
              <Button onClick={() => setFullscreenImageIndex((prev) => (prev - 1 + imagenesState.length) % imagenesState.length)} variant="ghost" size="icon" className="absolute left-4 text-white hover:bg-white/20">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button onClick={() => setFullscreenImageIndex((prev) => (prev + 1) % imagenesState.length)} variant="ghost" size="icon" className="absolute right-4 text-white hover:bg-white/20">
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); } 50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); } }
        .animate-fade-in { animation: fade-in 0.3s ease-in-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-slide-down { animation: slide-down 0.4s ease-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
