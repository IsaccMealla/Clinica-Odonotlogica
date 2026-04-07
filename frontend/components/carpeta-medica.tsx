"use client"

import { useState } from "react"
import { 
  ClipboardList, Activity, Users, Home, Venus, Save, 
  AlertTriangle, HeartPulse, Droplets, Edit3, Trash2, X 
} from "lucide-react"
import { Button } from "@/components/ui/button"
// 👇 Importamos DialogDescription
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CarpetaMedica({ paciente }: { paciente: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [data, setData] = useState({
    familiares: paciente.antecedentes_familiares || {},
    personales: paciente.antecedentes_personales || {},
    no_patologicos: paciente.antecedentes_no_patologicos || {},
    ginecologicos: paciente.antecedentes_ginecologicos || {},
  })

  const handleCheckChange = (section: string, field: string, value: boolean) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value },
    }))
  }

  const handleInputChange = (section: string, field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value },
    }))
  }

  const limpiarSeccion = (section: string) => {
    setData((prev) => ({ ...prev, [section]: {} }))
    toast.info(`Se ha limpiado la sección localmente.`)
  }

  const guardarAntecedentes = async () => {
    setLoading(true)
    try {
      // Usando la llave correcta encontrada en tu login
      const token = localStorage.getItem("access_token") 

      const res = await fetch(`http://localhost:8000/api/pacientes/${paciente.id}/antecedentes/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      })
      
      if (res.ok) {
        toast.success("Expediente actualizado")
        setIsEditing(false)
        setOpen(false)
        router.refresh()
      } else {
        console.error("Fallo al guardar, status:", res.status)
        toast.error("Hubo un error al guardar los datos. Revisa si tu sesión sigue activa.")
      }
    } catch (e) { 
      toast.error("Error de servidor") 
    }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setIsEditing(false); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50">
          <ClipboardList className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[1100px] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        
        {/* CABECERA FIJA */}
        <div className="p-6 border-b shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="text-blue-600 h-6 w-6" />
                Expediente: {paciente.nombres} {paciente.apellido_paterno}
              </DialogTitle>
              
              {/* 👇 Agregado para cumplir accesibilidad y quitar el Warning de la consola */}
              <DialogDescription className="sr-only">
                Detalles y antecedentes médicos del paciente.
              </DialogDescription>

              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
                CI: {paciente.ci} | {paciente.edad} años | {paciente.sexo}
              </p>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "destructive" : "outline"}>
              {isEditing ? <><X className="mr-2 h-4 w-4"/> Cancelar</> : <><Edit3 className="mr-2 h-4 w-4"/> Editar</>}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personales" className="flex-1 flex flex-col overflow-hidden">
          {/* TABS SELECTOR FIJO */}
          <div className="px-6 py-2 bg-slate-50 border-b flex justify-between items-center shrink-0">
            <TabsList className="bg-white border">
              <TabsTrigger value="personales">Patológicos</TabsTrigger>
              <TabsTrigger value="familiares">Familiares</TabsTrigger>
              <TabsTrigger value="no_patologicos">No Patológicos</TabsTrigger>
              <TabsTrigger value="ginecologicos" disabled={paciente.sexo !== 'Femenino'}>Ginecología</TabsTrigger>
            </TabsList>
            {isEditing && (
                <Button variant="ghost" size="sm" className="text-red-500 text-xs" onClick={() => {
                    const active = document.querySelector('[data-state="active"][role="tabpanel"]')?.getAttribute('value');
                    if(active) limpiarSeccion(active);
                }}><Trash2 className="h-3 w-3 mr-1"/> Vaciar</Button>
            )}
          </div>

          {/* ÁREA DE CONTENIDO CON SCROLL REAL */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full bg-slate-50/30">
              <div className="p-8 pb-20">
                
                {/* --- SECCIÓN PERSONALES --- */}
                <TabsContent value="personales" className="m-0 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Estado Salud</Label><Input disabled={!isEditing} value={data.personales.estado_salud || ""} onChange={(e) => handleInputChange("personales", "estado_salud", e.target.value)} className="bg-white" /></div>
                    <div className="space-y-2"><Label>Último Examen</Label><Input disabled={!isEditing} type="date" value={data.personales.fecha_ultimo_examen_medico || ""} onChange={(e) => handleInputChange("personales", "fecha_ultimo_examen_medico", e.target.value)} className="bg-white" /></div>
                  </div>

                  <Section title="Alergias" icon={<AlertTriangle className="text-red-500 h-4 w-4"/>}>
                    <div className="grid grid-cols-4 gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                      {['penicilina', 'anestesia', 'aspirina', 'yodo'].map(al => (
                        <SimpleCheck disabled={!isEditing} key={al} label={al} section="personales" field={`alergia_${al}`} data={data} onChange={handleCheckChange} />
                      ))}
                    </div>
                  </Section>

                  <Section title="Hematológicos" icon={<Droplets className="text-red-600 h-4 w-4"/>}>
                    <div className="grid grid-cols-2 gap-4">
                      {['sangra_excesivamente', 'problema_sanguineo', 'anemia', 'leucemia', 'hemofilia', 'deficit_vitamina_k', 'transfusion_sanguinea'].map(f => (
                        <CheckWithObs disabled={!isEditing} key={f} label={f} section="personales" field={f} obsField={`${f}_obs`} data={data} onCheck={handleCheckChange} onText={handleInputChange} />
                      ))}
                    </div>
                  </Section>

                  <Section title="Sistémicos" icon={<HeartPulse className="text-blue-600 h-4 w-4"/>}>
                    <div className="grid grid-cols-2 gap-4">
                      {['bajo_tratamiento_medico', 'toma_medicamentos', 'intervencion_quirurgica', 'diabetes', 'problemas_renales', 'problemas_corazon', 'hepatitis', 'aftas_herpes', 'consumo_drogas', 'enfermedades_venereas', 'vih_positivo', 'ulcera_gastrica', 'fiebre_reumatica', 'asma'].map(f => (
                        <CheckWithObs disabled={!isEditing} key={f} label={f} section="personales" field={f} obsField={`${f}_obs`} data={data} onCheck={handleCheckChange} onText={handleInputChange} />
                      ))}
                    </div>
                  </Section>
                </TabsContent>

                {/* --- SECCIÓN FAMILIARES --- */}
                <TabsContent value="familiares" className="m-0 grid grid-cols-2 gap-4">
                  {['alergia', 'asma_bronquial', 'cardiologicos', 'oncologicos', 'discrasias_sanguineas', 'diabetes', 'hipertension_arterial', 'renales'].map(f => (
                      <div key={f} className="p-4 border rounded-xl bg-white space-y-3">
                          <div className="flex items-center gap-2">
                              <Checkbox disabled={!isEditing} checked={data.familiares[f] || false} onCheckedChange={(v) => handleCheckChange("familiares", f, v as boolean)} />
                              <Label className="font-bold capitalize">{f.replace("_", " ")}</Label>
                          </div>
                          {data.familiares[f] && (
                              <div className="space-y-2">
                                  <Input disabled={!isEditing} placeholder="Familiar" value={data.familiares[`${f}_familiar`] || ""} onChange={(e) => handleInputChange("familiares", `${f}_familiar`, e.target.value)} />
                                  <Textarea disabled={!isEditing} placeholder="Obs..." value={data.familiares[`${f}_obs`] || ""} onChange={(e) => handleInputChange("familiares", `${f}_obs`, e.target.value)} />
                              </div>
                          )}
                      </div>
                  ))}
                </TabsContent>

                {/* --- SECCIÓN NO PATOLÓGICOS --- */}
                <TabsContent value="no_patologicos" className="m-0 grid grid-cols-2 gap-4">
                    {['respira_boca', 'consume_citricos', 'muerde_unas_labios', 'muerde_objetos', 'apretamiento_dentario'].map(f => (
                        <CheckWithObs disabled={!isEditing} key={f} label={f} section="no_patologicos" field={f} obsField={`${f}_obs`} data={data} onCheck={handleCheckChange} onText={handleInputChange} />
                    ))}
                    <div className="p-4 border rounded-xl bg-white space-y-3">
                        <Checkbox disabled={!isEditing} checked={data.no_patologicos.fuma || false} onCheckedChange={(v) => handleCheckChange("no_patologicos", "fuma", v as boolean)} />
                        <Label className="ml-2 font-bold">Fuma</Label>
                        {data.no_patologicos.fuma && (
                            <Input disabled={!isEditing} placeholder="Cant. Diaria" value={data.no_patologicos.fuma_cantidad_diaria || ""} onChange={(e) => handleInputChange("no_patologicos", "fuma_cantidad_diaria", e.target.value)} />
                        )}
                    </div>
                </TabsContent>

                {/* --- SECCIÓN GINECO --- */}
                <TabsContent value="ginecologicos" className="m-0 space-y-4">
                    <CheckWithObs disabled={!isEditing} label="Posibilidad Embarazo" section="ginecologicos" field="possibilidad_embarazo" obsField="embarazo_meses" data={data} onCheck={handleCheckChange} onText={handleInputChange} />
                    <CheckWithObs disabled={!isEditing} label="Anticonceptivos" section="ginecologicos" field="toma_anticonceptivos" obsField="anticonceptivos_obs" data={data} onCheck={handleCheckChange} onText={handleInputChange} />
                </TabsContent>

              </div>
            </ScrollArea>
          </div>
        </Tabs>

        {/* PIE DE PÁGINA FIJO */}
        <div className="p-4 border-t bg-white shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
          {isEditing && (
            <Button onClick={guardarAntecedentes} disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// HELPERS
function Section({ title, icon, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2"><h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">{icon} {title}</h3></div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

function SimpleCheck({ label, section, field, data, onChange, disabled }: any) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox disabled={disabled} checked={data[section][field] || false} onCheckedChange={(v) => onChange(section, field, v as boolean)} />
      <Label className="text-[10px] font-bold uppercase">{label}</Label>
    </div>
  )
}

function CheckWithObs({ label, section, field, obsField, data, onCheck, onText, disabled }: any) {
  return (
    <div className="p-4 border rounded-xl bg-white space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox disabled={disabled} checked={data[section][field] || false} onCheckedChange={(v) => onCheck(section, field, v as boolean)} />
        <Label className="font-bold text-sm capitalize">{label.replace("_", " ")}</Label>
      </div>
      {data[section][field] && (
        <Input disabled={disabled} placeholder="Obs..." value={data[section][obsField] || ""} onChange={(e) => onText(section, obsField, e.target.value)} className="h-8 text-xs" />
      )}
    </div>
  )
}