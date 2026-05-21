"use client"

<<<<<<< Updated upstream
import { useState, use, useEffect, useRef } from "react"
import { 
    ArrowLeft, User, Stethoscope, Activity, FileText, 
    Save, ClipboardList, ImageIcon, UploadCloud, History
} from "lucide-react"
=======
import { useEffect, useState } from "react"
import { UploadCloud, FileImage, X, Loader2, Clock, AlertCircle } from "lucide-react"
>>>>>>> Stashed changes
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
import { PeriodontogramaProvider } from "@/context/PeriodontogramaContext"
import { HistorialCitasPorPaciente } from "@/components/citas/HistorialCitasPorPaciente"
import { AutorizacionImagen } from "@/types/radiografias"

<<<<<<< Updated upstream
// MODULO 5: IMÁGENES
import VisorRadiologico from "@/components/imagenes/VisorRadiologico"
import ImageUpload from "@/components/imagenes/ImageUpload"
import ExploradorImagenes from "@/components/imagenes/ExploradorImagenes"       
=======
export default function ImageUpload({ pacienteId, onUploadSuccess }: Props) {
  const { playSound } = useSoundPlayer()
  const [file, setFile] = useState<File | null>(null)
  const [categoria, setCategoria] = useState<string>("")
  const [pieza, setPieza] = useState<string>("")
  const [subiendo, setSubiendo] = useState(false)
  const [tienePermiso, setTienePermiso] = useState(false)
  const [permisoCargando, setPermisoCargando] = useState(true)
  const [autorizacion, setAutorizacion] = useState<any>(null)
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null)
  const [permisoExpirado, setPermisoExpirado] = useState(false)
>>>>>>> Stashed changes

export default function ExpedientePacientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const pacienteId = unwrappedParams.id;
    const periodontogramaRef = useRef<any>(null);
    
    // --- ESTADOS ---
    const [autorizacionPendiente, setAutorizacionPendiente] = useState<AutorizacionImagen | null>(null);
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

