"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import { ArrowLeft, User, Save, Loader2, AlertCircle, Baby, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { toast } from "sonner"

// REUTILIZACIÓN DE TUS COMPONENTES EXISTENTES
import { TabEvaluacionGeneral } from "@/components/tabs-expediente/tab-evaluacion-general"
import { TabOdontopediatria } from "@/components/tabs-expediente/tab-odontopediatria"
import { TabPeriodoncia } from "@/components/tabs-expediente/tab-periodoncia"
import { TabPeriodontogramaGrafico } from "@/components/tabs-expediente/tab-periodontograma-grafico"
import { PeriodontogramaProvider } from "@/context/PeriodontogramaContext"
import { OdontogramaDinamico } from "@/components/tabs-expediente/odontograma-dinamico"
import { verificarAccesoModulo, getEstudiantesDemo } from "@/lib/supervision-store"
import { useClinicalPersist, clearAllPatientBackups } from "@/hooks/useClinicalPersist"

// ==========================================
// UTILIDADES DE NORMALIZACIÓN BIOLÓGICA
// ==========================================
function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function esFemenino(sexo: string | null | undefined): boolean {
    if (!sexo) return false;
    const s = sexo.toLowerCase().trim();
    return s === 'femenino' || s === 'mujer' || s === 'f';
}

function esPediatrico(edad: number | null): boolean {
    if (edad === null) return false;
    return edad < 12;
}

// Estado inicial del formulario
const FORM_DATA_INITIAL = {
    familiares: {}, personales: {}, no_patologicos: {}, ginecologicos: {},
    habitos: {}, antecedentes_periodontales: {}, examen_periodontal: {},
    historia_odontopediatrica: {}, prostodoncia_removible: {},
    prostodoncia_fija: {}, protocolo_quirurgico: {}, examen_clinico_fisico: {},
    odontograma: {}
};

