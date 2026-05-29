'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, TrendingDown, Users, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

interface Paciente {
  id: string;
  nombres: string;
  apellido_paterno: string;
}

interface Estudiante {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface AlumnoRetrasado {
  id: string;
  estudiante: string;
  paciente: string;
  asignatura: string;
  porcentaje_avance: number;
  procedimientos_aprobados: number;
  dias_activo: number;
}

interface ConfiguracionCupo {
  id: string;
  asignatura: string;
  procedimiento: string;
  cupo_minimo: number;
  cupo_maximo: number;
}

export function InterfazCoordinador() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [alumnosRetrasados, setAlumnosRetrasados] = useState<AlumnoRetrasado[]>([]);
  const [configCupos, setConfigCupos] = useState<ConfiguracionCupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'asignar' | 'reportes'>('asignar');

  // Estado para asignación
  const [selectedPaciente, setSelectedPaciente] = useState<string>('');
  const [selectedEstudiante, setSelectedEstudiante] = useState<string>('');
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('');
  const [selectedProcedimiento, setSelectedProcedimiento] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pacientesRes, estudiantesRes, retrasadosRes, cuposRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/pacientes/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE_URL}/api/usuarios/estudiantes/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE_URL}/api/asignacion-caso/alumnos_retrasados/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE_URL}/api/configuracion-cupo/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const pacientesData = await pacientesRes.json();
      const estudiantesData = await estudiantesRes.json();
      const retrasadosData = await retrasadosRes.json();
      const cuposData = await cuposRes.json();

      setPacientes(pacientesData.results || pacientesData);
      setEstudiantes(estudiantesData);
      setAlumnosRetrasados(Array.isArray(retrasadosData) ? retrasadosData : []);
      setConfigCupos(cuposData.results || cuposData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedPaciente || !selectedEstudiante || !selectedAsignatura) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/asignacion-caso/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          paciente: selectedPaciente,
          estudiante: selectedEstudiante,
          asignatura: selectedAsignatura,
          procedimiento_principal: selectedProcedimiento || 'PROFILAXIS',
        }),
      });

      if (response.ok) {
        alert('Caso asignado correctamente');
        setAssignDialogOpen(false);
        setSelectedPaciente('');
        setSelectedEstudiante('');
        setSelectedAsignatura('');
        setSelectedProcedimiento('');
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'No se pudo asignar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar caso');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  const asignaturas = Array.from(new Set(configCupos.map((c) => c.asignatura)));
  const procedimientos = configCupos
    .filter((c) => c.asignatura === selectedAsignatura)
    .map((c) => c.procedimiento);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Coordinación - Formación y Supervisión</h1>
        <p className="text-gray-600 mt-2">Gestiona asignaciones de casos y monitorea el desempeño estudiantil</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('asignar')}
          className={`pb-3 px-4 font-medium ${
            activeTab === 'asignar'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Asignar Casos
        </button>
        <button
          onClick={() => setActiveTab('reportes')}
          className={`pb-3 px-4 font-medium ${
            activeTab === 'reportes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reportes de Formación
        </button>
      </div>

      {/* TAB: ASIGNAR CASOS */}
      {activeTab === 'asignar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Asignación de Casos</h2>
            <Button onClick={() => setAssignDialogOpen(true)}>
              + Asignar Nuevo Caso
            </Button>
          </div>

          {/* Tabla de asignaciones (simplified view) */}
          <Card>
            <CardHeader>
              <CardTitle>Casos Asignados Recientemente</CardTitle>
              <CardDescription>Últimas asignaciones realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>Las asignaciones aparecerán aquí después de ser creadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: REPORTES */}
      {activeTab === 'reportes' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Reportes de Formación y Productividad</h2>

          {/* Alumnos Retrasados */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                <div>
                  <CardTitle className="text-orange-900">Alumnos Retrasados</CardTitle>
                  <CardDescription className="text-orange-700">
                    Avance menor al 50% del cupo requerido
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {alumnosRetrasados.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay alumnos retrasados actualmente. Buen trabajo!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {alumnosRetrasados.map((alumno) => (
                    <div
                      key={alumno.id}
                      className="flex justify-between items-center p-3 bg-white rounded border border-orange-200"
                    >
                      <div className="flex-grow">
                        <p className="font-medium">{alumno.estudiante}</p>
                        <p className="text-sm text-gray-600">
                          Paciente: {alumno.paciente} | {alumno.asignatura}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-1">
                          {alumno.porcentaje_avance.toFixed(0)}% Avance
                        </Badge>
                        <p className="text-xs text-gray-600">
                          {alumno.dias_activo} días activo
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>Total Estudiantes</CardDescription>
                  <CardTitle className="text-3xl">{estudiantes.length}</CardTitle>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>Alumnos Retrasados</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">
                    {alumnosRetrasados.length}
                  </CardTitle>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>Configuraciones Activas</CardDescription>
                  <CardTitle className="text-3xl">{configCupos.length}</CardTitle>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </CardHeader>
            </Card>
          </div>

          {/* Configuración de Cupos */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Cupos por Asignatura</CardTitle>
              <CardDescription>Requisitos mínimos y máximos de procedimientos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Asignatura</th>
                      <th className="text-left py-2">Procedimiento</th>
                      <th className="text-center py-2">Mín.</th>
                      <th className="text-center py-2">Máx.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configCupos.map((config) => (
                      <tr key={config.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{config.asignatura}</td>
                        <td className="py-2">{config.procedimiento}</td>
                        <td className="text-center py-2 font-medium">
                          {config.cupo_minimo}
                        </td>
                        <td className="text-center py-2 font-medium">
                          {config.cupo_maximo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de Asignación */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Nuevo Caso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Paciente */}
            <div>
              <label htmlFor="paciente" className="text-sm font-medium block mb-2">
                Paciente
              </label>
              <select
                id="paciente"
                value={selectedPaciente}
                onChange={(e) => setSelectedPaciente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>

            {/* Estudiante */}
            <div>
              <label htmlFor="estudiante" className="text-sm font-medium block mb-2">
                Estudiante
              </label>
              <select
                id="estudiante"
                value={selectedEstudiante}
                onChange={(e) => setSelectedEstudiante(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona un estudiante</option>
                {estudiantes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignatura */}
            <div>
              <label htmlFor="asignatura" className="text-sm font-medium block mb-2">
                Asignatura
              </label>
              <select
                id="asignatura"
                value={selectedAsignatura}
                onChange={(e) => setSelectedAsignatura(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona una asignatura</option>
                {asignaturas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Procedimiento */}
            {selectedAsignatura && (
              <div>
                <label htmlFor="procedimiento" className="text-sm font-medium block mb-2">
                  Procedimiento Principal
                </label>
                <select
                  id="procedimiento"
                  value={selectedProcedimiento}
                  onChange={(e) => setSelectedProcedimiento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecciona un procedimiento</option>
                  {procedimientos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAsignar} disabled={submitting}>
              {submitting ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
