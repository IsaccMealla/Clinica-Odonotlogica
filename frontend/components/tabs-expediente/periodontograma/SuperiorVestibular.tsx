"use client";

import React, { useState } from "react"
import { Input } from "@/components/ui/input"

type DienteData = {
  movilidad: string;
  implante: boolean;
  sangrado: [boolean, boolean, boolean];
  supuracion: [boolean, boolean, boolean];
  margen: [number, number, number];
  sondaje: [number, number, number];
}

// 16 dientes superiores (18 al 28)
const dientesSuperiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];

const estadoInicial: Record<number, DienteData> = {};
dientesSuperiores.forEach(num => {
  estadoInicial[num] = {
    movilidad: "", implante: false,
    sangrado: [false, false, false], supuracion: [false, false, false],
    margen: [0, 0, 0], sondaje: [0, 0, 0],
  };
});

// === COORDENADAS EXACTAS ===
const coordenadasX: Record<number, [number, number, number]> = {
  18: [21, 39, 57],
  17: [71, 90, 109],
  16: [121, 146, 171],
  15: [184, 196.5, 209],
  14: [224, 236, 248],
  13: [263, 275.5, 288],
  12: [306, 317.5, 329],
  11: [346, 361, 376],
  21: [413, 428, 443],
  22: [460, 471.5, 483],
  23: [500, 513, 526],
  24: [541, 553, 565],
  25: [579, 591.5, 605],
  26: [617, 642.5, 668],
  27: [680, 699, 718],
  28: [733, 750, 767]
};

// === ANCHOS DINÁMICOS POR DIENTE ===
const anchosDientes: Record<number, number> = {
  18: 61.5,  17: 52.5,  16: 61.0,  15: 41.0, 
  14: 40.5,  13: 41.5,  12: 38.5,  11: 58.0,
  21: 58.0,  22: 39.0,  23: 41.5,  24: 40.0, 
  25: 41.5,  26: 61.5,  27: 51.5,  28: 62.5
};

// === AJUSTES DINÁMICOS DE IMPLANTES ===
const ajustesImplantes: Record<number, { width: number, offsetX: number, offsetY: number, height: number }> = {
  18: { width: 55, offsetX: -1.5,  offsetY: 16, height: 125 },
  17: { width: 47, offsetX: 2,  offsetY: 16, height: 130 },
  16: { width: 60, offsetX: 0.5,  offsetY: 16, height: 130 },
  15: { width: 27, offsetX: 7, offsetY: 16, height: 125 },
  14: { width: 26, offsetX: 8, offsetY: 16, height: 125 },
  13: { width: 27, offsetX: 8, offsetY: 16, height: 130 },
  12: { width: 36, offsetX:0.5, offsetY: 5, height: 120 },
  11: { width: 42, offsetX: 12, offsetY: 16, height: 125 },
  21: { width: 57, offsetX: -3, offsetY: 13, height: 125 },
  22: { width: 37, offsetX: 1, offsetY: 1, height: 120 },
  23: { width: 26, offsetX: 8, offsetY: 16, height: 130 },
  24: { width: 24, offsetX: 8, offsetY: 16, height: 125 },
  25: { width: 27, offsetX: 7.5, offsetY: 16, height: 125 },
  26: { width: 60, offsetX: 0,  offsetY: 15, height: 130 },
  27: { width: 40, offsetX: 5.5,  offsetY: 16, height: 130 },
  28: { width: 60, offsetX: 6,  offsetY: 1, height: 120 },
};

const getMovilidadEstilo = (grado: string) => {
  switch (grado) {
    case 'I': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'II': return 'bg-orange-200 text-orange-900 border-orange-400 font-semibold';
    case 'III': return 'bg-red-200 text-red-900 border-red-500 font-bold';
    default: return 'bg-white text-slate-500 border-slate-200';
  }
};

