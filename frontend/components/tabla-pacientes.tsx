"use client"

import { useState } from "react"
import { Search, UserX, Stethoscope } from "lucide-react"
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

// IMPORTACIÓN DE ACCIONES
import { CarpetaMedica } from "./carpeta-medica"
import { VerPaciente } from "./ver-paciente"
import { EditarPaciente } from "./editar-paciente"
import { EliminarPaciente } from "./eliminar-paciente"

export function TablaPacientes({ pacientesIniciales }: { pacientesIniciales: any[] }) {
  const [busqueda, setBusqueda] = useState("")

  // Lógica de filtrado: Busca coincidencias en CI, Nombre o Apellidos
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
      {/* BARRA DE BÚSQUEDA */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o CI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 bg-white dark:bg-zinc-950 shadow-sm border-blue-100 focus-visible:ring-blue-500"
        />
      </div>

      {/* TABLA */}
      <div className="rounded-xl border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-bold w-[120px]">CI</TableHead>
              <TableHead className="font-bold">Paciente</TableHead>
              <TableHead className="font-bold">Contacto</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
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
                <TableRow key={paciente.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                  <TableCell className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {paciente.ci}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{paciente.nombres} {paciente.apellido_paterno} {paciente.apellido_materno}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{paciente.sexo} - {paciente.edad} años</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {paciente.celular || paciente.telefono || (
                        <span className="text-xs text-muted-foreground italic">Sin registro</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* BOTÓN 1: ANTECEDENTES (CARPETA MÉDICA) */}
                      <CarpetaMedica paciente={paciente} />
                      
                      {/* --- NUEVO BOTÓN: EXPEDIENTE CLÍNICO GIGANTE --- */}
                      <Link href={`/pacientes/${paciente.id}/expediente`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" 
                          title="Historia Clínica Completa"
                        >
                          <Stethoscope className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      {/* BOTÓN 2: VER PERFIL */}
                      <VerPaciente paciente={paciente} />
                      
                      {/* BOTÓN 3: EDITAR DATOS */}
                      <EditarPaciente paciente={paciente} />
                      
                      {/* BOTÓN 4: ELIMINAR (LÓGICO) */}
                      <EliminarPaciente 
                        id={paciente.id} 
                        nombre={`${paciente.nombres} ${paciente.apellido_paterno}`} 
                        esLogico={true} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Contador de resultados */}
      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-muted-foreground">
            Mostrando {pacientesFiltrados.length} de {pacientesIniciales.length} pacientes registrados.
        </div>
        <div className="flex gap-2">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] text-muted-foreground">Activos</span>
            </div>
        </div>
      </div>
    </div>
  )
}