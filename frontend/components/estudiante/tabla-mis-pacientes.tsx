"use client"

import { useState, useEffect } from "react"
import { Stethoscope, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PaginatedTable from '@/components/common/PaginatedTable'

// IMPORTACIÓN DE ACCIONES (Reutilizamos las mismas)
import { CarpetaMedica } from "../carpeta-medica"
import { VerPaciente } from "../ver-paciente"
import { EditarPaciente } from "../editar-paciente"

interface Paciente {
  id: string;
  ci: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  sexo: string;
  edad: number;
  celular?: string;
  telefono?: string;
}

export function TablaMisPacientes({ token }: { token: string }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [cargando, setCargando] = useState(true)

  const fetchMisPacientes = async () => {
    try {
      setCargando(true)
      const res = await fetch("http://localhost:8000/api/pacientes/mis_asignaciones/", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPacientes(data.results || data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    fetchMisPacientes()
  }, [token])

  const searchFields = [
    { key: 'ci', label: 'CI', accessor: (p: Paciente) => p.ci || '' },
    { key: 'nombres', label: 'Nombre', accessor: (p: Paciente) => p.nombres || '' },
    { key: 'apellido_paterno', label: 'Apellido', accessor: (p: Paciente) => p.apellido_paterno || '' },
  ]

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-clinica-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PaginatedTable
        data={pacientes}
        searchFields={searchFields}
        emptyMessage="No tienes pacientes asignados"
        header={
          <tr className="bg-slate-50">
            <th className="font-bold w-[120px] px-4 py-3 text-left">CI</th>
            <th className="font-bold px-4 py-3 text-left">Paciente</th>
            <th className="font-bold px-4 py-3 text-left">Contacto</th>
            <th className="text-right font-bold px-4 py-3">Acciones Clínicas</th>
          </tr>
        }
        renderRow={(paciente: Paciente) => (
          <>
            <td className="font-mono text-sm font-semibold text-clinica-primary px-4 py-4">{paciente.ci}</td>
            <td className="font-medium px-4 py-4">
              <div className="flex flex-col gap-1">
                <span>{paciente.nombres} {paciente.apellido_paterno}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{paciente.sexo} - {paciente.edad} años</span>
              </div>
            </td>
            <td className="text-sm px-4 py-4">{paciente.celular || paciente.telefono || (<span className="text-xs text-muted-foreground italic">Sin registro</span>)}</td>
            <td className="text-right px-4 py-4">
              <div className="flex justify-end gap-1 flex-wrap">
                <CarpetaMedica paciente={paciente} />
                <Link href={`/mis-pacientes/${paciente.id}`}>
                  <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" title="Llenar Expediente / Periodontograma"><Stethoscope className="h-4 w-4" /></Button>
                </Link>
                <VerPaciente paciente={paciente} />
                <EditarPaciente paciente={paciente} onRefresh={fetchMisPacientes} />
              </div>
            </td>
          </>
        )}
      />

      <div className="px-2 text-[11px] text-muted-foreground italic">
        * Tienes acceso total para editar antecedentes y el expediente clínico de tus pacientes asignados.
      </div>
    </div>
  )
}