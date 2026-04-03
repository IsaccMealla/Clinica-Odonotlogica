"use client"

import { useState, useEffect } from "react"
import { Loader2, Calendar, Download, Activity, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

// Importamos nuestros componentes actualizados
import { MetricasTarjetas } from "@/components/reportes/metricas-tarjetas"
import { GraficoFinanciero } from "@/components/reportes/grafico-financiero"
import { Grafico3DEspecialidades } from "@/components/reportes/grafico-3d-especialidades"

export default function DashboardReportesPage() {
  // Estados para la carga y gráficos estáticos (financiero)
  const [cargando, setCargando] = useState(true);
  const [flujoMensual, setFlujoMensual] = useState<any[]>([]);

  // Estados interactivos para el Gráfico 3D y Tarjetas Reales
  const [datos3D, setDatos3D] = useState<any[]>([]);
  const [metricasActivas, setMetricasActivas] = useState<string[]>([]);
  const [coloresPersonalizados, setColoresPersonalizados] = useState<Record<string, string>>({});
  
  // Filtros
  const [filtroTiempo, setFiltroTiempo] = useState('mes');
  const [filtroTipo, setFiltroTipo] = useState('clinico');

  useEffect(() => {
    const fetchDatos = async () => {
      setCargando(true);
      try {
        // Efecto visual de carga
        await new Promise(r => setTimeout(r, 1200)); 

        // Preparar los headers con el Token de Django (si aplica)
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`; 
        }

        // Fetch REAL a tu backend de Django
        const res = await fetch(`http://localhost:8000/api/reportes/estadisticas/?tipo=${filtroTipo}&tiempo=${filtroTiempo}`, {
          method: "GET",
          headers: headers,
        });

        if (res.ok) {
          const dataReal = await res.json();
          setDatos3D(dataReal);
          
          // Activar todas las métricas por defecto al cargar
          setMetricasActivas(dataReal.map((d: any) => d.nombre));
          
          // Guardar colores iniciales que vienen de la BD
          const coloresIniciales: Record<string, string> = {};
          dataReal.forEach((d: any) => {
            if (!coloresPersonalizados[d.nombre]) {
              coloresIniciales[d.nombre] = d.color;
            }
          });
          setColoresPersonalizados(prev => ({ ...prev, ...coloresIniciales }));
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
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [filtroTipo, filtroTiempo]);

  // --- FUNCIONES DE INTERACTIVIDAD ---
  const toggleMetrica = (nombre: string) => {
    setMetricasActivas(prev => 
      prev.includes(nombre) 
        ? prev.filter(m => m !== nombre) 
        : [...prev, nombre]              
    );
  };

  const cambiarColor = (e: React.ChangeEvent<HTMLInputElement>, nombre: string) => {
    e.stopPropagation(); 
    setColoresPersonalizados(prev => ({ ...prev, [nombre]: e.target.value }));
  };

  // Preparamos los datos EXACTOS que el gráfico 3D va a dibujar
  const datosParaGrafico = datos3D
    .filter(d => metricasActivas.includes(d.nombre))
    .map(d => ({
      ...d,
      color: coloresPersonalizados[d.nombre] || d.color
    }));

  // --- PANTALLA DE CARGA GLOBAL ---
  if (cargando && datos3D.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-transparent text-slate-500">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 animate-pulse">Generando Reportes...</h2>
        <p className="text-sm">Sincronizando con Clínica Dental</p>
      </div>
    )
  }

  // --- PANTALLA PRINCIPAL ---
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
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
            <Download className="mr-2 h-5 w-5" /> Exportar Reporte
          </Button>
        </div>
      </div>

      {/* SECCIÓN 1: GRÁFICO FINANCIERO (CON TAMAÑO AMPLIADO PARA EL 3D) */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-6 min-h-[450px] flex flex-col overflow-hidden">
        <GraficoFinanciero datos={flujoMensual} />
      </div>

      {/* SECCIÓN 2: DASHBOARD INTERACTIVO 3D (TAMAÑO AGRANDADO) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 min-h-[750px] flex flex-col">
        
        {/* Controles del Dashboard 3D */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="text-blue-500 h-8 w-8" /> 
            Panel de Métricas Dinámicas
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              disabled={cargando}
              className="bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold cursor-pointer"
            >
              <option value="clinico">Vista Clínica (Carpetas/Exámenes)</option>
              <option value="usuarios">Vista Institucional (Usuarios/Pacientes)</option>
            </select>
            <select 
              value={filtroTiempo} 
              onChange={(e) => setFiltroTiempo(e.target.value)}
              disabled={cargando}
              className="bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold cursor-pointer"
            >
              <option value="hoy">Filtro: Hoy</option>
              <option value="semana">Filtro: Esta Semana</option>
              <option value="mes">Filtro: Este Mes</option>
              <option value="siempre">Filtro: Histórico Total</option>
            </select>
          </div>
        </div>

        {/* CONTENEDOR LADO A LADO AGRANDADO */}
        <div className="flex flex-col md:flex-row gap-10 flex-grow">
          
          {/* LADO IZQUIERDO: Tarjetas Selectoras */}
          <div className="w-full md:w-1/3 xl:w-1/4 flex flex-col gap-5">
            {cargando ? (
              <div className="flex flex-col justify-center items-center flex-grow bg-slate-100 rounded-2xl border border-slate-200">
                <Loader2 className="animate-spin text-blue-500 h-10 w-10 mb-3" />
                <span className="text-base font-semibold text-slate-600">Actualizando datos...</span>
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
              <div className="text-center p-8 text-slate-600 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center flex-grow">
                No hay datos disponibles para la selección actual.
                <br /> Pruebe otro filtro de tiempo.
              </div>
            )}
          </div>

          {/* LADO DERECHO: Gráfico 3D AGRANDADO */}
          <div className="w-full md:w-2/3 xl:w-3/4 min-h-[550px] flex items-center justify-center bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden flex-grow shadow-inner">
            {datosParaGrafico.length > 0 ? (
              <Grafico3DEspecialidades datos={datosParaGrafico} />
            ) : (
              <div className="text-center text-slate-400 p-10 flex flex-col items-center">
                <Activity className="h-16 w-16 mx-auto mb-5 opacity-30" />
                <p className="text-2xl font-semibold">Visualización 3D en pausa</p>
                <p className="text-base mt-2">Utilice el panel izquierdo para seleccionar las métricas que desea visualizar en el gráfico.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}