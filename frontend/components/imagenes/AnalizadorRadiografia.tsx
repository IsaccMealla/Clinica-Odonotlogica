'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { radiografiaAPI } from '@/lib/radiografia-api';
import { useRadiografiaCache } from '@/hooks/useRadiografiaCache';
import SelectorImagenIA from './SelectorImagenIA';
import AnalisisTimeline from './AnalisisTimeline';
import {
  Hallazgo,
  EstadoRadiografia,
  dibujarAnotaciones,
  dibujarHallazgos,
  extraerCoordenadas,
  calcularBoundingBox,
  ETIQUETAS_DIAGNOSTICO
} from '@/lib/diagnostico-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Brain, Pencil, Download, Trash2, Image as ImageIcon } from 'lucide-react';

interface AnalizadorRadiografiaProps {
  radiografiaId: string;
  pacienteId: string;
  onClosed?: () => void;
}

interface Procesamiento {
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  progreso: number;
  tiempoInicio?: number;
}

export default function AnalizadorRadiografia({
  radiografiaId,
  pacienteId,
  onClosed
}: AnalizadorRadiografiaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagenRef = useRef<HTMLImageElement>(null);
  const cache = useRadiografiaCache({
    cacheDuration: 60000,
    maxPollingDuration: 30000,
    pollingInterval: 2000
  });

  const [estado, setEstado] = useState<EstadoRadiografia | null>(null);
  const [hallazgosManual, setHallazgosManual] = useState<Hallazgo[]>([]);
  const [dibujando, setDibujando] = useState(false);
  const [inicio, setInicio] = useState<[number, number] | null>(null);
  const [etiquetaActual, setEtiquetaActual] = useState(ETIQUETAS_DIAGNOSTICO[0]);
  const [colorActual, setColorActual] = useState('#facc15');
  const [procesamiento, setProcesamiento] = useState<Procesamiento>({
    estado: 'pendiente',
    progreso: 0
  });
  const [modoCargado, setModoCargado] = useState(false);
  const [mostrandoAnotaciones, setMostrandoAnotaciones] = useState(true);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [imagenActualId, setImagenActualId] = useState(radiografiaId);

  // ========================
  // CARGA INICIAL - SIN POLLING CONTINUO
  // ========================
  useEffect(() => {
    cargarEstadoInicial();
  }, [imagenActualId]);

  const cargarEstadoInicial = useCallback(async () => {
    try {
      setEstado(null);
      setProcesamiento({ estado: 'pendiente', progreso: 0 });

      // Usar caché optimizado
      const data = await cache.obtenerEstadoOptimizado(imagenActualId);
      setEstado(data);
      setHallazgosManual(data.hallazgos_manuales || []);
      
      // Si está procesando, iniciar polling inteligente (máximo 30 segundos)
      if (data.estado === 'Procesando') {
        setProcesamiento({ estado: 'procesando', progreso: 30, tiempoInicio: Date.now() });
        cache.iniciarPollingInteligente(imagenActualId, (newData) => {
          setEstado(newData);
          if (newData.estado === 'Procesado') {
            setProcesamiento({ estado: 'completado', progreso: 100 });
          } else if (newData.estado === 'Error') {
            setProcesamiento({ estado: 'error', progreso: 0 });
          }
        });
      } else if (data.estado === 'Procesado') {
        setProcesamiento({ estado: 'completado', progreso: 100 });
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  }, [imagenActualId, cache]);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !imagenRef.current || !estado) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    canvas.width = imagenRef.current.naturalWidth;
    canvas.height = imagenRef.current.naturalHeight;
    ctx.drawImage(imagenRef.current, 0, 0);

    if (mostrandoAnotaciones && estado.hallazgos_ia?.detecciones) {
      dibujarHallazgos(canvas, estado.hallazgos_ia.detecciones, '#3b82f6');
    }

    if (hallazgosManual.length > 0) {
      dibujarHallazgos(canvas, hallazgosManual);
    }
  }, [estado, hallazgosManual, mostrandoAnotaciones]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ========================
  // PROCESAMIENTO IA
  // ========================
  const procesarConIA = async () => {
    setProcesamiento({ estado: 'procesando', progreso: 10, tiempoInicio: Date.now() });
    try {
      await radiografiaAPI.procesarConIA(imagenActualId);
      setProcesamiento(p => ({ ...p, progreso: 30 }));
      
      // Invalidar caché y hacer polling inteligente
      cache.invalidateCache(`radiografia-estado-${imagenActualId}`);
      cache.iniciarPollingInteligente(imagenActualId, (newData) => {
        setEstado(newData);
        if (newData.estado === 'Procesado') {
          setProcesamiento({ estado: 'completado', progreso: 100 });
        } else if (newData.estado === 'Error') {
          setProcesamiento({ estado: 'error', progreso: 0 });
        }
      });
    } catch (error) {
      console.error('Error procesando IA:', error);
      setProcesamiento({ estado: 'error', progreso: 0 });
    }
  };

  // ========================
  // ANOTACIONES MANUALES
  // ========================
  function iniciarAnotacion(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;
    const coords = extraerCoordenadas(e as any, canvasRef.current);
    setInicio(coords as [number, number]);
    setDibujando(true);
  }

  function continuarAnotacion(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dibujando || !inicio || !canvasRef.current || !imagenRef.current) return;

    const coords = extraerCoordenadas(e as any, canvasRef.current);
    const bbox = calcularBoundingBox(inicio, coords as [number, number]);

    renderCanvas();

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.strokeStyle = colorActual;
    ctx.lineWidth = 2;
    ctx.strokeRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
  }

  function terminarAnotacion(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dibujando || !inicio || !canvasRef.current) return;

    const coords = extraerCoordenadas(e as any, canvasRef.current);
    const bbox = calcularBoundingBox(inicio, coords as [number, number]);

    const nuevoHallazgo: Hallazgo = {
      etiqueta: etiquetaActual,
      bounding_box: bbox as [number, number, number, number],
      observaciones: '',
      color: colorActual
    };

    setHallazgosManual([...hallazgosManual, nuevoHallazgo]);
    setDibujando(false);
    setInicio(null);
  }

  const guardarDiagnosticoManual = async () => {
    try {
      await radiografiaAPI.registrarDiagnosticoManual(imagenActualId, hallazgosManual);
      // Invalidar caché para obtener datos actualizados
      cache.invalidateCache(`radiografia-estado-${imagenActualId}`);
      await cargarEstadoInicial();
      setHallazgosManual([]);
      setModoCargado(false);
    } catch (error) {
      console.error('Error guardando diagnóstico:', error);
    }
  };

  const limpiarAnotaciones = () => {
    setHallazgosManual([]);
  };

  const descargarImagenAnotada = async () => {
    try {
      const data = await radiografiaAPI.descargarImagenAnotada(imagenActualId);
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error descargando imagen:', error);
    }
  };

  const handleImagenSeleccionada = (nuevoImagenId: string) => {
    setImagenActualId(nuevoImagenId);
    setEstado(null);
    setHallazgosManual([]);
    setMostrarSelector(false);
  };

  if (!estado) {
    return (
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando radiografía...</p>
        </CardContent>
      </Card>
    );
  }

  if (mostrarSelector) {
    return (
      <SelectorImagenIA 
        pacienteId={pacienteId}
        onImagenSeleccionada={handleImagenSeleccionada}
        onCerrar={() => setMostrarSelector(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
    <Card className="w-full border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Analizador de Radiografía</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setMostrarSelector(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Cambiar imagen
            </Button>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              estado.estado === 'Procesado' ? 'bg-green-100 text-green-800' :
              estado.estado === 'Procesando' ? 'bg-yellow-100 text-yellow-800' :
              estado.estado === 'Error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {estado.estado === 'Procesado' && <CheckCircle2 className="w-4 h-4" />}
              {estado.estado === 'Procesando' && <Clock className="w-4 h-4 animate-spin" />}
              {estado.estado === 'Error' && <AlertCircle className="w-4 h-4" />}
              {estado.estado}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Lienzo de visualización */}
        <div className="bg-black rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center min-h-[500px]">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={iniciarAnotacion}
              onMouseMove={continuarAnotacion}
              onMouseUp={terminarAnotacion}
              onMouseLeave={terminarAnotacion}
              className="border border-gray-600 cursor-crosshair"
              style={{ maxHeight: '500px' }}
            />
            <img
              ref={imagenRef}
              style={{ display: 'none' }}
              src={estado.imagen_url || ''}
              alt="Radiografía"
              onLoad={() => {
                if (canvasRef.current && imagenRef.current) {
                  canvasRef.current.width = imagenRef.current.naturalWidth;
                  canvasRef.current.height = imagenRef.current.naturalHeight;
                  renderCanvas();
                }
              }}
            />
          </div>
        </div>

        {/* Panel de Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Análisis IA */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" /> Análisis IA
            </label>
            <Button
              onClick={procesarConIA}
              disabled={procesamiento.estado === 'procesando' || estado.estado === 'Procesando'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {procesamiento.estado === 'procesando' ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : estado.estado === 'Procesado' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Procesado
                </>
              ) : (
                'Procesar con CNN'
              )}
            </Button>
          </div>

          {/* Análisis Manual */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-600" /> Análisis Manual
            </label>
            <select
              value={etiquetaActual}
              onChange={(e) => setEtiquetaActual(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              {ETIQUETAS_DIAGNOSTICO.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Color:</label>
              <input
                type="color"
                value={colorActual}
                onChange={(e) => setColorActual(e.target.value)}
                className="w-10 h-10 rounded-md border border-gray-300"
                aria-label="Seleccionar color de anotación"
              />
              <span className="text-xs text-slate-500">El color se usa para el cuadro manual</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Acciones</label>
            <div className="flex gap-2">
              {hallazgosManual.length > 0 && (
                <Button
                  onClick={limpiarAnotaciones}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Limpiar
                </Button>
              )}
              {estado.tiene_imagen_anotada && (
                <Button
                  onClick={descargarImagenAnotada}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" /> Descargar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hallazgos IA */}
        {estado.hallazgos_ia?.detecciones && estado.hallazgos_ia.detecciones.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Hallazgos Detectados por IA
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {estado.hallazgos_ia.detecciones.map((d: any, i: number) => (
                <div key={i} className="bg-white p-2 rounded border border-blue-100">
                  <p className="text-xs font-medium text-gray-900">{d.etiqueta}</p>
                  <p className="text-xs text-blue-600">
                    Confianza: {(d.confianza * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hallazgos Manuales */}
        {hallazgosManual.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Anotaciones Manuales ({hallazgosManual.length})
              </h3>
              <Button
                onClick={guardarDiagnosticoManual}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
            <div className="space-y-2">
              {hallazgosManual.map((h, i) => (
                <div key={i} className="bg-white p-2 rounded border border-amber-100 text-xs">
                  <p className="font-medium">{i + 1}. {h.etiqueta}</p>
                  <p className="text-gray-600">
                    Posición: [{h.bounding_box.join(', ')}]
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado de Procesamiento */}
        {procesamiento.estado === 'procesando' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Procesando imagen</p>
                <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${procesamiento.progreso}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {procesamiento.estado === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-900">Error al procesar la imagen. Por favor, intente nuevamente.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Línea de tiempo de análisis */}
    <AnalisisTimeline radiografiaId={imagenActualId} />
    </div>
  );
}
