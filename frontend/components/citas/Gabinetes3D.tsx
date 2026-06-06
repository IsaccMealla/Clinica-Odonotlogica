"use client"

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, PresentationControls, Text, Box, Cylinder } from '@react-three/drei'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle } from "lucide-react"
import { useSoundPlayer } from "@/hooks/useSoundPlayer"

interface Sillon {
  id: string | number
  nombre: string
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO'
  posicion_x: number
  posicion_y: number
  posicion_z: number
  ultima_revision?: string
  dias_frecuencia_mantenimiento?: number
}

interface Paciente {
  id: string
  ci: string
  nombres: string
  apellido_paterno: string
}

interface Usuario {
  id: number
  first_name: string
  last_name: string
  rol: string
}

interface Gabinetes3DProps {
  onGabineteSelect?: (sillon: Sillon) => void
  onCitaCreated?: () => void
}

// Componente individual de sillón dental en 3D
function SillonDental({ 
  position, 
  nombre, 
  estado, 
  onSelect 
}: { 
  position: [number, number, number]
  nombre: string
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO'
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  // Color según estado
  const getColor = () => {
    switch (estado) {
      case 'DISPONIBLE':
        return '#10b981' // Verde
      case 'OCUPADO':
        return '#ef4444' // Rojo
      case 'MANTENIMIENTO':
        return '#f97316' // Naranja
      default:
        return '#6b7280'
    }
  }

  return (
    <group position={position}>
      {/* Base del sillón */}
      <Box
        args={[1.2, 0.2, 1.2]}
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? '#00d9ff' : getColor()}
          metalness={0.6}
          roughness={0.4}
          emissive={hovered ? '#00d9ff' : getColor()}
          emissiveIntensity={hovered ? 0.5 : 0.1}
        />
      </Box>

      {/* Respaldo del sillón */}
      <Box
        args={[1, 1.5, 0.3]}
        position={[0, 0.75, -0.5]}
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? '#00d9ff' : getColor()}
          metalness={0.5}
          roughness={0.5}
        />
      </Box>

      {/* Pierna principal */}
      <Cylinder
        args={[0.1, 0.1, 1, 8]}
        position={[0, 0.5, 0]}
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Etiqueta */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.4}
        color={hovered ? '#00d9ff' : '#fff'}
        anchorX="center"
        anchorY="bottom"
      >
        {nombre}
      </Text>

      {/* Indicador de estado */}
      <Text
        position={[0, 1.3, 0]}
        fontSize={0.2}
        color={getColor()}
        anchorX="center"
        anchorY="bottom"
      >
        {estado}
      </Text>
    </group>
  )
}

// Componente Canvas con disposición de sillones
function GabineteCanvas({ sillones, onSelect }: { 
  sillones: Sillon[]
  onSelect: (sillon: Sillon) => void
}) {
  // Usar posiciones personalizadas si existen, si no usar una grilla predeterminada
  const getPosicion = (idx: number, sillon: Sillon): [number, number, number] => {
    if (sillon.posicion_x !== undefined && sillon.posicion_y !== undefined && sillon.posicion_z !== undefined) {
      return [sillon.posicion_x * 3, sillon.posicion_y, sillon.posicion_z * 3]
    }
    
    // Grilla de 3x2 por defecto
    const posiciones: [number, number, number][] = [
      [-2, 0, 0],
      [0, 0, 0],
      [2, 0, 0],
      [-2, 0, -3],
      [0, 0, -3],
      [2, 0, -3],
    ]
    return posiciones[idx] || [0, 0, 0]
  }

  return (
    <Canvas
      camera={{ position: [0, 3, 8], fov: 50 }}
      style={{ width: '100%', height: '500px' }}
    >
      <color attach="background" args={['#0f172a']} />
      
      {/* Iluminación */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#fff" />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#8b5cf6" />
      
      {/* Piso */}
      <Box args={[8, 0.05, 8]} position={[0, -1, 0]}>
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.3} 
          roughness={0.7}
        />
      </Box>

      {/* Sillones */}
      {sillones.map((sillon, idx) => (
        <SillonDental
          key={sillon.id}
          position={getPosicion(idx, sillon)}
          nombre={sillon.nombre}
          estado={sillon.estado}
          onSelect={() => onSelect(sillon)}
        />
      ))}

      {/* Ambiente */}
      <Environment preset="city" />
      <OrbitControls 
        autoRotate 
        autoRotateSpeed={2}
        enablePan={true}
        enableZoom={true}
      />
    </Canvas>
  )
}

