"use client"

import { useState, useCallback, useMemo } from "react"
import { Baby, User, Eye, Rotate3d, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Odontograma3D } from "./odontograma-3d"

// ==========================================
// DEFINICIÓN DE PIEZAS DENTALES
// ==========================================

// FDI - Piezas Permanentes Adulto (32 dientes)
const DIENTES_ADULTO_SUPERIOR = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const DIENTES_ADULTO_INFERIOR = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI - Piezas Deciduas/Temporales Niño (20 dientes)
const DIENTES_DECIDUO_SUPERIOR = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DIENTES_DECIDUO_INFERIOR = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Tipos de hallazgo por cara del diente
const HALLAZGOS = [
    { id: 'caries', label: 'Caries', color: 'bg-red-500', textColor: 'text-red-600' },
    { id: 'obturacion', label: 'Obturación', color: 'bg-clinica-primary/100', textColor: 'text-clinica-primary' },
    { id: 'sellante', label: 'Sellante', color: 'bg-clinica-secondary/100', textColor: 'text-clinica-secondary' },
    { id: 'corona', label: 'Corona', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { id: 'ausente', label: 'Ausente', color: 'bg-slate-800', textColor: 'text-slate-700' },
    { id: 'fractura', label: 'Fractura', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { id: 'endodoncia', label: 'Endodoncia', color: 'bg-purple-500', textColor: 'text-purple-600' },
    { id: 'protesis', label: 'Prótesis', color: 'bg-teal-500', textColor: 'text-teal-600' },
    { id: 'sano', label: 'Sano', color: 'bg-emerald-400', textColor: 'text-emerald-600' },
];

const CARAS_DIENTE = ['oclusal', 'mesial', 'distal', 'vestibular', 'lingual'] as const;
type CaraDiente = typeof CARAS_DIENTE[number];

interface OdontogramaDinamicoProps {
    pacienteId: string;
    esPediatrico: boolean;
    edadPaciente: number | null;
    data: Record<string, any>;
    onDataChange: (updater: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
}

export function OdontogramaDinamico({ pacienteId, esPediatrico, edadPaciente, data, onDataChange }: OdontogramaDinamicoProps) {
    const [vista, setVista] = useState<'2d' | '3d'>('2d');
    const [hallazgoActivo, setHallazgoActivo] = useState<string>('caries');
    const [dienteSeleccionado, setDienteSeleccionado] = useState<number | null>(null);

    // Seleccionar piezas según tipo de paciente
    const superiores = useMemo(() => esPediatrico ? DIENTES_DECIDUO_SUPERIOR : DIENTES_ADULTO_SUPERIOR, [esPediatrico]);
    const inferiores = useMemo(() => esPediatrico ? DIENTES_DECIDUO_INFERIOR : DIENTES_ADULTO_INFERIOR, [esPediatrico]);
    const totalPiezas = superiores.length + inferiores.length;

    // Manejador de clic en cara del diente
    const handleCaraClick = useCallback((diente: number, cara: CaraDiente) => {
        const key = `${diente}_${cara}`;
        onDataChange((prev: Record<string, any>) => {
            const current = prev[key];
            // Toggle: si ya tiene el mismo hallazgo, limpiar; si no, establecer
            if (current === hallazgoActivo) {
                const newData = { ...prev };
                delete newData[key];
                return newData;
            }
            return { ...prev, [key]: hallazgoActivo };
        });
    }, [hallazgoActivo, onDataChange]);

    // Obtener color de una cara (ahora retorna clase para fill de SVG)
    const getCaraColor = useCallback((diente: number, cara: CaraDiente) => {
        const key = `${diente}_${cara}`;
        const hallazgoId = data[key];
        if (!hallazgoId) return 'fill-white hover:fill-slate-100';
        const hallazgo = HALLAZGOS.find(h => h.id === hallazgoId);
        // Transformar 'bg-red-500' a 'fill-red-500'
        return hallazgo ? hallazgo.color.replace('bg-', 'fill-') : 'fill-white';
    }, [data]);

    // Contar hallazgos por tipo
    const conteoHallazgos = useMemo(() => {
        const conteo: Record<string, number> = {};
        Object.values(data).forEach(v => {
            if (typeof v === 'string') {
                conteo[v] = (conteo[v] || 0) + 1;
            }
        });
        return conteo;
    }, [data]);

    return (
        <div className="space-y-6">
            {/* Header del Odontograma */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {esPediatrico ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <Baby className="h-5 w-5 text-amber-600" />
                            <div>
                                <span className="font-bold text-amber-800 text-sm">Dentición Decidua</span>
                                <span className="text-xs text-amber-600 block">{totalPiezas} piezas temporales — Paciente de {edadPaciente} años</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-clinica-primary/10 border border-clinica-primary/20 rounded-xl">
                            <User className="h-5 w-5 text-clinica-primary" />
                            <div>
                                <span className="font-bold text-clinica-primary text-sm">Dentición Permanente</span>
                                <span className="text-xs text-clinica-primary block">{totalPiezas} piezas dentales</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Switch Vista 2D/3D */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border">
                    <button
                        onClick={() => setVista('2d')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            vista === '2d' ? 'bg-white shadow-sm text-clinica-primary' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Eye className="h-4 w-4" /> Vista 2D
                    </button>
                    <button
                        onClick={() => setVista('3d')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            vista === '3d' ? 'bg-white shadow-sm text-clinica-primary' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Rotate3d className="h-4 w-4" /> Vista 3D
                    </button>
                </div>
            </div>

            {/* Paleta de Hallazgos */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border">
                <span className="text-xs font-bold text-slate-500 uppercase self-center mr-2">Hallazgo:</span>
                {HALLAZGOS.map(h => (
                    <button
                        key={h.id}
                        onClick={() => setHallazgoActivo(h.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            hallazgoActivo === h.id
                                ? `${h.color} text-white border-transparent shadow-md scale-105`
                                : `bg-white ${h.textColor} border-slate-200 hover:border-current`
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${h.color}`} />
                        {h.label}
                        {conteoHallazgos[h.id] && (
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                                hallazgoActivo === h.id ? 'bg-white/30' : 'bg-slate-100'
                            }`}>
                                {conteoHallazgos[h.id]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {vista === '2d' ? (
                /* ==========================================
                   VISTA 2D — Diagrama interactivo de caras
                   ========================================== */
                <div className="space-y-8">
                    {/* Arcada Superior */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                            Arcada Superior
                        </h4>
                        <div className="flex justify-center gap-1 flex-wrap">
                            {superiores.map(num => (
                                <DienteInteractivo
                                    key={num}
                                    numero={num}
                                    data={data}
                                    hallazgoActivo={hallazgoActivo}
                                    onClick={handleCaraClick}
                                    getColor={getCaraColor}
                                    isSelected={dienteSeleccionado === num}
                                    onSelect={() => setDienteSeleccionado(dienteSeleccionado === num ? null : num)}
                                    esPediatrico={esPediatrico}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Línea divisoria */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Línea de oclusión
                        </span>
                        <div className="flex-1 h-px bg-slate-300" />
                    </div>

                    {/* Arcada Inferior */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                            Arcada Inferior
                        </h4>
                        <div className="flex justify-center gap-1 flex-wrap">
                            {inferiores.map(num => (
                                <DienteInteractivo
                                    key={num}
                                    numero={num}
                                    data={data}
                                    hallazgoActivo={hallazgoActivo}
                                    onClick={handleCaraClick}
                                    getColor={getCaraColor}
                                    isSelected={dienteSeleccionado === num}
                                    onSelect={() => setDienteSeleccionado(dienteSeleccionado === num ? null : num)}
                                    esPediatrico={esPediatrico}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* ==========================================
                   VISTA 3D — Renderizado con Three.js
                   ========================================== */
                <Odontograma3D esPediatrico={esPediatrico} data={data} hallazgoActivo={hallazgoActivo} onCaraClick={handleCaraClick} />
            )}

            {/* Resumen */}
            {Object.keys(conteoHallazgos).length > 0 && (
                <div className="p-4 bg-slate-50 border rounded-xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Resumen de Hallazgos</h4>
                    <div className="flex flex-wrap gap-3">
                        {HALLAZGOS.filter(h => conteoHallazgos[h.id]).map(h => (
                            <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg">
                                <span className={`w-3 h-3 rounded-full ${h.color}`} />
                                <span className="text-sm font-medium text-slate-700">{h.label}</span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {conteoHallazgos[h.id]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// COMPONENTE DE DIENTE INDIVIDUAL INTERACTIVO (ANATÓMICO SVG)
// ==========================================
function DienteInteractivo({
    numero,
    data,
    hallazgoActivo,
    onClick,
    getColor,
    isSelected,
    onSelect,
    esPediatrico,
}: {
    numero: number;
    data: Record<string, any>;
    hallazgoActivo: string;
    onClick: (diente: number, cara: CaraDiente) => void;
    getColor: (diente: number, cara: CaraDiente) => string;
    isSelected: boolean;
    onSelect: () => void;
    esPediatrico: boolean;
}) {
    const estaAusente = data[`${numero}_oclusal`] === 'ausente';
    
    // Determinar cuadrante y tipo de diente
    const strNum = numero.toString();
    const cuadrante = parseInt(strNum.charAt(0));
    const isUpper = [1, 2, 5, 6].includes(cuadrante); // Raíz hacia arriba
    const posicion = parseInt(strNum.charAt(1)); // 1-8
    
    // Determinar morfología base
    let tipoDiente: 'incisivo' | 'canino' | 'premolar' | 'molar' = 'incisivo';
    if (esPediatrico) {
        if (posicion <= 2) tipoDiente = 'incisivo';
        else if (posicion === 3) tipoDiente = 'canino';
        else tipoDiente = 'molar'; // Temporales 4 y 5 son molares
    } else {
        if (posicion <= 2) tipoDiente = 'incisivo';
        else if (posicion === 3) tipoDiente = 'canino';
        else if (posicion <= 5) tipoDiente = 'premolar';
        else tipoDiente = 'molar';
    }

    // Dibujar la raíz anatómica (dependiendo si es superior/inferior se rota todo el SVG después)
    // Para simplificar, dibujamos siempre asumiendo la corona abajo y raíz arriba.
    const renderRaiz = () => {
        if (tipoDiente === 'molar') {
            // Multirradicular (2 o 3 raíces)
            return (
                <path 
                    d="M 12 40 C 12 10, 5 5, 18 20 C 20 25, 20 25, 22 20 C 35 5, 28 10, 28 40" 
                    fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        } else if (tipoDiente === 'premolar') {
            // Raíz simple o bífida más delgada
            return (
                <path 
                    d="M 14 40 C 14 15, 17 5, 20 5 C 23 5, 26 15, 26 40" 
                    fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        } else if (tipoDiente === 'canino') {
            // Raíz muy larga y puntiaguda
            return (
                <path 
                    d="M 15 40 C 15 15, 20 0, 20 0 C 20 0, 25 15, 25 40" 
                    fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        } else {
            // Incisivo: raíz cónica
            return (
                <path 
                    d="M 14 40 C 14 15, 18 5, 20 5 C 22 5, 26 15, 26 40" 
                    fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        }
    };

    // Dibujar el contorno de la corona
    const renderCorona = () => {
        if (tipoDiente === 'molar') {
            return (
                <path 
                    d="M 10 40 Q 5 55 10 70 Q 20 75 30 70 Q 35 55 30 40 Z" 
                    fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        } else if (tipoDiente === 'canino') {
            return (
                <path 
                    d="M 14 40 Q 10 55 20 75 Q 30 55 26 40 Z" 
                    fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        } else {
            // Incisivo y premolar
            return (
                <path 
                    d="M 12 40 Q 10 60 14 70 Q 20 72 26 70 Q 30 60 28 40 Z" 
                    fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" 
                />
            );
        }
    };

    return (
        <div className={`flex flex-col items-center gap-1 transition-all ${isSelected ? 'scale-110 z-10' : ''}`}>
            {/* Si es SUPERIOR, el número va ARRIBA */}
            {isUpper && (
                <button
                    onClick={onSelect}
                    className={`text-[10px] font-bold px-1 py-0.5 rounded transition-colors cursor-pointer ${
                        isSelected 
                            ? 'bg-clinica-primary text-white' 
                            : 'text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    {numero}
                </button>
            )}

            {/* SVG Anatómico */}
            <div className={`relative ${estaAusente ? 'opacity-30' : ''}`} style={{ width: '40px', height: '80px' }}>
                <svg viewBox="0 0 40 80" width="100%" height="100%" className={!isUpper ? 'rotate-180' : ''}>
                    {/* Estructura anatómica de fondo */}
                    <g className="tooth-anatomy">
                        {renderRaiz()}
                        {renderCorona()}
                    </g>
                </svg>

                {/* SUPERPOSICIÓN: Mapa de Interacción de las 5 Caras */}
                <div 
                    className="absolute inset-0 flex items-center justify-center" 
                    style={{ top: isUpper ? '15px' : '-15px' }} // Ajuste para centrar sobre la corona
                >
                    <svg viewBox="0 0 30 30" width="24" height="24" className="drop-shadow-sm">
                        {/* Vestibular (Arriba) */}
                        <polygon 
                            points="0,0 30,0 22.5,7.5 7.5,7.5" 
                            className={`stroke-slate-300 stroke-[1px] transition-colors cursor-pointer ${getColor(numero, 'vestibular')}`}
                            onClick={() => onClick(numero, 'vestibular')}
                        />
                        {/* Mesial (Izquierda) */}
                        <polygon 
                            points="0,0 7.5,7.5 7.5,22.5 0,30" 
                            className={`stroke-slate-300 stroke-[1px] transition-colors cursor-pointer ${getColor(numero, 'mesial')}`}
                            onClick={() => onClick(numero, 'mesial')}
                        />
                        {/* Distal (Derecha) */}
                        <polygon 
                            points="30,0 22.5,7.5 22.5,22.5 30,30" 
                            className={`stroke-slate-300 stroke-[1px] transition-colors cursor-pointer ${getColor(numero, 'distal')}`}
                            onClick={() => onClick(numero, 'distal')}
                        />
                        {/* Lingual / Palatino (Abajo) */}
                        <polygon 
                            points="0,30 7.5,22.5 22.5,22.5 30,30" 
                            className={`stroke-slate-300 stroke-[1px] transition-colors cursor-pointer ${getColor(numero, 'lingual')}`}
                            onClick={() => onClick(numero, 'lingual')}
                        />
                        {/* Oclusal / Incisal (Centro) */}
                        <polygon 
                            points="7.5,7.5 22.5,7.5 22.5,22.5 7.5,22.5" 
                            className={`stroke-slate-300 stroke-[1px] transition-colors cursor-pointer ${getColor(numero, 'oclusal')}`}
                            onClick={() => onClick(numero, 'oclusal')}
                        />
                    </svg>
                </div>
            </div>

            {/* Si es INFERIOR, el número va ABAJO */}
            {!isUpper && (
                <button
                    onClick={onSelect}
                    className={`text-[10px] font-bold px-1 py-0.5 rounded transition-colors cursor-pointer ${
                        isSelected 
                            ? 'bg-clinica-primary text-white' 
                            : 'text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    {numero}
                </button>
            )}
        </div>
    );
}
