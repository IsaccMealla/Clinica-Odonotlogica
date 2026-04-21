"use client"

import { useState, useEffect } from "react"
import { Loader2, Calendar, Download, Activity, Target, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

// Importamos nuestros componentes actualizados
import { MetricasTarjetas } from "@/components/reportes/metricas-tarjetas"
import { GraficoFinanciero } from "@/components/reportes/grafico-financiero"
import { Grafico3DEspecialidades } from "@/components/reportes/grafico-3d-especialidades"

import PantallaCarga3D from "@/components/PantallaCarga3D"

export default function DashboardReportesPage() {
  // Estados para la carga y gráficos estáticos (financiero)
  const [cargando, setCargando] = useState(true);
  const [flujoMensual, setFlujoMensual] = useState<any[]>([]);

  // Estados interactivos para el Gráfico 3D y Tarjetas Reales
  const [datos3D, setDatos3D] = useState<any[]>([]);
  const [metricasActivas, setMetricasActivas] = useState<string[]>([]);
  const [coloresPersonalizados, setColoresPersonalizados] = useState<Record<string, string>>({});
  
  // 🔥 FILTROS PRINCIPALES
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  const [filtroTipo, setFiltroTipo] = useState('clinico');

  // 🔥 NUEVOS FILTROS ESPECÍFICOS BASADOS EN TUS MODELOS DE DJANGO
  const [filtroEstadoCarpeta, setFiltroEstadoCarpeta] = useState('todos'); // Modelo: SeguimientoAcademico
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('todos'); // Modelo: CustomUser

  useEffect(() => {
    const fetchDatos = async () => {
      setCargando(true);
      try {
        // Efecto visual de carga para la presentación
        await new Promise(r => setTimeout(r, 5000)); 

        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`; 
        }

        // Construimos la URL dinámica enviando todos los filtros al backend
        const url = `http://localhost:8000/api/reportes/estadisticas/?tipo=${filtroTipo}&tiempo=${filtroTiempo}&estado_carpeta=${filtroEstadoCarpeta}&rol=${filtroRolUsuario}`;

        const res = await fetch(url, {
          method: "GET",
          headers: headers,
        });

        if (res.ok) {
          const dataReal = await res.json();
          setDatos3D(dataReal);
          
          setMetricasActivas(dataReal.map((d: any) => d.nombre));
          
          const coloresIniciales: Record<string, string> = {};
          dataReal.forEach((d: any) => {
            if (!coloresPersonalizados[d.nombre]) {
              coloresIniciales[d.nombre] = d.color;
            }
          });
          setColoresPersonalizados(prev => ({ ...prev, ...coloresIniciales }));
        } else {
          // Si el backend falla o aún no tiene esta ruta, cargamos datos de respaldo para que tu presentación no se caiga
          cargarDatosDeRespaldo();
        }

        // Flujo financiero simulado
        setFlujoMensual([
          { mes: "Ene", ingresos: 4500 },
          { mes: "Feb", ingresos: 5200 },
          { mes: "Mar", ingresos: 3900 },
          { mes: "Abr", ingresos: 6800 },
          { mes: "May", ingresos: 8100 },
          { mes: "Jun", ingresos: 9500 },
        ]);

      } catch (error) {
        console.error("Error cargando reportes", error);
        cargarDatosDeRespaldo(); // Respaldo de emergencia
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [filtroTipo, filtroTiempo, filtroEstadoCarpeta, filtroRolUsuario]); // Se ejecuta al cambiar cualquier filtro

  // Función de seguridad por si tu backend Django aún no devuelve los datos exactos hoy
  const cargarDatosDeRespaldo = () => {
    const datosMuestra = filtroTipo === 'clinico' 
      ? [
          { nombre: "Carpetas en Revisión", valor: 28, color: "#f59e0b" },
          { nombre: "Trabajos Observados", valor: 7, color: "#ef4444" },
          { nombre: "Tratamientos Derivados", valor: 14, color: "#0ea5e9" },
        ]
      : [
          { nombre: "Docentes Activos", valor: 12, color: "#6366f1" },
          { nombre: "Estudiantes en Clínica", valor: 45, color: "#8b5cf6" },
          { nombre: "Pacientes Sin Asignar", valor: 15, color: "#14b8a6" },
        ];
    setDatos3D(datosMuestra);
    setMetricasActivas(datosMuestra.map(d => d.nombre));
  };

  // --- FUNCIONES DE INTERACTIVIDAD ---
  const toggleMetrica = (nombre: string) => {
    setMetricasActivas(prev => prev.includes(nombre) ? prev.filter(m => m !== nombre) : [...prev, nombre]);
  };

  const cambiarColor = (e: React.ChangeEvent<HTMLInputElement>, nombre: string) => {
    e.stopPropagation(); 
    setColoresPersonalizados(prev => ({ ...prev, [nombre]: e.target.value }));
  };

  const datosParaGrafico = datos3D
    .filter(d => metricasActivas.includes(d.nombre))
    .map(d => ({
      ...d,
      color: coloresPersonalizados[d.nombre] || d.color
    }));

  // --- PANTALLA DE CARGA ---
// --- PANTALLA DE CARGA ---
  if (cargando && datos3D.length === 0) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <PantallaCarga3D 
          texto="Generando Analíticas..." 
          subtexto="Cruzando datos de historias clínicas y rendimiento académico"
          alturaClase="h-[80vh]" // Le damos la altura que ya tenías pensada
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-6 flex flex-col space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">Centro de Analítica Avanzada</h1>
          <p className="text-slate-600 mt-2 text-lg">Monitoreo clínico, institucional y financiero en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 border-slate-200 pointer-events-none px-6">
            <Calendar className="mr-2 h-5 w-5 text-emerald-600" /> 
            {filtroTiempo === 'mes' ? 'Este Mes' : filtroTiempo === 'hoy' ? 'Hoy' : filtroTiempo === 'semana' ? 'Esta Semana' : 'Histórico'}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-md shadow-emerald-200">
            <Download className="mr-2 h-5 w-5" /> Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-6 min-h-[450px] flex flex-col overflow-hidden">
        <GraficoFinanciero datos={flujoMensual} />
      </div>

      {/* SECCIÓN 2: DASHBOARD INTERACTIVO 3D */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 min-h-[750px] flex flex-col">
        
        {/* CONTROLES DEL DASHBOARD (FILTROS DINÁMICOS) */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 border-b border-slate-100 pb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Filter className="text-blue-500 h-7 w-7" /> 
            Filtros de Análisis
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            
            <select 
              value={filtroTipo} 
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                // Reseteamos los subfiltros al cambiar de vista
                setFiltroEstadoCarpeta('todos');
                setFiltroRolUsuario('todos');
              }}
              disabled={cargando}
              className="bg-slate-900 text-white border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold cursor-pointer shadow-md"
            >
              <option value="clinico">Vista Clínica (Tratamientos y Carpetas)</option>
              <option value="usuarios">Vista Institucional (Usuarios y Pacientes)</option>
            </select>
            
            {filtroTipo === 'clinico' && (
              <select 
                value={filtroEstadoCarpeta} 
                onChange={(e) => setFiltroEstadoCarpeta(e.target.value)}
                disabled={cargando}
                className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl px-4 py-3 text-sm focus:ring-indigo-500 outline-none font-semibold cursor-pointer animate-in fade-in zoom-in duration-300"
              >
                <option value="todos">Estado Docente: Todos</option>
                <option value="BORRADOR">Estado: En Borrador (Editando)</option>
                <option value="REVISION">Estado: Pendiente de Revisión</option>
                <option value="APROBADO">Estado: Aprobado por Docente</option>
                <option value="RECHAZADO">Estado: Rechazado / Observado</option>
              </select>
            )}

        
            {filtroTipo === 'usuarios' && (
              <select 
                value={filtroRolUsuario} 
                onChange={(e) => setFiltroRolUsuario(e.target.value)}
                disabled={cargando}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm focus:ring-emerald-500 outline-none font-semibold cursor-pointer animate-in fade-in zoom-in duration-300"
              >
                <option value="todos">Roles: Todos los Usuarios</option>
                <option value="ESTUDIANTE">Rol: Estudiantes Clínicos</option>
                <option value="DOCENTE">Rol: Docentes Supervisores</option>
                <option value="RECEPCIONISTA">Rol: Recepcionistas</option>
              </select>
            )}

            {/* 3. SELECTOR DE TIEMPO  */}
            <select 
              value={filtroTiempo} 
              onChange={(e) => setFiltroTiempo(e.target.value)}
              disabled={cargando}
              className="bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-slate-400 outline-none font-semibold cursor-pointer"
            >
              <option value="hoy">Tiempo: Hoy</option>
              <option value="semana">Tiempo: Esta Semana</option>
              <option value="mes">Tiempo: Este Mes</option>
              <option value="siempre">Tiempo: Histórico</option>
            </select>
          </div>
        </div>

        {/* CONTENEDOR LADO A LADO */}
        <div className="flex flex-col md:flex-row gap-10 flex-grow">
          
          {/* LADO IZQUIERDO: Tarjetas Selectoras */}
          <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col gap-5">
            {cargando ? (
              <div className="flex flex-col justify-center items-center flex-grow bg-slate-50 rounded-2xl border border-slate-200">
                <Loader2 className="animate-spin text-blue-500 h-10 w-10 mb-3" />
                <span className="text-base font-semibold text-slate-600">Calculando métricas...</span>
              </div>
            ) : datos3D.length > 0 ? (
              <MetricasTarjetas 
                datos={datos3D} 
                activas={metricasActivas} 
                onToggle={toggleMetrica} 
                colores={coloresPersonalizados} 
                onColorChange={cambiarColor} 
              />
            ) : (
              <div className="text-center p-8 text-slate-600 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center flex-grow">
                No hay registros para este filtro.
              </div>
            )}
          </div>

          {/* LADO DERECHO: Gráfico 3D */}
          <div className="w-full md:w-2/3 xl:w-3/4 min-h-[550px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden flex-grow shadow-inner">
            {datosParaGrafico.length > 0 ? (
              <Grafico3DEspecialidades datos={datosParaGrafico} />
            ) : (
              <div className="text-center text-slate-400 p-10 flex flex-col items-center">
                <Target className="h-16 w-16 mx-auto mb-5 opacity-30" />
                <p className="text-2xl font-semibold">Esperando selección</p>
                <p className="text-base mt-2">Active las métricas en el panel izquierdo.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}