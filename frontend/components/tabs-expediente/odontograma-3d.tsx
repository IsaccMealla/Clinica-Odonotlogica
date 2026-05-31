"use client";

import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

type CaraDiente = 'oclusal' | 'mesial' | 'distal' | 'vestibular' | 'lingual';

interface Odontograma3DProps {
  esPediatrico: boolean;
  data: Record<string, any>;
  hallazgoActivo: string;
  onCaraClick: (diente: number, cara: CaraDiente) => void;
}

// FDI - Piezas
const DIENTES_ADULTO_SUPERIOR = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const DIENTES_ADULTO_INFERIOR = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const DIENTES_DECIDUO_SUPERIOR = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DIENTES_DECIDUO_INFERIOR = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Mapa de colores por hallazgo
const HALLAZGO_COLORS: Record<string, string> = {
  'caries': '#ef4444',
  'obturacion': '#3b82f6',
  'sellante': '#22c55e',
  'corona': '#eab308',
  'ausente': '#1e293b',
  'fractura': '#f97316',
  'endodoncia': '#a855f7',
  'protesis': '#14b8a6',
  'sano': '#34d399',
};

const HALLAZGO_EMISSIVE: Record<string, string> = {
  'caries': '#991b1b',
  'obturacion': '#1e3a5f',
  'sellante': '#14532d',
  'corona': '#713f12',
  'ausente': '#0f172a',
  'fractura': '#9a3412',
  'endodoncia': '#581c87',
  'protesis': '#134e4a',
  'sano': '#064e3b',
};

// Constantes para el arco
const RADIO_X = 5.5;
const RADIO_Z = 4.2;

// ==========================================
// COMPONENTE CARA 3D INDIVIDUAL
// ==========================================
function Cara3D({
  position,
  rotation,
  scale,
  color,
  emissive,
  onClick,
  nombre,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  emissive: string;
  onClick: () => void;
  nombre: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={hovered ? '#60a5fa' : color}
        emissive={hovered ? '#1e40af' : emissive}
        emissiveIntensity={hovered ? 0.4 : 0.1}
        roughness={0.3}
        metalness={0.05}
      />
    </mesh>
  );
}

// ==========================================
// COMPONENTE DIENTE 3D CON 5 CARAS INTERACTIVAS
// ==========================================
function Diente3DInteractivo({
  numero,
  index,
  total,
  isUpper,
  data,
  hallazgoActivo,
  onCaraClick,
}: {
  numero: number;
  index: number;
  total: number;
  isUpper: boolean;
  data: Record<string, any>;
  hallazgoActivo: string;
  onCaraClick: (diente: number, cara: CaraDiente) => void;
}) {
  // Calcular posición en arco
  const position = useMemo(() => {
    const t = total > 1 ? (index / (total - 1)) * 2 - 1 : 0;
    const angle = t * Math.PI * 0.45;
    const x = Math.sin(angle) * RADIO_X;
    const z = Math.cos(angle) * RADIO_Z * (isUpper ? -1 : 1);
    const y = isUpper ? 1.2 : -1.2;
    return new THREE.Vector3(x, y, z);
  }, [index, total, isUpper]);

  const rotation = useMemo(() => {
    const t = total > 1 ? (index / (total - 1)) * 2 - 1 : 0;
    const angle = t * Math.PI * 0.45;
    return new THREE.Euler(0, isUpper ? -angle : angle, 0);
  }, [index, total, isUpper]);

  const isAusente = data[`${numero}_oclusal`] === 'ausente';

  // Obtener color para cada cara
  const getCaraVisual = (cara: CaraDiente) => {
    const key = `${numero}_${cara}`;
    const hallazgoId = data[key];
    if (hallazgoId && HALLAZGO_COLORS[hallazgoId]) {
      return {
        color: HALLAZGO_COLORS[hallazgoId],
        emissive: HALLAZGO_EMISSIVE[hallazgoId] || '#000000',
      };
    }
    return { color: '#f8fafc', emissive: '#000000' };
  };

  if (isAusente) return null;

  // Dimensiones del diente
  const W = 0.7;
  const H = 1.1;
  const D = 0.7;
  const faceThickness = 0.08;

  const caras: { cara: CaraDiente; pos: [number, number, number]; rot: [number, number, number]; sc: [number, number, number] }[] = [
    { cara: 'oclusal',    pos: [0, H/2 - faceThickness/2, 0],  rot: [0, 0, 0],              sc: [W * 0.65, faceThickness, D * 0.65] },
    { cara: 'vestibular', pos: [0, 0, D/2 - faceThickness/2],   rot: [0, 0, 0],              sc: [W * 0.9, H * 0.7, faceThickness] },
    { cara: 'lingual',    pos: [0, 0, -D/2 + faceThickness/2],  rot: [0, 0, 0],              sc: [W * 0.9, H * 0.7, faceThickness] },
    { cara: 'mesial',     pos: [-W/2 + faceThickness/2, 0, 0],  rot: [0, 0, 0],              sc: [faceThickness, H * 0.7, D * 0.9] },
    { cara: 'distal',     pos: [W/2 - faceThickness/2, 0, 0],   rot: [0, 0, 0],              sc: [faceThickness, H * 0.7, D * 0.9] },
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Cuerpo base del diente (estructura interna) */}
      <mesh>
        <boxGeometry args={[W * 0.85, H * 0.85, D * 0.85]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.5}
          metalness={0.0}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 5 caras interactivas */}
      {caras.map(({ cara, pos, rot, sc }) => {
        const visual = getCaraVisual(cara);
        return (
          <Cara3D
            key={cara}
            position={pos}
            rotation={rot}
            scale={sc}
            color={visual.color}
            emissive={visual.emissive}
            onClick={() => onCaraClick(numero, cara)}
            nombre={`${numero}-${cara}`}
          />
        );
      })}

      {/* Número del diente */}
      <Html
        position={[0, isUpper ? H/2 + 0.35 : -H/2 - 0.35, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          color: '#94a3b8',
          fontFamily: 'monospace',
          userSelect: 'none',
        }}>
          {numero}
        </span>
      </Html>
    </group>
  );
}

