"use client";

import { useState } from "react";
import { exportPacientesPDF, exportCarpetaMedicaPDF } from "@/lib/exporters/pdf-exporter";
import { exportPacientesExcel, exportCarpetaMedicaExcel } from "@/lib/exporters/excel-exporter";
import { Button } from "@/components/ui/button";
import { FileText, Sheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PacientesExportProps {
  pacientes: any[];
  pacienteSeleccionado?: any;
}

export function PacientesExport({ pacientes, pacienteSeleccionado }: PacientesExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (
    exportFn: (data: any) => void,
    type: string
  ) => {
    setExporting(true);
    try {
      exportFn(pacienteSeleccionado || pacientes);
      toast.success(`Exportado a ${type}`);
    } catch (error) {
      console.error(error);
      toast.error(`Error al exportar`);
    } finally {
      setExporting(false);
    }
  };

  const dataCount = pacienteSeleccionado ? 1 : pacientes.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting || dataCount === 0}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar {dataCount > 0 ? `(${dataCount})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold">
          {pacienteSeleccionado ? "Opciones del Paciente" : "Listado Completo"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {pacienteSeleccionado ? (
          <>
            <DropdownMenuItem
              onClick={() => handleExport(exportCarpetaMedicaPDF, "PDF")}
              disabled={exporting}
            >
              <FileText className="mr-2 h-4 w-4 text-red-500" />
              <span>Carpeta Médica (PDF)</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport(exportCarpetaMedicaExcel, "Excel")}
              disabled={exporting}
            >
              <Sheet className="mr-2 h-4 w-4 text-green-500" />
              <span>Carpeta Médica (Excel)</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => handleExport(exportPacientesPDF, "PDF")}
              disabled={exporting}
            >
              <FileText className="mr-2 h-4 w-4 text-red-500" />
              <span>Listado Pacientes (PDF)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleExport(exportPacientesExcel, "Excel")}
              disabled={exporting}
            >
              <Sheet className="mr-2 h-4 w-4 text-green-500" />
              <span>Listado Pacientes (Excel)</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
