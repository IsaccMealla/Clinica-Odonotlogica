"use client"

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

interface DentalChair {
  id: string
  name: string
  gabinete?: { id: string; nombre: string }
  is_busy: boolean
}

interface DentalChairSelector3DProps {
  chairs: DentalChair[]
  onSelect: (chairId: string) => void
  selectedChairId?: string
}

function DentalChair3D({
  chair,
  position,
  onClick,
  isSelected,
  isBusy
}: {
  chair: DentalChair
  position: [number, number, number]
  onClick: () => void
  isSelected: boolean
  isBusy: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)

  // Rotación continua
  useFrame((state, delta) => {
    if (groupRef.current && !isSelected) {
      groupRef.current.rotation.y += delta * 0.4
    }
  })

  const baseColor = isBusy ? '#fca5a5' : isSelected ? '#93c5fd' : '#d1d5db'
  const seatColor = isBusy ? '#dc2626' : isSelected ? '#2563eb' : '#3b82f6'

  return (
    <group ref={groupRef} position={position}>
      {/* Base hidráulica inferior */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.3]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Cilindro hidráulico central */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Asiento principal - cuerpo de la silla */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.15, 0.7]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>

      {/* Respaldo del asiento - con curvatura */}
      <mesh position={[0, 0.55, -0.3]}>
        <boxGeometry args={[0.9, 0.6, 0.15]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>

      {/* Cabecera/Reposamanos izquierdo */}
      <mesh position={[-0.5, 0.3, 0.3]}>
        <boxGeometry args={[0.2, 0.35, 0.4]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>

      {/* Reposamanos derecho */}
      <mesh position={[0.5, 0.3, 0.3]}>
        <boxGeometry args={[0.2, 0.35, 0.4]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>

      {/* Bandeja de herramientas - parte 1 */}
      <mesh position={[0.4, 0.6, -0.5]}>
        <boxGeometry args={[0.5, 0.08, 0.4]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>

      {/* Bandeja de herramientas - parte 2 (escalonada) */}
      <mesh position={[-0.4, 0.75, -0.5]}>
        <boxGeometry args={[0.5, 0.08, 0.4]} />
        <meshStandardMaterial color="#a0826d" />
      </mesh>

      {/* Cabezal de tratamiento - estructura superior */}
      <mesh position={[0, 1.0, 0.2]}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Lámpara de tratamiento */}
      <mesh position={[0, 1.1, 0.35]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05]} />
        <meshStandardMaterial color="#fffacd" />
      </mesh>
      <pointLight position={[0, 1.15, 0.35]} intensity={1} color="#fffacd" />

      {/* Soporte articulado */}
      <mesh position={[0, 0.8, -0.2]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Etiqueta de información */}
      <Html position={[0, 1.6, 0]} center>
        <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-bold text-center min-w-[140px] ${
          isBusy ? 'bg-red-100 text-red-700' : isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
        }`}>
          <div>{chair.name}</div>
          {chair.gabinete && <div className="text-xs mt-1">{chair.gabinete.nombre}</div>}
          {isBusy && <div className="text-xs font-bold mt-1">OCUPADA</div>}
          {!isBusy && isSelected && <div className="text-xs font-bold mt-1">SELECCIONADA</div>}
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
        <boxGeometry args={[1.2, 2, 1.2]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

export function DentalChairSelector3D({
  chairs,
  onSelect,
  selectedChairId
}: DentalChairSelector3DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedChairId || null)

  useEffect(() => {
    setSelectedId(selectedChairId || null)
  }, [selectedChairId])

  const handleSelect = (chairId: string) => {
    setSelectedId(chairId)
    onSelect(chairId)
  }

  // Posicionar sillas en una cuadrícula
  const positions: [number, number, number][] = []
  const itemsPerRow = 3
  chairs.forEach((_, index) => {
    const row = Math.floor(index / itemsPerRow)
    const col = index % itemsPerRow
    positions.push([
      (col - 1) * 4,
      0,
      row * 3
    ])
  })

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1} />

        {chairs.map((chair, index) => (
          <DentalChair3D
            key={chair.id}
            chair={chair}
            position={positions[index]}
            onClick={() => handleSelect(chair.id)}
            isSelected={selectedId === chair.id}
            isBusy={chair.is_busy}
          />
        ))}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {/* Plano base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
          <planeGeometry args={[20, 15]} />
          <meshStandardMaterial color="#f3f4f6" />
        </mesh>
      </Canvas>
    </div>
  )
}