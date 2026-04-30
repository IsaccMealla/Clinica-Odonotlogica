# Instalación de Dependencias para Exportación

Ejecuta estos comandos en la carpeta `frontend`:

```bash
npm install jspdf jspdf-autotable xlsx
npm install --save-dev @types/jspdf
```

O con yarn:
```bash
yarn add jspdf jspdf-autotable xlsx
yarn add -D @types/jspdf
```

## Librerías instaladas:

- **jspdf**: Para generar PDFs
- **jspdf-autotable**: Plugin para tablas en PDFs
- **xlsx**: Para generar archivos Excel

## Uso en componentes:

### En el módulo de Pacientes:
```typescript
import { exportPacientesPDF } from '@/lib/exporters/pdf-exporter';
import { exportPacientesExcel } from '@/lib/exporters/excel-exporter';
import { ExportButtons } from '@/components/export-buttons';

// Dentro del componente:
const handleExportPDF = () => {
  exportPacientesPDF(pacientes);
};

const handleExportExcel = () => {
  exportPacientesExcel(pacientes);
};

// En el JSX:
<ExportButtons 
  data={pacientes}
  onExportPDF={handleExportPDF}
  onExportExcel={handleExportExcel}
/>
```

## Nota sobre la estructura de datos:

Las funciones esperan que los datos tengan los siguientes campos:
- **Pacientes**: cedula, nombre_completo, email, numero_telefonico, fecha_nacimiento, sexo, direccion, ocupacion
- **Asignaciones**: id, paciente_nombre, docente_nombre, estudiante_nombre, estado, fecha_asignacion, observaciones
- **Citas**: id, paciente_nombre, fecha, hora, sillon, estudiante_nombre, docente_nombre, estado, motivo
- **Tratamientos**: id, paciente_nombre, tipo, descripcion, estado, fecha_inicio, fecha_fin, costo, notas
