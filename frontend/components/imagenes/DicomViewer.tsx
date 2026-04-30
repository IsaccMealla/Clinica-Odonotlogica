'use client'

import React, { useRef, useEffect, useState, useCallback, useId } from 'react'
import { useDicomSynchronizer } from '@/context/DicomSynchronizerContext'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface DicomViewerProps {
  imageIds: string[]
  patientName?: string
  enableSync?: boolean
}

interface ImageData {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  imageData: ImageData | null
  originalImageData: ImageData | null
}

interface DicomViewerState {
  zoom: number
  panX: number
  panY: number
  windowCenter: number
  windowWidth: number
}

export default function DicomViewer({
  imageIds,
  patientName = 'Paciente Anónimo',
  enableSync = false
}: DicomViewerProps) {
  const viewerId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageDataRef = useRef<ImageData>({
    canvas: null as any,
    ctx: null as any,
    imageData: null,
    originalImageData: null
  })

  const [currentImageIdIndex, setCurrentImageIdIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [windowCenter, setWindowCenter] = useState(128)
  const [windowWidth, setWindowWidth] = useState(256)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [mouseStartX, setMouseStartX] = useState(0)
  const [mouseStartY, setMouseStartY] = useState(0)
  const [tool, setTool] = useState<'ww/wc' | 'pan' | 'zoom'>('ww/wc')
  const [loadedImages, setLoadedImages] = useState<Map<number, HTMLImageElement>>(new Map())

  const synchronizer = useDicomSynchronizer()

  // Registrar el visor en el sincronizador
  useEffect(() => {
    if (enableSync && synchronizer) {
      const updateState = (state: DicomViewerState) => {
        setZoom(state.zoom)
        setPanX(state.panX)
        setPanY(state.panY)
        setWindowCenter(state.windowCenter)
        setWindowWidth(state.windowWidth)
      }
      synchronizer.registerViewer(viewerId, updateState)
      return () => synchronizer.unregisterViewer(viewerId)
    }
  }, [enableSync, synchronizer, viewerId])

  // Sincronizar cambios con otros visores
  const syncState = useCallback((state: DicomViewerState) => {
    if (enableSync && synchronizer) {
      synchronizer.syncViewers(viewerId, state)
    }
  }, [enableSync, synchronizer, viewerId])

  // Cargar y cachear imagen
  const loadAndCacheImage = useCallback(async (index: number) => {
    if (index < 0 || index >= imageIds.length) return

    const imageId = imageIds[index]
    let img: HTMLImageElement

    if (loadedImages.has(index)) {
      img = loadedImages.get(index)!
    } else {
      img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageId
      })
      setLoadedImages(prev => new Map(prev).set(index, img))
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)
    imageDataRef.current.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    imageDataRef.current.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    imageDataRef.current.canvas = canvas
    imageDataRef.current.ctx = ctx

    renderImage()
  }, [imageIds, loadedImages])

  // Renderizar imagen con transformaciones
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageDataRef.current.originalImageData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const original = imageDataRef.current.originalImageData

    // Aplicar Window/Level
    const data = imageData.data
    const originalData = original.data

    for (let i = 0; i < data.length; i += 4) {
      let pixel = originalData[i]

      // Convertir a rango [-128, 127]
      const normalized = pixel - 128

      // Aplicar WW/WC
      const minWindow = windowCenter - windowWidth / 2
      const maxWindow = windowCenter + windowWidth / 2

      let normalized2 = (normalized - minWindow) / (maxWindow - minWindow)
      normalized2 = Math.max(0, Math.min(1, normalized2))
      pixel = Math.round(normalized2 * 255)

      data[i] = pixel
      data[i + 1] = pixel
      data[i + 2] = pixel
    }

    ctx.putImageData(imageData, 0, 0)

    // Aplicar zoom y pan
    const transform = new DOMMatrix()
    transform.translateSelf(panX, panY)
    transform.scaleSelf(zoom)

    ctx.save()
    ctx.setTransform(transform)
    ctx.drawImage(canvas, 0, 0)
    ctx.restore()
  }, [windowCenter, windowWidth, zoom, panX, panY])

  // Evento de rueda (scroll)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    if (e.deltaY > 0) {
      setCurrentImageIdIndex(prev => Math.min(prev + 1, imageIds.length - 1))
    } else {
      setCurrentImageIdIndex(prev => Math.max(prev - 1, 0))
    }
  }, [imageIds.length])

  // Evento de ratón hacia abajo
  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsMouseDown(true)
    setMouseStartX(e.clientX)
    setMouseStartY(e.clientY)

    if (e.button === 2) {
      // Botón derecho para WW/WC
      setTool('ww/wc')
    } else if (e.button === 1) {
      // Botón central para zoom
      setTool('zoom')
    } else if (e.button === 0) {
      // Botón izquierdo para pan
      setTool('pan')
    }
  }, [])

  // Evento de ratón en movimiento
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown) return

    const deltaX = e.clientX - mouseStartX
    const deltaY = e.clientY - mouseStartY

    if (tool === 'ww/wc') {
      setWindowWidth(prev => Math.max(1, prev + deltaX))
      setWindowCenter(prev => prev + deltaY)
    } else if (tool === 'pan') {
      setPanX(prev => prev + deltaX)
      setPanY(prev => prev + deltaY)
      syncState({ zoom, panX: panX + deltaX, panY: panY + deltaY, windowCenter, windowWidth })
    } else if (tool === 'zoom') {
      const zoomDelta = 1 + deltaY * 0.01
      setZoom(prev => Math.max(0.1, prev * zoomDelta))
      syncState({ zoom: zoom * zoomDelta, panX, panY, windowCenter, windowWidth })
    }

    setMouseStartX(e.clientX)
    setMouseStartY(e.clientY)
  }, [isMouseDown, tool, mouseStartX, mouseStartY, zoom, panX, panY, windowCenter, windowWidth, syncState])

  // Evento de ratón hacia arriba
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false)
  }, [])

  // Evento contextual del menú
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()
  }, [])

  // Setup de eventos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('contextmenu', handleContextMenu)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu])

  // Cargar imagen cuando cambia el índice
  useEffect(() => {
    loadAndCacheImage(currentImageIdIndex)
  }, [currentImageIdIndex, loadAndCacheImage])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-black rounded-lg overflow-hidden border-2 border-slate-700">
      {/* Header con información */}
      <div className="bg-slate-950 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-white">
            <p className="font-bold text-sm">{patientName}</p>
            <p className="text-xs text-slate-400">Pila {currentImageIdIndex + 1}/{imageIds.length}</p>
          </div>
        </div>
        <div className="text-xs text-slate-300 space-y-1 text-right">
          <p><span className="font-semibold">WC:</span> {Math.round(windowCenter)}</p>
          <p><span className="font-semibold">WW:</span> {Math.round(windowWidth)}</p>
          <p><span className="font-semibold">Zoom:</span> {(zoom * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Canvas principal */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black group cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center',
            transition: isMouseDown ? 'none' : 'transform 0.1s ease-out'
          }}
        />

        {/* Overlay de controles */}
        <div className="absolute top-4 left-4 text-xs text-slate-300 bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <p>🖱️ Click Der: WW/WC</p>
          <p>🖱️ Click Izq: Pan</p>
          <p>🖱️ Click Med: Zoom</p>
          <p>⌚️ Scroll: Cambiar imagen</p>
        </div>

        {/* Controles de navegación vertical */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setCurrentImageIdIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentImageIdIndex === 0}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentImageIdIndex(prev => Math.min(prev + 1, imageIds.length - 1))}
            disabled={currentImageIdIndex === imageIds.length - 1}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer con información técnica */}
      <div className="bg-slate-950 border-t border-slate-700 px-4 py-2 text-xs text-slate-400 space-y-1">
        <p>ID: {imageIds[currentImageIdIndex] ? imageIds[currentImageIdIndex].substring(0, 50) + '...' : 'N/A'}</p>
        <p>{enableSync ? '🔄 Sincronización activa' : 'Visualización local'}</p>
      </div>
    </div>
  )
}
