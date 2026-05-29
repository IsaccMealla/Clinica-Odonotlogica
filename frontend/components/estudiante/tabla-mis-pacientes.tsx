"use client"

import { useState, useEffect } from "react"
import { Search, UserX, Stethoscope, Loader2 } from "lucide-react"
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
  const [busqueda, setBusqueda] = useState("")
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

  const filtrados = pacientes.filter((p) => {
    const termino = busqueda.toLowerCase()
    return (
      p.ci.toLowerCase().includes(termino) ||
      p.nombres.toLowerCase().includes(termino) ||
      p.apellido_paterno.toLowerCase().includes(termino)
    )
  })

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* BARRA DE BÚSQUEDA */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar entre mis pacientes..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 bg-white shadow-sm border-blue-100 focus-visible:ring-blue-500"
        />
      </div>

      {/* TABLA ESTILO PROFESIONAL */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold w-[120px]">CI</TableHead>
              <TableHead className="font-bold">Paciente</TableHead>
              <TableHead className="font-bold">Contacto</TableHead>
              <TableHead className="text-right font-bold">Acciones Clínicas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <UserX className="h-10 w-10 mb-2 opacity-20" />
                    <p>No tienes pacientes asignados que coincidan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((paciente) => (
                <TableRow key={paciente.id} className="hover:bg-blue-50/30 transition-colors">
                  <TableCell className="font-mono text-sm font-semibold text-blue-700">
                    {paciente.ci}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{paciente.nombres} {paciente.apellido_paterno}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {paciente.sexo} - {paciente.edad} años
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {paciente.celular || paciente.telefono || (
                      <span className="text-xs text-muted-foreground italic">Sin registro</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* 1. CARPETA MÉDICA (ANTECEDENTES) */}
                      <CarpetaMedica paciente={paciente} />
                      
                      {/* 2. EXPEDIENTE COMPLETO (PERIODONTOGRAMA, ETC) */}
                      <Link href={`/mis-pacientes/${paciente.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" 
                          title="Llenar Expediente / Periodontograma"
                        >
                          <Stethoscope className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* 3. VER PERFIL (SÓLO LECTURA) */}
                      <VerPaciente paciente={paciente} />
                      
                      {/* 4. EDITAR DATOS PERSONALES */}
                      <EditarPaciente paciente={paciente} onRefresh={fetchMisPacientes} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-2 text-[11px] text-muted-foreground italic">
        * Tienes acceso total para editar antecedentes y el expediente clínico de tus pacientes asignados.
      </div>
    </div>
  )
}