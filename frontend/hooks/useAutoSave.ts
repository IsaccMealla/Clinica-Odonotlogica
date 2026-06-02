import { useEffect, useRef, useCallback } from 'react';

export interface AutoSaveConfig {
  key: string; // Clave única para localStorage (ej: hc_backup_${pacienteId}_${estudianteId})
  data: any; // Datos a guardar
  delay?: number; // Delay en ms antes de guardar (default: 500ms)
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook personalizado para auto-save de datos en localStorage
 * 
 * Cada vez que `data` cambia, se guarda automáticamente en localStorage
 * después de un pequeño delay para evitar guardados excesivos.
 * 
 * @param config Configuración del auto-save
 */
export function useAutoSave({
  key,
  data,
  delay = 500,
  onSaveSuccess,
  onSaveError,
}: AutoSaveConfig) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Función para guardar en localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataString = JSON.stringify(data);
      // Solo guardar si los datos han cambiado
      if (dataString !== lastSavedRef.current) {
        localStorage.setItem(key, dataString);
        lastSavedRef.current = dataString;
        onSaveSuccess?.(data);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onSaveError?.(err);
      console.error(`[useAutoSave] Error guardando ${key}:`, err);
    }
  }, [key, data, onSaveSuccess, onSaveError]);

  // Effect: Auto-save con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer nuevo timeout para guardar después del delay
    timeoutRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, delay);

    // Cleanup: limpiar timeout al desmontar o si los datos cambian
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveToLocalStorage]);

  // Función para recuperar datos del backup
  const loadFromLocalStorage = useCallback((): any | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`[useAutoSave] Error cargando ${key}:`, error);
      return null;
    }
  }, [key]);

  // Función para limpiar el backup (llamar después de guardar exitosamente al backend)
  const clearBackup = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedRef.current = '';
    } catch (error) {
      console.error(`[useAutoSave] Error limpiando ${key}:`, error);
    }
  }, [key]);

  // Función para guardar inmediatamente (bypass debounce)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  return {
    loadFromLocalStorage,
    clearBackup,
    saveNow,
  };
}

/**
 * Hook composable para manejar múltiples auto-saves
 * Útil para guardar odontograma, periodontograma y antecedentes simultáneamente
 */
export function useMultiAutoSave(configs: AutoSaveConfig[]) {
  const saves = configs.map((config) => useAutoSave(config));

  return {
    loadAll: () => {
      return configs.reduce((acc, config, i) => {
        acc[config.key] = saves[i].loadFromLocalStorage();
        return acc;
      }, {} as Record<string, any>);
    },
    clearAll: () => {
      saves.forEach((save) => save.clearBackup());
    },
    saveAllNow: () => {
      saves.forEach((save) => save.saveNow());
    },
  };
}
