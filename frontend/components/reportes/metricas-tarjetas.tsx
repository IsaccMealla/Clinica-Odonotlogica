"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, FileText, Activity, Stethoscope, Palette } from "lucide-react"

interface MetricasProps {
  datos: any[];
  activas: string[];
  onToggle: (nombre: string) => void;
  colores: Record<string, string>;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>, nombre: string) => void;
}

export function MetricasTarjetas({ datos, activas, onToggle, colores, onColorChange }: MetricasProps) {
  
  const getIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("estudiant") || n.includes("docent") || n.includes("pacient") || n.includes("usuario")) return Users;
    if (n.includes("periodoncia") || n.includes("ortodoncia") || n.includes("riesgo")) return Activity;
    if (n.includes("general") || n.includes("tratamiento") || n.includes("clinico")) return Stethoscope;
    return FileText;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {datos.map((stat, index) => {
        const estaActiva = activas.includes(stat.nombre);
        const colorActual = colores[stat.nombre] || stat.color || "#3b82f6";
        const Icono = getIcon(stat.nombre);

        return (
          <Card 
            key={index} 
            onClick={() => onToggle(stat.nombre)}
            className={`border-2 cursor-pointer transition-all duration-300 transform relative overflow-hidden
              ${estaActiva 
                ? "bg-white shadow-md hover:-translate-y-1" 
                : "bg-slate-50 border-transparent opacity-60 hover:opacity-100 grayscale"
              }`}
            style={{ borderColor: estaActiva ? colorActual : "transparent" }}
          >
            {estaActiva && <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: colorActual }}></div>}

            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="p-3 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: estaActiva ? `${colorActual}20` : '#e2e8f0' }} 
                >
                  <Icono 
                    className="h-6 w-6" 
                    style={{ color: estaActiva ? colorActual : '#64748b' }} 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.nombre}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stat.valor}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium hidden lg:block">{stat.desc}</p>
                </div>
              </div>

              {/* CONTROLES DE COLOR ARREGLADOS */}
              {estaActiva && (
                <div 
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg transition-colors z-10"
                  onClick={(e) => e.stopPropagation()} 
                >
                  <Palette className="w-4 h-4 text-slate-400 ml-1" />
                  <input 
                    type="color" 
                    value={colorActual}
                    onChange={(e) => onColorChange(e, stat.nombre)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                    title="Seleccionar nuevo color"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}