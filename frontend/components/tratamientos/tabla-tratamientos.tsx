"use client"

import { useState } from "react"
import { Activity, Eye, FileText, User, Search, ClipboardX } from "lucide-react"
import { Tratamiento } from "@/app/tratamientos/page"
import { useRouter } from "next/navigation"

interface TratamientoExtendido extends Tratamiento {
  estudiante_nombre_completo?: string; 
}

interface TablaTratamientosProps {
  tratamientosIniciales: TratamientoExtendido[]
  onRefresh: () => void
}

export function TablaTratamientos({ tratamientosIniciales, onRefresh }: TablaTratamientosProps) {
  const router = useRouter()
  // 1. ESTADO PARA LA BÚSQUEDA
  const [busqueda, setBusqueda] = useState("")

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_PROGRESO':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold tracking-wide">En Progreso</span>
      case 'FINALIZADO':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold tracking-wide">Finalizado</span>
      case 'DERIVADO':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold tracking-wide">Derivado</span>
      case 'ABANDONADO':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold tracking-wide">Abandonado</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold tracking-wide">{estado}</span>
    }
  }

  const formatearFecha = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  // 2. LÓGICA DE FILTRADO
  const tratamientosFiltrados = tratamientosIniciales.filter((t) => {
    const termino = busqueda.toLowerCase()
    const nombrePaciente = t.paciente_nombre_completo ? t.paciente_nombre_completo.toLowerCase() : ""
    const nombreTratamiento = t.nombre_tratamiento.toLowerCase()
    const pieza = t.diente_pieza ? t.diente_pieza.toLowerCase() : ""

    return (
      nombrePaciente.includes(termino) ||
      nombreTratamiento.includes(termino) ||
      pieza.includes(termino)
    )
  })

  return (
    <div className="space-y-4">
      {/* 3. BARRA DE BÚSQUEDA (Igual a la de pacientes) */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por tratamiento, paciente o pieza..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-5 font-bold tracking-wider">Tratamiento Clínico</th>
                <th className="px-6 py-5 font-bold tracking-wider">Pieza Dental</th>
                <th className="px-6 py-5 font-bold tracking-wider">Estado</th>
                <th className="px-6 py-5 font-bold tracking-wider">Fecha Inicio</th>
                <th className="px-6 py-5 font-bold tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* 4. MANEJO DE ESTADO VACÍO DE BÚSQUEDA */}
              {tratamientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ClipboardX className="h-10 w-10 mb-3 text-gray-300" />
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">No se encontraron resultados</p>
                      <p className="text-sm mt-1">No hay tratamientos que coincidan con "{busqueda}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tratamientosFiltrados.map((tratamiento) => (
                  <tr key={tratamiento.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-gray-900 dark:text-white text-base">{tratamiento.nombre_tratamiento}</p>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> Paciente: <span className="font-medium text-gray-700 dark:text-gray-300">{tratamiento.paciente_nombre_completo || `ID: ${tratamiento.paciente}`}</span>
                            </p>
                            {tratamiento.estudiante_nombre_completo && (
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                                <span className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center text-[8px]">🎓</span> 
                                Op: {tratamiento.estudiante_nombre_completo}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tratamiento.diente_pieza ? (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                          Pieza {tratamiento.diente_pieza}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">General</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(tratamiento.estado)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600 dark:text-gray-300">
                      {formatearFecha(tratamiento.creado_en)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/tratamientos/${tratamiento.id}`)}
                          className="text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all duration-200 text-xs font-bold inline-flex items-center gap-1.5 border border-blue-200 hover:border-transparent shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Carpeta
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors inline-flex items-center justify-center border border-gray-200">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}