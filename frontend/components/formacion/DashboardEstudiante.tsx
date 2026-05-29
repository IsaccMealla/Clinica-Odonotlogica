'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

interface AsignacionCaso {
  id: string;
  paciente_nombre: string;
  asignatura: string;
  procedimiento_principal: string;
  procedimientos_aprobados: number;
  porcentaje_avance: number;
  estado: string;
}

interface SolicitudSupervision {
  id: string;
  tipo_hito: string;
  estado: string;
  fecha_solicitud: string;
}

export function DashboardEstudiante() {
  const [asignaciones, setAsignaciones] = useState<AsignacionCaso[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudSupervision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsignacion, setSelectedAsignacion] = useState<AsignacionCaso | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [tipoHito, setTipoHito] = useState('DIAGNOSTICO');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAsignaciones();
    fetchSolicitudes();
  }, []);

  const fetchAsignaciones = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/asignacion-caso/mis_asignaciones/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAsignaciones(data);
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/solicitud-supervision/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setSolicitudes(data.results || data);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarSupervision = (asignacion: AsignacionCaso) => {
    setSelectedAsignacion(asignacion);
    setDialogOpen(true);
  };

  const submitSolicitud = async () => {
    if (!selectedAsignacion) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/solicitud-supervision/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          asignacion_caso: selectedAsignacion.id,
          tipo_hito: tipoHito,
          descripcion_solicitud: descripcion,
        }),
      });

      if (response.ok) {
        alert('Solicitud de supervisión enviada correctamente');
        setDialogOpen(false);
        setDescripcion('');
        setTipoHito('DIAGNOSTICO');
        fetchSolicitudes();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'No se pudo enviar la solicitud'}`);
      }
    } catch (error) {
      console.error('Error submitting solicitud:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Dashboard de Formación</h1>
        <p className="text-gray-600 mt-2">Visualiza tu progreso académico y solicita supervisiones</p>
      </div>

      {/* Mis Casos Asignados */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Mis Casos Asignados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {asignaciones.map((asignacion) => (
            <Card key={asignacion.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{asignacion.paciente_nombre}</CardTitle>
                <CardDescription>{asignacion.asignatura}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                {/* Barra de progreso */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progreso de Cupo</span>
                    <span className="text-sm font-bold text-blue-600">{asignacion.porcentaje_avance.toFixed(0)}%</span>
                  </div>
                  <Progress value={asignacion.porcentaje_avance} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    {asignacion.procedimientos_aprobados} procedimientos aprobados
                  </p>
                </div>

                {/* Badge de estado */}
                <div className="flex items-center gap-2">
                  {asignacion.estado === 'ACTIVO' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Activo</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-600 font-medium">{asignacion.estado}</span>
                    </>
                  )}
                </div>

                {/* Botón solicitar supervisión */}
                <Button
                  onClick={() => handleSolicitarSupervision(asignacion)}
                  className="w-full mt-4"
                  variant="default"
                >
                  Solicitar Supervisión
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {asignaciones.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes casos asignados en este momento. Contacta a la coordinación clínica.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Solicitudes Pendientes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Mis Solicitudes de Supervisión</h2>
        <div className="space-y-2">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {solicitud.estado === 'APROBADO' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : solicitud.estado === 'RECHAZADO' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">{solicitud.tipo_hito}</p>
                  <p className="text-sm text-gray-500">
                    Estado: <span className="font-semibold">{solicitud.estado}</span>
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
              </span>
            </Card>
          ))}
          {solicitudes.length === 0 && (
            <p className="text-gray-500">Aún no has enviado solicitudes de supervisión</p>
          )}
        </div>
      </div>

      {/* Diálogo de solicitud */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Supervisión</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Paciente</label>
              <p className="text-sm text-gray-600">{selectedAsignacion?.paciente_nombre}</p>
            </div>

            <div>
              <label htmlFor="hito" className="text-sm font-medium block mb-2">
                Tipo de Hito
              </label>
              <select
                id="hito"
                value={tipoHito}
                onChange={(e) => setTipoHito(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="DIAGNOSTICO">Diagnóstico</option>
                <option value="INICIO">Inicio del Procedimiento</option>
                <option value="CIERRE">Cierre del Procedimiento</option>
              </select>
            </div>

            <div>
              <label htmlFor="descripcion" className="text-sm font-medium block mb-2">
                Descripción
              </label>
              <Textarea
                id="descripcion"
                placeholder="Describe el procedimiento o diagnóstico..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitSolicitud} disabled={submitting || !descripcion.trim()}>
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
