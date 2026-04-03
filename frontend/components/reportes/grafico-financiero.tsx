"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Wallet, ShieldCheck, ArrowUpRight, BarChart3 } from "lucide-react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sparkles } from "@react-three/drei"
import * as THREE from "three"

// --- 1. COMPONENTE 3D: Holograma Financiero ---
function HologramaFinanciero() {
  const anilloref = useRef<THREE.Mesh>(null);
  const nucleoRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (anilloref.current) {
      anilloref.current.rotation.x += delta * 0.3;
      anilloref.current.rotation.y += delta * 0.5;
    }
    if (nucleoRef.current) {
      nucleoRef.current.rotation.y -= delta * 1.2;
      nucleoRef.current.rotation.x += delta * 0.8;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.5}>
      {/* Anillo exterior */}
      <mesh ref={anilloref}>
        <torusGeometry args={[1.6, 0.15, 16, 64]} />
        <meshPhysicalMaterial 
          color="#10b981" 
          metalness={0.7} 
          roughness={0.2} 
          transmission={0.8} 
          thickness={0.5}
          clearcoat={1}
        />
      </mesh>

      {/* Núcleo brillante */}
      <mesh ref={nucleoRef}>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={0.8} wireframe />
      </mesh>

      <Sparkles count={80} scale={4.5} size={2.5} speed={0.4} opacity={0.6} color="#6ee7b7" />
    </Float>
  );
}

// --- 2. TOOLTIP PERSONALIZADO ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-xl min-w-[150px]">
        <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="flex items-center justify-between gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm bg-emerald-500"></div>
            <span className="text-slate-500">Ingresos:</span>
          </div>
          <span className="text-emerald-700 font-bold">${payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

// --- 3. COMPONENTE PRINCIPAL ---
export function GraficoFinanciero({ datos }: { datos: any[] }) {
  // Cálculos automáticos para llenar las nuevas tarjetas
  const totalIngresos = datos.reduce((acc, curr) => acc + (curr.ingresos || 0), 0);
  const promedioMensual = datos.length > 0 ? Math.round(totalIngresos / datos.length) : 0;

  return (
    <Card className="shadow-lg border-slate-200 bg-white h-full flex flex-col rounded-[2rem] overflow-hidden">
      
      {/* HEADER: Ahora con fondo interactivo y más elementos */}
      <CardHeader className="relative border-b border-slate-100 py-8 px-6 md:px-10 bg-white overflow-hidden rounded-t-[2rem]">
        
        {/* Luces de fondo (Blobs) para quitar lo aburrido del blanco */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-32 -left-20 w-96 h-96 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute top-10 right-0 w-80 h-80 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 w-full">
          
          {/* COLUMNA IZQUIERDA: Textos e Insignias */}
          <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
            <div>
              <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-emerald-600" />
                Flujo Financiero Mensual
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1 text-base">
                Registro histórico de ingresos de la clínica
              </CardDescription>
            </div>
            {/* Badges para llenar espacio visualmente */}
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Datos Cifrados
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +12% vs Año Anterior
              </span>
            </div>
          </div>

          {/* CENTRO: Moneda 3D (Holograma) */}
          <div className="w-[260px] h-[260px] relative flex-shrink-0 flex items-center justify-center">
            {/* Círculo de luz brillante detrás de la moneda */}
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-2xl animate-pulse"></div>
            <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={3} />
              <directionalLight position={[-5, -5, -5]} intensity={1} color="#34d399" />
              <HologramaFinanciero />
            </Canvas>
          </div>

          {/* COLUMNA DERECHA: Tarjetas de Métricas */}
          <div className="flex-1 flex flex-col items-end justify-center space-y-3 w-full">
            
            {/* Tarjeta Principal: Total */}
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full max-w-[240px]">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Total del Periodo
              </p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">${totalIngresos.toLocaleString()}</p>
            </div>

            {/* Tarjeta Secundaria: Promedio */}
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center justify-between w-full max-w-[240px]">
              <div className="flex flex-col">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Promedio Mensual</p>
                <p className="text-lg font-bold text-slate-700">${promedioMensual.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-slate-300" />
            </div>

          </div>
        </div>
      </CardHeader>

      {/* CONTENIDO DEL GRÁFICO (El área verde) */}
      <CardContent className="p-0 bg-white border-t border-slate-50">
        <div className="h-[360px] w-full p-6 pt-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} tickFormatter={(val) => `$${val}`} />
              
              <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}} />
              
              <Area 
                type="monotone" 
                dataKey="ingresos" 
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorIngresos)" 
                activeDot={{r: 8, strokeWidth: 0, fill: '#059669', style: {filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))'}}} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}