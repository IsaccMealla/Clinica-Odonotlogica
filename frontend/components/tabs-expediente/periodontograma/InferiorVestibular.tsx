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

// 16 dientes inferiores (48 al 38)
const dientesInferiores = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const estadoInicial: Record<number, DienteData> = {};
dientesInferiores.forEach(num => {
  estadoInicial[num] = {
    movilidad: "", implante: false,
    sangrado: [false, false, false], supuracion: [false, false, false],
    margen: [0, 0, 0], sondaje: [0, 0, 0],
  };
});

// === COORDENADAS EXACTAS ===
const coordenadasX: Record<number, [number, number, number]> = {
  48: [23, 44, 65],
  47: [83, 105.5, 128],
  46: [145, 167.5, 190],
  45: [214, 223, 232],
  44: [253, 262.5, 272],
  43: [290, 299.5, 309],
  42: [327, 336, 345],
  41: [360, 369, 378],
  31: [411, 420, 429],
  32: [444, 453, 462],
  33: [480, 489.5, 499],
  34: [517, 526.5, 536],
  35: [557, 566, 575],
  36: [599, 621.5, 644],
  37: [661, 683.5, 706],
  38: [723, 744.5, 766]
};

// === ANCHOS DINÁMICOS POR DIENTE ===
const anchosDientes: Record<number, number> = {
  48: 61.5,  47: 52.5,  46: 61.0,  45: 41.0, 
  44: 40.5,  43: 41.5,  42: 38.5,  41: 58.0,
  31: 58.0,  32: 39.0,  33: 41.5,  34: 40.0, 
  35: 41.5,  36: 61.5,  37: 51.5,  38: 62.5
};

// === AJUSTES DINÁMICOS DE IMPLANTES ===
const ajustesImplantes: Record<number, { width: number, offsetX: number, offsetY: number, height: number }> = {
  48: { width: 55, offsetX: 3,  offsetY: -14, height: 125 },
  47: { width: 55, offsetX: -1.5,  offsetY: -14, height: 130 },
  46: { width: 56, offsetX: 3,  offsetY: -14, height: 130 },
  45: { width: 22, offsetX: 8.5, offsetY: -12, height: 115 },
  44: { width: 24, offsetX: 7, offsetY: -14, height: 125 },
  43: { width: 27, offsetX: 5, offsetY: -14, height: 130 },
  42: { width: 36, offsetX: 0.4, offsetY: -14, height: 120 },
  41: { width: 41.5, offsetX: 13.5, offsetY: -14, height: 125 },
  31: { width: 40, offsetX: 4.5, offsetY: -14, height: 125 },
  32: { width: 35, offsetX: 3, offsetY: -14, height: 120 },
  33: { width: 24, offsetX: 9, offsetY: -13, height: 118 },
  34: { width: 22, offsetX: 10, offsetY: -13, height: 115 },
  35: { width: 24, offsetX: 8.5, offsetY: -13, height: 120 },
  36: { width: 58, offsetX: 1.5,  offsetY: -14, height: 130 },
  37: { width: 55, offsetX: -2,  offsetY: -14, height: 130 },
  38: { width: 77, offsetX: 1,  offsetY: -14, height: 120 },
};

const getMovilidadEstilo = (grado: string) => {
  switch (grado) {
    case 'I': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'II': return 'bg-orange-200 text-orange-900 border-orange-400 font-semibold';
    case 'III': return 'bg-red-200 text-red-900 border-red-500 font-bold';
    default: return 'bg-white text-slate-500 border-slate-200';
  }
};

