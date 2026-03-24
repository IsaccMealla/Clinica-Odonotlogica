"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// --- COMPONENTE SWITCH PERSONALIZADO (Reutilizado para mantener el diseño) ---
function BotonSwitch({ 
  checked, 
  onCheckedChange, 
  id 
}: { 
  checked: boolean; 
  onCheckedChange: (c: boolean) => void; 
  id?: string 
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
        checked ? 'bg-rose-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

interface TabPeriodonciaProps {
  formData: any;
  onChange: (seccion: string, campo: string, valor: any) => void;
}

export function TabPeriodoncia({ formData, onChange }: TabPeriodonciaProps) {
  // Extraemos las DOS secciones del estado global (ya que son 2 modelos de Django distintos)
  const antecedentes = formData.antecedentes_periodontales || {};
  const examen = formData.examen_periodontal || {};

  return (
    <div className="space-y-8 bg-white p-6 border rounded-xl shadow-sm">
      
      {/* --- 1. ANTECEDENTES PERIODONTALES (Booleanos) --- */}
      <div>
        <h3 className="font-bold text-lg mb-4 text-rose-900 border-b border-rose-100 pb-2">
          Antecedentes Periodontales (Síntomas)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 p-6 border rounded-xl bg-rose-50/30">
          {[
            { id: 'sangrado_espontaneo', label: 'Sangrado Espontáneo' },
            { id: 'sangrado_provocado', label: 'Sangrado Provocado' },
            { id: 'movilidad', label: 'Movilidad Dental' },
            { id: 'se_han_separado', label: '¿Se han separado los dientes?' },
            { id: 'se_han_elongado', label: '¿Se han elongado los dientes?' },
            { id: 'halitosis', label: 'Halitosis (Mal aliento)' },
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors">
              <BotonSwitch 
                checked={antecedentes[item.id] || false} 
                onCheckedChange={(c) => onChange('antecedentes_periodontales', item.id, c)} 
              />
              <Label className="cursor-pointer text-sm font-medium text-slate-700">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* --- 2. EXAMEN PERIODONTAL (Campos de texto) --- */}
      <div>
        <h3 className="font-bold text-lg mb-4 mt-8 text-rose-900 border-b border-rose-100 pb-2">
          Examen Físico Periodontal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Color de la Encía</Label>
            <Input 
              value={examen.color || ''} 
              onChange={(e) => onChange('examen_periodontal', 'color', e.target.value)} 
              placeholder="Ej: Rosa coral, enrojecida, cianótica..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>Textura</Label>
            <Input 
              value={examen.textura || ''} 
              onChange={(e) => onChange('examen_periodontal', 'textura', e.target.value)} 
              placeholder="Ej: Punteado de cáscara de naranja, lisa, brillante..."
            />
          </div>

          <div className="space-y-2">
            <Label>Consistencia</Label>
            <Input 
              value={examen.consistencia || ''} 
              onChange={(e) => onChange('examen_periodontal', 'consistencia', e.target.value)} 
              placeholder="Ej: Firme y resiliente, edematosa, blanda..."
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label>Otras Características de la Encía</Label>
            <Textarea 
              value={examen.caracteristica_encia || ''} 
              onChange={(e) => onChange('examen_periodontal', 'caracteristica_encia', e.target.value)} 
              rows={3}
              placeholder="Describa contornos, márgenes, papilas, presencia de exudado, etc."
            />
          </div>
        </div>
      </div>

    </div>
  )
}