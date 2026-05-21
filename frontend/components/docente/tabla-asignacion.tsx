"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, UserCheck, UserX, Stethoscope } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// IMPORTACIÓN DE ACCIONES
import { NuevaAsignacion } from "./nueva-asignacion"
import { EliminarAsignacion } from "./eliminar-asignacion"
import { CarpetaMedica } from "../carpeta-medica"
import { VerPaciente } from "../ver-paciente"

interface Estudiante {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

interface Docente {
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
  docente_asignado: number | null;
  docente_asignado_nombre?: string;
}

interface TablaAsignacionProps {
  token: string
  rol?: string | null
  onDataLoaded?: (data: Paciente[]) => void
}

export function TablaAsignacion({ token, rol, onDataLoaded }: TablaAsignacionProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const pacientesUrl = rol === "DOCENTE"
        ? "http://localhost:8000/api/pacientes/mis_asignaciones_docente/"
        : "http://localhost:8000/api/pacientes/"

      const [resP, resE, resD] = await Promise.all([
        fetch(pacientesUrl, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/usuarios/estudiantes/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/usuarios/docentes/", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (!resP.ok || !resE.ok || !resD.ok) throw new Error("Error al obtener datos")

      const dataPacientes = await resP.json()
      const dataEstudiantes = await resE.json()
      const dataDocentes = await resD.json()

      const pacientesList: Paciente[] = dataPacientes.results || dataPacientes
      setPacientes(pacientesList)
      setEstudiantes(dataEstudiantes)
      setDocentes(dataDocentes)
      onDataLoaded?.(pacientesList)
    } catch (e) {
      setError("No se pudieron cargar las asignaciones.")
    } finally {
      setCargando(false)
    }
  }, [token, rol, onDataLoaded])

  useEffect(() => { fetchData() }, [fetchData])

  const asignacionesActivas = pacientes.filter((p) => {
    if (!p.estudiante_asignado) return false
    const termino = busqueda.toLowerCase()

    const estudiante = estudiantes.find((e) => e.id === p.estudiante_asignado)
    const estudianteNombre = estudiante ? `${estudiante.first_name} ${estudiante.last_name}`.toLowerCase() : ""
    const docenteNombre = p.docente_asignado_nombre?.toLowerCase() || ""

    return (
      p.ci.toLowerCase().includes(termino) ||
      p.nombres.toLowerCase().includes(termino) ||
      p.apellido_paterno.toLowerCase().includes(termino) ||
      estudianteNombre.includes(termino) ||
      docenteNombre.includes(termino)
    )
  })

  if (cargando) return (
    <div className="flex flex-col items-center justify-center p-20 gap-2">
      <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      <p className="text-sm text-muted-foreground">Cargando datos...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative max-w-sm flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por CI, paciente, estudiante o docente..." 
            className="pl-10 bg-white border-blue-100" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>
        {rol === "ADMIN" ? (
          <NuevaAsignacion 
            pacientes={pacientes} 
            estudiantes={estudiantes} 
            docentes={docentes}
            token={token} 
            onSuccess={fetchData} 
          />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold w-[120px]">CI</TableHead>
              <TableHead className="font-bold">Paciente</TableHead>
              <TableHead className="font-bold">Estudiante Responsable</TableHead>
              <TableHead className="font-bold">Docente Asignado</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignacionesActivas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <UserX className="h-8 w-8 mb-2 opacity-20" />
                    <p>No se encontraron asignaciones.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              asignacionesActivas.map((paciente) => {
                const estudiante = estudiantes.find((e) => e.id === paciente.estudiante_asignado)
                const docente = docentes.find((d) => d.id === paciente.docente_asignado)

                return (
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {estudiante ? `${estudiante.first_name} ${estudiante.last_name}` : "No asignado"}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Estudiante</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="font-medium">
                          {paciente.docente_asignado_nombre || (docente ? `${docente.first_name} ${docente.last_name}` : "Sin docente")}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Docente</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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

                        <EliminarAsignacion
                          pacienteId={paciente.id}
                          token={token}
                          onSuccess={fetchData}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}