"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, UserCheck, Stethoscope } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PaginatedTable from '@/components/common/PaginatedTable'

// IMPORTACIÓN DE ACCIONES
import { NuevaAsignacion } from "./nueva-asignacion"
import { EliminarAsignacion } from "./eliminar-asignacion"
import { CarpetaMedica } from "../carpeta-medica" // Ajustar ruta según tu proyecto
import { VerPaciente } from "../ver-paciente"      // Ajustar ruta según tu proyecto

interface Estudiante {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

interface Paciente {
  id: string;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  sexo: string;
  edad: number;
  estudiante_asignado: number | null;
}

export function TablaAsignacion({ token }: { token: string }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [resP, resE] = await Promise.all([
        fetch("http://localhost:8000/api/pacientes/", { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch("http://localhost:8000/api/usuarios/estudiantes/", { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ])

      if (!resP.ok || !resE.ok) throw new Error("Error al obtener datos")

      const dataPacientes = await resP.json()
      const dataEstudiantes = await resE.json()

      // Manejo de paginación si el backend devuelve .results
      setPacientes(dataPacientes.results || dataPacientes)
      setEstudiantes(dataEstudiantes)
    } catch (e) {
      setError("No se pudieron cargar las asignaciones.")
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const searchFields = [
    { key: 'ci', label: 'CI', accessor: (p: Paciente) => p.ci || '' },
    { key: 'nombres', label: 'Nombre', accessor: (p: Paciente) => p.nombres || '' },
    { key: 'apellido_paterno', label: 'Apellido', accessor: (p: Paciente) => p.apellido_paterno || '' },
  ]

  if (cargando) return (
    <div className="flex flex-col items-center justify-center p-20 gap-2">
      <Loader2 className="animate-spin text-clinica-primary h-8 w-8" />
      <p className="text-sm text-muted-foreground">Cargando datos...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <NuevaAsignacion 
          pacientes={pacientes} 
          estudiantes={estudiantes} 
          token={token} 
          onSuccess={fetchData} 
        />
      </div>

      <PaginatedTable
        data={pacientes.filter(p => !!p.estudiante_asignado)}
        searchFields={searchFields}
        emptyMessage="No se encontraron asignaciones"
        header={
          <tr className="bg-slate-50">
            <th className="font-bold w-[120px] px-4 py-3 text-left">CI</th>
            <th className="font-bold px-4 py-3 text-left">Paciente</th>
            <th className="font-bold px-4 py-3 text-left">Estudiante Responsable</th>
            <th className="text-right font-bold px-4 py-3">Acciones</th>
          </tr>
        }
        renderRow={(paciente: Paciente) => {
          const estudiante = estudiantes.find((e) => e.id === paciente.estudiante_asignado)
          return (
            <>
              <td className="font-mono text-sm font-semibold text-clinica-primary px-4 py-4">{paciente.ci}</td>
              <td className="font-medium px-4 py-4">
                <div className="flex flex-col gap-1">
                  <span>{paciente.nombres} {paciente.apellido_paterno}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{paciente.sexo} - {paciente.edad} años</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{estudiante ? `${estudiante.first_name} ${estudiante.last_name}` : "No encontrado"}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Asignado</span>
                  </div>
                </div>
              </td>
              <td className="text-right px-4 py-4">
                <div className="flex justify-end gap-1 flex-wrap">
                  <CarpetaMedica paciente={paciente} />
                  <Link href={`/pacientes/${paciente.id}/expediente`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-emerald-600 hover:bg-emerald-50"
                      title="Ver Expediente Clínico"
                    >
                      <Stethoscope className="h-4 w-4" />
                    </Button>
                  </Link>
                  <VerPaciente paciente={paciente} />
                  <EliminarAsignacion pacienteId={paciente.id} token={token} onSuccess={fetchData} />
                </div>
              </td>
            </>
          )
        }}
      />
    </div>
  )
}