export function InferiorVestibular() {
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
  
  const yLAC = 59; 
  const escala = 6.45; 

  const ptsMargenArr: string[] = [];
  const ptsSondajeArr: string[] = [];

  dientesInferiores.forEach((pieza) => {
    const d = datos[pieza];
    const xs = coordenadasX[pieza];
    
    xs.forEach((x, index) => {
      const m = Number(d.margen[index]) || 0;
      const s = Number(d.sondaje[index]) || 0;
      
      // ✅ [AJUSTE APLICADO]: Se usa "-" para que la bolsa crezca hacia arriba en la gráfica
      const yMargen = yLAC - (m * escala);
      const ySondaje = yLAC - ((m + s) * escala); 
      
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
        <h3 className="font-bold text-lg text-blue-900">Arcada Inferior (Vestibular) - Modo Clínico</h3>
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
              {dientesInferiores.map((pieza) => {
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
              
              <img 
                src="/img/dientes/inferior-vestibular.jpg" 
                alt="Raíces de los dientes Inferiores Vestibulares"
                className="absolute inset-0 w-full h-full object-fill opacity-75 grayscale"
              />

              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                viewBox={`0 0 ${viewBoxAncho} ${viewBoxAlto}`}
                preserveAspectRatio="none" 
              >
                {/* 1. Grilla Milimetrada */}
                {Array.from({ length: 26 }).map((_, i) => {
                  const step = i - 10; 
                  // ✅ [NOTA]: La grilla se dibuja en ambas direcciones desde el LAC
                  const y = yLAC + (step * escala); 
                  if (y < 0 || y > viewBoxAlto) return null; 
                  return (
                    <line key={`grid-${y}`} x1="0" y1={y} x2={viewBoxAncho} y2={y} stroke="#94a3b8" strokeWidth={step === 0 ? "1.5" : "0.5"} opacity={step === 0 ? "1" : "0.4"} strokeDasharray={step % 5 === 0 || step === 0 ? "none" : "2 2"} />
                  )
                })}

                {/* 2. RENDERIZADO DE IMPLANTES */}
                {dientesInferiores.map((pieza) => {
                  if (!datos[pieza].implante) return null;
                  
                  const ancho = anchosDientes[pieza];
                  const centroX = coordenadasX[pieza][1];
                  const xPos = centroX - (ancho / 2);

                  const ajuste = ajustesImplantes[pieza] || { width: 41, offsetX: 11, offsetY: -7, height: 125 };
                  
                  // ✅ [AJUSTE APLICADO]: Ahora se suma a yLAC para que el implante crezca hacia abajo (debajo de la línea)
                  const yImplante = yLAC + ajuste.offsetY;

                  return (
                    <image 
                      key={`img-implante-${pieza}`}
                      href={`/img/implants/3/${pieza}b.png`}
                      x={xPos + ajuste.offsetX}
                      y={yImplante} 
                      width={ajuste.width}
                      height={ajuste.height} 
                      preserveAspectRatio="xMidYMin slice"
                    />
                  );
                })}

                {/* 3. POLÍGONO DE BOLSA PERIODONTAL */}
                <polygon points={poligonBolsaStr} fill="#000080" fillOpacity="0.25" stroke="none" />
                
                {/* 4. LÍNEAS DE MARGEN Y SONDAJE */}
                <polyline points={ptsMargenStr} stroke="#2563eb" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                <polyline points={ptsSondajeStr} stroke="#ef4444" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                
                {/* 5. PUNTOS Y MARCADORES (Sangrado, supuración) */}
                {dientesInferiores.map((pieza) => {
                  const d = datos[pieza];
                  const xs = coordenadasX[pieza];
                  
                  return xs.map((x, index) => {
                    const m = Number(d.margen[index]) || 0;
                    const s = Number(d.sondaje[index]) || 0;
                    
                    // ✅ [AJUSTE APLICADO]: Puntos usan "-" para ir hacia arriba
                    const cyMargen = yLAC - (m * escala);
                    const cySondaje = yLAC - ((m + s) * escala);

                    return (
                      <g key={`puntos-${pieza}-${index}`}>
                        <circle cx={x} cy={cyMargen} r="1.5" fill="#1e40af" />
                        {s > 0 && <circle cx={x} cy={cySondaje} r="1.5" fill="#ef4444" />}
                        
                        {d.sangrado[index] && (
                          <circle cx={x - 3} cy={cyMargen - 6} r="1.8" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
                        )}
                        {d.supuracion[index] && (
                          <circle cx={x + 3} cy={cyMargen - 6} r="1.8" fill="#eab308" stroke="#ffffff" strokeWidth="0.6" />
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