# 💻 Ejemplos de Código - Exportación

## Ejemplo 1: Usar PacientesExport

```tsx
// app/pacientes/page.tsx
"use client"

import { PacientesExport } from "@/components/exporters/pacientes-export"
import { useState, useEffect } from "react"

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([])

  useEffect(() => {
    // Cargar pacientes del API
    fetchPacientes()
  }, [])

  return (
    <div>
      {/* Encabezado con botón de exportación */}
      <div className="flex justify-between items-center">
        <h1>Pacientes</h1>
        <PacientesExport pacientes={pacientes} />
      </div>

      {/* Tabla */}
      <TablaPacientes pacientes={pacientes} />
    </div>
  )
}
```

---

## Ejemplo 2: Exportación Individual en Tabla

```tsx
// components/tabla-pacientes.tsx
import { exportCarpetaMedicaPDF } from "@/lib/exporters/pdf-exporter"
import { toast } from "sonner"

export function TablaPacientes({ pacientes }) {
  const handleExportPaciente = (paciente) => {
    try {
      exportCarpetaMedicaPDF(paciente)
      toast.success(`Carpeta de ${paciente.nombres} exportada`)
    } catch (error) {
      toast.error("Error al exportar")
    }
  }

  return (
    <Table>
      <TableBody>
        {pacientes.map(paciente => (
          <TableRow key={paciente.id}>
            <TableCell>{paciente.nombres}</TableCell>
            <TableCell>{paciente.ci}</TableCell>
            <TableCell>
              <Button
                onClick={() => handleExportPaciente(paciente)}
                variant="ghost"
                size="icon"
              >
                📥
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Ejemplo 3: Crear Nuevo Exportador

```tsx
// lib/exporters/pdf-exporter.ts

// Agregar esta función al final del archivo
export const exportReportesPDF = (reportes: any[]) => {
  exportPDF({
    title: 'Listado de Reportes',
    subtitle: `Total: ${reportes.length} reportes`,
    filename: `reportes_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Título', dataKey: 'titulo' },
      { header: 'Fecha', dataKey: 'fecha' },
      { header: 'Tipo', dataKey: 'tipo' },
      { header: 'Estado', dataKey: 'estado' },
    ],
    data: reportes,
    headerColor: [230, 126, 34], // Naranja personalizado
  });
};
```

```tsx
// lib/exporters/excel-exporter.ts

export const exportReportesExcel = (reportes: any[]) => {
  exportExcel({
    filename: `reportes_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Reportes',
        columns: [
          { header: 'ID', dataKey: 'id' },
          { header: 'Título', dataKey: 'titulo' },
          { header: 'Fecha', dataKey: 'fecha' },
          { header: 'Tipo', dataKey: 'tipo' },
          { header: 'Generado Por', dataKey: 'usuario' },
          { header: 'Estado', dataKey: 'estado' },
        ],
        data: reportes,
      },
    ],
    headerColor: 'FFE67E22', // Naranja
  });
};
```

---

## Ejemplo 4: Componente Exportador Personalizado

```tsx
// components/exporters/reportes-export.tsx
"use client";

import { useState } from "react";
import { exportReportesPDF } from "@/lib/exporters/pdf-exporter";
import { exportReportesExcel } from "@/lib/exporters/excel-exporter";
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

interface ReportesExportProps {
  reportes: any[];
}

