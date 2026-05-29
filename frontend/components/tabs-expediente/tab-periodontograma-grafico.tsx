"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, FileText, Sheet } from "lucide-react";
import { toast } from "sonner";
import { SuperiorPalatino } from "./periodontograma/SuperiorPalatino";
import { SuperiorVestibular } from "./periodontograma/SuperiorVestibular";
import { InferiorVestibular } from "./periodontograma/InferiorVestibular";
import { InferiorPalatino } from "./periodontograma/InferiorPalatino";
import { usePeriodontograma } from "@/context/PeriodontogramaContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { exportSubmoduloPeriodontogramaPDF } from "@/lib/exporters/pdf-exporter";
import { exportSubmoduloPeriodontogramaExcel } from "@/lib/exporters/excel-exporter";

interface TabPeriodontogramaGraficoProps {
  pacienteId: string;
  paciente?: any;
  ref?: React.Ref<any>;
}

const TabPeriodontogramaGraficoComponent = forwardRef<any, TabPeriodontogramaGraficoProps>(
  ({ pacienteId, paciente }, ref) => {
    const { guardarPeriodontograma, loading, datos } = usePeriodontograma();
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
        {/* BOTONES DE ACCIÓN */}
        <div className="flex justify-end gap-3">
          {paciente && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-2 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exportar Periodontograma</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl border-emerald-500/20 bg-slate-50 dark:bg-zinc-950 p-1.5 shadow-xl">
                <DropdownMenuLabel className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1.5">
                  Formatos de Exportación
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => exportSubmoduloPeriodontogramaPDF(paciente, datos)}
                  className="rounded-xl cursor-pointer hover:bg-emerald-500/10"
                >
                  <FileText className="mr-2 h-4 w-4 text-red-500" />
                  <span>Descargar PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportSubmoduloPeriodontogramaExcel(paciente, datos)}
                  className="rounded-xl cursor-pointer hover:bg-emerald-500/10"
                >
                  <Sheet className="mr-2 h-4 w-4 text-green-500" />
                  <span>Descargar Excel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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