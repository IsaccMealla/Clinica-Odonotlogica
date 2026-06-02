"use client"

import { useState, use, useEffect, useRef } from "react"
import { 
    ArrowLeft, User, Stethoscope, Activity, FileText, 
    Save, ClipboardList, ImageIcon, UploadCloud, History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { BotonSupervisado } from "@/components/seguridad/BotonSupervisado"
import { useAutoSave } from "@/hooks/useAutoSave"

// IMPORTAMOS LOS COMPONENTES DE LAS PESTAÑAS
import { TabEvaluacionGeneral } from "@/components/tabs-expediente/tab-evaluacion-general"
import { TabOdontopediatria } from "@/components/tabs-expediente/tab-odontopediatria"
import { TabPeriodoncia } from "@/components/tabs-expediente/tab-periodoncia"
import { TabPeriodontogramaGrafico } from "@/components/tabs-expediente/tab-periodontograma-grafico"
import { TabHistorialTratamientos } from "@/components/tabs-expediente/tab-historial-tratamientos"
import { PeriodontogramaProvider } from "@/context/PeriodontogramaContext"
import { HistorialCitasPorPaciente } from "@/components/citas/HistorialCitasPorPaciente"
import { OdontogramaDinamico } from "@/components/tabs-expediente/odontograma-dinamico"

// MODULO 5: IMÁGENES
import VisorRadiografiasAvanzado from "@/components/imagenes/VisorRadiografiasAvanzado"
import ImageUpload from "@/components/imagenes/ImageUpload"
import AuditRadiografias from "@/components/imagenes/AuditRadiografias"       

export default function ExpedientePacientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const pacienteId = unwrappedParams.id;
    const periodontogramaRef = useRef<any>(null);
    const [estudianteId, setEstudianteId] = useState<string>("");

    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        familiares: {}, personales: {}, no_patologicos: {}, ginecologicos: {},
        habitos: {}, antecedentes_periodontales: {}, examen_periodontal: {},
        historia_odontopediatrica: {}, prostodoncia_removible: {},
        prostodoncia_fija: {}, protocolo_quirurgico: {}, examen_clinico_fisico: {},
        odontograma: {}
    });
    const [paciente, setPaciente] = useState<any>(null);
    const [imagenes, setImagenes] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [showUploadRadiografia, setShowUploadRadiografia] = useState(false);

    // --- CARGA DE DATOS (PACIENTE, ANTECEDENTES E IMÁGENES) ---
    const cargarPaciente = async (id: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/pacientes/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPaciente(data);
            }
        } catch (error) { 
            console.error("Error cargando datos del paciente:", error); 
        }
    };

    const cargarImagenes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/imagenes/?paciente=${pacienteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setImagenes(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (error) { console.error("Error cargando imágenes:", error); }
    };

    useEffect(() => {
        const cargarExpediente = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/antecedentes/`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const datosGuardados = await response.json();
                    setFormData(prev => ({ ...prev, ...datosGuardados }));
                }
            } catch (error) { console.error("Error cargando expediente:", error); }
        };

        // Obtener ID del estudiante
        const userId = localStorage.getItem('user_id') || '';
        setEstudianteId(userId);

        // Recuperar backup del localStorage si existe
        const backupKey = `hc_backup_${pacienteId}_${userId}`;
        try {
            const backup = localStorage.getItem(backupKey);
            if (backup) {
                const backupData = JSON.parse(backup);
                setFormData(prev => ({ ...prev, ...backupData }));
            }
        } catch (e) {
            console.warn('No se pudo recuperar el backup:', e);
        }

        if (pacienteId) {
            setCargando(true);
            Promise.all([
                cargarPaciente(pacienteId),
                cargarExpediente(),
                cargarImagenes()
            ]).finally(() => setCargando(false));
        }
    }, [pacienteId]);

    // --- AUTO-SAVE EN LOCALSTORAGE ---
    const backupKey = `hc_backup_${pacienteId}_${estudianteId}`;
    const { clearBackup: clearAutoSaveBackup } = useAutoSave({
        key: backupKey,
        data: formData,
        delay: 1000, // Guardar cada 1 segundo de inactividad
        onSaveSuccess: () => {
            // Silenciosamente guardado
        },
        onSaveError: (error) => {
            console.warn('[AutoSave] Error guardando backup en localStorage:', error);
        }
    });

    // --- FUNCIONES DE ACCIÓN ---
    const handleInputChange = (seccion: string, campo: string, valor: any) => {
        setFormData((prev) => ({
            ...prev,
            [seccion]: { ...prev[seccion as keyof typeof prev], [campo]: valor }
        }));
    };

    const handleOdontogramaChange = (updater: any) => {
        setFormData(prev => ({
            ...prev,
            odontograma: typeof updater === 'function' ? updater(prev.odontograma || {}) : updater
        }));
    };

    const guardarExpediente = async () => {
        setGuardando(true);
        try {
            const token = localStorage.getItem('access_token');
            const dataParaEnviar = JSON.parse(JSON.stringify(formData));
            
            Object.keys(dataParaEnviar).forEach(seccion => {
                if (dataParaEnviar[seccion]) {
                    delete dataParaEnviar[seccion].id;
                    delete dataParaEnviar[seccion].paciente;
                }
            });

            const response = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/antecedentes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dataParaEnviar)
            });

            if (!response.ok) {
                alert("Error al guardar los antecedentes.");
                setGuardando(false);
                return;
            }

            // Ahora guardar el periodontograma si existe
            if (periodontogramaRef.current) {
                const periodontogramaGuardado = await periodontogramaRef.current.guardar();
                if (!periodontogramaGuardado) {
                    alert("Antecedentes guardados, pero hubo un error al guardar el periodontograma.");
                    setGuardando(false);
                    return;
                }
            }

            alert("¡Expediente completo guardado con éxito! 🎉");
            // Limpiar el backup automático después de guardar exitosamente
            clearAutoSaveBackup();
        } catch (error) { 
            alert("Error de conexión con el servidor."); 
        }
        finally { setGuardando(false); }
    }

    return (
        <div className="min-h-screen bg-clinica-bg p-6 flex flex-col space-y-6">

            {cargando || !paciente ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : (
            <>
            {/* --- ENCABEZADO --- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Expediente Clínico</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {paciente.nombres} {paciente.apellido_paterno} • CI: {paciente.ci} • {paciente.edad} años
                        </p>
                    </div>
                </div>

                <BotonSupervisado
                    modulo="M2_DIAGNOSTICO"
                    accionLabel={guardando ? "Guardando..." : "Guardar Expediente"}
                    accionDescripcion="Guardar Diagnóstico y Odontograma del Expediente"
                    onAccionPermitida={guardarExpediente}
                    disabled={guardando}
                    pacienteId={pacienteId}
                    pacienteNombre={paciente ? `${paciente.nombres} ${paciente.apellido_paterno}` : ''}
                    className="min-w-[180px]"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {guardando ? "Guardando..." : "Guardar Expediente"}
                </BotonSupervisado>
            </div>

            {/* --- TABS PRINCIPALES (AHORA 6 COLUMNAS) --- */}
            <Tabs defaultValue="historia" className="w-full flex-1 flex flex-col">

                <TabsList className="grid w-full grid-cols-7 h-14 bg-white border shadow-sm rounded-xl p-1">
                    <TabsTrigger value="historia" className="text-md data-[state=active]:bg-clinica-secondary/10 data-[state=active]:text-clinica-secondary">
                        <FileText className="h-4 w-4 mr-2" /> Historia Clínica
                    </TabsTrigger>
                    <TabsTrigger value="odontograma" className="text-md data-[state=active]:bg-clinica-primary/10 data-[state=active]:text-clinica-primary">
                        <Stethoscope className="h-4 w-4 mr-2" /> Odontograma 3D
                    </TabsTrigger>
                    <TabsTrigger value="periodontograma" className="text-md data-[state=active]:bg-clinica-accent/10 data-[state=active]:text-clinica-accent">
                        <Activity className="h-4 w-4 mr-2" /> Periodontograma
                    </TabsTrigger>
                    <TabsTrigger value="tratamientos" className="text-md data-[state=active]:bg-clinica-primary/10 data-[state=active]:text-clinica-primary">
                        <ClipboardList className="h-4 w-4 mr-2" /> Tratamientos
                    </TabsTrigger>
                    <TabsTrigger value="radiografias" className="text-md data-[state=active]:bg-clinica-secondary/10 data-[state=active]:text-clinica-secondary">
                        <ImageIcon className="h-4 w-4 mr-2" /> Radiografías
                    </TabsTrigger>
                    <TabsTrigger value="historial-citas" className="text-md data-[state=active]:bg-clinica-primary/10 data-[state=active]:text-clinica-primary">
                        <History className="h-4 w-4 mr-2" /> Historial Citas
                    </TabsTrigger>
                    <TabsTrigger value="auditoria" className="text-md data-[state=active]:bg-clinica-accent/10 data-[state=active]:text-clinica-accent">
                        <ClipboardList className="h-4 w-4 mr-2" /> Auditoría
                    </TabsTrigger>
                </TabsList>

                {/* --- CONTENIDO: HISTORIA CLÍNICA --- */}
                <TabsContent value="historia" className="mt-6 flex-1">
                    <Card className="border-clinica-secondary/20 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-clinica-secondary/10 to-clinica-secondary/5 border-b border-clinica-secondary/20">
                            <CardTitle className="text-clinica-secondary">Historia Clínica Detallada</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Tabs defaultValue="evaluacion" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100">
                                    <TabsTrigger value="evaluacion">Evaluación y Hábitos</TabsTrigger>
                                    <TabsTrigger value="odontopediatria">Odontopediatría</TabsTrigger>
                                    <TabsTrigger value="periodoncia">Enf. Periodontales</TabsTrigger>
                                </TabsList>
                                <TabsContent value="evaluacion">
                                    <TabEvaluacionGeneral formData={formData} onChange={handleInputChange} />
                                </TabsContent>
                                <TabsContent value="odontopediatria">
                                    <TabOdontopediatria formData={formData} onChange={handleInputChange} />
                                </TabsContent>
                                <TabsContent value="periodoncia">
                                    <TabPeriodoncia formData={formData} onChange={handleInputChange} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: ODONTOGRAMA 3D --- */}
                <TabsContent value="odontograma" className="mt-6 flex-1">
                    <Card className="border-clinica-primary/20 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-clinica-primary/10 to-clinica-primary/5 border-b border-clinica-primary/20">
                            <CardTitle className="text-clinica-primary">Odontograma Interactivo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <OdontogramaDinamico 
                                pacienteId={pacienteId}
                                esPediatrico={paciente?.edad !== null && paciente?.edad <= 14}
                                edadPaciente={paciente?.edad}
                                data={formData.odontograma || {}}
                                onDataChange={handleOdontogramaChange}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: PERIODONTOGRAMA --- */}
                <TabsContent value="periodontograma" className="mt-6 flex-1">
                    <Card className="border-clinica-accent/20 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-clinica-accent/10 to-clinica-accent/5 border-b border-clinica-accent/20">
                            <CardTitle className="text-clinica-accent">Periodontograma Gráfico</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <PeriodontogramaProvider pacienteId={pacienteId}>
                                <TabPeriodontogramaGrafico ref={periodontogramaRef} pacienteId={pacienteId} />
                            </PeriodontogramaProvider>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: TRATAMIENTOS --- */}
                <TabsContent value="tratamientos" className="mt-6 flex-1">
                    <Card className="border-clinica-primary/20 shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-clinica-primary/10 to-clinica-primary/5 border-b border-clinica-primary/20">
                            <CardTitle className="text-clinica-primary">Plan de Tratamiento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 bg-slate-50">
                            <TabHistorialTratamientos pacienteId={pacienteId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NUEVO CONTENIDO: MÓDULO 5 RADIOGRAFÍAS Y RAYOS X --- */}
                <TabsContent value="radiografias" className="mt-6 flex-1">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-clinica-secondary/10 p-4 rounded-lg border border-clinica-secondary/20">
                            <div>
                                <h3 className="text-lg font-semibold text-clinica-primary">Radiografías e Imágenes</h3>
                                <p className="text-sm text-clinica-primary/70">Explora las imágenes existentes o sube una nueva.</p>
                            </div>
                            <Button 
                                onClick={() => setShowUploadRadiografia(!showUploadRadiografia)}
                                className={showUploadRadiografia ? "bg-slate-500 hover:bg-slate-600 text-white" : "bg-clinica-secondary hover:bg-clinica-secondary/90 text-white shadow-md"}
                            >
                                {showUploadRadiografia ? "Cancelar" : "+ Agregar Nueva Radiografía"}
                            </Button>
                        </div>

                        {/* Panel de Carga Superior */}
                        {showUploadRadiografia && (
                            <Card className="border-clinica-secondary/20 shadow-md transition-all duration-300">
                                <CardHeader className="bg-clinica-secondary/10 border-b border-clinica-secondary/20">
                                    <CardTitle className="text-base flex items-center gap-2 text-clinica-primary">
                                        <UploadCloud className="w-5 h-5" /> Adquisición de Imagen
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <ImageUpload pacienteId={pacienteId} onUploadSuccess={cargarImagenes} />
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Visor Avanzado */}
                        <VisorRadiografiasAvanzado imagenes={imagenes} />
                    </div>
                </TabsContent>

                {/* --- NUEVO CONTENIDO: HISTORIAL DE CITAS --- */}
                <TabsContent value="historial-citas" className="mt-6 flex-1">
                    <Card className="border-cyan-100 shadow-sm">
                        <CardHeader className="bg-cyan-50/50 border-b">
                            <CardTitle className="text-cyan-800">Historial de Cambios de Citas</CardTitle>
                            <CardDescription>
                                Visualiza todos los cambios de estado realizados en las citas de este paciente
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <HistorialCitasPorPaciente 
                                pacienteId={pacienteId} 
                                pacienteNombre={`${paciente.apellido_paterno} ${paciente.nombres}`}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NUEVO CONTENIDO: AUDITORÍA DE RADIOGRAFÍAS --- */}
                <TabsContent value="auditoria" className="mt-6 flex-1">
                    <Card className="border-orange-100 shadow-sm">
                        <CardHeader className="bg-orange-50/50 border-b">
                            <CardTitle className="text-orange-800 flex items-center gap-2">
                                <History className="h-5 w-5" /> Auditoría de Radiografías
                            </CardTitle>
                            <CardDescription className="text-orange-700">
                                Registro detallado de todas las acciones realizadas en las radiografías del paciente
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AuditRadiografias />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
            </>
            )}
        </div>
    )
}