// ==========================================
// COMPONENTE DE CÁMARA CENTRADA
// ==========================================
function CameraAdjust() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 6, 11);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ==========================================
// COMPONENTE PRINCIPAL EXPORTADO
// ==========================================
export function Odontograma3D({ esPediatrico, data, hallazgoActivo, onCaraClick }: Odontograma3DProps) {
  const superiores = esPediatrico ? DIENTES_DECIDUO_SUPERIOR : DIENTES_ADULTO_SUPERIOR;
  const inferiores = esPediatrico ? DIENTES_DECIDUO_INFERIOR : DIENTES_ADULTO_INFERIOR;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[520px] bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 rounded-2xl overflow-hidden relative"
      style={{ contain: 'layout' }}
    >
      <Canvas
        camera={{ position: [0, 6, 11], fov: 42 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <CameraAdjust />
        <ambientLight intensity={0.6} />
        <spotLight position={[8, 12, 8]} angle={0.2} penumbra={1} intensity={1.2} castShadow />
        <pointLight position={[-8, -8, -8]} intensity={0.4} color="#a5b4fc" />
        <directionalLight position={[0, 10, 0]} intensity={0.3} />

        {/* Arcada Superior */}
        <group position={[0, 0.5, 0]}>
          {superiores.map((num, i) => (
            <Diente3DInteractivo
              key={num}
              numero={num}
              index={i}
              total={superiores.length}
              isUpper={true}
              data={data}
              hallazgoActivo={hallazgoActivo}
              onCaraClick={onCaraClick}
            />
          ))}
        </group>

        {/* Arcada Inferior */}
        <group position={[0, -0.5, 0]}>
          {inferiores.map((num, i) => (
            <Diente3DInteractivo
              key={num}
              numero={num}
              index={i}
              total={inferiores.length}
              isUpper={false}
              data={data}
              hallazgoActivo={hallazgoActivo}
              onCaraClick={onCaraClick}
            />
          ))}
        </group>

        <ContactShadows position={[0, -3.5, 0]} opacity={0.35} scale={22} blur={2.5} far={5} />
        <OrbitControls
          enablePan={true}
          minDistance={5}
          maxDistance={18}
          maxPolarAngle={Math.PI / 1.4}
          target={[0, 0, 0]}
          autoRotate={false}
        />
      </Canvas>

      {/* Overlay: Instrucciones */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Clic en cara para registrar hallazgo • Arrastre para rotar • Scroll para zoom
      </div>

      {/* Botón Pantalla Completa */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-xl backdrop-blur-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      {/* Leyenda del hallazgo activo */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm border border-white/10">
        Pintando: <span className="font-bold capitalize">{hallazgoActivo}</span>
        <span
          className="inline-block w-3 h-3 rounded-full ml-2 align-middle border border-white/30"
          style={{ backgroundColor: HALLAZGO_COLORS[hallazgoActivo] || '#ffffff' }}
        />
      </div>
    </div>
  );
}
