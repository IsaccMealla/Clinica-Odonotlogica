'use client'

import React, { useRef, useEffect, useState, useCallback, useId } from 'react'
import { useDicomSynchronizer } from '@/context/DicomSynchronizerContext'
import { ChevronUp, ChevronDown, Printer } from 'lucide-react'
import { jsPDF } from 'jspdf'

interface DicomViewerProps {
  imageIds: string[]
  patientName?: string
  enableSync?: boolean
}

interface ViewerImageState {
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
  const imageDataRef = useRef<ViewerImageState>({
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
    const loadedData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    imageDataRef.current.originalImageData = loadedData
    imageDataRef.current.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    renderImage()
  }, [imageIds, loadedImages])

  // Renderizar imagen con transformaciones
  const renderImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageDataRef.current.originalImageData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const original = imageDataRef.current.originalImageData
    const output = ctx.createImageData(original.width, original.height)

    const data = output.data
    const originalData = original.data

    for (let i = 0; i < data.length; i += 4) {
      let pixel = originalData[i]
      const minWindow = windowCenter - windowWidth / 2
      let normalized = (pixel - minWindow) / windowWidth
      normalized = Math.max(0, Math.min(1, normalized))
      pixel = Math.round(normalized * 255)

      data[i] = pixel
      data[i + 1] = pixel
      data[i + 2] = pixel
      data[i + 3] = originalData[i + 3]
    }

    ctx.putImageData(output, 0, 0)
  }, [windowCenter, windowWidth])

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

  const exportToPDF = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      pdf.setFontSize(16)
      pdf.text(`Expediente Radiológico - ${patientName}`, 14, 15)
      pdf.setFontSize(10)
      pdf.text(`Filtro Aplicado - WW: ${Math.round(windowWidth)} / WC: ${Math.round(windowCenter)}`, 14, 22)
      pdf.text(`Fecha de Impresión: ${new Date().toLocaleDateString('es-ES')}`, 14, 28)
      
      // Capturamos el canvas con las transformaciones visuales o solo los filtros? 
      // Si usamos toDataURL, capturamos el canvas entero (los filtros sí, pero el CSS de transform no, 
      // lo cual es mejor para impresión en alta calidad sin el paneo).
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      
      // Calculamos para que encaje en el A4 horizontal
      const pdfWidth = 269 
      const pdfHeight = 170
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height)
      const width = canvas.width * ratio
      const height = canvas.height * ratio
      
      pdf.addImage(imgData, 'JPEG', 14, 35, width, height)
      pdf.save(`Radiografia_Filtrada_${Date.now()}.pdf`)
    } catch (e) {
      console.error("Error al exportar PDF:", e)
      alert("Error al generar el PDF.")
    }
  }

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

      {/* Controles Rápidos (Presets DICOM) */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold mr-2">Filtros (8-bit):</span>
          <button onClick={() => { setWindowWidth(256); setWindowCenter(128) }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-600">Estándar</button>
          <button onClick={() => { setWindowWidth(100); setWindowCenter(128) }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-600">Tejido Blando</button>
          <button onClick={() => { setWindowWidth(150); setWindowCenter(200) }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-600">Hueso / Dental</button>
          <button onClick={() => { setWindowWidth(50); setWindowCenter(128) }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-600">Contraste Alto</button>
          <div className="w-px h-5 bg-slate-700 mx-1"></div>
          <button onClick={() => { setZoom(1); setPanX(0); setPanY(0) }} className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800/80 text-blue-300 text-xs rounded transition-colors border border-blue-800/50">Restaurar Zoom</button>
        </div>
        <button onClick={exportToPDF} className="px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-2 shadow-md">
          <Printer className="w-4 h-4" /> Exportar a PDF
        </button>
      </div>

      {/* Canvas principal */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black group cursor-crosshair min-h-[400px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
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