<<<<<<< Updated upstream
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
=======
  useEffect(() => {
    const verificarPermiso = async () => {
      setPermisoCargando(true)
      const token = localStorage.getItem('access_token')
      try {
        const response = await fetch(`http://localhost:8000/api/autorizaciones/?paciente=${pacienteId}&estado=APROBADO&only_valid=true`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          const items = Array.isArray(data) ? data : data.results || []
          if (items.length > 0) {
            setAutorizacion(items[0])
            setTienePermiso(true)
            setTiempoRestante(items[0].tiempo_restante_minutos * 60)
          } else {
            setTienePermiso(false)
          }
        } else {
          setTienePermiso(false)
        }
      } catch (error) {
        console.error('Error verificando permiso:', error)
        setTienePermiso(false)
      } finally {
        setPermisoCargando(false)
      }
    }
    if (pacienteId) {
      void verificarPermiso()
    }
  }, [pacienteId])

  // Actualizar cronómetro cada segundo
  useEffect(() => {
    if (!autorizacion || !tiempoRestante) return

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev === null || prev <= 0) {
          setPermisoExpirado(true)
          clearInterval(intervalo)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalo)
  }, [autorizacion])

  const formatearTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60

    if (horas > 0) {
      return `${horas}h ${minutos}m`
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`
    } else {
      return `${segs}s`
    }
  }

  const handleUpload = async () => {
    if (!file || !categoria) {
      alert("Por favor selecciona un archivo y una categoría")
      return
    }
    if (!tienePermiso) {
      alert("No tienes autorización válida para subir imágenes a este paciente.")
      return
    }
    if (permisoExpirado || tiempoRestante === 0) {
      alert("Tu tiempo para enviar la radiografía ha expirado.")
      return
    }

    setSubiendo(true)
    const formData = new FormData()
    formData.append("archivo", file)
    formData.append("categoria", categoria)
    formData.append("paciente", pacienteId)
    formData.append("tipo_evidencia", categoria)
    formData.append("avance", "1")
    if (pieza) formData.append("pieza_dental", pieza)

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch("http://localhost:8000/api/imagenes/", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
>>>>>>> Stashed changes
        }
    };

<<<<<<< Updated upstream
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

    // NUEVO: Función para buscar autorizaciones
    const verificarAutorizacion = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/autorizaciones/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const autorizaciones: AutorizacionImagen[] = await res.json();
                const authActiva = autorizaciones.find(
                    auth => String(auth.paciente) === String(pacienteId) && auth.estado === 'PENDIENTE'
                );
                setAutorizacionPendiente(authActiva || null);
            }
        } catch (error) {
            console.error("Error al verificar autorizaciones:", error);
        }
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
            // Añadimos verificarAutorizacion al Promise.all para que cargue al mismo tiempo
            Promise.all([
                cargarPaciente(pacienteId),
                cargarExpediente(),
                cargarImagenes(),
                verificarAutorizacion() 
            ]).finally(() => setCargando(false));
        }
    }, [pacienteId]);

    // Función que se llama cuando una imagen se sube correctamente
    const handleUploadSuccess = async () => {
        await cargarImagenes();      // Refresca el visor
        await verificarAutorizacion(); // Refresca las autorizaciones para quitar el banner/cronómetro si se completó
    };

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
        } catch (error) { 
            alert("Error de conexión con el servidor."); 
        }
        finally { setGuardando(false); }
=======
      if (res.ok) {
        playSound("exito")
        setFile(null)
        setCategoria("")
        setPieza("")
        onUploadSuccess()
      } else {
        const errorTexto = await res.text()
        try {
          const errorJson = JSON.parse(errorTexto)
          console.error("Errores de validación:", errorJson)
        } catch (e) {
          console.error("Error del servidor (HTML):", errorTexto)
        }
        alert("Error al guardar. Revisa la consola.")
      }
    } catch (error) {
      console.error("Error de red:", error)
    } finally {
      setSubiendo(false)
>>>>>>> Stashed changes
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col space-y-6">

<<<<<<< Updated upstream
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
=======
      {/* Estado de Permiso */}
      {!permisoCargando && autorizacion && tienePermiso && (
        <div className={`p-3 rounded-lg border flex items-start gap-2 ${
          permisoExpirado ? 'bg-red-50 border-red-200' : tiempoRestante && tiempoRestante < 300 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
        }`}>
          <Clock className="w-4 h-4 mt-1 flex-shrink-0" />
          <div className="text-sm">
            <p className={`font-semibold ${
              permisoExpirado ? 'text-red-800' : tiempoRestante && tiempoRestante < 300 ? 'text-yellow-800' : 'text-green-800'
            }`}>
              Tiempo disponible: {tiempoRestante !== null ? formatearTiempo(tiempoRestante) : 'Sin límite'}
            </p>
            <p className={`text-xs ${
              permisoExpirado ? 'text-red-600' : tiempoRestante && tiempoRestante < 300 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {permisoExpirado ? '⏰ Tu permiso ha expirado' : tiempoRestante === null ? 'Aprobado por el docente' : `Aprobado el ${new Date(autorizacion.fecha_aprobacion).toLocaleString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Categoría Obligatoria */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-bold text-slate-500">Tipo de Imagen *</Label>
        <Select onValueChange={setCategoria} value={categoria}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FACIAL">Fotografía Facial</SelectItem>
            <SelectItem value="INTRAORAL">Fotografía Intraoral</SelectItem>
            <SelectItem value="PSP">Radiografía (PSP)</SelectItem>
            <SelectItem value="CBCT">Captura CBCT</SelectItem>
            <SelectItem value="PROCESO">Seguimiento Proceso</SelectItem>
            <SelectItem value="FINAL">Resultado Final</SelectItem>
          </SelectContent>
        </Select>
      </div>
>>>>>>> Stashed changes

                <Button onClick={guardarExpediente} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {guardando ? "Guardando..." : "Guardar Expediente"}
                </Button>
            </div>

<<<<<<< Updated upstream
            {/* --- TABS PRINCIPALES (AHORA 6 COLUMNAS) --- */}
            <Tabs defaultValue="historia" className="w-full flex-1 flex flex-col">

                <TabsList className="grid w-full grid-cols-6 h-14 bg-white border shadow-sm rounded-xl p-1">
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
                    <TabsTrigger value="historial-citas" className="text-md data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700">
                        <History className="h-4 w-4 mr-2" /> Historial Citas
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
                            <PeriodontogramaProvider pacienteId={pacienteId}>
                                <TabPeriodontogramaGrafico ref={periodontogramaRef} pacienteId={pacienteId} />
                            </PeriodontogramaProvider>
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
                            
                            {/* BANNERS DINÁMICOS DE AUTORIZACIÓN */}
                            {autorizacionPendiente ? (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-md shadow-sm">
                                    <p className="text-xs text-yellow-800 font-semibold">Modo Supervisado Activo</p>
                                    <p className="text-[10px] text-yellow-700 mt-1">El docente <b>{autorizacionPendiente.docente_username}</b> requiere que subas una imagen. El tiempo corre.</p>
                                </div>
                            ) : (
                                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-md shadow-sm">
                                    <p className="text-xs text-green-800 font-semibold">Carga Libre Activa</p>
                                    <p className="text-[10px] text-green-700 mt-1">Puedes subir fotos clínicas de seguimiento. (DICOM requiere permiso).</p>
                                </div>
                            )}

                            <Card className="border-blue-100 shadow-sm overflow-hidden">
                                <CardHeader className={`${autorizacionPendiente ? 'bg-yellow-500/10' : 'bg-blue-50/50'} border-b transition-colors`}>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4" /> Adquisición de Imagen
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ImageUpload 
                                        pacienteId={pacienteId} 
                                        onUploadSuccess={handleUploadSuccess} 
                                        autorizacion={autorizacionPendiente} 
                                    />
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

            </Tabs>
            </>
            )}
        </div>
    )
=======
      <Button 
        onClick={handleUpload} 
        disabled={subiendo || permisoCargando || !tienePermiso || !file || !categoria || permisoExpirado}
        className="w-full bg-blue-600 hover:bg-blue-700 h-10 shadow-sm"
      >
        {subiendo ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
        ) : permisoExpirado ? (
          <>⏰ Permiso expirado</>
        ) : (
          "Vincular al Expediente"
        )}
      </Button>
      
      {!permisoCargando && !tienePermiso && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
          <p className="text-sm text-red-600">No tienes autorización activa para subir imágenes a este paciente. Solicita permiso al docente.</p>
        </div>
      )}
    </div>
  )
>>>>>>> Stashed changes
}