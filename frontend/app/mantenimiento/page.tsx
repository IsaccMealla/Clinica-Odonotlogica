import { Metadata } from "next"
// Asegúrate de que esta ruta coincida con donde guardaste el componente anterior
// Si lo guardaste en la carpeta "reportes", sería "@/components/reportes/mantenimiento-clinica"
import MantenimientoClinica from "@/components/mantenimiento/mantenimiento-clinico" 

export const metadata: Metadata = {
  title: "Mantenimiento y Fallas | Sistema de Clínica",
  description: "Monitoreo en tiempo real del estado de los equipos y sillones dentales.",
}

export default function MantenimientoPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/50 min-h-screen">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Mantenimiento y Fallas
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Monitoreo en tiempo real de la infraestructura clínica.
          </p>
        </div>
        
        {/* Aquí podrías agregar botones de acción global si los necesitas después */}
        <div className="flex items-center space-x-2">
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold py-2 px-4 rounded-xl shadow-sm transition-all text-sm">
            Descargar Reporte
          </button>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition-all text-sm">
            + Nueva Orden
          </button>
        </div>
      </div>
      
      {/* CONTENEDOR DEL COMPONENTE PRINCIPAL */}
      <div className="w-full">
        {/* Cargamos el mapa 3D interactivo y el sistema de alertas */}
        <MantenimientoClinica />
      </div>
    </div>
  )
}