// Diálogo para asignar cita rápidamente
function DialogoAsignarCita({ 
  sillon, 
  onClose, 
  onCitaCreada 
}: { 
  sillon: Sillon | null
  onClose: () => void
  onCitaCreada: () => void
}) {
  const { playSound } = useSoundPlayer()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([])
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [tratamientos, setTratamientos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    paciente: '',
    estudiante: '',
    docente: '',
    motivo: '',
    fecha_hora: '',
    duracion_estimada: 30
  })

  useEffect(() => {
    if (sillon) {
      fetchData()
    }
  }, [sillon])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const [pacRes, estRes, docRes, tratRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/pacientes/', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=ESTUDIANTE', { headers }),
        fetch('http://127.0.0.1:8000/api/usuarios/?rol=DOCENTE', { headers }),
        fetch('http://127.0.0.1:8000/api/tratamientos/', { headers })
      ])

      const normalizeList = (data: any) => {
        if (Array.isArray(data)) return data
        if (data && Array.isArray(data.results)) return data.results
        return []
      }

      setPacientes(normalizeList(await pacRes.json()))
      setEstudiantes(normalizeList(await estRes.json()))
      setDocentes(normalizeList(await docRes.json()).filter((u: Usuario) => u.rol === 'DOCENTE'))
      setTratamientos(normalizeList(await tratRes.json()))
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error al cargar los datos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.paciente || !formData.estudiante || !formData.fecha_hora) {
      setError('Faltan campos obligatorios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/api/citas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...formData,
          gabinete: sillon?.id.toString()
        })
      })

      if (response.ok) {
        playSound('exito')
        setError('')
        setFormData({
          paciente: '',
          estudiante: '',
          docente: '',
          motivo: '',
          fecha_hora: '',
          duracion_estimada: 30
        })
        onCitaCreada()
        onClose()
      } else {
        const errorData = await response.json()
        setError(`Error: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  if (!sillon) return null

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Asignar Cita - {sillon.nombre}</DialogTitle>
      </DialogHeader>

      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 p-3 bg-clinica-primary/10 rounded-lg border border-clinica-primary/20">
        <p className="text-sm text-blue-900">
          <strong>Gabinete:</strong> {sillon.nombre} <br />
          <strong>Estado:</strong> <Badge className="ml-1">{sillon.estado}</Badge>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PACIENTE */}
        <div className="space-y-1">
          <Label>Paciente <span className="text-red-500">*</span></Label>
          <Select value={formData.paciente} onValueChange={(value) => setFormData({...formData, paciente: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.apellido_paterno} {p.nombres}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ESTUDIANTE */}
        <div className="space-y-1">
          <Label>Estudiante <span className="text-red-500">*</span></Label>
          <Select value={formData.estudiante} onValueChange={(value) => setFormData({...formData, estudiante: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estudiante" />
            </SelectTrigger>
            <SelectContent>
              {estudiantes.map(est => (
                <SelectItem key={est.id} value={est.id.toString()}>
                  {est.first_name} {est.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* DOCENTE */}
        <div className="space-y-1">
          <Label>Docente</Label>
          <Select value={formData.docente} onValueChange={(value) => setFormData({...formData, docente: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar docente" />
            </SelectTrigger>
            <SelectContent>
              {docentes.map(doc => (
                <SelectItem key={doc.id} value={doc.id.toString()}>
                  {doc.first_name} {doc.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MOTIVO */}
        <div className="space-y-1">
          <Label>Tratamiento</Label>
          <Select value={formData.motivo} onValueChange={(value) => setFormData({...formData, motivo: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tratamiento" />
            </SelectTrigger>
            <SelectContent>
              {tratamientos.map(trat => (
                <SelectItem key={trat.id} value={trat.id.toString()}>
                  {trat.nombre_tratamiento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* FECHA Y HORA */}
        <div className="space-y-1">
          <Label>Fecha y Hora <span className="text-red-500">*</span></Label>
          <Input
            type="datetime-local"
            value={formData.fecha_hora}
            onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
            required
          />
        </div>

        {/* DURACIÓN */}
        <div className="space-y-1">
          <Label>Duración (min)</Label>
          <Input
            type="number"
            value={formData.duracion_estimada}
            onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value) || 30})}
            min="15"
            max="180"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 bg-clinica-secondary hover:bg-clinica-secondary/90">
            {loading ? '⏳ Guardando...' : '✓ Crear Cita'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

// Componente principal
export default function Gabinetes3D({ onGabineteSelect, onCitaCreated }: Gabinetes3DProps) {
  const [sillones, setSillones] = useState<Sillon[]>([])
  const [selectedSillon, setSelectedSillon] = useState<Sillon | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialogoAsignar, setShowDialogoAsignar] = useState(false)

  useEffect(() => {
    fetchSillones()
  }, [])

  const fetchSillones = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/sillones/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      const data = await response.json()
      const lista = Array.isArray(data) ? data : (data.results || [])
      setSillones(lista)
    } catch (error) {
      console.error('Error fetching sillones:', error)
      setSillones([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSillon = (sillon: Sillon) => {
    setSelectedSillon(sillon)
    onGabineteSelect?.(sillon)
  }

  const handleCitaCreada = () => {
    fetchSillones()
    onCitaCreated?.()
    setShowDialogoAsignar(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-clinica-secondary mx-auto mb-4" />
          <p className="text-slate-600">Cargando gabinetes...</p>
        </div>
      </div>
    )
  }

  if (sillones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/30 rounded-lg border border-slate-700">
        <p className="text-slate-400">No hay gabinetes disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-slate-700">
        <GabineteCanvas sillones={sillones} onSelect={handleSelectSillon} />
      </div>

      {/* Panel de información */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resumen de estado */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 Estados</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-clinica-secondary/100 rounded-full"></div>
              <span>Disponible: <strong>{sillones.filter(s => s.estado === 'DISPONIBLE').length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ocupado: <strong>{sillones.filter(s => s.estado === 'OCUPADO').length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Mantenimiento: <strong>{sillones.filter(s => s.estado === 'MANTENIMIENTO').length}</strong></span>
            </div>
          </div>
        </div>

        {/* Gabinete seleccionado */}
        <Dialog open={showDialogoAsignar} onOpenChange={setShowDialogoAsignar}>
          <motion.div
            key={selectedSillon?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-900/40 to-slate-900/50 p-4 rounded-lg border border-clinica-secondary/30 md:col-span-2"
          >
            {selectedSillon ? (
              <div>
                <h3 className="text-sm font-semibold text-clinica-secondary mb-2">🎯 Gabinete Seleccionado</h3>
                <p className="text-lg font-bold text-white mb-3">{selectedSillon.nombre}</p>
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: selectedSillon.estado === 'DISPONIBLE' ? '#10b981' 
                        : selectedSillon.estado === 'OCUPADO' ? '#ef4444' 
                        : '#f97316'
                    }}
                  />
                  <span className="text-sm text-slate-300">{selectedSillon.estado}</span>
                </div>
                {selectedSillon.ultima_revision && (
                  <p className="text-xs text-slate-400 mb-3">
                    Última revisión: {new Date(selectedSillon.ultima_revision).toLocaleDateString('es-ES')}
                  </p>
                )}
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-clinica-primary hover:bg-cyan-700 text-white"
                    onClick={() => setShowDialogoAsignar(true)}
                  >
                    ➕ Asignar Cita
                  </Button>
                </DialogTrigger>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                👆 Selecciona un gabinete en la vista 3D para ver detalles y asignarlo
              </div>
            )}
          </motion.div>

          <DialogoAsignarCita 
            sillon={selectedSillon}
            onClose={() => setShowDialogoAsignar(false)}
            onCitaCreada={handleCitaCreada}
          />
        </Dialog>
      </div>
    </div>
  )
}
