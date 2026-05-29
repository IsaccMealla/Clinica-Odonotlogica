import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ExportButtonsProps {
  data: any[];
  onExportPDF: () => void;
  onExportExcel: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  onExportPDF,
  onExportExcel,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
}) => {
  const isDisabled = disabled || loading || data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {loading ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onExportPDF} disabled={isDisabled}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Exportar a PDF</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportExcel} disabled={isDisabled}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Exportar a Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Variante compacta para sidebars
export const ExportButtonsCompact: React.FC<ExportButtonsProps> = ({
  data,
  onExportPDF,
  onExportExcel,
  loading = false,
  disabled = false,
}) => {
  const isDisabled = disabled || loading || data.length === 0;

  return (
    <div className="flex gap-2">
      <Button
        onClick={onExportPDF}
        disabled={isDisabled}
        variant="outline"
        size="sm"
        title="Descargar PDF"
        className="h-8 px-2"
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button
        onClick={onExportExcel}
        disabled={isDisabled}
        variant="outline"
        size="sm"
        title="Descargar Excel"
        className="h-8 px-2"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
