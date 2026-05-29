"use client";

import { useState } from "react";
import { exportAsistenciaPDF } from "@/lib/exporters/pdf-exporter";
import { exportAsistenciaExcel } from "@/lib/exporters/excel-exporter";
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

interface AsistenciaExportProps {
  registros: any[];
}

export function AsistenciaExport({ registros }: AsistenciaExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (
    exportFn: (data: any) => void,
    type: string
  ) => {
    setExporting(true);
    try {
      exportFn(registros);
      toast.success(`Exportado a ${type}`);
    } catch (error) {
      console.error(error);
      toast.error(`Error al exportar asistencia`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting || registros.length === 0}
          className="gap-2 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Exportar ({registros.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-emerald-500/20 bg-slate-50 dark:bg-zinc-950 p-1.5 shadow-xl">
        <DropdownMenuLabel className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1.5">
          Exportar Asistencia
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport(exportAsistenciaPDF, "PDF")}
          disabled={exporting}
          className="flex gap-2 text-sm font-medium cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1.5"
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <span>Registros en PDF</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(exportAsistenciaExcel, "Excel")}
          disabled={exporting}
          className="flex gap-2 text-sm font-medium cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1.5"
        >
          <Sheet className="mr-2 h-4 w-4 text-green-500" />
          <span>Registros en Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