export default function ExpedienteEstudiantePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: pacienteId } = use(params);
    const periodontogramaRef = useRef<any>(null);

    const [paciente, setPaciente] = useState<any>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // ==========================================
    // PERSISTENCIA AUTOMÁTICA (Anti-Pérdida)
    // ==========================================
    const {
        data: formData,
        setData: setFormData,
        clearBackup: clearFormBackup,
        hasBackup: tieneBackupForm,
        lastSaved: ultimoGuardadoForm
    } = useClinicalPersist('formData', pacienteId, FORM_DATA_INITIAL);

    // Persistencia separada para datos del odontograma
    const {
        data: odontogramaData,
        setData: setOdontogramaData,
        clearBackup: clearOdontogramaBackup,
        hasBackup: tieneBackupOdontograma,
    } = useClinicalPersist<Record<string, any>>('odontograma', pacienteId, {});

    const [tienePermisoOdontograma, setTienePermisoOdontograma] = useState(false);
    const [tienePermisoTratamiento, setTienePermisoTratamiento] = useState(false);

    // ==========================================
    // NORMALIZACIÓN BIOLÓGICA
    // ==========================================
    const edadPaciente = calcularEdad(paciente?.fecha_nacimiento);
    const pacienteEsFemenino = esFemenino(paciente?.sexo);
    const pacienteEsPediatrico = esPediatrico(edadPaciente);

    // ==========================================
    // CARGA DE DATOS
    // ==========================================
    useEffect(() => {
        // Mock ID for current student demo
        const estudianteId = '4'; // We assume '4' (García López) for demo purposes
        setTienePermisoOdontograma(verificarAccesoModulo(estudianteId, 'M2_DIAGNOSTICO'));
        setTienePermisoTratamiento(verificarAccesoModulo(estudianteId, 'M3_TRATAMIENTO'));

        const cargarDatos = async () => {
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPaciente(data);
                    // Si el backend ya tiene antecedentes Y no hay backup local, cargar del backend
                    if (data.antecedentes && !tieneBackupForm) {
                        setFormData(data.antecedentes);
                    }
                }
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();

        // Listen to updates from Docente Panel
        const listener = () => {
            setTienePermisoOdontograma(verificarAccesoModulo(estudianteId, 'M2_DIAGNOSTICO'));
            setTienePermisoTratamiento(verificarAccesoModulo(estudianteId, 'M3_TRATAMIENTO'));
        };
        window.addEventListener('supervision-update', listener);
        return () => window.removeEventListener('supervision-update', listener);
    }, [pacienteId]);

    // ==========================================
    // MANEJADORES DE CAMBIO CON PERSISTENCIA
    // ==========================================
    const handleInputChange = useCallback((seccion: string, campo: string, valor: any) => {
        setFormData((prev: typeof FORM_DATA_INITIAL) => ({
            ...prev,
            [seccion]: { ...(prev as any)[seccion], [campo]: valor }
        }));
    }, [setFormData]);

    const handleOdontogramaChange = useCallback((updater: any) => {
        setFormData((prev: any) => ({
            ...prev,
            odontograma: typeof updater === 'function' ? updater(prev.odontograma || {}) : updater
        }));
    }, [setFormData]);

    // ==========================================
    // GUARDADO DEFINITIVO (Botón Guardar)
    // ==========================================
    const guardarExpediente = async () => {
        setGuardando(true);
        const token = localStorage.getItem("access_token");
        try {
            // 1. Guardar antecedentes/formulario
            const response = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/antecedentes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                toast.error("Error al guardar los antecedentes.");
                setGuardando(false);
                return;
            }

            // 2. Guardar el periodontograma si existe
            if (periodontogramaRef.current) {
                const periodontogramaGuardado = await periodontogramaRef.current.guardar();
                if (!periodontogramaGuardado) {
                    toast.warning("Antecedentes guardados, pero hubo un error al guardar el periodontograma.");
                    setGuardando(false);
                    return;
                }
            }

            // 3. Solo limpiar backup local DESPUÉS de respuesta HTTP exitosa
            clearAllPatientBackups(pacienteId);
            
            toast.success("¡Expediente completo guardado con éxito! 🎉");
        } catch (error) {
            toast.error("Error de conexión al servidor.");
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Expediente Clínico</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" /> {paciente?.nombres} {paciente?.apellido_paterno}
                            {paciente?.sexo && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    pacienteEsFemenino 
                                        ? 'bg-pink-100 text-pink-700' 
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {paciente.sexo}
                                </span>
                            )}
                            {edadPaciente !== null && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    pacienteEsPediatrico 
                                        ? 'bg-amber-100 text-amber-700' 
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {edadPaciente} años {pacienteEsPediatrico && '(Pediátrico)'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Indicador de auto-guardado */}
                    {(tieneBackupForm || tieneBackupOdontograma) && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <Shield className="h-3 w-3" />
                            <span>Auto-guardado activo</span>
                            {ultimoGuardadoForm && (
                                <span className="text-emerald-400 ml-1">
                                    · {ultimoGuardadoForm.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    )}
                    <Button onClick={guardarExpediente} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                        {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Historia Clínica
                    </Button>
                </div>
            </div>

            {/* Tabs de Trabajo del Estudiante */}
            <Tabs defaultValue="historia" className="w-full">
                <TabsList className="bg-white border shadow-sm p-1 h-12 mb-6 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="historia">Historia Clínica</TabsTrigger>
                    
                    <TabsTrigger value="periodontograma" className={!tienePermisoOdontograma ? "opacity-50" : ""}>
                        {!tienePermisoOdontograma && <Lock className="w-3 h-3 mr-2" />}
                        Periodontograma
                    </TabsTrigger>
                    
                    <TabsTrigger value="odontograma" className={!tienePermisoOdontograma ? "opacity-50" : ""}>
                        {!tienePermisoOdontograma && <Lock className="w-3 h-3 mr-2" />}
                        Odontograma {pacienteEsPediatrico ? '(Deciduo)' : '(Adulto)'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="historia">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registro de Historia</CardTitle>
                            {pacienteEsPediatrico && (
                                <CardDescription className="flex items-center gap-1.5 text-amber-600">
                                    <Baby className="h-4 w-4" />
                                    Paciente pediátrico — Secciones adaptadas automáticamente
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="evaluacion">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
                                    <TabsTrigger value="odontopediatria">Odontopediatría</TabsTrigger>
                                    <TabsTrigger value="periodoncia">Periodoncia</TabsTrigger>
                                    {/* CONDICIONAL POR SEXO: Solo visible si es Femenino */}
                                    {pacienteEsFemenino && (
                                        <TabsTrigger value="gineco" className="text-pink-700">
                                            Gineco-Obstétrico
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                                <TabsContent value="evaluacion">
                                    <TabEvaluacionGeneral 
                                        formData={formData} 
                                        onChange={handleInputChange}
                                        paciente={paciente}
                                    />
                                </TabsContent>
                                <TabsContent value="odontopediatria">
                                    <TabOdontopediatria 
                                        formData={formData} 
                                        onChange={handleInputChange}
                                        paciente={paciente}
                                    />
                                </TabsContent>
                                <TabsContent value="periodoncia">
                                    <TabPeriodoncia formData={formData} onChange={handleInputChange} />
                                </TabsContent>
                                {/* SECCIÓN GINECO-OBSTÉTRICA — Solo para Femenino */}
                                {pacienteEsFemenino && (
                                    <TabsContent value="gineco">
                                        <SeccionGinecoObstetrica 
                                            formData={formData} 
                                            onChange={handleInputChange} 
                                        />
                                    </TabsContent>
                                )}
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="periodontograma">
                    {!tienePermisoOdontograma ? (
                        <Card className="h-[400px] flex flex-col items-center justify-center bg-slate-50 border-dashed text-slate-500">
                            <Lock className="w-12 h-12 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700">Módulo Bloqueado</h3>
                            <p className="mt-2 text-center max-w-sm">
                                Necesitas que tu Docente Supervisor habilite el paso "Diagnóstico / Odontograma" en tu bandeja para ingresar.
                            </p>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <PeriodontogramaProvider pacienteId={pacienteId}>
                                    <TabPeriodontogramaGrafico ref={periodontogramaRef} pacienteId={pacienteId} />
                                </PeriodontogramaProvider>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="odontograma">
                    {!tienePermisoOdontograma ? (
                        <Card className="h-[400px] flex flex-col items-center justify-center bg-slate-50 border-dashed text-slate-500">
                            <Lock className="w-12 h-12 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700">Módulo Bloqueado</h3>
                            <p className="mt-2 text-center max-w-sm">
                                Necesitas que tu Docente Supervisor habilite el paso "Diagnóstico / Odontograma" en tu bandeja para ingresar.
                            </p>
                        </Card>
                    ) : (
                        <Card className="border-purple-100 shadow-sm">
                            <CardHeader className="bg-purple-50/50 border-b">
                                <CardTitle className="text-purple-800">Odontograma Interactivo</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <OdontogramaDinamico 
                                    pacienteId={pacienteId}
                                    esPediatrico={pacienteEsPediatrico}
                                    edadPaciente={edadPaciente}
                                    data={(formData as any).odontograma || {}}
                                    onDataChange={handleOdontogramaChange}
                                />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ==========================================
// SECCIÓN GINECO-OBSTÉTRICA
// (Se renderiza SOLO si paciente es Femenino)
// ==========================================
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

function SeccionGinecoObstetrica({ formData, onChange }: { formData: any; onChange: (s: string, c: string, v: any) => void }) {
    const gineco = formData.ginecologicos || {};
    const seccion = 'ginecologicos';

    return (
        <div className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 border-b pb-3">
                <div className="bg-pink-100 p-2 rounded-full">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-pink-900">Examen Gineco-Obstétrico</h3>
                    <p className="text-xs text-pink-600">Sección exclusiva para paciente femenino</p>
                </div>
            </div>

            {/* Estado de embarazo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-pink-100 rounded-xl bg-pink-50/30 space-y-4">
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            checked={gineco.posibilidad_embarazo || false}
                            onCheckedChange={(v) => onChange(seccion, 'posibilidad_embarazo', v as boolean)}
                        />
                        <Label className="font-bold text-pink-800">¿Posibilidad de Embarazo?</Label>
                    </div>
                    {gineco.posibilidad_embarazo && (
                        <div className="space-y-3 pl-7">
                            <div className="space-y-1">
                                <Label className="text-xs text-pink-600">Meses de embarazo</Label>
                                <Input 
                                    type="number" min="1" max="9"
                                    value={gineco.embarazo_meses || ''} 
                                    onChange={(e) => onChange(seccion, 'embarazo_meses', e.target.value)}
                                    className="bg-white"
                                    placeholder="Ej: 3"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-pink-600">Fecha probable de parto</Label>
                                <Input 
                                    type="date"
                                    value={gineco.fecha_probable_parto || ''} 
                                    onChange={(e) => onChange(seccion, 'fecha_probable_parto', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border border-pink-100 rounded-xl bg-pink-50/30 space-y-4">
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            checked={gineco.toma_anticonceptivos || false}
                            onCheckedChange={(v) => onChange(seccion, 'toma_anticonceptivos', v as boolean)}
                        />
                        <Label className="font-bold text-pink-800">¿Toma Anticonceptivos?</Label>
                    </div>
                    {gineco.toma_anticonceptivos && (
                        <div className="pl-7 space-y-1">
                            <Label className="text-xs text-pink-600">Tipo / Nombre</Label>
                            <Input 
                                value={gineco.anticonceptivos_obs || ''} 
                                onChange={(e) => onChange(seccion, 'anticonceptivos_obs', e.target.value)}
                                className="bg-white"
                                placeholder="Ej: Pastillas, DIU..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Fecha de última regla y otros campos ginecológicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-pink-700">Fecha de Última Regla (FUR)</Label>
                    <Input 
                        type="date"
                        value={gineco.fecha_ultima_regla || ''} 
                        onChange={(e) => onChange(seccion, 'fecha_ultima_regla', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-pink-700">Ciclo Menstrual</Label>
                    <Input 
                        value={gineco.ciclo_menstrual || ''} 
                        onChange={(e) => onChange(seccion, 'ciclo_menstrual', e.target.value)}
                        placeholder="Regular / Irregular"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-pink-700">N° de Gestaciones Previas</Label>
                    <Input 
                        type="number" min="0"
                        value={gineco.gestaciones_previas || ''} 
                        onChange={(e) => onChange(seccion, 'gestaciones_previas', e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-semibold text-pink-700">Observaciones Gineco-Obstétricas</Label>
                <Textarea 
                    value={gineco.observaciones || ''} 
                    onChange={(e) => onChange(seccion, 'observaciones', e.target.value)}
                    rows={3}
                    placeholder="Notas adicionales sobre el estado gineco-obstétrico de la paciente..."
                />
            </div>
        </div>
    );
}