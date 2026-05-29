"use client";

import { useState } from "react";
import { exportUsuariosPDF } from "@/lib/exporters/pdf-exporter";
import { exportUsuariosExcel } from "@/lib/exporters/excel-exporter";
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

interface UsuariosExportProps {
  usuarios: any[];
}

export function UsuariosExport({ usuarios }: UsuariosExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (
    exportFn: (data: any) => void,
    type: string
  ) => {
    setExporting(true);
    try {
      exportFn(usuarios);
      toast.success(`Exportado a ${type}`);
    } catch (error) {
      console.error(error);
      toast.error(`Error al exportar`);
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
          disabled={exporting || usuarios.length === 0}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar ({usuarios.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold">
          Exportar Usuarios
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport(exportUsuariosPDF, "PDF")}
          disabled={exporting}
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <span>Listado Usuarios (PDF)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(exportUsuariosExcel, "Excel")}
          disabled={exporting}
        >
          <Sheet className="mr-2 h-4 w-4 text-green-500" />
          <span>Listado Usuarios (Excel)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
