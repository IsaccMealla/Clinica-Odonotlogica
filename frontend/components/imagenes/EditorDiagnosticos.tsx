"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Trash2, 
  Download, 
  Palette,
  Circle,
  Square,
  ArrowRight,
  Pen
} from 'lucide-react'

interface Diagnosis {
  id: string
  type: 'circle' | 'rectangle' | 'line' | 'freehand'
  color: string
  label: string
  points: { x: number; y: number }[]
  timestamp: string
}

interface EditorDiagnosticosProps {
  imageUrl: string
  diagnosticos: Diagnosis[]
  onSave: (diagnosticos: Diagnosis[], snapshotDataUrl?: string) => void
}

const ANOMALIES = [
  { name: 'Caries', color: '#FF6B6B' },
  { name: 'Fractura', color: '#FFA500' },
  { name: 'Inflamación', color: '#FF1744' },
  { name: 'Lesión', color: '#9C27B0' },
  { name: 'Retención', color: '#2196F3' },
  { name: 'Malposición', color: '#4CAF50' },
  { name: 'Otra', color: '#757575' },
]

const SHAPES = [
  { name: 'Círculo', icon: Circle, type: 'circle' as const },
  { name: 'Rectángulo', icon: Square, type: 'rectangle' as const },
  { name: 'Línea', icon: ArrowRight, type: 'line' as const },
  { name: 'Libre', icon: Pen, type: 'freehand' as const },
]

