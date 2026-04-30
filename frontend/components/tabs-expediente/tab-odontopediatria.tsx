"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- COMPONENTE SWITCH PERSONALIZADO (Reutilizado) ---
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

interface TabOdontoProps {
  formData: any;
  onChange: (seccion: string, campo: string, valor: any) => void;
}

export function TabOdontopediatria({ formData, onChange }: TabOdontoProps) {
  const odonto = formData.historia_odontopediatrica || {};
  const seccion = 'historia_odontopediatrica';

  // ==========================================
  // CÁLCULO DE EDAD Y VALIDACIÓN DE ACCESO
  // ==========================================
  // NOTA: Ajusta la ruta de 'fecha_nacimiento' según la estructura exacta de tu JSON
  const fechaNacimiento = formData?.datos_personales?.fecha_nacimiento || formData?.fecha_nacimiento;
  const EDAD_LIMITE_PEDIATRIA = 14; // Cambia este número si tu clínica considera niños hasta otra edad (ej. 12 o 15)

  const calcularEdad = (fecha: string) => {
    if (!fecha) return null;
    const hoy = new Date();
    const cumpleanos = new Date(fecha);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad;
  };

  const edadPaciente = calcularEdad(fechaNacimiento);

  // ==========================================
  // FUNCIONES DE VALIDACIÓN
  // ==========================================
  const handleTextChange = (seccionObj: string, campo: string, value: string) => {
    if (/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\.,\-]*$/.test(value)) {
      onChange(seccionObj, campo, value);
    }
  };

  const handlePAChange = (value: string) => {
    if (/^\d{0,3}(\/\d{0,3})?$/.test(value)) {
      onChange(seccion, 'presion_arterial', value);
    }
  };

  const preventInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal: boolean = true) => {
    const invalidChars = ['e', 'E', '+', '-'];
    if (!allowDecimal) invalidChars.push('.', ',');
    if (invalidChars.includes(e.key)) {
      e.preventDefault();
    }
  };

  // ==========================================
  // RENDER CONDICIONAL SI ES MAYOR DE EDAD
  // ==========================================
  if (edadPaciente !== null && edadPaciente > EDAD_LIMITE_PEDIATRIA) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border rounded-xl shadow-sm space-y-4">
        <div className="bg-slate-100 p-4 rounded-full">
          {/* Un ícono simple de bloqueo o información */}
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700">Sección no aplicable</h3>
        <p className="text-slate-500 text-center max-w-md">
          El paciente tiene <span className="font-bold text-slate-700">{edadPaciente} años</span>. 
          La historia clínica de odontopediatría está restringida para pacientes de hasta {EDAD_LIMITE_PEDIATRIA} años de edad.
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER DEL COMPONENTE NORMAL
  // ==========================================
  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100 p-1 rounded-xl">
        <TabsTrigger value="datos" className="rounded-lg py-2">Datos y Desarrollo</TabsTrigger>
        <TabsTrigger value="habitos" className="rounded-lg py-2">Hábitos y Alimentación</TabsTrigger>
        <TabsTrigger value="examen" className="rounded-lg py-2">Examen y Oclusión</TabsTrigger>
        <TabsTrigger value="conducta" className="rounded-lg py-2">Análisis Conductual</TabsTrigger>
      </TabsList>

      {/* --- 1. DATOS, PERINATALES Y PSICOMOTOR --- */}
      <TabsContent value="datos" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        
        {/* Datos Clínicos y Personales */}
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Datos Clínicos y Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Apodo (¿Cómo lo llaman?)</Label>
            <Input value={odonto.apodo || ''} onChange={(e) => handleTextChange(seccion, 'apodo', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hobbie</Label>
            <Input value={odonto.hobbie || ''} onChange={(e) => handleTextChange(seccion, 'hobbie', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nombre Padres/Madre</Label>
            <Input value={odonto.nombre_padres || ''} onChange={(e) => handleTextChange(seccion, 'nombre_padres', e.target.value)} />
          </div>
          <div className="space-y-2">
            {/* Teléfono libre (para permitir signos + o espacios) */}
            <Label>Teléfono Padres</Label>
            <Input value={odonto.telefono_padres || ''} onChange={(e) => onChange(seccion, 'telefono_padres', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nombre Representante</Label>
            <Input value={odonto.nombre_representante || ''} onChange={(e) => handleTextChange(seccion, 'nombre_representante', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono Representante</Label>
            <Input value={odonto.telefono_representante || ''} onChange={(e) => onChange(seccion, 'telefono_representante', e.target.value)} />
          </div>
        </div>

        {/* Antecedentes Perinatales */}
        <h3 className="font-bold text-lg mb-4 mt-8 text-slate-800 border-b pb-2">Antecedentes Perinatales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>N° Embarazo</Label>
            <Input 
              type="number" min="1" 
              value={odonto.numero_embarazo || ''} 
              onKeyDown={(e) => preventInvalidNumberChars(e, false)}
              onChange={(e) => onChange(seccion, 'numero_embarazo', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Edad Madre al Embarazo</Label>
            <Input 
              type="number" min="10" 
              value={odonto.edad_madre_embarazo || ''} 
              onKeyDown={(e) => preventInvalidNumberChars(e, false)}
              onChange={(e) => onChange(seccion, 'edad_madre_embarazo', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Duración del Parto (Ej. 12 horas)</Label>
            <Input value={odonto.duracion_parto || ''} onChange={(e) => onChange(seccion, 'duracion_parto', e.target.value)} />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4 p-4 bg-slate-50 border rounded-xl">
          <div className="flex items-center space-x-2">
            <BotonSwitch checked={odonto.embarazo_controlado || false} onCheckedChange={(c) => onChange(seccion, 'embarazo_controlado', c)} />
            <Label className="cursor-pointer text-slate-700">Embarazo Controlado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <BotonSwitch checked={odonto.parto_normal || false} onCheckedChange={(c) => onChange(seccion, 'parto_normal', c)} />
            <Label className="cursor-pointer text-slate-700">Parto Normal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <BotonSwitch checked={odonto.cesarea || false} onCheckedChange={(c) => onChange(seccion, 'cesarea', c)} />
            <Label className="cursor-pointer text-slate-700">Cesárea</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-2">
            <Label>Antecedentes del Embarazo</Label>
            <Textarea value={odonto.antecedentes_embarazo || ''} onChange={(e) => onChange(seccion, 'antecedentes_embarazo', e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Observaciones del Nacimiento</Label>
            <Textarea value={odonto.observaciones_nacimiento || ''} onChange={(e) => onChange(seccion, 'observaciones_nacimiento', e.target.value)} rows={2} />
          </div>
        </div>

        {/* Desarrollo Psicomotor */}
        <h3 className="font-bold text-lg mb-4 mt-8 text-slate-800 border-b pb-2">Desarrollo Psicomotor</h3>
        {/* Se dejan libres porque pueden responder "a los 6 meses", "al año", etc. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Edad se sentó</Label><Input value={odonto.edad_sento || ''} onChange={(e) => onChange(seccion, 'edad_sento', e.target.value)} /></div>
          <div className="space-y-2"><Label>Edad gateó</Label><Input value={odonto.edad_gateo || ''} onChange={(e) => onChange(seccion, 'edad_gateo', e.target.value)} /></div>
          <div className="space-y-2"><Label>Edad se paró</Label><Input value={odonto.edad_paro || ''} onChange={(e) => onChange(seccion, 'edad_paro', e.target.value)} /></div>
          <div className="space-y-2"><Label>Edad caminó</Label><Input value={odonto.edad_camino || ''} onChange={(e) => onChange(seccion, 'edad_camino', e.target.value)} /></div>
          <div className="space-y-2"><Label>1er Diente</Label><Input value={odonto.edad_primer_diente || ''} onChange={(e) => onChange(seccion, 'edad_primer_diente', e.target.value)} /></div>
          <div className="space-y-2"><Label>1era Palabra</Label><Input value={odonto.edad_primera_palabra || ''} onChange={(e) => onChange(seccion, 'edad_primera_palabra', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-2"><Label>Evolución Escolar</Label><Input value={odonto.evolucion_escolar || ''} onChange={(e) => handleTextChange(seccion, 'evolucion_escolar', e.target.value)} /></div>
          <div className="space-y-2"><Label>Vacunas</Label><Input value={odonto.vacunas || ''} onChange={(e) => onChange(seccion, 'vacunas', e.target.value)} /></div>
        </div>
      </TabsContent>

      {/* --- 2. HÁBITOS Y ALIMENTACIÓN --- */}
      <TabsContent value="habitos" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        
        {/* Alimentación Primer Año */}
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Alimentación (Primer Año)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'lactancia_materna', label: 'L. Materna', edadId: 'edad_lactancia_materna' },
            { id: 'lactancia_artificial', label: 'L. Artificial', edadId: 'edad_lactancia_artificial' },
            { id: 'lactancia_mixta', label: 'L. Mixta', edadId: 'edad_lactancia_mixta' },
          ].map((item) => (
            <div key={item.id} className="p-4 border rounded-xl bg-slate-50 space-y-3">
              <div className="flex items-center space-x-3">
                <BotonSwitch checked={odonto[item.id] || false} onCheckedChange={(c) => onChange(seccion, item.id, c)} />
                <Label className="font-bold text-slate-700">{item.label}</Label>
              </div>
              {odonto[item.id] && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">¿Hasta qué edad?</Label>
                  <Input value={odonto[item.edadId] || ''} onChange={(e) => onChange(seccion, item.edadId, e.target.value)} placeholder="Ej: 1 año..." />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2 mt-4">
          <Label>Observaciones de Alimentación</Label>
          <Textarea value={odonto.obs_alimentacion || ''} onChange={(e) => onChange(seccion, 'obs_alimentacion', e.target.value)} rows={2} />
        </div>

        {/* Hábitos Infantiles */}
        <h3 className="font-bold text-lg mb-4 mt-8 text-slate-800 border-b pb-2">Hábitos Infantiles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'biberon', label: 'Biberón' },
            { id: 'chupon', label: 'Chupón' },
            { id: 'succion_digital', label: 'Succión Digital' },
            { id: 'enuresis', label: 'Enuresis (Orina cama)' },
            { id: 'onicofagia', label: 'Onicofagia (Uñas)' },
            { id: 'queilofagia', label: 'Queilofagia (Labios)' },
            { id: 'geofagia', label: 'Geofagia (Tierra)' },
            { id: 'golosinas', label: 'Golosinas en exceso' },
            { id: 'otros_habitos_inf', label: 'Otros Hábitos' },
          ].map((hab) => (
            <div key={hab.id} className="space-y-2 p-3 border rounded-xl bg-slate-50 hover:border-blue-200 transition-colors">
              <div className="flex items-center space-x-3">
                <BotonSwitch checked={odonto[hab.id] || false} onCheckedChange={(c) => onChange(seccion, hab.id, c)} />
                <Label className="font-semibold text-sm cursor-pointer text-slate-700">{hab.label}</Label>
              </div>
              {odonto[hab.id] && (
                <Input 
                  placeholder="Detalles / Frecuencia..." 
                  value={odonto[`${hab.id}_obs`] || ''} 
                  onChange={(e) => onChange(seccion, `${hab.id}_obs`, e.target.value)} 
                  className="mt-2 text-sm bg-white" 
                />
              )}
            </div>
          ))}
        </div>

        {/* Higiene Bucal */}
        <h3 className="font-bold text-lg mb-4 mt-8 text-slate-800 border-b pb-2">Higiene y Experiencia Previa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Cepillados al día</Label>
            <Input 
              type="number" min="0" max="10"
              value={odonto.veces_cepilla_dia || ''} 
              onKeyDown={(e) => preventInvalidNumberChars(e, false)}
              onChange={(e) => onChange(seccion, 'veces_cepilla_dia', e.target.value)} 
            />
          </div>
          <div className="space-y-2"><Label>¿Cuándo cepilla?</Label><Input value={odonto.cuando_cepilla || ''} onChange={(e) => handleTextChange(seccion, 'cuando_cepilla', e.target.value)} /></div>
          <div className="space-y-2"><Label>Tipo Higiene (Asistido, solo)</Label><Input value={odonto.tipo_higiene || ''} onChange={(e) => handleTextChange(seccion, 'tipo_higiene', e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Pasta y Cepillo utilizado</Label><Input value={odonto.pasta_y_cepillo || ''} onChange={(e) => onChange(seccion, 'pasta_y_cepillo', e.target.value)} /></div>
          
          <div className="flex flex-col justify-center space-y-3 p-3 border rounded-xl bg-slate-50">
            <div className="flex items-center space-x-2">
              <BotonSwitch checked={odonto.usa_enjuague || false} onCheckedChange={(c) => onChange(seccion, 'usa_enjuague', c)} />
              <Label>Usa Enjuague</Label>
            </div>
            <div className="flex items-center space-x-2">
              <BotonSwitch checked={odonto.usa_hilo || false} onCheckedChange={(c) => onChange(seccion, 'usa_hilo', c)} />
              <Label>Usa Hilo Dental</Label>
            </div>
          </div>
        </div>

        <div className="p-5 border rounded-xl bg-blue-50/50 mt-4 space-y-4">
          <div className="flex items-center space-x-3">
            <BotonSwitch checked={odonto.atencion_previa || false} onCheckedChange={(c) => onChange(seccion, 'atencion_previa', c)} />
            <Label className="font-bold text-base text-blue-900">¿Atención Odontológica Previa?</Label>
          </div>
          
          {odonto.atencion_previa && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>¿Cuándo y Dónde?</Label>
                <Input value={odonto.cuando_donde_atencion || ''} onChange={(e) => onChange(seccion, 'cuando_donde_atencion', e.target.value)} className="bg-white" />
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <div className="flex items-center space-x-3 mt-4">
                  <BotonSwitch checked={odonto.experiencia_positiva ?? true} onCheckedChange={(c) => onChange(seccion, 'experiencia_positiva', c)} />
                  <Label>¿Fue una experiencia positiva?</Label>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>¿Por qué? (Detalles de la experiencia)</Label>
                <Textarea value={odonto.por_que_experiencia || ''} onChange={(e) => onChange(seccion, 'por_que_experiencia', e.target.value)} rows={2} className="bg-white" />
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* --- 3. EXAMEN FÍSICO Y OCLUSIÓN --- */}
      <TabsContent value="examen" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Examen Físico y Dentición</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Peso (kg)</Label>
            <Input type="number" step="0.1" value={odonto.peso || ''} onKeyDown={(e) => preventInvalidNumberChars(e, true)} onChange={(e) => onChange(seccion, 'peso', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Talla (m)</Label>
            <Input type="number" step="0.01" value={odonto.talla || ''} onKeyDown={(e) => preventInvalidNumberChars(e, true)} onChange={(e) => onChange(seccion, 'talla', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Temperatura (°C)</Label>
            <Input type="number" step="0.1" value={odonto.temperatura || ''} onKeyDown={(e) => preventInvalidNumberChars(e, true)} onChange={(e) => onChange(seccion, 'temperatura', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Presión Arterial</Label>
            <Input type="text" value={odonto.presion_arterial || ''} onChange={(e) => handlePAChange(e.target.value)} placeholder="100/60" />
          </div>
          <div className="space-y-2">
            <Label>Frec. Respiratoria (rpm)</Label>
            <Input type="number" value={odonto.frecuencia_respiratoria || ''} onKeyDown={(e) => preventInvalidNumberChars(e, false)} onChange={(e) => onChange(seccion, 'frecuencia_respiratoria', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Frec. Cardíaca (lpm)</Label>
            <Input type="number" value={odonto.frecuencia_cardiaca || ''} onKeyDown={(e) => preventInvalidNumberChars(e, false)} onChange={(e) => onChange(seccion, 'frecuencia_cardiaca', e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo Dentición</Label>
            <Input value={odonto.tipo_denticion || ''} onChange={(e) => handleTextChange(seccion, 'tipo_denticion', e.target.value)} placeholder="Temporal, Mixta, Permanente..." />
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4 mt-8 text-slate-800 border-b pb-2">Oclusión y Análisis Facial</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2"><Label>Competencia Labial</Label><Input value={odonto.competencia_labial || ''} onChange={(e) => handleTextChange(seccion, 'competencia_labial', e.target.value)} /></div>
          <div className="space-y-2"><Label>Tipo de Perfil</Label><Input value={odonto.tipo_perfil || ''} onChange={(e) => handleTextChange(seccion, 'tipo_perfil', e.target.value)} /></div>
          <div className="space-y-2"><Label>Línea Media</Label><Input value={odonto.linea_media || ''} onChange={(e) => handleTextChange(seccion, 'linea_media', e.target.value)} /></div>
          <div className="space-y-2"><Label>Relación Molar Baume</Label><Input value={odonto.relacion_molar_baume || ''} onChange={(e) => onChange(seccion, 'relacion_molar_baume', e.target.value)} /></div>
          <div className="space-y-2"><Label>Tipo Arco Baume</Label><Input value={odonto.tipo_arco_baume || ''} onChange={(e) => onChange(seccion, 'tipo_arco_baume', e.target.value)} /></div>
          <div className="space-y-2"><Label>Relación Molar Angle</Label><Input value={odonto.relacion_molar_angle || ''} onChange={(e) => onChange(seccion, 'relacion_molar_angle', e.target.value)} /></div>
          <div className="space-y-2"><Label>Relación Canina</Label><Input value={odonto.relacion_canina || ''} onChange={(e) => onChange(seccion, 'relacion_canina', e.target.value)} /></div>
        </div>

        <Label className="font-bold text-slate-700 mt-6 block">Anomalías y Problemas Oclusales (Sí / No)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 p-5 border rounded-xl bg-slate-50">
          {[
            { id: 'mordida_abierta', label: 'Mordida Abierta' },
            { id: 'apinamiento', label: 'Apiñamiento' },
            { id: 'mordida_cubierta', label: 'Mordida Cubierta' },
            { id: 'diastemas', label: 'Diastemas' },
            { id: 'mordida_borde_borde', label: 'Mordida Borde a Borde' },
            { id: 'transposicion', label: 'Transposición' },
            { id: 'mordida_cruzada_anterior', label: 'M. Cruzada Anterior' },
            { id: 'version_rotacion', label: 'Versión/Rotación' },
            { id: 'mordida_cruzada_uni_der', label: 'M. Cruzada Uni Der' },
            { id: 'mordida_cruzada_uni_izq', label: 'M. Cruzada Uni Izq' },
            { id: 'mordida_cruzada_bilateral', label: 'M. Cruzada Bilateral' },
          ].map((ocl) => (
            <div key={ocl.id} className="flex items-center space-x-3">
              <BotonSwitch checked={odonto[ocl.id] || false} onCheckedChange={(c) => onChange(seccion, ocl.id, c)} />
              <Label className="cursor-pointer text-sm font-medium text-slate-600">{ocl.label}</Label>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          <div className="space-y-2">
            <Label>Observaciones de Oclusión</Label>
            <Textarea value={odonto.obs_oclusion || ''} onChange={(e) => onChange(seccion, 'obs_oclusion', e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Anomalías de Formación Dental</Label>
            <Textarea value={odonto.anomalias_formacion_dental || ''} onChange={(e) => onChange(seccion, 'anomalias_formacion_dental', e.target.value)} rows={2} />
          </div>
        </div>
      </TabsContent>

      {/* --- 4. ANÁLISIS CONDUCTUAL --- */}
      <TabsContent value="conducta" className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        
        <div className="space-y-2 mb-6">
          <Label className="font-bold text-lg text-slate-800">Clasificación de Escobar</Label>
          <Input 
            value={odonto.tipo_escobar || ''} 
            onChange={(e) => handleTextChange(seccion, 'tipo_escobar', e.target.value)} 
            placeholder="Ej: Colaborador, No colaborador, Colaborador en potencia" 
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rasgos del Niño */}
          <div className="p-5 border rounded-xl bg-indigo-50/50">
            <h4 className="font-bold text-indigo-900 mb-4 border-b border-indigo-100 pb-2">Rasgos del Niño</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'rasgo_timido', label: 'Tímido' },
                { id: 'rasgo_agresivo', label: 'Agresivo' },
                { id: 'rasgo_mimado', label: 'Mimado' },
                { id: 'rasgo_miedoso', label: 'Miedoso' },
                { id: 'rasgo_desafiante', label: 'Desafiante' },
                { id: 'rasgo_lloroso', label: 'Lloroso' },
              ].map((rasgo) => (
                <div key={rasgo.id} className="flex items-center space-x-3">
                  <BotonSwitch checked={odonto[rasgo.id] || false} onCheckedChange={(c) => onChange(seccion, rasgo.id, c)} />
                  <Label className="cursor-pointer text-sm font-medium text-slate-700">{rasgo.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Rasgos de los Padres */}
          <div className="p-5 border rounded-xl bg-amber-50/50">
            <h4 className="font-bold text-amber-900 mb-4 border-b border-amber-100 pb-2">Actitud de los Padres</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'padres_cooperador', label: 'Cooperador' },
                { id: 'padres_despreocupado', label: 'Despreocupado' },
                { id: 'padres_sobreprotector', label: 'Sobreprotector' },
                { id: 'padres_reganon', label: 'Regañón' },
                { id: 'padres_debil', label: 'Débil / Permisivo' },
              ].map((rasgo) => (
                <div key={rasgo.id} className="flex items-center space-x-3">
                  <BotonSwitch checked={odonto[rasgo.id] || false} onCheckedChange={(c) => onChange(seccion, rasgo.id, c)} />
                  <Label className="cursor-pointer text-sm font-medium text-slate-700">{rasgo.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label className="font-bold text-slate-800">Observaciones Conductuales</Label>
          <Textarea 
            value={odonto.obs_conductual || ''} 
            onChange={(e) => onChange(seccion, 'obs_conductual', e.target.value)} 
            rows={3} 
            placeholder="Anotaciones adicionales sobre el comportamiento en la consulta..."
          />
        </div>

      </TabsContent>
    </Tabs>
  )
}