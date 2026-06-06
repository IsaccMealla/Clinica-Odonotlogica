"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Send, Loader2, Check, X, ExternalLink, Copy, 
  CheckCircle2, AlertCircle, Settings
} from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  testResult?: TestExecutionResult
}

interface TestExecutionResult {
  endpoint: string
  method: string
  payload?: any
  responseStatus: number
  responseData?: any
  error?: string
  screenshot?: string
  paso: number
  entrada: string
  resultado: string
  estado: 'PASA' | 'FALLA'
  defectos?: string
  evidencia_img?: string
}

interface QASession {
  id: string
  startTime: Date
  commands: string[]
  results: TestExecutionResult[]
  estado_general: 'PASA' | 'FALLA'
}

export default function QAAgentPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [session, setSession] = useState<QASession | null>(null)
  const [apiBaseUrl] = useState('http://localhost:8000/api')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setAuthToken(token)
  }, [])

  const executeQACommand = async (command: string) => {
    const trimmedCommand = command.trim()
    const trimmedCommandLower = trimmedCommand.toLowerCase()
    
    const commandMap: { [key: string]: { modulo: string; descripcion: string } } = {
      'test login': { modulo: 'M1', descripcion: 'Validar login y acceso al dashboard' },
      'test crear paciente': { modulo: 'M1', descripcion: 'Crear paciente y verificar listado' },
      'test odontograma': { modulo: 'M2', descripcion: 'Abrir odontograma, marcar hallazgos y guardar' },
      'test diagnóstico': { modulo: 'M2', descripcion: 'Abrir odontograma y ejecutar flujo diagnóstico' },
      'test diagnostico': { modulo: 'M2', descripcion: 'Abrir odontograma y ejecutar flujo diagnóstico' },
      'test panel qa': { modulo: 'M6', descripcion: 'Abrir panel QA y ejecutar comando de prueba' },
      'test reportes': { modulo: 'M6', descripcion: 'Abrir panel QA y ejecutar comando de prueba' },
      'generar pdf': { modulo: 'M6', descripcion: 'Abrir panel QA y generar reporte PDF' },
      'test funcional': { modulo: 'M7', descripcion: 'Ejecutar pruebas funcionales agrupadas' },
      'test funcionales': { modulo: 'M7', descripcion: 'Ejecutar pruebas funcionales agrupadas' },
      'test no funcional': { modulo: 'M8', descripcion: 'Ejecutar pruebas no funcionales de rendimiento' },
      'test no funcionales': { modulo: 'M8', descripcion: 'Ejecutar pruebas no funcionales de rendimiento' },
      'pruebas funcionales': { modulo: 'M7', descripcion: 'Ejecutar pruebas funcionales agrupadas' },
      'pruebas no funcionales': { modulo: 'M8', descripcion: 'Ejecutar pruebas no funcionales de rendimiento' },
    }

    const commandEntry = commandMap[trimmedCommandLower]

    if (!commandEntry && !trimmedCommandLower.startsWith('credenciales ')) {
      throw new Error(`Comando no soportado. Usa uno de: ${Object.keys(commandMap).join(', ')}`)
    }

    const modulo = commandEntry?.modulo ?? 'M1'

    let credenciales = null
    // Preservar mayúsculas en credenciales usando comando original
    if (trimmedCommandLower.startsWith('credenciales ')) {
      const credsStr = trimmedCommand.substring(13)
      const [email, password] = credsStr.split(':')
      if (email && password) {
        credenciales = { email: email.trim(), password: password.trim() }
      }
    }

    try {
      if (!authToken) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`${apiBaseUrl}/qa/ejecutar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          modulo,
          credenciales
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Error HTTP ${response.status}`)
      }

      const report = await response.json()

      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'agent',
        content: `✅ Pruebas ejecutadas: ${report.estado_general}\n📊 Total: ${report.resultados.length} casos\n✓ Pasados: ${report.resultados.filter((r: any) => r.estado === 'PASA').length}\n✗ Fallidos: ${report.resultados.filter((r: any) => r.estado === 'FALLA').length}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMessage])

      if (report.resultados && report.resultados.length > 0) {
        setSession({
          id: `session-${Date.now()}`,
          startTime: new Date(),
          commands: [command],
          results: report.resultados.map((r: any) => ({
            endpoint: `M${report.modulo}`,
            method: 'PLAYWRIGHT',
            responseStatus: r.estado === 'PASA' ? 200 : 400,
            paso: r.paso,
            entrada: r.entrada,
            resultado: r.obtenido,
            estado: r.estado,
            defectos: r.defectos,
            evidencia_img: r.evidencia_img
          })),
          estado_general: report.estado_general
        })
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'agent',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsExecuting(true)

    try {
      await executeQACommand(inputValue)
    } finally {
      setIsExecuting(false)
      inputRef.current?.focus()
    }
  }

  const imageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn(`No se pudo cargar imagen: ${imageUrl}`)
      return ''
    }
  }

  const generarPDFReporte = async (): Promise<{ message: string }> => {
    try {
      if (!session || !session.results.length) {
        throw new Error('No hay resultados de pruebas para generar reporte')
      }

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORTE QA AGENT - E2E VISUAL CON PLAYWRIGHT', pageWidth / 2, yPos, { align: 'center' })
      yPos += 12

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const metadatos = [
        { label: 'ID Sesión:', valor: session.id },
        { label: 'Fecha:', valor: new Date(session.startTime).toLocaleDateString('es-ES') },
        { label: 'Total Pruebas:', valor: String(session.results.length) },
        { label: 'Estado General:', valor: session.estado_general },
        { label: 'Comandos Ejecutados:', valor: session.commands.length.toString() }
      ]

      metadatos.forEach(({ label, valor }) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(valor, margin + 50, yPos)
        yPos += 5
      })

      yPos += 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('TABLA 1: RESULTADOS DE PRUEBAS', margin, yPos)
      yPos += 7

      const tableColumns = ['PASO', 'ENTRADA O ACCIÓN', 'RESULTADO ESPERADO', 'RESULTADO OBTENIDO', 'DEFECTOS', 'PASA / FALLA']
      const tableRows = session.results.map(r => [
        String(r.paso),
        r.entrada.substring(0, 25),
        r.resultado.substring(0, 25),
        r.resultado.substring(0, 25),
        r.defectos ? r.defectos.substring(0, 15) : '—',
        r.estado
      ])

      autoTable(doc, {
        startY: yPos,
        head: [tableColumns],
        body: tableRows,
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 6, textColor: 0 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 18, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (String(data.cell.raw) === 'PASA') {
              data.cell.styles.fillColor = [220, 252, 231]
              data.cell.styles.textColor = [34, 197, 94]
              data.cell.styles.fontStyle = 'bold'
            } else if (String(data.cell.raw) === 'FALLA') {
              data.cell.styles.fillColor = [254, 226, 226]
              data.cell.styles.textColor = [239, 68, 68]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        }
      })

      let currentY = (doc as any).lastAutoTable?.finalY || yPos + 50

      if (currentY > pageHeight - 80) {
        doc.addPage()
        currentY = margin
      } else {
        currentY += 10
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('TABLA 2: LOG DE EVIDENCIAS Y OBSERVACIONES', margin, currentY)
      currentY += 7

      const imageCache = new Map<number, string>()
      for (let i = 0; i < session.results.length; i++) {
        const result = session.results[i]
        if (result.evidencia_img) {
          try {
            const base64 = await imageToBase64(result.evidencia_img)
            if (base64) {
              imageCache.set(i, base64)
            }
          } catch (error) {
            console.warn(`Error precargando imagen ${i}:`, error)
          }
        }
      }

      const evidenciaColumns = ['PASO', 'ENTRADA O ACCIÓN', 'OBSERVACIONES', 'EVIDENCIA']
      const evidenciaRows = session.results.map(r => [
        String(r.paso),
        r.entrada.substring(0, 20),
        'Ejecución E2E visual capturada',
        r.evidencia_img ? '[IMAGEN]' : 'N/A'
      ])

      autoTable(doc, {
        startY: currentY,
        head: [evidenciaColumns],
        body: evidenciaRows,
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { fontSize: 6, textColor: 0 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 50, minCellHeight: 40 }
        },
        didDrawCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const rowIndex = data.row.index
            const base64Image = imageCache.get(rowIndex)
            
            if (base64Image) {
              try {
                const imgWidth = 35
                const imgHeight = 30
                const x = data.cell.x + 2
                const y = data.cell.y + 2
                
                doc.addImage(base64Image, 'PNG', x, y, imgWidth, imgHeight)
              } catch (err) {
                console.warn(`Error renderizando imagen ${rowIndex} en PDF:`, err)
              }
            }
          }
        }
      })

      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        )
      }

      try {
        const audio = new Audio('/sounds/exito.mp3')
        await audio.play()
      } catch (error) {
        console.log('No se pudo reproducir sonido', error)
      }

      const fileName = `QA-Report-E2E-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      return {
        message: `✅ PDF generado y descargado: ${fileName}\n📸 ${session.results.filter(r => r.evidencia_img).length} capturas incrustadas en el documento`
      }
    } catch (error) {
      return {
        message: `❌ Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  return (
    <div className="flex h-full gap-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-clinica-primary to-clinica-secondary text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">🤖 QA Agent Automation</h1>
              <p className="text-sm text-clinica-secondary/80">E2E Visual Testing con Playwright</p>
            </div>
            {session && (
              <Badge className="bg-clinica-accent text-slate-900">
                {session.results.length} pruebas ejecutadas
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4">
                <div className="text-4xl">🧪</div>
                <p className="text-slate-500 font-medium">Sin mensajes aún</p>
                <p className="text-xs text-slate-400">Escribe un comando para empezar pruebas E2E</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-clinica-primary text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {msg.testResult && msg.testResult.evidencia_img && (
                  <div className="mt-2">
                    <img 
                      src={msg.testResult.evidencia_img} 
                      alt={`Paso ${msg.testResult.paso}`}
                      className="h-20 w-32 object-cover rounded shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <p className="text-xs opacity-70 mt-2">
                  {msg.timestamp.toLocaleTimeString('es-ES')}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isExecuting) {
                  handleSendMessage()
                }
              }}
              placeholder="test login, test odontograma, test funcional, test no funcional..."
              disabled={isExecuting}
              className="flex-1 bg-white border border-slate-300"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isExecuting || !inputValue.trim()}
              className="bg-clinica-primary hover:bg-clinica-primary/90"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-80 space-y-4">
        {session ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {session.estado_general === 'PASA' ? (
                    <CheckCircle2 className="h-4 w-4 text-clinica-secondary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-clinica-primary">
                  {session.estado_general}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-100 p-2 rounded">
                    <div className="font-semibold text-green-700">
                      {session.results.filter(r => r.estado === 'PASA').length}
                    </div>
                    <div className="text-clinica-secondary">Pasadas</div>
                  </div>
                  <div className="bg-red-100 p-2 rounded">
                    <div className="font-semibold text-red-700">
                      {session.results.filter(r => r.estado === 'FALLA').length}
                    </div>
                    <div className="text-red-600">Fallidas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={async () => {
                    const result = await generarPDFReporte()
                    const msg: ChatMessage = {
                      id: `msg-${Date.now()}`,
                      role: 'agent',
                      content: result.message,
                      timestamp: new Date()
                    }
                    setMessages(prev => [...prev, msg])
                  }}
                  className="w-full text-sm bg-clinica-accent text-slate-900 hover:bg-clinica-accent/90"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Generar PDF
                </Button>
                <Button
                  onClick={() => {
                    setSession(null)
                    setMessages([])
                  }}
                  className="w-full text-sm"
                  variant="outline"
                >
                  Nueva Sesión
                </Button>
              </CardContent>
            </Card>

            {session.results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Últimos Resultados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {session.results.slice(-3).map((result, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-clinica-primary pl-2 pb-2">
                      <div className="flex items-center gap-1">
                        {result.estado === 'PASA' ? (
                          <CheckCircle2 className="h-3 w-3 text-clinica-secondary" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="font-semibold truncate">{result.entrada}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1">Status: {result.responseStatus}</p>
                      {result.evidencia_img && (
                        <div className="mt-2">
                          <img 
                            src={result.evidencia_img} 
                            alt={`Paso ${result.paso}`}
                            className="h-16 w-24 object-cover rounded shadow border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-3">
              <Settings className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm text-slate-500">Sesión no iniciada</p>
              <p className="text-xs text-slate-400">Ejecuta un comando para comenzar</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comandos Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs space-y-1 text-slate-600">
              <p><strong>M1 (Asignación):</strong> test login, test crear paciente</p>
              <p><strong>M2 (Diagnóstico):</strong> test odontograma, test diagnóstico</p>
              <p><strong>M6 (Reportes):</strong> test panel qa, test reportes, generar pdf</p>
              <p><strong>M7 (Funcionales):</strong> test funcional, pruebas funcionales</p>
              <p><strong>M8 (No Funcionales):</strong> test no funcional, pruebas no funcionales</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
