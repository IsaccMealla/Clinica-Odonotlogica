"use client"

import { useState } from "react"
import { Search, UserX, Stethoscope, Download, FileText, Sheet } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from "@/components/ui/dropdown-menu"
import { exportPacientesPDF } from "@/lib/exporters/pdf-exporter"
import { exportPacientesExcel } from "@/lib/exporters/excel-exporter"
import { ModalExportacionListado } from "./exporters/ModalExportacionListado"
import { ModalExportacionPaciente } from "./exporters/ModalExportacionPaciente"
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
  const [busqueda, setBusqueda] = useState("")

  // Lógica de filtrado por CI o Nombre
  const pacientesFiltrados = pacientesIniciales.filter((p) => {
    const termino = busqueda.toLowerCase()
    return (
      p.ci.toLowerCase().includes(termino) ||
      p.nombres.toLowerCase().includes(termino) ||
      p.apellido_paterno.toLowerCase().includes(termino) ||
      (p.apellido_materno && p.apellido_materno.toLowerCase().includes(termino))
    )
  })

  return (
    <div className="space-y-4">
      {/* BARRA DE BÚSQUEDA Y EXPORTACIÓN GENERAL FILTRADA (Premium UI) */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o CI..."
            value={busqueda}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-950 shadow-sm border-emerald-100 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:border-emerald-950 animate-in fade-in"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">Lote:</span>
          <ModalExportacionListado pacientes={pacientesFiltrados} tituloListado="Filtro Actual" />
          <ModalExportacionListado pacientes={pacientesIniciales} tituloListado="Todo el Universo" />
        </div>
      </div>

      {/* TABLA DE PACIENTES */}
      <div className="rounded-xl border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden border-emerald-500/10">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-bold w-[120px] text-emerald-800 dark:text-emerald-400">CI</TableHead>
              <TableHead className="font-bold text-emerald-800 dark:text-emerald-400">Paciente</TableHead>
              <TableHead className="font-bold text-emerald-800 dark:text-emerald-400">Contacto</TableHead>
              <TableHead className="text-right font-bold text-emerald-800 dark:text-emerald-400">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <UserX className="h-10 w-10 mb-2 opacity-20" />
                    <p>No se encontraron pacientes con "{busqueda}"</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pacientesFiltrados.map((paciente) => (
                <TableRow key={paciente.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/5 transition-colors">
                  <TableCell className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {paciente.ci}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-800 dark:text-slate-200">{paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno || ''}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{paciente.sexo} - {paciente.edad} años</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {paciente.celular || paciente.telefono || (
                      <span className="text-xs text-muted-foreground italic">Sin registro</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 items-center">
                      
                      {/* ACCIÓN 1: MODAL INTERACTIVO DE EXPORTACIÓN GRANULAR (PREMIUM) */}
                      <ModalExportacionPaciente paciente={paciente} />
                      
                      {/* ACCIÓN 2: CARPETA MÉDICA (Antecedentes Rápidos) */}
                      <CarpetaMedica paciente={paciente} onRefresh={onRefresh} />
                      
                      {/* ACCIÓN 3: EXPEDIENTE COMPLETO */}
                      <Link href={`/pacientes/${paciente.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700" 
                          title="Historia Clínica Completa"
                        >
                          <Stethoscope className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {/* ACCIÓN 4: VER PERFIL DETALLADO */}
                      <VerPaciente paciente={paciente} />
                      
                      {/* ACCIÓN 5: EDITAR DATOS */}
                      <EditarPaciente paciente={paciente} onRefresh={onRefresh} />
                      
                      {/* ACCIÓN 6: ELIMINAR (BORRADO LÓGICO) */}
                      <EliminarPaciente 
                        id={paciente.id} 
                        nombre={`${paciente.nombres} ${paciente.apellido_paterno}`} 
                        esLogico={true} 
                        onRefresh={onRefresh}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* FOOTER DE LA TABLA */}
      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-muted-foreground">
          Mostrando {pacientesFiltrados.length} de {pacientesIniciales.length} pacientes registrados.
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-muted-foreground">Activos</span>
          </div>
        </div>
      </div>
    </div>
  )
}