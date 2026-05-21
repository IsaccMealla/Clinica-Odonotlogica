'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Clock, CheckCircle2, XCircle, Brain } from 'lucide-react';

interface AnalisisEntry {
  timestamp: string;
  tipo: string;
  estado: string;
  usuario_id: string;
  usuario_nombre: string;
  tarea_id?: string;
  resultados?: any;
}

interface Props {
  radiografiaId: string;
}

export default function AnalisisTimeline({ radiografiaId }: Props) {
  const [historial, setHistorial] = useState<AnalisisEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cargarHistorial = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `http://localhost:8000/api/imagenes/${radiografiaId}/historial_analisis/`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHistorial(data.historial || []);
        } else {
          setError('Error al cargar historial');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error de conexión');
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [radiografiaId]);

  const toggleExpanded = (index: number) => {
    const newExpandidos = new Set(expandidos);
    if (newExpandidos.has(index)) {
      newExpandidos.delete(index);
    } else {
      newExpandidos.add(index);
    }
    setExpandidos(newExpandidos);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIconoEstado = (entrada: AnalisisEntry) => {
    if (entrada.tipo === 'IA_INFERENCIA') {
      if (entrada.estado === 'completado') {
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      } else if (entrada.estado === 'error') {
        return <XCircle className="w-5 h-5 text-red-600" />;
      } else {
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      }
    }
    return <Brain className="w-5 h-5 text-blue-600" />;
  };

  const getColorBorde = (entrada: AnalisisEntry) => {
    if (entrada.tipo === 'IA_INFERENCIA') {
      if (entrada.estado === 'completado') {
        return 'border-l-4 border-l-green-600';
      } else if (entrada.estado === 'error') {
        return 'border-l-4 border-l-red-600';
      } else {
        return 'border-l-4 border-l-yellow-600';
      }
    }
    return 'border-l-4 border-l-blue-600';
  };

  if (cargando) {
    return (
      <Card className="w-full border-slate-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (historial.length === 0) {
    return (
      <Card className="w-full border-slate-200">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Línea de tiempo de análisis</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600">Sin análisis realizados aún</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-slate-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Línea de tiempo de análisis ({historial.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {historial.map((entrada, index) => (
            <div key={index} className={`p-4 rounded-lg bg-slate-50 ${getColorBorde(entrada)}`}>
              <div 
                className="flex items-start justify-between cursor-pointer hover:bg-slate-100 p-2 -m-2 rounded transition-colors"
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getIconoEstado(entrada)}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {entrada.tipo === 'IA_INFERENCIA' ? 'Análisis IA' : 'Análisis manual'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatearFecha(entrada.timestamp)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Por: {entrada.usuario_nombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    entrada.estado === 'completado'
                      ? 'bg-green-100 text-green-800'
                      : entrada.estado === 'error'
                      ? 'bg-red-100 text-red-800'
                      : entrada.estado === 'en_proceso'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {entrada.estado === 'en_proceso' ? 'En proceso' : entrada.estado}
                  </span>
                </div>
              </div>

              {expandidos.has(index) && entrada.resultados && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Resultados:</p>
                  <pre className="text-xs bg-white p-3 rounded border border-slate-200 overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(entrada.resultados, null, 2)}
                  </pre>
                </div>
              )}

              {expandidos.has(index) && !entrada.resultados && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600 italic">
                    {entrada.estado === 'en_proceso' ? 'Análisis en proceso...' : 'Sin resultados disponibles'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
