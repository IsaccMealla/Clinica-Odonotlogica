'use client';

import { useState, useRef, useEffect } from 'react';
import { radiografiaAPI } from '@/lib/radiografia-api';
import {
  Hallazgo,
  EstadoRadiografia,
  dibujarAnotaciones,
  extraerCoordenadas,
  calcularBoundingBox,
  ETIQUETAS_DIAGNOSTICO
} from '@/lib/diagnostico-helpers';

interface VisorRadiografiaProps {
  radiografiaId: string;
  pacienteId: string;
}

export default function VisorRadiografiaConAnotaciones({
  radiografiaId,
  pacienteId
}: VisorRadiografiaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagenRef = useRef<HTMLImageElement>(null);
  const [estado, setEstado] = useState<EstadoRadiografia | null>(null);
  const [hallazgosManual, setHallazgosManual] = useState<Hallazgo[]>([]);
  const [dibujando, setDibujando] = useState(false);
  const [inicio, setInicio] = useState<[number, number] | null>(null);
  const [etiquetaActual, setEtiquetaActual] = useState(ETIQUETAS_DIAGNOSTICO[0]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarEstado();
    const intervalo = setInterval(cargarEstado, 3000);
    return () => clearInterval(intervalo);
  }, [radiografiaId]);

  async function cargarEstado() {
    try {
      const data = await radiografiaAPI.obtenerEstado(radiografiaId);
      setEstado(data);
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  }

  async function procesarConIA() {
    setCargando(true);
    try {
      await radiografiaAPI.procesarConIA(radiografiaId);
      await cargarEstado();
    } catch (error) {
      console.error('Error procesando IA:', error);
    } finally {
      setCargando(false);
    }
  }

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

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.drawImage(imagenRef.current, 0, 0);
    ctx.strokeStyle = '#ffff00';
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
      observaciones: ''
    };

    setHallazgosManual([...hallazgosManual, nuevoHallazgo]);
    setDibujando(false);
    setInicio(null);
  }

  async function guardarDiagnosticoManual() {
    setCargando(true);
    try {
      await radiografiaAPI.registrarDiagnosticoManual(radiografiaId, hallazgosManual);
      await cargarEstado();
      setHallazgosManual([]);
    } catch (error) {
      console.error('Error guardando diagnóstico:', error);
    } finally {
      setCargando(false);
    }
  }

  async function descargarImagenAnotada() {
    try {
      const data = await radiografiaAPI.descargarImagenAnotada(radiografiaId);
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error descargando imagen:', error);
    }
  }

  if (!estado) {
    return <div className="p-4">Cargando radiografía...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Visor de Radiografía</h2>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${
            estado.estado === 'Procesado' ? 'bg-green-500' :
            estado.estado === 'Procesando' ? 'bg-yellow-500' :
            'bg-gray-500'
          } text-white`}>
            {estado.estado}
          </span>
        </div>
      </div>

      {/* Canvas de visualización */}
      <div className="border border-gray-300 bg-white p-2 rounded">
        <canvas
          ref={canvasRef}
          onMouseDown={iniciarAnotacion}
          onMouseMove={continuarAnotacion}
          onMouseUp={terminarAnotacion}
          className="border border-gray-200 cursor-crosshair max-w-full"
        />
        <img
          ref={imagenRef}
          style={{ display: 'none' }}
          src={estado.imagen_url || ''}
          alt="Radiografía"
        />
      </div>

      {/* Panel de control */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Etiqueta:</label>
          <select
            value={etiquetaActual}
            onChange={(e) => setEtiquetaActual(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {ETIQUETAS_DIAGNOSTICO.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <button
          onClick={procesarConIA}
          disabled={cargando || estado.estado === 'Procesando'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Procesar IA
        </button>
      </div>

      {/* Hallazgos IA */}
      {estado.hallazgos_ia && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold mb-2">Hallazgos IA:</h3>
          {estado.hallazgos_ia.detecciones?.map((d: any, i: number) => (
            <div key={i} className="text-sm text-gray-700">
              {d.etiqueta} ({(d.confianza * 100).toFixed(1)}%)
            </div>
          ))}
        </div>
      )}

      {/* Hallazgos Manuales */}
      {hallazgosManual.length > 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-semibold mb-2">Hallazgos Manuales ({hallazgosManual.length}):</h3>
          <button
            onClick={guardarDiagnosticoManual}
            disabled={cargando}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Guardar Diagnóstico
          </button>
        </div>
      )}

      {/* Imagen Anotada */}
      {estado.tiene_imagen_anotada && (
        <button
          onClick={descargarImagenAnotada}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Descargar Imagen Anotada
        </button>
      )}
    </div>
  );
}
