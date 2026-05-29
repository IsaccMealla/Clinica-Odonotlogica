"use client"

import { useState, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Environment, Html } from "@react-three/drei"
import * as THREE from "three"

// --- 1. COMPONENTE DE LA BARRA ---
interface Barra3DProps {
  position: [number, number, number];
  color: string;
  height: number;
  label: string;
  valor: number | string;
  detalle: string;
}

function Barra3D({ position, color, height, label, valor, detalle }: Barra3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHover] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      const targetY = height / 2;
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y, 
        targetY + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05, 
        0.1
      );
    }
  })

  return (
    <group>
      <mesh 
        ref={meshRef} 
        position={[position[0], 0, position[2]]} 
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={() => { 
          if(meshRef.current) {
            meshRef.current.scale.y = 1.1; 
            setTimeout(() => { if(meshRef.current) meshRef.current.scale.y = 1 }, 150) 
          }
        }}
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshPhysicalMaterial color={hovered ? "#ffffff" : color} roughness={0.1} metalness={0.4} clearcoat={0.8} />
        
        {hovered && (
          <Html position={[0, height / 2 + 0.5, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-white/95 text-slate-900 text-sm px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm border border-slate-200 whitespace-nowrap pointer-events-none min-w-[120px] text-center">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-xs">{label}</p>
              <p className="text-2xl font-black text-blue-600 my-1">{valor}</p>
              <p className="text-slate-500 font-medium text-xs">{detalle}</p>
            </div>
          </Html>
        )}
      </mesh>
      <Text position={[position[0], -0.4, position[2]]} fontSize={0.25} color="#1f2937" anchorY="top" maxWidth={1.2} textAlign="center">
        {label}
      </Text>
    </group>
  )
}

// --- 2. EL GRÁFICO DINÁMICO (Ahora solo recibe datos) ---
interface Grafico3DProps {
  datos: any[]; // Recibe los datos ya procesados desde el Page
}

export function Grafico3DEspecialidades({ datos }: Grafico3DProps) {
  
  // --- MATEMÁTICA 3D (Calcula las alturas y posiciones basado en los props recibidos) ---
  const prepararDatos3D = () => {
    if (!datos || datos.length === 0) return [];

    // Encontrar el valor máximo para escalar las alturas
    const maxValor = Math.max(...datos.map((d: any) => Number(d.valor) || 0));
    const ALTURA_MAXIMA = 4;
    
    // Calcular separaciones para centrar el gráfico automáticamente
    const separacion = 1.8;
    const anchoTotal = (datos.length - 1) * separacion;
    const posicionInicialX = -(anchoTotal / 2);

    return datos.map((item: any, index: number) => ({
      ...item,
      // Altura dinámica: proporcional al valor máximo, pero con un mínimo de 0.5 para que la barra se vea
      height: maxValor > 0 ? Math.max((Number(item.valor) / maxValor) * ALTURA_MAXIMA, 0.5) : 0.5,
      pos: [posicionInicialX + (index * separacion), 0, 0] as [number, number, number]
    }));
  };

  const datosCalculados = prepararDatos3D();

  return (
    <div className="w-full h-full min-h-[450px] relative">
      {/* Ya no usamos <Card> aquí porque el contenedor con bordes/sombras ya está en el Page.tsx */}
      <Canvas camera={{ position: [0, 4, 8], fov: 45 }}>
        <Environment preset="city" />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />
        
        <group position={[0, -1, 0]}>
          {datosCalculados.map((d, i) => (
            <Barra3D 
              key={`${d.nombre}-${i}`} 
              position={d.pos} 
              height={d.height} 
              color={d.color} 
              label={d.nombre} 
              valor={d.valor} 
              detalle={d.desc} 
            />
          ))}
          
          {/* Base cilíndrica del gráfico */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[5, 5, 0.1, 64]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
          </mesh>
        </group>

        <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={1} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  )
}