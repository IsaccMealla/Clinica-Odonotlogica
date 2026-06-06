"use client"

import { Stethoscope, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PaginatedTable from '@/components/common/PaginatedTable'
import { exportCarpetaMedicaPDF } from "@/lib/exporters/pdf-exporter"
import { toast } from "sonner"

// IMPORTACIÓN DE ACCIONES
import { CarpetaMedica } from "./carpeta-medica"
import { VerPaciente } from "./ver-paciente"
import { EditarPaciente } from "./editar-paciente"
import { EliminarPaciente } from "./eliminar-paciente"

// Interfaz para las props
interface TablaPacientesProps {
  pacientesIniciales: any[];
  onRefresh?: () => void;
}

export function TablaPacientes({ pacientesIniciales, onRefresh }: TablaPacientesProps) {
  const searchFields = [
    { key: 'ci', label: 'Buscar por Carnet (CI)', accessor: (p:any) => p.ci || '' },
    { key: 'nombres', label: 'Buscar por Nombre', accessor: (p:any) => p.nombres || '' },
    { key: 'apellido_paterno', label: 'Buscar por Apellido', accessor: (p:any) => p.apellido_paterno || '' },
  ]

  const handleExportPaciente = async (paciente: any) => {
    try {
      // Cargar datos completos del paciente desde la API para obtener antecedentes
      const token = localStorage.getItem("access_token")
      const res = await fetch(`http://localhost:8000/api/pacientes/${paciente.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const pacienteCompleto = await res.json()
        exportCarpetaMedicaPDF(pacienteCompleto)
        toast.success(`Carpeta de ${paciente.nombres} exportada`)
      } else {
        toast.error("Error al cargar los datos del paciente")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al exportar")
    }
  }

  return (
    <div className="space-y-4">
      <PaginatedTable
        data={pacientesIniciales}
        searchFields={searchFields}
        emptyMessage="No se encontraron pacientes"
        header={
          <tr className="bg-slate-50 dark:bg-zinc-900/50">
            <th className="font-bold w-[120px] px-4 py-3 text-left">CI</th>
            <th className="font-bold px-4 py-3 text-left">Paciente</th>
            <th className="font-bold px-4 py-3 text-left">Contacto</th>
            <th className="text-right font-bold px-4 py-3">Acciones</th>
          </tr>
        }
        renderRow={(paciente:any) => (
          <>
            <td className="font-mono text-sm font-semibold text-clinica-primary dark:text-clinica-secondary px-4 py-4">{paciente.ci}</td>
            <td className="font-medium px-4 py-4">
              <div className="flex flex-col gap-1">
                <span>{paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{paciente.sexo} - {paciente.edad} años</span>
              </div>
            </td>
            <td className="text-sm px-4 py-4">{paciente.celular || paciente.telefono || (<span className="text-xs text-muted-foreground italic">Sin registro</span>)}</td>
            <td className="text-right px-4 py-4">
              <div className="flex justify-end gap-1 flex-wrap">
                <Button variant="ghost" size="icon" onClick={() => handleExportPaciente(paciente)} className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950" title="Descargar Carpeta Médica (PDF)"><Download className="h-4 w-4" /></Button>
                <CarpetaMedica paciente={paciente} />
                <Link href={`/pacientes/${paciente.id}`}>
                  <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" title="Historia Clínica Completa"><Stethoscope className="h-4 w-4" /></Button>
                </Link>
                <VerPaciente paciente={paciente} />
                <EditarPaciente paciente={paciente} onRefresh={onRefresh} />
                <EliminarPaciente id={paciente.id} nombre={`${paciente.nombres} ${paciente.apellido_paterno}`} esLogico={true} onRefresh={onRefresh} />
              </div>
            </td>
          </>
        )}
      />
    </div>
  )
}