export function ReportesExport({ reportes }: ReportesExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (
    exportFn: (data: any) => void,
    type: string
  ) => {
    setExporting(true);
    try {
      exportFn(reportes);
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
          disabled={exporting || reportes.length === 0}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exportar ({reportes.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold">
          Exportar Reportes
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport(exportReportesPDF, "PDF")}
          disabled={exporting}
        >
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          <span>Listado Reportes (PDF)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport(exportReportesExcel, "Excel")}
          disabled={exporting}
        >
          <Sheet className="mr-2 h-4 w-4 text-green-500" />
          <span>Listado Reportes (Excel)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Ejemplo 5: Integrar en Página de Reportes

```tsx
// app/reportes/page.tsx
"use client"

import { useState, useEffect } from "react"
import { ReportesExport } from "@/components/exporters/reportes-export"

export default function ReportesPage() {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchReportes()
  }, [])

  const fetchReportes = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch("http://localhost:8000/api/reportes/", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setReportes(data.results || data)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <ReportesExport reportes={reportes} />
      </div>

      {cargando ? (
        <div>Cargando...</div>
      ) : (
        <TablaReportes reportes={reportes} />
      )}
    </div>
  )
}
```

---

## Ejemplo 6: Exportación con Filtros

```tsx
// Exportar solo ciertos datos
import { exportPacientesPDF } from "@/lib/exporters/pdf-exporter"

export function ExportarPacientesActivos() {
  const pacientes = [...] // todos los pacientes
  
  // Filtrar solo activos
  const pacientesActivos = pacientes.filter(p => p.estado === 'activo')
  
  // Exportar filtrados
  const handleExport = () => {
    exportPacientesPDF(pacientesActivos)
  }

  return (
    <Button onClick={handleExport}>
      Exportar Pacientes Activos
    </Button>
  )
}
```

---

## Ejemplo 7: Exportación Personalizada (Campos Específicos)

```tsx
// Crear función personalizada si necesitas campos diferentes
import { exportPDF } from "@/lib/exporters/pdf-exporter"

export const exportPacientesConDiagnostico = (pacientes: any[]) => {
  // Mapear datos a campos específicos
  const datosPersonalizados = pacientes.map(p => ({
    nombres: p.nombres,
    ci: p.ci,
    edad: p.edad,
    diagnostico: p.diagnostico || 'Pendiente',
    fecha_control: p.ultima_cita,
  }))

  exportPDF({
    title: 'Pacientes con Diagnóstico',
    filename: `pacientes_diagnostico_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'nombres' },
      { header: 'CI', dataKey: 'ci' },
      { header: 'Edad', dataKey: 'edad' },
      { header: 'Diagnóstico', dataKey: 'diagnostico' },
      { header: 'Fecha Control', dataKey: 'fecha_control' },
    ],
    data: datosPersonalizados,
    headerColor: [52, 152, 219],
  });
};
```

---

## Ejemplo 8: Exportación Programada

```tsx
// Hook para exportación automática
import { useEffect } from "react"

export function useAutoExport(data: any[], exportFn: Function, interval: number = 3600000) {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log("Exportación automática...")
      exportFn(data)
    }, interval) // Por defecto cada hora

    return () => clearInterval(timer)
  }, [data, exportFn, interval])
}

// Uso:
function MiComponente() {
  const [pacientes, setPacientes] = useState([])

  // Exportar cada 24 horas
  useAutoExport(
    pacientes,
    exportPacientesPDF,
    24 * 60 * 60 * 1000 // 24 horas en ms
  )

  return <div>Exportación automática cada 24 horas</div>
}
```

---

## Ejemplo 9: Manejo de Errores

```tsx
// Exportación con validación
const safeExport = async (exportFn: Function, datos: any[], nombreArchivo: string) => {
  // Validar datos
  if (!datos || datos.length === 0) {
    toast.error("No hay datos para exportar")
    return
  }

  // Validar que los datos tengan las propiedades necesarias
  const primeraFila = datos[0]
  if (!primeraFila) {
    toast.error("Datos inválidos")
    return
  }

  try {
    exportFn(datos)
    toast.success(`${nombreArchivo} descargado exitosamente`)
  } catch (error) {
    console.error("Error en exportación:", error)
    toast.error("Error al descargar. Intenta de nuevo.")
  }
}

// Uso:
const handleExport = () => {
  safeExport(exportPacientesPDF, pacientes, "Pacientes")
}
```

---

**¡Listo para copiar y pegar!** 🚀
