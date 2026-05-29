'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';

interface SolicitudSupervision {
  id: string;
  asignacion_caso_paciente: string;
  asignacion_caso_estudiante: string;
  tipo_hito: string;
  descripcion_solicitud: string;
  estado: string;
  fecha_solicitud: string;
}

interface EvaluacionData {
  solicitud_id: string;
  calificacion: number;
  alerta_temprana: boolean;
  motivo_detalle: string;
  manejo_tecnica: number;
  bioseguridad: number;
  comunicacion_paciente: number;
  cumplimiento_tiempo: number;
  documentacion: number;
}

export function PanelDocente() {
  const [solicitudes, setSolicitudes] = useState<SolicitudSupervision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudSupervision | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evaluacion, setEvaluacion] = useState<Partial<EvaluacionData>>({
    calificacion: 3,
    alerta_temprana: false,
    motivo_detalle: '',
    manejo_tecnica: 3,
    bioseguridad: 3,
    comunicacion_paciente: 3,
    cumplimiento_tiempo: 3,
    documentacion: 3,
  });
  const [submitting, setSubmitting] = useState(false);
  const [tipoAccion, setTipoAccion] = useState<'aprobar' | 'rechazar'>('aprobar');

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/solicitud-supervision/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      const pendientes = (data.results || data).filter(
        (s: SolicitudSupervision) => s.estado === 'PENDIENTE'
      );
      setSolicitudes(pendientes);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluar = (solicitud: SolicitudSupervision, tipo: 'aprobar' | 'rechazar') => {
    setSelectedSolicitud(solicitud);
    setTipoAccion(tipo);
    setDialogOpen(true);
  };

  const submitEvaluacion = async () => {
    if (!selectedSolicitud) return;

    setSubmitting(true);
    try {
      const endpoint =
        tipoAccion === 'aprobar'
          ? `${API_BASE_URL}/api/solicitud-supervision/${selectedSolicitud.id}/aprobar/`
          : `${API_BASE_URL}/api/solicitud-supervision/${selectedSolicitud.id}/rechazar/`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(
          tipoAccion === 'rechazar'
            ? { observaciones: evaluacion.motivo_detalle }
            : {}
        ),
      });

      if (response.ok) {
        // Si se aprueba, crear la evaluación
        if (tipoAccion === 'aprobar') {
          await crearEvaluacion(selectedSolicitud.id);
        }
        alert(`Solicitud ${tipoAccion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
        setDialogOpen(false);
        fetchSolicitudes();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'No se pudo procesar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const crearEvaluacion = async (solicitudId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/evaluacion-desempeño/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          solicitud_supervision: solicitudId,
          calificacion: evaluacion.calificacion,
          alerta_temprana: evaluacion.alerta_temprana,
          motivo_detalle: evaluacion.motivo_detalle,
          manejo_tecnica: evaluacion.manejo_tecnica,
          bioseguridad: evaluacion.bioseguridad,
          comunicacion_paciente: evaluacion.comunicacion_paciente,
          cumplimiento_tiempo: evaluacion.cumplimiento_tiempo,
          documentacion: evaluacion.documentacion,
        }),
      });
    } catch (error) {
      console.error('Error creating evaluacion:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Supervisión Docente</h1>
        <p className="text-gray-600 mt-2">Revisa y aprueba las solicitudes de tus estudiantes</p>
      </div>

      {/* Alertas de Bajo Desempeño */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Alertas Tempranas Activas</h3>
            <p className="text-sm text-red-800 mt-1">
              Hay estudiantes que requieren atención especial por bajo desempeño
            </p>
          </div>
        </div>
      </div>

      {/* Solicitudes Pendientes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Solicitudes Pendientes ({solicitudes.length})
        </h2>

        {solicitudes.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              No hay solicitudes pendientes de supervisión en este momento.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {solicitudes.map((solicitud) => (
              <Card key={solicitud.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {solicitud.asignacion_caso_paciente}
                      </CardTitle>
                      <CardDescription>
                        Estudiante: {solicitud.asignacion_caso_estudiante}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {solicitud.tipo_hito}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-grow">
                  <div>
                    <h4 className="font-medium mb-2">Descripción del Procedimiento:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {solicitud.descripcion_solicitud}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleEvaluar(solicitud, 'rechazar')}
                      className="flex gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </Button>
                    <Button
                      onClick={() => handleEvaluar(solicitud, 'aprobar')}
                      className="flex gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Evaluar y Aprobar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de Evaluación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tipoAccion === 'aprobar' ? 'Evaluar Desempeño' : 'Registrar Rechazo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {tipoAccion === 'aprobar' && (
              <>
                <div>
                  <label className="text-sm font-medium block mb-2">Calificación General</label>
                  <select
                    value={evaluacion.calificacion}
                    onChange={(e) =>
                      setEvaluacion({ ...evaluacion, calificacion: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={5}>5 - Excelente</option>
                    <option value={4}>4 - Muy Bueno</option>
                    <option value={3}>3 - Bueno</option>
                    <option value={2}>2 - Regular</option>
                    <option value={1}>1 - Insuficiente</option>
                  </select>
                </div>

                {/* Criterios de Evaluación */}
                {(['manejo_tecnica', 'bioseguridad', 'comunicacion_paciente', 'cumplimiento_tiempo', 'documentacion'] as const).map(
                  (criterio) => (
                    <div key={criterio}>
                      <label className="text-sm font-medium block mb-2 capitalize">
                        {criterio.replace(/_/g, ' ')}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <Button
                            key={val}
                            variant={evaluacion[criterio] === val ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              setEvaluacion({ ...evaluacion, [criterio]: val })
                            }
                          >
                            {val}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Alerta Temprana */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evaluacion.alerta_temprana}
                      onChange={(e) =>
                        setEvaluacion({
                          ...evaluacion,
                          alerta_temprana: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Marcar Alerta Temprana de Bajo Desempeño</span>
                  </label>
                </div>

                {evaluacion.alerta_temprana && (
                  <div>
                    <label htmlFor="motivo" className="text-sm font-medium block mb-2">
                      Motivo Detallado de la Alerta
                    </label>
                    <Textarea
                      id="motivo"
                      placeholder="Describe los puntos débiles identificados..."
                      value={evaluacion.motivo_detalle}
                      onChange={(e) =>
                        setEvaluacion({ ...evaluacion, motivo_detalle: e.target.value })
                      }
                      className="min-h-24"
                    />
                  </div>
                )}
              </>
            )}

            {tipoAccion === 'rechazar' && (
              <div>
                <label htmlFor="observaciones" className="text-sm font-medium block mb-2">
                  Observaciones para el Estudiante
                </label>
                <Textarea
                  id="observaciones"
                  placeholder="Describe qué necesita mejorarse..."
                  value={evaluacion.motivo_detalle}
                  onChange={(e) =>
                    setEvaluacion({ ...evaluacion, motivo_detalle: e.target.value })
                  }
                  className="min-h-32"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitEvaluacion}
              disabled={
                submitting ||
                (tipoAccion === 'rechazar' && !evaluacion.motivo_detalle?.trim())
              }
              variant={tipoAccion === 'rechazar' ? 'destructive' : 'default'}
            >
              {submitting
                ? 'Procesando...'
                : tipoAccion === 'aprobar'
                  ? 'Aprobar'
                  : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
