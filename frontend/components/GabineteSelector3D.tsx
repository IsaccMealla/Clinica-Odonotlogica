"use client"

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

interface Gabinete {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  capacidad: number
  is_busy: boolean
}

interface GabineteSelector3DProps {
  gabinetes: Gabinete[]
  onSelect: (gabineteId: string) => void
  selectedGabineteId?: string
}

function Gabinete3D({
  gabinete,
  position,
  onClick,
  isSelected,
  isBusy
}: {
  gabinete: Gabinete
  position: [number, number, number]
  onClick: () => void
  isSelected: boolean
  isBusy: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)

  // Rotación continua
  useFrame((state, delta) => {
    if (groupRef.current && !isSelected) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  const wallColor = isBusy ? '#fca5a5' : isSelected ? '#93c5fd' : '#e5e7eb'
  const doorColor = isBusy ? '#dc2626' : isSelected ? '#2563eb' : '#4b5563'

  return (
    <group ref={groupRef} position={position}>
      {/* Paredes del gabinete - estructura principal */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 2.5, 2.5]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Puerta */}
      <mesh position={[1.48, 0.5, 1.26]}>
        <boxGeometry args={[0.2, 1.8, 0.5]} />
        <meshStandardMaterial color={doorColor} />
      </mesh>

      {/* Ventana superior */}
      <mesh position={[-1.48, 0.8, 0]}>
        <boxGeometry args={[0.1, 0.8, 2.5]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
      </mesh>

      {/* Mesilla/Escritorio */}
      <mesh position={[-0.8, -0.8, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>

      {/* Luz de techo */}
      <pointLight position={[0, 1.1, 0]} intensity={1.5} color="#fffacd" />
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1]} />
        <meshStandardMaterial color="#fffacd" />
      </mesh>

      {/* Etiqueta */}
      <Html position={[0, 1.5, 1.3]} center>
        <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-bold text-center min-w-[140px] ${
          isBusy ? 'bg-red-100 text-red-700' : isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          <div>{gabinete.nombre}</div>
          <div className="text-xs mt-1">Cap: {gabinete.capacidad}</div>
          {isBusy && <div className="text-xs font-bold mt-1">OCUPADO</div>}
        </div>
      </Html>

      {/* Área invisible para click */}
      <mesh
        onClick={isBusy ? undefined : onClick}
        onPointerOver={(e) => {
          if (!isBusy) {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[3, 2.5, 2.5]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

export function GabineteSelector3D({
  gabinetes,
  onSelect,
  selectedGabineteId
}: GabineteSelector3DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedGabineteId || null)

  useEffect(() => {
    setSelectedId(selectedGabineteId || null)
  }, [selectedGabineteId])

  useEffect(() => {
    if (gabinetes.length > 0) {
      console.log('Gabinetes cargados:', gabinetes)
    }
  }, [gabinetes])

  const handleSelect = (gabineteId: string) => {
    setSelectedId(gabineteId)
    onSelect(gabineteId)
  }

  // Posicionar gabinetes en una fila
  const positions: [number, number, number][] = gabinetes.map((_, index) => [
    (index - (gabinetes.length - 1) / 2) * 5,
    0,
    0
  ])

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50">
      {gabinetes.length === 0 ? (
        <div className="flex items-center justify-center h-full flex-col gap-2">
          <p className="text-muted-foreground">No hay gabinetes disponibles</p>
          <p className="text-xs text-gray-500">Verifica que los datos se hayan cargado desde el backend</p>
        </div>
      ) : (
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />

          {gabinetes.map((gabinete, index) => (
            <Gabinete3D
              key={gabinete.id}
              gabinete={gabinete}
              position={positions[index]}
              onClick={() => handleSelect(gabinete.id)}
              isSelected={selectedId === gabinete.id}
              isBusy={gabinete.is_busy}
            />
          ))}

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Plano base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[20, 10]} />
            <meshStandardMaterial color="#f3f4f6" />
          </mesh>
        </Canvas>
      )}
    </div>
  )
}