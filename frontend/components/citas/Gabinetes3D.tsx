"use client"

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, PresentationControls, Text, Box, Cylinder } from '@react-three/drei'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'

interface Sillon {
  id: string
  nombre: string
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO'
}

interface Gabinetes3DProps {
  onGabineteSelect?: (sillon: Sillon) => void
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
  // Disposición en grilla de sillones (3x2)
  const posiciones: [number, number, number][] = [
    [-2, 0, 0],
    [0, 0, 0],
    [2, 0, 0],
    [-2, 0, -3],
    [0, 0, -3],
    [2, 0, -3],
  ]

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
          position={posiciones[idx] || [0, 0, 0]}
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

// Componente principal
export default function Gabinetes3D({ onGabineteSelect }: Gabinetes3DProps) {
  const [sillones, setSillones] = useState<Sillon[]>([])
  const [selectedSillon, setSelectedSillon] = useState<Sillon | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4" />
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
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Estados</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Disponible: {sillones.filter(s => s.estado === 'DISPONIBLE').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ocupado: {sillones.filter(s => s.estado === 'OCUPADO').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Mantenimiento: {sillones.filter(s => s.estado === 'MANTENIMIENTO').length}</span>
            </div>
          </div>
        </div>

        {/* Gabinete seleccionado */}
        <motion.div
          key={selectedSillon?.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-900/40 to-slate-900/50 p-4 rounded-lg border border-cyan-500/30 md:col-span-2"
        >
          {selectedSillon ? (
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">Gabinete Seleccionado</h3>
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
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                Asignar a Cita
              </button>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              Selecciona un gabinete en la vista 3D para ver detalles y asignarlo
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
