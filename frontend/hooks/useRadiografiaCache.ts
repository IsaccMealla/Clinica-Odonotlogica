import { useEffect, useRef, useCallback, useState } from 'react';
import { radiografiaAPI } from '@/lib/radiografia-api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface UseRadiografiaCacheOptions {
  cacheDuration?: number; // ms
  maxPollingDuration?: number; // ms máximo de polling
  pollingInterval?: number; // ms entre intentos
}

const DEFAULT_CACHE_DURATION = 60000; // 1 minuto
const DEFAULT_MAX_POLLING_DURATION = 30000; // 30 segundos
const DEFAULT_POLLING_INTERVAL = 2000; // 2 segundos

/**
 * Hook para cachear y optimizar peticiones de estado de radiografías
 * Reduce drasticamente el número de peticiones innecesarias
 */
export function useRadiografiaCache(options: UseRadiografiaCacheOptions = {}) {
  const {
    cacheDuration = DEFAULT_CACHE_DURATION,
    maxPollingDuration = DEFAULT_MAX_POLLING_DURATION,
    pollingInterval = DEFAULT_POLLING_INTERVAL
  } = options;

  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const pollIntervalRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pollStartTimeRef = useRef<Map<string, number>>(new Map());

  // ========================
  // CACHE MANAGEMENT
  // ========================
  
  const getCached = useCallback((key: string) => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > cacheDuration) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data;
  }, [cacheDuration]);

  const setCached = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const invalidateCache = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // ========================
  // SMART POLLING
  // ========================

  const stopPolling = useCallback((key: string) => {
    const timeout = pollIntervalRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      pollIntervalRef.current.delete(key);
    }
    pollStartTimeRef.current.delete(key);
  }, []);

  const startSmartPolling = useCallback(
    async (
      key: string,
      fetchFn: () => Promise<any>,
      onUpdate: (data: any) => void,
      shouldContinuePolling: (data: any) => boolean
    ) => {
      // Si ya hay polling activo, no iniciar otro
      if (pollIntervalRef.current.has(key)) {
        return;
      }

      const startTime = Date.now();
      pollStartTimeRef.current.set(key, startTime);

      const poll = async () => {
        try {
          // Verificar si hemos excedido el tiempo máximo de polling
          const elapsed = Date.now() - startTime;
          if (elapsed > maxPollingDuration) {
            stopPolling(key);
            return;
          }

          const data = await fetchFn();
          setCached(key, data);
          onUpdate(data);

          // Decidir si continuar polling
          if (shouldContinuePolling(data)) {
            const timeout = setTimeout(poll, pollingInterval);
            pollIntervalRef.current.set(key, timeout);
          } else {
            stopPolling(key);
          }
        } catch (error) {
          console.error(`Error en polling para ${key}:`, error);
          // Reintentar después del intervalo
          const timeout = setTimeout(poll, pollingInterval);
          pollIntervalRef.current.set(key, timeout);
        }
      };

      // Primera ejecución inmediata
      await poll();
    },
    [maxPollingDuration, pollingInterval, setCached, stopPolling]
  );

  // ========================
  // RADIOGRAFÍA-SPECIFIC METHODS
  // ========================

  const obtenerEstadoOptimizado = useCallback(
    async (radiografiaId: string, useCache = true) => {
      const cacheKey = `radiografia-estado-${radiografiaId}`;

      // Intentar usar caché
      if (useCache) {
        const cached = getCached(cacheKey);
        if (cached) {
          console.debug(`[CACHE HIT] ${cacheKey}`);
          return cached;
        }
      }

      console.debug(`[API CALL] Obteniendo estado de ${radiografiaId}`);
      const data = await radiografiaAPI.obtenerEstado(radiografiaId);
      setCached(cacheKey, data);
      return data;
    },
    [getCached, setCached]
  );

  /**
   * Polling inteligente que solo continúa mientras el estado sea "Procesando"
   */
  const iniciarPollingInteligente = useCallback(
    (radiografiaId: string, onUpdate: (data: any) => void) => {
      const cacheKey = `radiografia-estado-${radiografiaId}`;

      startSmartPolling(
        cacheKey,
        () => radiografiaAPI.obtenerEstado(radiografiaId),
        onUpdate,
        (data) => data.estado === 'Procesando' // Solo continuar si está procesando
      );
    },
    [startSmartPolling]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      pollIntervalRef.current.forEach(timeout => clearTimeout(timeout));
      pollIntervalRef.current.clear();
    };
  }, []);

  return {
    // Cache operations
    getCached,
    setCached,
    invalidateCache,
    clearAllCache,

    // Polling operations
    stopPolling,
    startSmartPolling,

    // Radiografía specific
    obtenerEstadoOptimizado,
    iniciarPollingInteligente
  };
}

/**
 * Hook para usar la caché de radiografías de forma simple
 */
export function useRadiografiaOptimizada(radiografiaId: string) {
  const cache = useRadiografiaCache();
  const [estado, setEstado] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await cache.obtenerEstadoOptimizado(radiografiaId);
        setEstado(data);

        // Si está procesando, iniciar polling
        if (data.estado === 'Procesando') {
          cache.iniciarPollingInteligente(radiografiaId, setEstado);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setCargando(false);
      }
    };

    cargar();

    return () => {
      cache.stopPolling(`radiografia-estado-${radiografiaId}`);
    };
  }, [radiografiaId]);

  return {
    estado,
    cargando,
    error,
    recargar: async () => {
      cache.invalidateCache(`radiografia-estado-${radiografiaId}`);
      return await cache.obtenerEstadoOptimizado(radiografiaId, false);
    }
  };
}
