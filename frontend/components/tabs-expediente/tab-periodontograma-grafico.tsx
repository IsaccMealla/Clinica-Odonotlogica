"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { SuperiorPalatino } from "./periodontograma/SuperiorPalatino";
import { SuperiorVestibular } from "./periodontograma/SuperiorVestibular";
import { InferiorVestibular } from "./periodontograma/InferiorVestibular";
import { InferiorPalatino } from "./periodontograma/InferiorPalatino";
import { usePeriodontograma } from "@/context/PeriodontogramaContext";

interface TabPeriodontogramaGraficoProps {
  pacienteId: string;
  ref?: React.Ref<any>;
}

const TabPeriodontogramaGraficoComponent = forwardRef<any, TabPeriodontogramaGraficoProps>(
  ({ pacienteId }, ref) => {
    const { guardarPeriodontograma, loading } = usePeriodontograma();
    const [guardando, setGuardando] = useState(false);

    // Exposer método para guardar desde el padre
    useImperativeHandle(ref, () => ({
      guardar: async () => {
        return await handleGuardar();
      },
    }));

    const handleGuardar = async () => {
      setGuardando(true);
      try {
        const resultado = await guardarPeriodontograma(pacienteId);
        if (resultado) {
          toast.success("Periodontograma guardado");
          return true;
        } else {
          toast.error("Error al guardar el periodontograma");
          return false;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error de servidor");
        return false;
      } finally {
        setGuardando(false);
      }
    };

    return (
      <div className="flex flex-col gap-8 w-full p-4">
        {/* BOTÓN DE GUARDADO INDIVIDUAL (OPCIONAL) */}
        <div className="flex justify-end">
          <Button
            onClick={handleGuardar}
            disabled={guardando || loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Save className="mr-2 h-3 w-3" />
            {guardando ? "Guardando..." : "Guardar Solo Periodontograma"}
          </Button>
        </div>

        {/* 1. Arcada Superior - Vestibular */}
        <SuperiorVestibular />

        {/* 2. Arcada Superior - Palatino */}
        <SuperiorPalatino />
        {/* 3. Arcada Inferior - Vestibular */}
        <InferiorVestibular />
        {/* 4. Arcada Inferior - Lingual/Palatino */}
        {<InferiorPalatino/>}
      </div>
    );
  }
);

TabPeriodontogramaGraficoComponent.displayName = "TabPeriodontogramaGrafico";

export const TabPeriodontogramaGrafico = TabPeriodontogramaGraficoComponent;