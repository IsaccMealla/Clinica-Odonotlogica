import React, { useEffect, useState } from 'react';
import { useClinicaWebSocket, WebSocketEvent } from '@/hooks/useClinicaWebSocket';

export interface TratamientoStep {
  label: string;
  descripcion: string;
  estado: string;
  completado: boolean;
  activo: boolean;
}

interface TratamientoStepperProps {
  tratamientoId: string;
  estadoActual?: string;
  onEstadoChanged?: (estado: string) => void;
}

/**
 * Componente Stepper que muestra el flujo del tratamiento en tiempo real.
 * Cambia automáticamente cuando hay cambios de estado vía WebSocket.
 */
export function TratamientoStepper({
  tratamientoId,
  estadoActual = 'Pendiente_Aprobacion',
  onEstadoChanged
}: TratamientoStepperProps) {
  const [estadoActualLocal, setEstadoActualLocal] = useState(estadoActual);
  const [pasos, setPasos] = useState<TratamientoStep[]>([]);

  // Definir el flujo de pasos
  const definirPasos = (estado: string): TratamientoStep[] => {
    const mapaPasos = {
      'Pendiente_Aprobacion': 0,
      'Aprobado_Por_Pagar': 1,
      'Pagado_Autorizado': 2,
      'En_Ejecucion': 3,
      'Finalizado_Pendiente_Nota': 4,
      'Evaluado': 5,
    };

    const pasoList: TratamientoStep[] = [
      {
        label: 'Aprobación',
        descripcion: 'Espera aprobación del docente',
        estado: 'Pendiente_Aprobacion',
        completado: false,
        activo: false,
      },
      {
        label: 'Pago',
        descripcion: 'Pago en caja',
        estado: 'Aprobado_Por_Pagar',
        completado: false,
        activo: false,
      },
      {
        label: 'Despacho',
        descripcion: 'Despacho de almacén',
        estado: 'Pagado_Autorizado',
        completado: false,
        activo: false,
      },
      {
        label: 'Ejecución',
        descripcion: 'Ejecución del tratamiento',
        estado: 'En_Ejecucion',
        completado: false,
        activo: false,
      },
      {
        label: 'Evaluación',
        descripcion: 'Pendiente evaluación final',
        estado: 'Finalizado_Pendiente_Nota',
        completado: false,
        activo: false,
      },
      {
        label: 'Finalizado',
        descripcion: 'Tratamiento evaluado',
        estado: 'Evaluado',
        completado: false,
        activo: false,
      },
    ];

    const indiceActual = mapaPasos[estado as keyof typeof mapaPasos] ?? 0;

    return pasoList.map((paso, index) => ({
      ...paso,
      completado: index < indiceActual,
      activo: index === indiceActual,
    }));
  };

  // Conectar a WebSocket
  const { suscribir } = useClinicaWebSocket({
    onTratamientoEstadoChanged: (evento: WebSocketEvent) => {
      if (evento.tratamiento_id === tratamientoId && evento.data?.estado) {
        const nuevoEstado = evento.data.estado;
        setEstadoActualLocal(nuevoEstado);
        onEstadoChanged?.(nuevoEstado);
      }
    },
  });

  // Suscribirse al tratamiento
  useEffect(() => {
    suscribir([tratamientoId]);
  }, [tratamientoId, suscribir]);

  // Mantener el estado local sincronizado si cambia el estado inicial desde las props
  useEffect(() => {
    setEstadoActualLocal(estadoActual);
  }, [estadoActual]);

  // Actualizar pasos cuando cambia el estado
  useEffect(() => {
    setPasos(definirPasos(estadoActualLocal));
  }, [estadoActualLocal]);

  // Obtener color del paso
  const getColorClase = (paso: TratamientoStep): string => {
    if (paso.completado) return 'bg-green-500';
    if (paso.activo) return 'bg-blue-500 animate-pulse';
    return 'bg-gray-300';
  };

  const getTextColorClase = (paso: TratamientoStep): string => {
    if (paso.completado) return 'text-green-700';
    if (paso.activo) return 'text-blue-700';
    return 'text-gray-700';
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Flujo del Tratamiento</h2>

      {/* Línea de progreso */}
      <div className="flex items-center justify-between mb-8">
        {pasos.map((paso, index) => (
          <React.Fragment key={paso.estado}>
            {/* Círculo del paso */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${getColorClase(
                  paso
                )}`}
              >
                {paso.completado ? '✓' : index + 1}
              </div>
              <div className={`text-sm font-semibold mt-2 ${getTextColorClase(paso)}`}>
                {paso.label}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {paso.descripcion}
              </div>
            </div>

            {/* Línea conectora */}
            {index < pasos.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  pasos[index].completado ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Estado actual */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-800">Estado Actual</h3>
        <p className="text-blue-700 mt-2">
          {pasos.find((p) => p.activo)?.label || 'Desconocido'}
        </p>
        <p className="text-sm text-blue-600 mt-1">
          {pasos.find((p) => p.activo)?.descripcion}
        </p>
      </div>

      {/* Detalles del progreso */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${((pasos.filter((p) => p.completado).length + 1) / pasos.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {pasos.filter((p) => p.completado).length + 1} de {pasos.length} pasos completados
        </p>
      </div>
    </div>
  );
}

/**
 * Versión compacta del Stepper (solo para dashboards)
 */
export function TratamientoStepperCompacto({
  tratamientoId,
  estadoActual = 'Pendiente_Aprobacion',
}: TratamientoStepperProps) {
  const [estadoActualLocal, setEstadoActualLocal] = useState(estadoActual);

  const { suscribir } = useClinicaWebSocket({
    onTratamientoEstadoChanged: (evento: WebSocketEvent) => {
      if (evento.tratamiento_id === tratamientoId && evento.data?.estado) {
        setEstadoActualLocal(evento.data.estado);
      }
    },
  });

  useEffect(() => {
    suscribir([tratamientoId]);
  }, [tratamientoId, suscribir]);

  const estadosColores = {
    'Pendiente_Aprobacion': { color: 'bg-yellow-500', texto: 'Pendiente' },
    'Aprobado_Por_Pagar': { color: 'bg-orange-500', texto: 'Por Pagar' },
    'Pagado_Autorizado': { color: 'bg-blue-500', texto: 'Pagado' },
    'En_Ejecucion': { color: 'bg-purple-500', texto: 'En Ejecución' },
    'Finalizado_Pendiente_Nota': { color: 'bg-indigo-500', texto: 'Pendiente Nota' },
    'Evaluado': { color: 'bg-green-500', texto: 'Finalizado' },
  };

  const estadoConfig =
    estadosColores[estadoActualLocal as keyof typeof estadosColores] ||
    estadosColores['Pendiente_Aprobacion'];

  return (
    <div className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${estadoConfig.color}`}>
      {estadoConfig.texto}
    </div>
  );
}
