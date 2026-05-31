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
  History
} from "lucide-react"
import RadiographGrid from '@/components/radiografias/RadiographGrid'
import RadiographTimeline from '@/components/radiografias/RadiographTimeline'
import { loadMe } from '@/lib/permissions'

interface Props {
  imagenes: any[] // Lista de imágenes del paciente (IUP)
}

export default function VisorRadiologico({ imagenes }: { imagenes: any[] }) {
  const [index, setIndex] = useState(0)
  const [imgPre, setImgPre] = useState<string | null>(null)
  const [imgPost, setImgPost] = useState<string | null>(null)
  const [imagenesState, setImagenesState] = useState<any[]>(imagenes || [])

  // Actualizar el estado cuando cambian las imágenes
  useEffect(() => {
    setImagenesState(imagenes || [])
  }, [imagenes])

  // Ensure user data loaded for audit identity
  useEffect(()=>{ loadMe().catch(()=>{}) }, [])

  async function deleteImage(id: number | string){
    const token = localStorage.getItem('access_token') || ''
    let attempted = false
    try{
      const res = await fetch(`http://localhost:8000/api/imagenes/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      attempted = true
      // ignore result, proceed to local update
    }catch(e){
      // network error -> proceed with local deletion
    }

    // remove locally
    setImagenesState(prev => prev.filter(i => String(i.id) !== String(id)))

    // write audit entry locally
    try{
      const by = localStorage.getItem('user_role') || localStorage.getItem('username') || 'Desconocido'
      const at = new Date().toISOString()
      const entry = { imageId: id, action: 'delete', by, at, attempted }
      const existing = JSON.parse(localStorage.getItem('radiografia_audit') || '[]')
      existing.unshift(entry)
      localStorage.setItem('radiografia_audit', JSON.stringify(existing.slice(0,200)))
    }catch(_){ }
  }

  const siguiente = () => setIndex((prev) => (prev + 1) % Math.max(1, imagenesState.length))
  const anterior = () => setIndex((prev) => (prev - 1 + Math.max(1, imagenesState.length)) % Math.max(1, imagenesState.length))

  return (
    <Card className="w-full shadow-lg border border-slate-200 rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
          <Maximize2 className="w-5 h-5 text-blue-600" /> 
          Centro de Diagnóstico por Imagen
        </CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="galeria" className="p-6">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100 rounded-lg p-1 h-auto">
          <TabsTrigger value="galeria" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 py-2">
            <ChevronRight className="w-4 h-4" /> Galería
          </TabsTrigger>
          <TabsTrigger value="comparar" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 py-2">
            <Columns className="w-4 h-4" /> Antes y Después
          </TabsTrigger>
          <TabsTrigger value="album" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 py-2">
            <ImageIcon className="w-4 h-4" /> Álbum
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 py-2">
            <History className="w-4 h-4" /> Línea de Tiempo
          </TabsTrigger>
        </TabsList>

        {/* --- VISTA 1: GALERÍA --- */}
        <TabsContent value="galeria" className="relative group">
          <div className="flex flex-col items-center bg-gradient-to-b from-slate-900 to-black rounded-lg overflow-hidden min-h-[550px] justify-center shadow-lg border border-slate-700">
            {imagenesState.length > 0 ? (
              <>
                <div className="relative w-full flex-1 flex items-center justify-center max-h-[480px]">
                  <img 
                    src={imagenesState[index]?.archivo} 
                    className="max-h-full max-w-full object-contain transition-all duration-500"
                    alt="Radiografía"
                  />
                </div>
                <div className="w-full bg-gradient-to-t from-black to-transparent p-4 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white text-lg">{imagenesState[index]?.categoria}</p>
                      <p className="text-xs text-slate-300 bg-black/30 px-3 py-1 rounded-full">{index + 1} / {imagenesState.length}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      📅 {imagenesState[index]?.fecha_adquisicion ? new Date(imagenesState[index].fecha_adquisicion).toLocaleDateString('es-ES') : 'N/A'}
                      {imagenesState[index]?.pieza_dental && ` • 🦷 Pieza ${imagenesState[index].pieza_dental}`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <ImageIcon className="w-16 h-16 text-slate-600" />
                <p className="text-slate-400 text-lg">No hay radiografías cargadas</p>
                <p className="text-slate-500 text-sm">Sube imágenes desde el panel de carga</p>
              </div>
            )}
            
            {imagenesState.length > 1 && (
              <>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
                  onClick={anterior}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
                  onClick={siguiente}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </TabsContent>

        {/* --- VISTA 2: COMPARACIÓN ANTES Y DESPUÉS --- */}
        <TabsContent value="comparar" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
            <div className="space-y-2">
                <label className="font-semibold text-slate-700">📸 Imagen Inicial (Pre):</label>
                <select className="w-full border border-slate-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" onChange={(e) => setImgPre(e.target.value)}>
                  <option value="">Seleccionar imagen...</option>
                  {imagenesState.map(img => (
                    <option key={img.id} value={img.archivo}>
                      {img.categoria} - {new Date(img.fecha_adquisicion).toLocaleDateString('es-ES')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-slate-700">📸 Imagen Final (Post):</label>
                <select className="w-full border border-slate-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" onChange={(e) => setImgPost(e.target.value)}>
                  <option value="">Seleccionar imagen...</option>
                  {imagenesState.map(img => (
                    <option key={img.id} value={img.archivo}>
                      {img.categoria} - {new Date(img.fecha_adquisicion).toLocaleDateString('es-ES')}
                    </option>
                  ))}
                </select>
              </div>
          </div>

          {imgPre && imgPost ? (
            <div className="border-4 border-blue-200 rounded-lg overflow-hidden shadow-lg bg-black">
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={imgPre} alt="Imagen Pre" />}
                itemTwo={<ReactCompareSliderImage src={imgPost} alt="Imagen Post" />}
                style={{ height: '500px', width: '100%' }}
              />
            </div>
          ) : (
            <div className="h-[400px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-slate-600 italic border-2 border-dashed border-slate-300">
              <div className="text-center space-y-2">
                <Columns className="w-12 h-12 mx-auto text-slate-400" />
                <p>Selecciona dos radiografías para comparar el progreso clínico</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- VISTA 3: ALBUM (GRID) --- */}
        <TabsContent value="album" className="space-y-4 p-4">
          {imagenesState.length > 0 ? (
            <RadiographGrid 
              images={imagenesState.map(img => ({
                id: img.id,
                url: img.archivo,
                date: new Date(img.fecha_adquisicion).toLocaleDateString('es-ES'),
                alt: img.categoria
              }))} 
              onDelete={deleteImage} 
            />
          ) : (
            <div className="h-80 bg-slate-100 rounded-lg flex items-center justify-center text-center">
              <div className="space-y-2 text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-400" />
                <p>No hay radiografías para mostrar</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- VISTA 4: TIMELINE --- */}
        <TabsContent value="timeline" className="space-y-4 p-4">
          {imagenesState.length > 0 ? (
            <RadiographTimeline 
              images={imagenesState.map(img => ({
                id: img.id,
                url: img.archivo,
                date: new Date(img.fecha_adquisicion).toLocaleDateString('es-ES'),
                alt: img.categoria
              }))} 
              onDelete={deleteImage} 
            />
          ) : (
            <div className="h-80 bg-slate-100 rounded-lg flex items-center justify-center text-center">
              <div className="space-y-2 text-slate-500">
                <History className="w-12 h-12 mx-auto text-slate-400" />
                <p>No hay radiografías para mostrar</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}