"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import * as cornerstone from "cornerstone-core"
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader"

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.configure({
  beforeSend: function (xhr: any) {
    // Puede agregar auth headers si usa JWT
  },
})

export default function ImageViewerPage() {
  const [images, setImages] = useState<Array<{id:string;file_url:string;description?:string}>>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const imageElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("http://localhost:8000/api/images/?image_type=dicom")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setImages(data))
      .catch(() => toast.error("No se pudieron cargar imágenes DICOM"))
  }, [])

  useEffect(() => {
    if (!selectedUrl || !imageElement.current) return

    const element = imageElement.current
    cornerstone.enable(element)

    const loadImage = async () => {
      try {
        const image = await cornerstone.loadImage(`wadouri:${selectedUrl}`)
        cornerstone.displayImage(element, image)
      } catch (e) {
        toast.error('Error al cargar DICOM en visor')
        console.error(e)
      }
    }

    loadImage()
  }, [selectedUrl])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Visor DICOM</h1>
        <p className="text-muted-foreground">Selecciona un archivo DICOM para verlo, rotar y ajustar.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          <h2 className="font-semibold">Imágenes DICOM</h2>
          {images.map((img) => (
            <Button key={img.id} variant={selectedId === img.id ? 'secondary' : 'outline'} onClick={() => { setSelectedId(img.id); setSelectedUrl(img.file_url)}}>
              {img.description || img.id}
            </Button>
          ))}
        </div>

        <div className="md:col-span-2 rounded-lg border p-2 h-[600px] bg-black">
          <div ref={imageElement} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => selectedUrl && cornerstone.zoom(1.1)} disabled={!selectedUrl}>Zoom +</Button>
        <Button onClick={() => selectedUrl && cornerstone.zoom(0.9)} disabled={!selectedUrl}>Zoom -</Button>
        <Button onClick={() => selectedUrl && cornerstone.setViewport(imageElement.current, { scale: 1 })} disabled={!selectedUrl}>Restaurar</Button>
        <Button onClick={() => selectedUrl && cornerstone.setViewport(imageElement.current, { rotation: 90 })} disabled={!selectedUrl}>Rotar 90°</Button>
      </div>
    </div>
  )
}
