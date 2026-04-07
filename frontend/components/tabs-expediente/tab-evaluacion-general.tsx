"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- COMPONENTE SWITCH PERSONALIZADO ---
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
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

interface TabEvaluacionProps {
  formData: any;
  onChange: (seccion: string, campo: string, valor: any) => void;
}

export function TabEvaluacionGeneral({ formData, onChange }: TabEvaluacionProps) {
  const examen = formData.examen_clinico_fisico || {};
  const habitos = formData.habitos || {};

  // ==========================================
  // FUNCIONES DE VALIDACIÓN
  // ==========================================

  // 1. Validar campos de SOLO TEXTO (Letras, acentos, espacios, comas y puntos. SIN NÚMEROS)
  const handleTextChange = (seccion: string, campo: string, value: string) => {
    if (/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\.,\-]*$/.test(value)) {
      onChange(seccion, campo, value);
    }
  };

  // 2. Validar Presión Arterial (Solo números y una barra inclinada)
  const handlePAChange = (value: string) => {
    // Permite hasta 3 dígitos, una barra opcional, y hasta 3 dígitos (Ej: 120/80)
    if (/^\d{0,3}(\/\d{0,3})?$/.test(value)) {
      onChange('examen_clinico_fisico', 'presion_arterial', value);
    }
  };

  // 3. Bloquear teclas inválidas en inputs type="number" (e, E, +, -)
  const preventInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal: boolean = true) => {
    const invalidChars = ['e', 'E', '+', '-'];
    // Si es un número entero (ej. Pulso), también bloqueamos el punto y la coma
    if (!allowDecimal) invalidChars.push('.', ',');
    
    if (invalidChars.includes(e.key)) {
      e.preventDefault();
    }
  };

  // ==========================================
  // RENDER DEL COMPONENTE
  // ==========================================
  return (
    <Tabs defaultValue="signos" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100 p-1 rounded-xl">
        <TabsTrigger value="signos" className="rounded-lg">Signos Vitales</TabsTrigger>
        <TabsTrigger value="fisico" className="rounded-lg">Examen Físico</TabsTrigger>
        <TabsTrigger value="atm" className="rounded-lg">Examen ATM</TabsTrigger>
        <TabsTrigger value="habitos" className="rounded-lg">Hábitos</TabsTrigger>
      </TabsList>

      {/* --- 1. SIGNOS VITALES --- */}
      <TabsContent value="signos" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Signos Vitales y Estado General</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* Temperatura (Decimal) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Temperatura</Label>
            <div className="relative">
              <Input 
                type="number" step="0.1" min="30" max="45"
                value={examen.temperatura_c || ''} 
                onKeyDown={(e) => preventInvalidNumberChars(e, true)}
                onChange={(e) => onChange('examen_clinico_fisico', 'temperatura_c', e.target.value)} 
                className="pr-10" 
                placeholder="36.5" 
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400 font-medium pointer-events-none">°C</span>
            </div>
          </div>

          {/* Presión Arterial (Validación estricta de Regex) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Presión Arterial</Label>
            <Input 
              type="text"
              value={examen.presion_arterial || ''} 
              onChange={(e) => handlePAChange(e.target.value)} 
              placeholder="120/80" 
            />
          </div>

          {/* Pulso (Entero) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Pulso</Label>
            <div className="relative">
              <Input 
                type="number" min="0" max="300"
                value={examen.pulso || ''} 
                onKeyDown={(e) => preventInvalidNumberChars(e, false)}
                onChange={(e) => onChange('examen_clinico_fisico', 'pulso', e.target.value)} 
                className="pr-12" placeholder="80"
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400 font-medium pointer-events-none">lpm</span>
            </div>
          </div>

          {/* Frecuencia Respiratoria (Entero) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Frec. Respiratoria</Label>
            <div className="relative">
              <Input 
                type="number" min="0" max="100"
                value={examen.frecuencia_respiratoria || ''} 
                onKeyDown={(e) => preventInvalidNumberChars(e, false)}
                onChange={(e) => onChange('examen_clinico_fisico', 'frecuencia_respiratoria', e.target.value)} 
                className="pr-12" placeholder="16"
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400 font-medium pointer-events-none">rpm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Peso (Decimal) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Peso</Label>
            <div className="relative">
              <Input 
                type="number" step="0.1" min="0"
                value={examen.peso_kg || ''} 
                onKeyDown={(e) => preventInvalidNumberChars(e, true)}
                onChange={(e) => onChange('examen_clinico_fisico', 'peso_kg', e.target.value)} 
                className="pr-10" placeholder="70.5"
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400 font-medium pointer-events-none">kg</span>
            </div>
          </div>

          {/* Talla (Decimal) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Talla</Label>
            <div className="relative">
              <Input 
                type="number" step="0.01" min="0"
                value={examen.talla_m || ''} 
                onKeyDown={(e) => preventInvalidNumberChars(e, true)}
                onChange={(e) => onChange('examen_clinico_fisico', 'talla_m', e.target.value)} 
                className="pr-10" placeholder="1.75"
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400 font-medium pointer-events-none">m</span>
            </div>
          </div>

          {/* Tipo de Constitución (Solo texto) */}
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Constitución</Label>
            <Input 
              value={examen.tipo_constitucion || ''} 
              onChange={(e) => handleTextChange('examen_clinico_fisico', 'tipo_constitucion', e.target.value)} 
              placeholder="Normolíneo..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Estado General</Label>
            <Input value={examen.estado_general || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'estado_general', e.target.value)} placeholder="Bueno, regular, malo..." />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Estado Nutricional</Label>
            <Input value={examen.estado_nutricional || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'estado_nutricional', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Estado de Hidratación</Label>
            <Input value={examen.estado_hidratacion || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'estado_hidratacion', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Actitud / Posición</Label>
            <Input value={examen.actitud_posicion || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'actitud_posicion', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-600 font-semibold">Consciencia</Label>
            <Input value={examen.consciencia || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'consciencia', e.target.value)} />
          </div>
          
          <div className="flex items-center space-x-4 mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">
            <BotonSwitch checked={examen.orientacion_etp || false} onCheckedChange={(c: boolean) => onChange('examen_clinico_fisico', 'orientacion_etp', c)} />
            <div className="space-y-0.5">
              <Label className="cursor-pointer font-bold text-slate-700 text-base">Paciente Orientado (ETP)</Label>
              <p className="text-xs text-slate-500">Espacio, Tiempo y Persona</p>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* --- 2. EXAMEN FÍSICO (Extraoral) --- */}
      <TabsContent value="fisico" className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
         <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Examen Físico Extraoral</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cráneo</Label>
              <Input value={examen.craneo || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'craneo', e.target.value)} placeholder="Mesocefalo, doliocefalo..." />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Input value={examen.perfil || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'perfil', e.target.value)} placeholder="Cóncavo, convexo, recto..." />
            </div>
            
            <div className="space-y-2">
              <Label>Ojos</Label>
              <Input value={examen.ojos || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'ojos', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nariz</Label>
              <Input value={examen.nariz || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'nariz', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Oídos</Label>
              <Input value={examen.oidos || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'oidos', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cuello</Label>
              <Input value={examen.cuello || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'cuello', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ganglios Linfáticos</Label>
              <Input value={examen.ganglios_linfaticos || ''} onChange={(e) => handleTextChange('examen_clinico_fisico', 'ganglios_linfaticos', e.target.value)} />
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-slate-50 border rounded-xl md:col-span-2 hover:bg-slate-100 transition-colors">
              <BotonSwitch checked={examen.cara_simetria ?? true} onCheckedChange={(c: boolean) => onChange('examen_clinico_fisico', 'cara_simetria', c)} />
              <Label className="cursor-pointer font-bold text-slate-700">Simetría Facial (Rostro simétrico)</Label>
            </div>
         </div>
      </TabsContent>

      {/* --- 3. EXAMEN ATM --- */}
      <TabsContent value="atm" className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Articulación Temporomandibular (ATM)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'lateralidad', label: 'Lateralidad' },
            { id: 'apertura', label: 'Apertura' },
            { id: 'chasquidos', label: 'Chasquidos' },
            { id: 'crepitacion', label: 'Crepitación' },
            { id: 'desviacion_apertura_cierre', label: 'Desviación en apertura/cierre' },
            { id: 'dificultad_abrir_boca', label: 'Dificultad para abrir la boca' },
            { id: 'fatiga_dolor_muscular', label: 'Fatiga / Dolor Muscular' },
            { id: 'disminucion_apertura', label: 'Disminución de apertura' },
            { id: 'dolor_apertura', label: 'Dolor a la apertura' },
          ].map((item) => (
            <div key={item.id} className="space-y-2 p-4 border rounded-xl bg-slate-50 transition-all hover:border-blue-200">
              <div className="flex items-center space-x-3">
                <BotonSwitch 
                  checked={examen[item.id] || false} 
                  onCheckedChange={(c: boolean) => onChange('examen_clinico_fisico', item.id, c)} 
                />
                <Label className="font-semibold text-sm cursor-pointer text-slate-700">{item.label}</Label>
              </div>
              {examen[item.id] && (
                <Input 
                  placeholder={`Observaciones de ${item.label.toLowerCase()}...`} 
                  value={examen[`${item.id}_obs`] || ''} 
                  onChange={(e) => handleTextChange('examen_clinico_fisico', `${item.id}_obs`, e.target.value)} 
                  className="mt-3 text-sm bg-white border-blue-100 focus-visible:ring-blue-500" 
                />
              )}
            </div>
          ))}
        </div>
      </TabsContent>

      {/* --- 4. HÁBITOS --- */}
      <TabsContent value="habitos" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Hábitos del Paciente</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Técnica de cepillado</Label>
            {/* Aquí no forzamos solo texto, porque pueden usar marcas con números ej: Oral-B 3D */}
            <Input value={habitos.tecnica_cepillado || ''} onChange={(e) => onChange('habitos', 'tecnica_cepillado', e.target.value)} placeholder="Ej: Fones, Bass..." />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Elementos de Higiene</Label>
            <Input value={habitos.elementos_higiene || ''} onChange={(e) => onChange('habitos', 'elementos_higiene', e.target.value)} placeholder="Ej: enjuagues, hilo dental..." />
          </div>
        </div>

        <div>
          <Label className="font-bold text-slate-700 mb-4 block">Hábitos Perjudiciales (Sí / No)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 p-6 border rounded-xl bg-slate-50">
            
            {[
              { id: 'onicofagia', label: 'Onicofagia (Muerde uñas)' },
              { id: 'interposicion_lingual', label: 'Interposición lingual' },
              { id: 'bruxismo', label: 'Bruxismo' },
              { id: 'bruxomania', label: 'Bruxomanía' },
              { id: 'succiona_citricos', label: 'Succiona cítricos' },
              { id: 'respirador_bucal', label: 'Respirador bucal' },
              { id: 'fuma', label: 'Fuma' },
              { id: 'bebe', label: 'Bebe alcohol' },
              { id: 'interposicion_objetos', label: 'Interposición de objetos' },
            ].map((habito) => (
              <div key={habito.id} className="flex items-center space-x-3">
                <BotonSwitch 
                  id={habito.id} 
                  checked={habitos[habito.id] || false} 
                  onCheckedChange={(c: boolean) => onChange('habitos', habito.id, c)} 
                />
                <Label htmlFor={habito.id} className="cursor-pointer text-sm font-medium text-slate-600">{habito.label}</Label>
              </div>
            ))}

          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label className="text-sm font-semibold text-slate-700">Otros hábitos</Label>
          {/* Un textarea general no debería bloquear números porque puede decir "Fuma 3 cajas al día" */}
          <Textarea 
            value={habitos.otros_habitos || ''} 
            onChange={(e) => onChange('habitos', 'otros_habitos', e.target.value)} 
            placeholder="Describe aquí cualquier otro hábito relevante..." 
            className="resize-none"
            rows={3}
          />
        </div>
      </TabsContent>

    </Tabs>
  )
}