"use client"

import { useState, use, useEffect } from "react"
import { 
    ArrowLeft, User, Stethoscope, Activity, FileText, 
    Save, ClipboardList, ImageIcon, UploadCloud 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

// IMPORTAMOS LOS COMPONENTES DE LAS PESTAÑAS
import { TabEvaluacionGeneral } from "@/components/tabs-expediente/tab-evaluacion-general"
import { TabOdontopediatria } from "@/components/tabs-expediente/tab-odontopediatria"
import { TabPeriodoncia } from "@/components/tabs-expediente/tab-periodoncia"
import { TabPeriodontogramaGrafico } from "@/components/tabs-expediente/tab-periodontograma-grafico"
import { TabHistorialTratamientos } from "@/components/tabs-expediente/tab-historial-tratamientos"

// MODULO 5: IMÁGENES
import VisorRadiologico from "@/components/imagenes/VisorRadiologico"
import ImageUpload from "@/components/imagenes/ImageUpload"
import ExploradorImagenes from "@/components/imagenes/ExploradorImagenes"       

export default function ExpedientePacientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const pacienteId = unwrappedParams.id;

    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        familiares: {}, personales: {}, no_patologicos: {}, ginecologicos: {},
        habitos: {}, antecedentes_periodontales: {}, examen_periodontal: {},
        historia_odontopediatrica: {}, prostodoncia_removible: {},
        prostodoncia_fija: {}, protocolo_quirurgico: {}, examen_clinico_fisico: {}
    });
    const [paciente, setPaciente] = useState<any>(null);
    const [imagenes, setImagenes] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);

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

        if (pacienteId) {
            setCargando(true);
            Promise.all([
                cargarPaciente(pacienteId),
                cargarExpediente(),
                cargarImagenes()
            ]).finally(() => setCargando(false));
        }
    }, [pacienteId]);

    // --- FUNCIONES DE ACCIÓN ---
    const handleInputChange = (seccion: string, campo: string, valor: any) => {
        setFormData((prev) => ({
            ...prev,
            [seccion]: { ...prev[seccion as keyof typeof prev], [campo]: valor }
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

            if (response.ok) alert("¡Expediente guardado con éxito! 🎉");
        } catch (error) { alert("Error de conexión con el servidor."); } 
        finally { setGuardando(false); }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col space-y-6">

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

                <Button onClick={guardarExpediente} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {guardando ? "Guardando..." : "Guardar Expediente"}
                </Button>
            </div>

            {/* --- TABS PRINCIPALES (AHORA 5 COLUMNAS) --- */}
            <Tabs defaultValue="historia" className="w-full flex-1 flex flex-col">

                <TabsList className="grid w-full grid-cols-5 h-14 bg-white border shadow-sm rounded-xl p-1">
                    <TabsTrigger value="historia" className="text-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        <FileText className="h-4 w-4 mr-2" /> Historia Clínica
                    </TabsTrigger>
                    <TabsTrigger value="odontograma" className="text-md data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                        <Stethoscope className="h-4 w-4 mr-2" /> Odontograma 3D
                    </TabsTrigger>
                    <TabsTrigger value="periodontograma" className="text-md data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                        <Activity className="h-4 w-4 mr-2" /> Periodontograma
                    </TabsTrigger>
                    <TabsTrigger value="tratamientos" className="text-md data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        <ClipboardList className="h-4 w-4 mr-2" /> Tratamientos
                    </TabsTrigger>
                    <TabsTrigger value="imagenes" className="text-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        <ImageIcon className="h-4 w-4 mr-2" /> Imágenes/RX
                    </TabsTrigger>
                </TabsList>

                {/* --- CONTENIDO: HISTORIA CLÍNICA --- */}
                <TabsContent value="historia" className="mt-6 flex-1">
                    <Card className="h-full border-emerald-100 shadow-sm">
                        <CardHeader className="bg-emerald-50/50 border-b">
                            <CardTitle className="text-emerald-800">Historia Clínica Detallada</CardTitle>
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
                <TabsContent value="odontograma" className="mt-6">
                    <Card className="h-[600px] flex items-center justify-center bg-slate-900">
                        <p className="text-slate-400 font-mono">THREE.JS CANVAS: ODONTOGRAMA EN TIEMPO REAL</p>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: PERIODONTOGRAMA --- */}
                <TabsContent value="periodontograma" className="mt-6 flex-1">
                    <Card className="border-rose-100 shadow-sm">
                        <CardHeader className="bg-rose-50/50 border-b">
                            <CardTitle className="text-rose-800">Periodontograma Gráfico</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <TabPeriodontogramaGrafico />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: TRATAMIENTOS --- */}
                <TabsContent value="tratamientos" className="mt-6 flex-1">
                    <Card className="border-indigo-100 shadow-sm">
                        <CardHeader className="bg-indigo-50/50 border-b">
                            <CardTitle className="text-indigo-800">Plan de Tratamiento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 bg-slate-50">
                            <TabHistorialTratamientos pacienteId={pacienteId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NUEVO CONTENIDO: MÓDULO 5 IMÁGENES Y RAYOS X --- */}
                <TabsContent value="imagenes" className="mt-6 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                        {/* Columna Izquierda: Panel de Carga */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="border-blue-100 shadow-sm">
                                <CardHeader className="bg-blue-50/50 border-b">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4" /> Adquisición de Imagen
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ImageUpload pacienteId={pacienteId} onUploadSuccess={cargarImagenes} />
                                </CardContent>
                            </Card>
                            
                            <Card className="p-4 bg-blue-50 border-blue-100">
                                <p className="text-xs text-blue-800 font-medium italic">
                                    "Recuerde etiquetar correctamente la pieza dental y el plano de corte para capturas CBCT."
                                </p>
                            </Card>
                        </div>
                        
                        {/* Columna Derecha: Visor Avanzado */}
                        <div className="lg:col-span-3">
                            <VisorRadiologico imagenes={imagenes} />
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
            </>
            )}
        </div>
    )
}