"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, User, Save, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

// REUTILIZACIÓN DE TUS COMPONENTES EXISTENTES
import { TabEvaluacionGeneral } from "@/components/tabs-expediente/tab-evaluacion-general"
import { TabOdontopediatria } from "@/components/tabs-expediente/tab-odontopediatria"
import { TabPeriodoncia } from "@/components/tabs-expediente/tab-periodoncia"
import { TabPeriodontogramaGrafico } from "@/components/tabs-expediente/tab-periodontograma-grafico"

export default function ExpedienteEstudiantePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: pacienteId } = use(params);

    const [paciente, setPaciente] = useState<any>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // Estado unificado del expediente
    const [formData, setFormData] = useState({
        familiares: {}, personales: {}, no_patologicos: {}, ginecologicos: {},
        habitos: {}, antecedentes_periodontales: {}, examen_periodontal: {},
        historia_odontopediatrica: {}, prostodoncia_removible: {}, 
        prostodoncia_fija: {}, protocolo_quirurgico: {}, examen_clinico_fisico: {}
    });

    // Cargar datos iniciales del paciente y sus antecedentes
    useEffect(() => {
        const cargarDatos = async () => {
            const token = localStorage.getItem("access_token");
            try {
                const res = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPaciente(data);
                    // Si el backend ya tiene antecedentes, los cargamos al formData
                    if (data.antecedentes) setFormData(data.antecedentes);
                }
            } catch (error) {
                console.error("Error al cargar:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [pacienteId]);

    const handleInputChange = (seccion: string, campo: string, valor: any) => {
        setFormData(prev => ({
            ...prev,
            [seccion]: { ...prev[seccion as keyof typeof prev], [campo]: valor }
        }));
    };

    const guardarExpediente = async () => {
        setGuardando(true);
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`http://localhost:8000/api/pacientes/${pacienteId}/antecedentes/`, {
                method: 'POST', // O PUT si tu backend lo soporta
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 👈 SOLUCIÓN AL ERROR DE IMAGEN 1
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("¡Expediente guardado con éxito! 🎉");
            } else {
                alert("Error al guardar. Verifica los datos.");
            }
        } catch (error) {
            alert("Error de conexión.");
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
                        </p>
                    </div>
                </div>
                <Button onClick={guardarExpediente} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                    {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Cambios
                </Button>
            </div>

            {/* Tabs de Trabajo del Estudiante */}
            <Tabs defaultValue="historia" className="w-full">
                <TabsList className="bg-white border shadow-sm p-1 h-12 mb-6">
                    <TabsTrigger value="historia">Historia Clínica</TabsTrigger>
                    <TabsTrigger value="periodontograma">Periodontograma</TabsTrigger>
                    <TabsTrigger value="odontograma">Odontograma 3D</TabsTrigger>
                </TabsList>

                <TabsContent value="historia">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registro de Historia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="evaluacion">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
                                    <TabsTrigger value="odontopediatria">Odontopediatría</TabsTrigger>
                                    <TabsTrigger value="periodoncia">Periodoncia</TabsTrigger>
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

                <TabsContent value="periodontograma">
                    <Card>
                        <CardContent className="pt-6">
                            <TabPeriodontogramaGrafico />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="odontograma">
                    <Card className="h-[500px] flex items-center justify-center bg-slate-900 text-white">
                        Próximamente: Renderizado de Piezas Dentales
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}