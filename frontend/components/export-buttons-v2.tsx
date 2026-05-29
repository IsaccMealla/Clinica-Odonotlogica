"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Sheet, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportButtonsProps {
  data: any[];
  onExportPDF: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  onExportPDF,
  onExportExcel,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  label = 'Exportar',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const isDisabled = disabled || loading || data.length === 0 || isExporting;

  const handleExport = async (exportFn: () => void | Promise<void>, type: 'PDF' | 'Excel') => {
    setIsExporting(true);
    try {
      await exportFn();
      toast.success(`Exportación a ${type} completada`);
    } catch (error) {
      console.error(`Error exportando a ${type}:`, error);
      toast.error(`Error al exportar a ${type}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className="gap-2 opacity-50"
        title="No hay datos para exportar"
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport(onExportPDF, 'PDF')} 
          disabled={isDisabled}
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <span>Exportar a PDF</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport(onExportExcel, 'Excel')} 
          disabled={isDisabled}
        >
          <Sheet className="mr-2 h-4 w-4 text-green-500" />
          <span>Exportar a Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Versión individual (botones separados)
interface ExportButtonsIndividualProps {
  data: any[];
  onExportPDF: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export const ExportButtonsIndividual: React.FC<ExportButtonsIndividualProps> = ({
  data,
  onExportPDF,
  onExportExcel,
  loading = false,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const isDisabled = disabled || loading || data.length === 0 || isExporting;

  const handleExport = async (exportFn: () => void | Promise<void>, type: 'PDF' | 'Excel') => {
    setIsExporting(true);
    try {
      await exportFn();
      toast.success(`Exportado a ${type}`);
    } catch (error) {
      console.error(`Error:`, error);
      toast.error(`Error al exportar`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport(onExportPDF, 'PDF')}
        disabled={isDisabled}
        variant="outline"
        size="sm"
        title="Descargar PDF"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button
        onClick={() => handleExport(onExportExcel, 'Excel')}
        disabled={isDisabled}
        variant="outline"
        size="sm"
        title="Descargar Excel"
        className="gap-2"
      >
        <Sheet className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
};