export function SuperiorVestibular() {
  const [datos, setDatos] = useState(estadoInicial);

  const updateDiente = (pieza: number, campo: keyof DienteData, valor: any) => {
    setDatos(prev => ({ ...prev, [pieza]: { ...prev[pieza], [campo]: valor } }));
  };

  const updateArray = (pieza: number, campo: 'sangrado' | 'supuracion' | 'margen' | 'sondaje', index: number, valor: any) => {
    setDatos(prev => {
      const nuevoArray = [...prev[pieza][campo]] as any;
      nuevoArray[index] = valor;
      return { ...prev, [pieza]: { ...prev[pieza], [campo]: nuevoArray } };
    });
  };

  // --- CONSTANTES MATEMÁTICAS ---
  const viewBoxAncho = 790;
  const viewBoxAlto = 162;
  const altoCanvas = 210; // ❤️ AJUSTADO A 210 PARA MANTENER LA PROPORCIÓN
  
  // 📍 [EDITAR AQUÍ]: Altura de la línea recta azul/roja. 
  // Aumenta el número para bajar la línea, disminúyelo para subirla.
  const yLAC = 105; 
  const escala = 6.45; 

  const ptsMargenArr: string[] = [];
  const ptsSondajeArr: string[] = [];

  dientesSuperiores.forEach((pieza) => {
    const d = datos[pieza];
    const xs = coordenadasX[pieza];
    
    xs.forEach((x, index) => {
      const m = Number(d.margen[index]) || 0;
      const s = Number(d.sondaje[index]) || 0;
      
      // 📍 [EDITAR AQUÍ]: Ahora usamos "+" para que la gráfica vaya hacia ABAJO.
      // Si algún día necesitas que vaya hacia arriba, cámbialo por "-".
      const yMargen = yLAC + (m * escala);
      const ySondaje = yLAC + ((m + s) * escala); 
      
      ptsMargenArr.push(`${x},${yMargen}`);
      ptsSondajeArr.push(`${x},${ySondaje}`);
    });
  });

  const ptsMargenStr = ptsMargenArr.join(' ');
  const ptsSondajeStr = ptsSondajeArr.join(' ');
  const poligonBolsaStr = `${ptsMargenStr} ${[...ptsSondajeArr].reverse().join(' ')}`;

  return (
    <div className="w-full space-y-4 font-sans bg-white p-2 rounded-xl">
      <div className="flex justify-between items-center bg-blue-50/80 p-4 rounded-xl border border-blue-100 shadow-sm">
        <h3 className="font-bold text-lg text-blue-900">Arcada Superior (Vestibular) - Modo Clínico</h3>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar rounded-xl">
        <div className="flex min-w-[1000px] lg:min-w-max border border-slate-300 rounded-lg bg-white shadow-md relative">
          
          {/* COLUMNA 1: ETIQUETAS FIJAS */}
          <div className="sticky left-0 z-20 flex flex-col w-[130px] bg-slate-100/95 backdrop-blur-sm font-bold text-xs text-slate-700 border-r-2 border-slate-300 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.05)]">
            <div className="h-10 border-b border-slate-300 flex items-center px-3">Pieza</div>
            <div className="h-10 border-b border-slate-300 flex items-center px-3">Movilidad</div>
            <div className="h-8 border-b border-slate-300 flex items-center px-3">Implante</div>
            <div className="h-8 border-b border-slate-300 flex items-center px-3 text-red-600">BOP (Sangra)</div>
            <div className="h-8 border-b border-slate-300 flex items-center px-3 text-yellow-600">Supuración</div>
            <div className="h-10 border-b border-slate-300 flex items-center px-3 text-blue-700">Margen (MG)</div>
            <div className="h-10 border-b border-slate-300 flex items-center px-3 text-red-700">Sondaje (PS)</div>
            <div className="h-10 border-b-2 border-slate-400 flex items-center px-3 bg-emerald-50 text-emerald-700 shadow-inner">NIC (Inserción)</div>
            <div className="h-[210px] flex items-center justify-center text-slate-400 bg-white border-r-2 border-slate-300"> {/* ❤️ AJUSTADO A 210px */}
              Gráfico 2D
            </div>
          </div>

          {/* COLUMNA 2: DATOS Y GRÁFICO */}
          {/* ❤️ ANCHO FIJO A 1000px PARA EVITAR EL ESTIRAMIENTO HORIZONTAL */}
          <div className="flex flex-col shrink-0 w-[1000px]">
            
            {/* TABLA DE INPUTS */}
            <div className="flex w-full">
              {dientesSuperiores.map((pieza) => {
                const d = datos[pieza];
                const nic = [
                  (Number(d.margen[0]) || 0) + (Number(d.sondaje[0]) || 0),
                  (Number(d.margen[1]) || 0) + (Number(d.sondaje[1]) || 0),
                  (Number(d.margen[2]) || 0) + (Number(d.sondaje[2]) || 0)
                ];

                const anchoPorcentaje = (anchosDientes[pieza] / viewBoxAncho) * 100;

                return (
                  <div key={pieza} className="flex flex-col border-r border-slate-200 shrink-0 hover:bg-slate-50/50 transition-colors" style={{ width: `${anchoPorcentaje}%` }}>
                    <div className="h-10 border-b border-slate-300 flex items-center justify-center font-extrabold text-[15px] bg-slate-50 text-slate-800">{pieza}</div>
                    
                    <div className="h-10 border-b border-slate-300 flex items-center justify-center p-1">
                      <select 
                        className={`w-[85%] max-w-[45px] text-center text-[11px] py-1 rounded border outline-none cursor-pointer shadow-sm transition-colors ${getMovilidadEstilo(d.movilidad)}`}
                        value={d.movilidad} 
                        onChange={e => updateDiente(pieza, 'movilidad', e.target.value)}
                      >
                        <option value="">-</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                      </select>
                    </div>
                    
                    <div className="h-8 border-b border-slate-300 flex items-center justify-center bg-slate-50/30">
                      <input type="checkbox" checked={d.implante} onChange={e => updateDiente(pieza, 'implante', e.target.checked)} className="cursor-pointer w-3.5 h-3.5 accent-slate-600 rounded" />
                    </div>

                    <div className="h-8 border-b border-slate-300 grid grid-cols-3 items-center justify-items-center bg-red-50/20 px-0.5">
                      {[0, 1, 2].map(i => <input key={`sang-${i}`} type="checkbox" checked={d.sangrado[i]} onChange={e => updateArray(pieza, 'sangrado', i, e.target.checked)} className="w-3.5 h-3.5 cursor-pointer accent-red-500 rounded-sm" />)}
                    </div>

                    <div className="h-8 border-b border-slate-300 grid grid-cols-3 items-center justify-items-center bg-yellow-50/20 px-0.5">
                      {[0, 1, 2].map(i => <input key={`sup-${i}`} type="checkbox" checked={d.supuracion[i]} onChange={e => updateArray(pieza, 'supuracion', i, e.target.checked)} className="w-3.5 h-3.5 cursor-pointer accent-yellow-400 rounded-sm" />)}
                    </div>

                    <div className="h-10 border-b border-slate-300 grid grid-cols-3 items-center justify-items-center gap-0.5 px-0.5">
                      {[0, 1, 2].map(i => (
                        <Input key={`mg-${i}`} type="number" value={d.margen[i] === 0 ? '' : d.margen[i]} onChange={e => updateArray(pieza, 'margen', i, e.target.value)} className="h-7 w-[90%] p-0 text-center text-xs text-blue-700 font-bold border-blue-200 focus-visible:ring-blue-400 focus-visible:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ))}
                    </div>

                    <div className="h-10 border-b border-slate-300 grid grid-cols-3 items-center justify-items-center gap-0.5 px-0.5">
                      {[0, 1, 2].map(i => (
                        <Input key={`ps-${i}`} type="number" value={d.sondaje[i] === 0 ? '' : d.sondaje[i]} onChange={e => updateArray(pieza, 'sondaje', i, e.target.value)} className="h-7 w-[90%] p-0 text-center text-xs text-red-700 font-bold border-red-200 focus-visible:ring-red-400 focus-visible:border-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ))}
                    </div>

                    <div className="h-10 border-b-2 border-slate-400 grid grid-cols-3 items-center justify-items-center bg-emerald-50/80 text-[11px] font-extrabold text-emerald-800">
                      <span>{nic[0]}</span>
                      <span>{nic[1]}</span>
                      <span>{nic[2]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ZONA DEL GRÁFICO */}
            <div className="relative w-full overflow-hidden bg-[#eef2f6]" style={{ height: `${altoCanvas}px` }}>
              
              {/* IMAGEN DE FONDO BASE (Vestibular) */}
              <img 
                src="/img/dientes/superior-vestibular.jpg" 
                alt="Raíces de los dientes Vestibulares"
                className="absolute inset-0 w-full h-full object-fill opacity-75 grayscale"
              />

              {/* OVERLAY SVG PARA GRILLA, IMPLANTES Y DIBUJO DE BOLSAS */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                viewBox={`0 0 ${viewBoxAncho} ${viewBoxAlto}`}
                preserveAspectRatio="none" 
              >
                {/* 1. Grilla Milimetrada (Se dibuja al fondo del SVG) */}
                {Array.from({ length: 26 }).map((_, i) => {
                  const step = i - 10; 
                  const y = yLAC + (step * escala); 
                  if (y < 0 || y > viewBoxAlto) return null; 
                  return (
                    <line key={`grid-${y}`} x1="0" y1={y} x2={viewBoxAncho} y2={y} stroke="#94a3b8" strokeWidth={step === 0 ? "1.5" : "0.5"} opacity={step === 0 ? "1" : "0.4"} strokeDasharray={step % 5 === 0 || step === 0 ? "none" : "2 2"} />
                  )
                })}

                {/* 2. RENDERIZADO DE IMPLANTES (Tapan la grilla y la imagen base gracias a su fondo sólido) */}
                {dientesSuperiores.map((pieza) => {
                  if (!datos[pieza].implante) return null;
                  
                  const ancho = anchosDientes[pieza];
                  const centroX = coordenadasX[pieza][1];
                  const xPos = centroX - (ancho / 2);

                  const ajuste = ajustesImplantes[pieza] || { width: 41, offsetX: 11, offsetY: -7, height: 125 };
                  
                  // 📍 [EDITAR AQUÍ]: Le restamos la altura (ajuste.height) a yLAC 
                  // para que la imagen se dibuje POR ENCIMA de la línea azul.
                  const yImplante = yLAC - ajuste.height + ajuste.offsetY;

                  // Calculamos el centro exacto de la imagen para rotarla
                  const cx = xPos + ajuste.offsetX + (ajuste.width / 2);
                  const cy = yImplante + (ajuste.height / 2);

                  return (
                    <image 
                      key={`img-implante-${pieza}`}
                      href={`/img/implants/2/${pieza}b.png`}  // <-- ¡AQUÍ ESTÁ EL CAMBIO A "b.png"!
                      x={xPos + ajuste.offsetX}
                      y={yImplante} 
                      width={ajuste.width}
                      height={ajuste.height} 
                      preserveAspectRatio="xMidYMin slice"
                      // 📍 [EDITAR AQUÍ]: Rota 180° para que apunte hacia arriba.
                      
                    />
                  );
                })}

                {/* 3. POLÍGONO DE BOLSA PERIODONTAL */}
                <polygon points={poligonBolsaStr} fill="#000080" fillOpacity="0.25" stroke="none" />
                
                {/* 4. LÍNEAS DE MARGEN Y SONDAJE */}
                <polyline points={ptsMargenStr} stroke="#2563eb" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                <polyline points={ptsSondajeStr} stroke="#ef4444" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                
                {/* 5. PUNTOS Y MARCADORES (Sangrado, supuración) */}
                {dientesSuperiores.map((pieza) => {
                  const d = datos[pieza];
                  const xs = coordenadasX[pieza];
                  
                  return xs.map((x, index) => {
                    const m = Number(d.margen[index]) || 0;
                    const s = Number(d.sondaje[index]) || 0;
                    
                    // 📍 [EDITAR AQUÍ]: También usamos "+" en los puntos para que bajen.
                    const cyMargen = yLAC + (m * escala);
                    const cySondaje = yLAC + ((m + s) * escala);

                    return (
                      <g key={`puntos-${pieza}-${index}`}>
                        <circle cx={x} cy={cyMargen} r="1.5" fill="#1e40af" />
                        {s > 0 && <circle cx={x} cy={cySondaje} r="1.5" fill="#ef4444" />}
                        
                        {d.sangrado[index] && (
                          <circle cx={x - 3} cy={cyMargen + 6} r="1.8" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
                        )}
                        {d.supuracion[index] && (
                          <circle cx={x + 3} cy={cyMargen + 6} r="1.8" fill="#eab308" stroke="#ffffff" strokeWidth="0.6" />
                        )}
                      </g>
                    )
                  });
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}