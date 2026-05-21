import { useEffect, useRef, useCallback, useState } from 'react';

export interface TratamientoEstado {
  id: string;
  paciente_id: string;
  estado: 'Pendiente_Aprobacion' | 'Aprobado_Por_Pagar' | 'Pagado_Autorizado' | 'En_Ejecucion' | 'Finalizado_Pendiente_Nota' | 'Evaluado';
  nombre_tratamiento: string;
  precio: string;
  pieza_dental: number | null;
  procedimiento: string | null;
}

export interface WebSocketEvent {
  event: string;
  tratamiento_id?: string;
  paciente_id?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  data?: Record<string, any>;
  timestamp?: string;
}

interface UseClinicaWebSocketOptions {
  onTratamientoEstadoChanged?: (evento: WebSocketEvent) => void;
  onControlAcademicoAprobado?: (evento: WebSocketEvent) => void;
  onPagoProcessado?: (evento: WebSocketEvent) => void;
  onDespachoAlmacen?: (evento: WebSocketEvent) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

/**
 * Custom Hook para conectarse a WebSocket en tiempo real.
 * Maneja suscripciones dinámicas y emite eventos según cambios de estado.
 */
export function useClinicaWebSocket(options: UseClinicaWebSocketOptions = {}) {
  const {
    onTratamientoEstadoChanged,
    onControlAcademicoAprobado,
    onPagoProcessado,
    onDespachoAlmacen,
    onError,
    autoConnect = true
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectCountRef = useRef(0);
  const tratamientosSubscritosRef = useRef<Set<string>>(new Set());
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set());

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.hostname}:${window.location.port}/ws/clinica/`;
  }, []);

  const conectar = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectCountRef.current = 0;

        if (pendingSubscriptionsRef.current.size > 0) {
          const tratamiento_ids = Array.from(pendingSubscriptionsRef.current);
          wsRef.current?.send(JSON.stringify({ action: 'subscribe', tratamiento_ids }));
        }

        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const mensaje = JSON.parse(event.data) as WebSocketEvent;

          switch (mensaje.event) {
            case 'tratamiento_estado_changed':
              onTratamientoEstadoChanged?.(mensaje);
              break;
            case 'control_academico_aprobado':
              onControlAcademicoAprobado?.(mensaje);
              break;
            case 'pago_procesado':
              onPagoProcessado?.(mensaje);
              break;
            case 'despacho_almacen':
              onDespachoAlmacen?.(mensaje);
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Error parseando mensaje:', error);
        }
      };

      wsRef.current.onerror = () => {
        onError?.('Error en la conexión WebSocket');
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);

        if (reconnectCountRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          setIsReconnecting(true);
          reconnectCountRef.current++;

          setTimeout(() => {
            conectar();
          }, delay);
        }
      };
    } catch (error) {
      onError?.('Error inicializando WebSocket');
    }
  }, [getWebSocketUrl, onTratamientoEstadoChanged, onControlAcademicoAprobado, onPagoProcessado, onDespachoAlmacen, onError]);

  const desconectar = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
      tratamientosSubscritosRef.current.clear();
    }
  }, []);

  const suscribir = useCallback((tratamientoIds: string[]) => {
    tratamientoIds.forEach((id) => tratamientosSubscritosRef.current.add(id));
    tratamientoIds.forEach((id) => pendingSubscriptionsRef.current.add(id));

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const mensaje = {
      action: 'subscribe',
      tratamiento_ids: tratamientoIds
    };

    wsRef.current.send(JSON.stringify(mensaje));
    tratamientoIds.forEach((id) => pendingSubscriptionsRef.current.delete(id));
  }, []);

  const desuscribir = useCallback((tratamientoIds: string[]) => {
    tratamientoIds.forEach((id) => tratamientosSubscritosRef.current.delete(id));
    tratamientoIds.forEach((id) => pendingSubscriptionsRef.current.delete(id));

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const mensaje = {
      action: 'unsubscribe',
      tratamiento_ids: tratamientoIds
    };

    wsRef.current.send(JSON.stringify(mensaje));
  }, []);

  useEffect(() => {
    if (autoConnect) {
      conectar();
    }

    return () => {
      desconectar();
    };
  }, [autoConnect, conectar, desconectar]);

  return {
    isConnected,
    isReconnecting,
    conectar,
    desconectar,
    suscribir,
    desuscribir,
    tratamientosSuscriptos: Array.from(tratamientosSubscritosRef.current)
  };
}