export default function EditorDiagnosticos({ imageUrl, diagnosticos, onSave }: EditorDiagnosticosProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | 'freehand'>('circle')
  const [selectedAnomaly, setSelectedAnomaly] = useState<string>('Caries')
  const [selectedColor, setSelectedColor] = useState<string>('#FF6B6B')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [localDiagnosticos, setLocalDiagnosticos] = useState<Diagnosis[]>(diagnosticos)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [showLabels, setShowLabels] = useState(true)

  // Cargar la imagen
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      redraw(img, localDiagnosticos, showLabels)
    }
    img.src = imageUrl
  }, [imageUrl, showLabels]) // Added showLabels to deps so it redraws if toggled

  // Redibujar canvas
  const redraw = (img: HTMLImageElement | null, diags: Diagnosis[], labelsVisible: boolean = true) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpiar canvas
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar imagen
    if (img) {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    }

    // Dibujar diagnósticos
    diags.forEach(diag => {
      ctx.strokeStyle = diag.color
      ctx.fillStyle = diag.color + '40'
      ctx.lineWidth = 2

      if (diag.type === 'circle' && diag.points.length >= 2) {
        const dx = diag.points[1].x - diag.points[0].x
        const dy = diag.points[1].y - diag.points[0].y
        const radius = Math.sqrt(dx * dx + dy * dy)
        ctx.beginPath()
        ctx.arc(diag.points[0].x, diag.points[0].y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } else if (diag.type === 'rectangle' && diag.points.length >= 2) {
        const w = diag.points[1].x - diag.points[0].x
        const h = diag.points[1].y - diag.points[0].y
        ctx.fillRect(diag.points[0].x, diag.points[0].y, w, h)
        ctx.strokeRect(diag.points[0].x, diag.points[0].y, w, h)
      } else if (diag.type === 'line' && diag.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(diag.points[0].x, diag.points[0].y)
        ctx.lineTo(diag.points[1].x, diag.points[1].y)
        ctx.stroke()
      } else if (diag.type === 'freehand' && diag.points.length > 1) {
        ctx.beginPath()
        ctx.moveTo(diag.points[0].x, diag.points[0].y)
        diag.points.forEach(point => {
          ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
      }

      // Dibujar etiqueta
      if (labelsVisible) {
        ctx.fillStyle = diag.color
        ctx.font = 'bold 16px sans-serif'
        // Pequeña sombra para legibilidad
        ctx.shadowColor = 'black'
        ctx.shadowBlur = 4
        ctx.fillText(diag.label, diag.points[0].x + 10, diag.points[0].y - 10)
        ctx.shadowBlur = 0 // Resetear sombra
      }
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setIsDrawing(true)
    setStartX(x)
    setStartY(y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (selectedShape === 'freehand') {
      // Dibujar en tiempo real para mano libre
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
        ctx.stroke()
        setStartX(x)
        setStartY(y)
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const newDiagnosis: Diagnosis = {
      id: Date.now().toString(),
      type: selectedShape,
      color: selectedColor,
      label: selectedAnomaly,
      points: [
        { x: startX, y: startY },
        { x, y }
      ],
      timestamp: new Date().toLocaleTimeString('es-ES')
    }

    const updated = [...localDiagnosticos, newDiagnosis]
    setLocalDiagnosticos(updated)
    redraw(image, updated, showLabels)
    setIsDrawing(false)
  }

  const deleteDiagnosis = (id: string) => {
    const updated = localDiagnosticos.filter(d => d.id !== id)
    setLocalDiagnosticos(updated)
    redraw(image, updated, showLabels)
  }

  const handleAnomalyChange = (anomaly: string) => {
    const selected = ANOMALIES.find(a => a.name === anomaly)
    if (selected) {
      setSelectedAnomaly(anomaly)
      setSelectedColor(selected.color)
    }
  }

  const guardar = () => {
    let snapshot = ""
    if (canvasRef.current) {
      // Capturar estado visual actual
      snapshot = canvasRef.current.toDataURL('image/jpeg', 0.8)
    }
    onSave(localDiagnosticos, snapshot)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
            <Palette className="w-5 h-5" /> Editor de Diagnósticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Formas */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Forma de Anotación</p>
            <div className="grid grid-cols-4 gap-2">
              {SHAPES.map(shape => (
                <Button
                  key={shape.type}
                  variant={selectedShape === shape.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedShape(shape.type)}
                  className={selectedShape === shape.type ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  <shape.icon className="w-4 h-4 mr-1" />
                  {shape.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Selector de Anomalías */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Tipo de Anomalía</p>
            <div className="grid grid-cols-2 gap-2">
              {ANOMALIES.map(anomaly => (
                <Button
                  key={anomaly.name}
                  variant={selectedAnomaly === anomaly.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAnomalyChange(anomaly.name)}
                  className={`flex items-center gap-2 ${selectedAnomaly === anomaly.name ? 'ring-2 ring-offset-1' : ''}`}
                  style={selectedAnomaly === anomaly.name ? { backgroundColor: anomaly.color } : {}}
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: anomaly.color }}
                  ></div>
                  {anomaly.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Personalizado */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-sm font-semibold text-slate-700">Color:</span>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border border-slate-300"
            />
            <span className="text-xs text-slate-600 font-mono">{selectedColor}</span>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
            <input 
              type="checkbox" 
              id="showLabels" 
              checked={showLabels} 
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="showLabels" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Mostrar etiquetas en el dibujo
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Canvas para Dibujar */}
      <div className="rounded-lg overflow-hidden border-2 border-indigo-300 shadow-lg bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="w-full h-auto cursor-crosshair bg-gradient-to-br from-slate-50 to-slate-100 block"
        />
      </div>

      {/* Lista de Diagnósticos */}
      {localDiagnosticos.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <Plus className="w-4 h-4" /> Anotaciones Realizadas ({localDiagnosticos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {localDiagnosticos.map((diag, idx) => (
              <div 
                key={diag.id} 
                className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-5 h-5 rounded border"
                    style={{ backgroundColor: diag.color }}
                  ></div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-700">{diag.label}</p>
                    <p className="text-xs text-slate-500">{diag.timestamp}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDiagnosis(diag.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Botón Guardar */}
      <Button
        onClick={guardar}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md"
      >
        <Download className="w-4 h-4 mr-2" /> Guardar Diagnósticos
      </Button>
    </div>
  )
}
