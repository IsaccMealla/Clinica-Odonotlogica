"use client"

import { useState, use } from "react"
import { ArrowLeft, User, Stethoscope, Activity, FileText, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

// IMPORTAMOS LOS COMPONENTES DE LAS PESTAÑAS
import { TabEvaluacionGeneral } from "@/components/tabs-expediente/tab-evaluacion-general"
import { TabOdontopediatria } from "@/components/tabs-expediente/tab-odontopediatria"
import { TabPeriodoncia } from "@/components/tabs-expediente/tab-periodoncia"
// NUEVO IMPORT: La pestaña gráfica del periodontograma
import { TabPeriodontogramaGrafico } from "@/components/tabs-expediente/tab-periodontograma-grafico"

export default function ExpedientePacientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    // 1. Desempaquetamos los params usando la función use()
    const unwrappedParams = use(params);
    // 2. Ahora sí podemos acceder al id sin que Next.js se queje
    const pacienteId = unwrappedParams.id;

    // --- 1. ESTADO GLOBAL DEL FORMULARIO ---
    const [formData, setFormData] = useState({
        familiares: {},
        personales: {},
        no_patologicos: {},
        ginecologicos: {},
        habitos: {},
        antecedentes_periodontales: {},
        examen_periodontal: {},
        historia_odontopediatrica: {},
        prostodoncia_removible: {},
        prostodoncia_fija: {},
        protocolo_quirurgico: {},
        examen_clinico_fisico: {}
    });

    const [guardando, setGuardando] = useState(false);

    // Datos de prueba (Luego haremos un GET al backend)
    const paciente = {
        nombres: "Isacc Leonardo",
        apellido_paterno: "Mealla",
        ci: "13970664",
        edad: 21,
        sexo: "Masculino"
    }

    // --- 2. FUNCIÓN MAESTRA PARA ACTUALIZAR CAMPOS ---
    const handleInputChange = (seccion: string, campo: string, valor: any) => {
        setFormData((prev) => ({
            ...prev,
            [seccion]: {
                ...prev[seccion as keyof typeof prev],
                [campo]: valor
            }
        }));
    };

    // --- 3. FUNCIÓN PARA ENVIAR A DJANGO ---
    const guardarExpediente = async () => {
        setGuardando(true);
        try {
            const response = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/antecedentes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${tu_token_jwt}` // <-- Cuando haya login
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("¡Expediente guardado con éxito! 🎉");
            } else {
                const errorData = await response.json();
                console.error("Error al guardar:", errorData);
                alert("Hubo un error al guardar. Revisa la consola.");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de conexión con el servidor.");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col space-y-6">

            {/* --- ENCABEZADO Y BOTÓN DE REGRESO --- */}
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

                {/* --- NUEVO BOTÓN MAESTRO PARA GUARDAR --- */}
                <Button
                    onClick={guardarExpediente}
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {guardando ? "Guardando..." : "Guardar Expediente"}
                </Button>
            </div>

            {/* --- EL HUB DE PESTAÑAS GIGANTES --- */}
            <Tabs defaultValue="historia" className="w-full flex-1 flex flex-col">

                {/* LA BARRA DE NAVEGACIÓN PRINCIPAL */}
                <TabsList className="grid w-full grid-cols-4 h-14 bg-white border shadow-sm rounded-xl">
   
                    <TabsTrigger value="historia" className="text-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        <FileText className="h-4 w-4 mr-2" /> Historia Clínica
                    </TabsTrigger>
                    <TabsTrigger value="odontograma" className="text-md data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                        <Stethoscope className="h-4 w-4 mr-2" /> Odontograma 3D
                    </TabsTrigger>
                    <TabsTrigger value="periodontograma" className="text-md data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                        <Activity className="h-4 w-4 mr-2" /> Periodontograma
                    </TabsTrigger>
                </TabsList>

                {/* --- CONTENIDO: ANTECEDENTES (Carpeta Médica General) --- */}
                <TabsContent value="antecedentes" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Antecedentes Médicos</CardTitle>
                            <CardDescription>Resumen de antecedentes patológicos y familiares.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-500">Aquí incrustaremos tu diseño de carpeta-medica.tsx pero sin el modal.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: HISTORIA CLÍNICA --- */}
                <TabsContent value="historia" className="mt-6 flex-1">
                    <Card className="h-full border-emerald-100 shadow-sm">
                        <CardHeader className="bg-emerald-50/50 border-b">
                            <CardTitle className="text-emerald-800">Historia Clínica Detallada</CardTitle>
                            <CardDescription>Exámenes físicos, Hábitos, Odontopediatría y Periodoncia.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">

                            {/* SUB-PESTAÑAS DE LA HISTORIA CLÍNICA */}
                            <Tabs defaultValue="evaluacion" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100">
                                    <TabsTrigger value="evaluacion">Evaluación y Hábitos</TabsTrigger>
                                    <TabsTrigger value="odontopediatria">Odontopediatría</TabsTrigger>
                                    <TabsTrigger value="periodoncia">Enf. Periodontales</TabsTrigger>
                                </TabsList>

                                {/* 1. SUB-PESTAÑA: EVALUACIÓN Y HÁBITOS */}
                                <TabsContent value="evaluacion">
                                    <TabEvaluacionGeneral formData={formData} onChange={handleInputChange} />
                                </TabsContent>

                                {/* 2. SUB-PESTAÑA: ODONTOPEDIATRÍA */}
                                <TabsContent value="odontopediatria">
                                    <TabOdontopediatria formData={formData} onChange={handleInputChange} />
                                </TabsContent>

                                {/* 3. SUB-PESTAÑA: PERIODONCIA (Textos) */}
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
                        <p className="text-slate-400">Espacio reservado para Canvas de Three.js (Odontograma)</p>
                    </Card>
                </TabsContent>

                {/* --- CONTENIDO: PERIODONTOGRAMA GRÁFICO (El nuevo) --- */}
                <TabsContent value="periodontograma" className="mt-6 flex-1">
                    <Card className="min-h-full border-rose-100 shadow-sm">
                        <CardHeader className="bg-rose-50/50 border-b">
                            <CardTitle className="text-rose-800">Periodontograma Gráfico</CardTitle>
                            <CardDescription>Registro de márgenes, sondaje, placa y sangrado por pieza dental.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <TabPeriodontogramaGrafico />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}