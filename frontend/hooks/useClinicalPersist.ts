"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useClinicalPersist - Hook de persistencia clínica anti-pérdida de datos.
 * 
 * Guarda automáticamente el estado en localStorage indexado por pacienteId,
 * restaura al montar, y limpia únicamente tras guardado exitoso en backend.
 * 
 * @param key - Identificador de la sección (ej: 'formData', 'odontograma', 'periodontograma')
 * @param pacienteId - ID del paciente activo
 * @param initialState - Estado inicial si no hay backup
 */
export function useClinicalPersist<T>(
  key: string,
  pacienteId: string | null,
  initialState: T
): {
  data: T;
  setData: (updater: T | ((prev: T) => T)) => void;
  clearBackup: () => void;
  hasBackup: boolean;
  lastSaved: Date | null;
} {
  const storageKey = pacienteId ? `hc_backup_${pacienteId}_${key}` : null;
  const isInitialMount = useRef(true);

  // Función para leer del localStorage de forma segura
  const readFromStorage = useCallback((): T | null => {
    if (!storageKey) return null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data as T;
      }
    } catch (e) {
      console.warn(`[useClinicalPersist] Error leyendo backup de ${storageKey}:`, e);
    }
    return null;
  }, [storageKey]);

  // Función para leer la fecha del último guardado
  const readTimestamp = useCallback((): Date | null => {
    if (!storageKey) return null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.timestamp ? new Date(parsed.timestamp) : null;
      }
    } catch {
      return null;
    }
    return null;
  }, [storageKey]);

  // Inicializar con backup o initialState
  const [data, setDataInternal] = useState<T>(() => {
    const backup = readFromStorage();
    return backup !== null ? backup : initialState;
  });

  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Detectar si hay backup al montar
  useEffect(() => {
    if (storageKey) {
      const backup = readFromStorage();
      setHasBackup(backup !== null);
      setLastSaved(readTimestamp());
      if (backup !== null) {
        setDataInternal(backup);
      }
    }
  }, [storageKey, readFromStorage, readTimestamp]);

  // Persistir cambios en localStorage automáticamente (debounce implícito por useEffect)
  useEffect(() => {
    // Saltar la escritura en el mount inicial para evitar sobreescribir con initialState
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!storageKey) return;

    const timeout = setTimeout(() => {
      try {
        const payload = {
          data,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setHasBackup(true);
        setLastSaved(new Date());
      } catch (e) {
        console.warn(`[useClinicalPersist] Error guardando backup de ${storageKey}:`, e);
      }
    }, 300); // Debounce de 300ms para no saturar localStorage

    return () => clearTimeout(timeout);
  }, [data, storageKey]);

  // Setter compatible con funciones de actualización (como useState)
  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    setDataInternal(prev => {
      if (typeof updater === "function") {
        return (updater as (prev: T) => T)(prev);
      }
      return updater;
    });
  }, []);

  // Limpiar backup (llamar solo después de guardado exitoso en backend)
  const clearBackup = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
        setHasBackup(false);
        setLastSaved(null);
      } catch (e) {
        console.warn(`[useClinicalPersist] Error limpiando backup:`, e);
      }
    }
  }, [storageKey]);

  return { data, setData, clearBackup, hasBackup, lastSaved };
}

/**
 * Limpia TODOS los backups de un paciente específico.
 * Llamar tras guardado definitivo exitoso.
 */
export function clearAllPatientBackups(pacienteId: string): void {
  const prefix = `hc_backup_${pacienteId}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
