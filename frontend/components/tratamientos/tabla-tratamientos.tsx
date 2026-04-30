"use client"

import { Activity, Eye, FileText } from "lucide-react"
import { Tratamiento } from "@/app/tratamientos/page"
import { useRouter } from "next/navigation" // IMPORTANTE

interface TablaTratamientosProps {
  tratamientosIniciales: Tratamiento[]
  onRefresh: () => void
}

export function TablaTratamientos({ tratamientosIniciales, onRefresh }: TablaTratamientosProps) {
  const router = useRouter() // Inicializamos el router

  // Función para dar color al estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_PROGRESO':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">En Progreso</span>
      case 'FINALIZADO':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Finalizado</span>
      case 'DERIVADO':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Derivado</span>
      case 'ABANDONADO':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Abandonado</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{estado}</span>
    }
  }

  // Formatear la fecha para que sea legible
  const formatearFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-semibold">Tratamiento</th>
              <th className="px-6 py-4 font-semibold">Pieza Dental</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Fecha Inicio</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tratamientosIniciales.map((tratamiento) => (
              <tr key={tratamiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tratamiento.nombre_tratamiento}</p>
                      <p className="text-xs text-gray-500">Paciente: {tratamiento.paciente_nombre_completo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {tratamiento.diente_pieza ? (
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {tratamiento.diente_pieza}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {getEstadoBadge(tratamiento.estado)}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {formatearFecha(tratamiento.creado_en)}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  
                  {/* BOTÓN ACTUALIZADO PARA NAVEGAR A LA RUTA DINÁMICA */}
                  <button 
                    onClick={() => router.push(`/tratamientos/${tratamiento.id}`)}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Avances
                  </button>

                  <button className="text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors text-xs font-medium inline-flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}