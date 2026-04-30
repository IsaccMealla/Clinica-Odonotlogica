"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type DienteData = {
  movilidad: string;
  implante: boolean;
  sangrado: [boolean, boolean, boolean];
  supuracion: [boolean, boolean, boolean];
  margen: [number, number, number];
  sondaje: [number, number, number];
};

interface PeriodontogramaData {
  datos_vestibular_superior: Record<number, DienteData>;
  datos_palatino_superior: Record<number, DienteData>;
  datos_vestibular_inferior: Record<number, DienteData>;
  datos_lingual_inferior: Record<number, DienteData>;
  diagnostico?: string;
  pronostico?: string;
}

interface PeriodontogramaContextType {
  datos: PeriodontogramaData;
  setDatos: (data: PeriodontogramaData) => void;
  cargarPeriodontograma: (pacienteId: string) => Promise<void>;
  guardarPeriodontograma: (pacienteId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  periodontogramaId: string | null;
  // Nuevo: exposer datos para guardarlos externamente
  obtenerDatos: () => PeriodontogramaData;
}

const PeriodontogramaContext = createContext<PeriodontogramaContextType | undefined>(undefined);

// Función para inicializar datos vacíos con estructura correcta
const generarDatosIniciales = (dientes: number[]): Record<number, DienteData> => {
  const datos: Record<number, DienteData> = {};
  dientes.forEach(num => {
    datos[num] = {
      movilidad: "",
      implante: false,
      sangrado: [false, false, false],
      supuracion: [false, false, false],
      margen: [0, 0, 0],
      sondaje: [0, 0, 0],
    };
  });
  return datos;
};

const dientesSuperiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const dientesInferiores = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function PeriodontogramaProvider({ children, pacienteId }: { children: React.ReactNode; pacienteId?: string }) {
  const [datos, setDatos] = useState<PeriodontogramaData>({
    datos_vestibular_superior: generarDatosIniciales(dientesSuperiores),
    datos_palatino_superior: generarDatosIniciales(dientesSuperiores),
    datos_vestibular_inferior: generarDatosIniciales(dientesInferiores),
    datos_lingual_inferior: generarDatosIniciales(dientesInferiores),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodontogramaId, setPeriodontogramaId] = useState<string | null>(null);

  // Cargar periodontograma cuando se proporcione pacienteId
  useEffect(() => {
    if (pacienteId) {
      cargarPeriodontograma(pacienteId);
    }
  }, [pacienteId]);

  const cargarPeriodontograma = async (pId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/periodontogramas/?paciente=${pId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        // Obtener el periodontograma más reciente
        if (result.results && result.results.length > 0) {
          const periodonto = result.results[0];
          setPeriodontogramaId(periodonto.id);
          setDatos({
            datos_vestibular_superior: periodonto.datos_vestibular_superior && Object.keys(periodonto.datos_vestibular_superior).length > 0 
              ? periodonto.datos_vestibular_superior 
              : generarDatosIniciales(dientesSuperiores),
            datos_palatino_superior: periodonto.datos_palatino_superior && Object.keys(periodonto.datos_palatino_superior).length > 0
              ? periodonto.datos_palatino_superior
              : generarDatosIniciales(dientesSuperiores),
            datos_vestibular_inferior: periodonto.datos_vestibular_inferior && Object.keys(periodonto.datos_vestibular_inferior).length > 0
              ? periodonto.datos_vestibular_inferior
              : generarDatosIniciales(dientesInferiores),
            datos_lingual_inferior: periodonto.datos_lingual_inferior && Object.keys(periodonto.datos_lingual_inferior).length > 0
              ? periodonto.datos_lingual_inferior
              : generarDatosIniciales(dientesInferiores),
            diagnostico: periodonto.diagnostico || "",
            pronostico: periodonto.pronostico || "",
          });
        } else {
          // Si no hay periodontograma guardado, inicializar con estructura vacía
          setDatos({
            datos_vestibular_superior: generarDatosIniciales(dientesSuperiores),
            datos_palatino_superior: generarDatosIniciales(dientesSuperiores),
            datos_vestibular_inferior: generarDatosIniciales(dientesInferiores),
            datos_lingual_inferior: generarDatosIniciales(dientesInferiores),
          });
        }
      }
    } catch (err) {
      console.error("Error cargando periodontograma:", err);
      setError("Error al cargar el periodontograma");
      // Inicializar con estructura vacía en caso de error
      setDatos({
        datos_vestibular_superior: generarDatosIniciales(dientesSuperiores),
        datos_palatino_superior: generarDatosIniciales(dientesSuperiores),
        datos_vestibular_inferior: generarDatosIniciales(dientesInferiores),
        datos_lingual_inferior: generarDatosIniciales(dientesInferiores),
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarPeriodontograma = async (pId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      // No incluir 'estudiante' porque lo asigna el backend automáticamente
      const payload = {
        paciente: pId,
        datos_vestibular_superior: datos.datos_vestibular_superior,
        datos_palatino_superior: datos.datos_palatino_superior,
        datos_vestibular_inferior: datos.datos_vestibular_inferior,
        datos_lingual_inferior: datos.datos_lingual_inferior,
        diagnostico: datos.diagnostico || "",
        pronostico: datos.pronostico || "",
      };

      const url = periodontogramaId
        ? `http://localhost:8000/api/periodontogramas/${periodontogramaId}/`
        : `http://localhost:8000/api/periodontogramas/`;

      const method = periodontogramaId ? "PUT" : "POST";

      console.log(`[Periodontograma] ${method} a ${url}`);
      console.log("[Periodontograma] Payload:", payload);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`[Periodontograma] Response status: ${res.status}`);

      if (res.ok) {
        const result = await res.json();
        console.log("[Periodontograma] ✅ Guardado exitosamente:", result);
        setPeriodontogramaId(result.id);
        return true;
      } else {
        // Intentar parsear como JSON, si falla es probablemente HTML de error
        let errorData: any;
        const contentType = res.headers.get('content-type');
        
        try {
          errorData = contentType?.includes('application/json') 
            ? await res.json() 
            : { error: "Error del servidor", status: res.status };
        } catch {
          const textError = await res.text();
          console.error("Error response (HTML):", textError.substring(0, 500));
          errorData = { error: `Error ${res.status} del servidor`, details: textError.substring(0, 200) };
        }
        
        console.error("Error guardando periodontograma:", errorData);
        setError(`Error al guardar: ${errorData.error || 'Error desconocido'}`);
        return false;
      }
    } catch (err) {
      console.error("Error guardando periodontograma:", err);
      setError("Error de conexión");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const obtenerDatos = () => datos;

  return (
    <PeriodontogramaContext.Provider
      value={{
        datos,
        setDatos,
        cargarPeriodontograma,
        guardarPeriodontograma,
        loading,
        error,
        periodontogramaId,
        obtenerDatos,
      }}
    >
      {children}
    </PeriodontogramaContext.Provider>
  );
}

export function usePeriodontograma() {
  const context = useContext(PeriodontogramaContext);
  if (!context) {
    throw new Error("usePeriodontograma debe ser usado dentro de PeriodontogramaProvider");
  }
  return context;
}
