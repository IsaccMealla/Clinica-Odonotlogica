'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface Imagen {
  id: string;
  archivo: string;
  categoria: string;
  pieza_dental?: number;
  fecha_adquisicion: string;
  estado_procesamiento: string;
}

interface Props {
  pacienteId: string;
  onImagenSeleccionada: (imagenId: string) => void;
  onCerrar: () => void;
}

export default function SelectorImagenIA({ pacienteId, onImagenSeleccionada, onCerrar }: Props) {
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const cargarImagenes = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `http://localhost:8000/api/imagenes/listar_para_analizar/?paciente=${pacienteId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setImagenes(data);
        } else {
          setError('Error al cargar imágenes');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error de conexión');
      } finally {
        setCargando(false);
      }
    };

    cargarImagenes();
  }, [pacienteId]);

  const handleSeleccionar = () => {
    if (seleccionada) {
      onImagenSeleccionada(seleccionada);
      onCerrar();
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString();
  };

  const getCategoriaLabel = (cat: string) => {
    const labels: Record<string, string> = {
      FACIAL: '📷 Fotografía Facial',
      INTRAORAL: '👄 Fotografía Intraoral',
      PSP: '🩻 Radiografía PSP',
      CBCT: '🗂️ CBCT',
      PROCESO: '📋 Proceso',
      FINAL: '✅ Resultado Final'
    };
    return labels[cat] || cat;
  };

  if (cargando) {
    return (
      <Card className="w-full border-slate-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando imágenes...</p>
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
            <div>
              <p className="font-semibold text-red-800">{error}</p>
              <Button onClick={onCerrar} variant="outline" size="sm" className="mt-3">
                Cerrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (imagenes.length === 0) {
    return (
      <Card className="w-full border-slate-200">
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600">No hay imágenes disponibles para analizar</p>
          <Button onClick={onCerrar} variant="outline" size="sm" className="mt-4">
            Cerrar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-slate-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle>Selecciona imagen para analizar</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {imagenes.map((img) => (
            <div
              key={img.id}
              onClick={() => setSeleccionada(img.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                seleccionada === img.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {getCategoriaLabel(img.categoria)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {img.pieza_dental && `Pieza: ${img.pieza_dental} | `}
                    {formatearFecha(img.fecha_adquisicion)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      img.estado_procesamiento === 'Procesado'
                        ? 'bg-green-100 text-green-800'
                        : img.estado_procesamiento === 'Procesando'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {img.estado_procesamiento}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      seleccionada === img.id ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <ImageIcon
                      className={`w-6 h-6 ${
                        seleccionada === img.id ? 'text-white' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button
            onClick={onCerrar}
            variant="outline"
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSeleccionar}
            disabled={!seleccionada}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Analizar seleccionada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
