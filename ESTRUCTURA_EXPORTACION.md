# 📁 Estructura de Archivos - Exportación

```
frontend/
├── lib/
│   └── exporters/
│       ├── pdf-exporter.ts ........................ Core PDF
│       └── excel-exporter.ts ..................... Core Excel
│
├── components/
│   ├── export-buttons-v2.tsx ..................... Botones mejorados
│   ├── tabla-pacientes.tsx ....................... ACTUALIZADO: Botón descarga
│   └── exporters/
│       ├── pacientes-export.tsx .................. Exportador Pacientes
│       ├── asignaciones-export.tsx .............. Exportador Asignaciones
│       ├── citas-export.tsx ..................... Exportador Citas
│       ├── tratamientos-export.tsx ............. Exportador Tratamientos
│       └── usuarios-export.tsx ................. Exportador Usuarios
│
└── app/
    ├── pacientes/
    │   └── page.tsx ............................. ACTUALIZADO: Botón exportar
    └── asignacion/
        └── page.tsx ............................ ACTUALIZADO: Botón exportar
```

## 📋 Funciones Exportadoras

### PDF Exporter (`lib/exporters/pdf-exporter.ts`)

```typescript
// Funciones genéricas
export const exportPDF(options: PDFOptions)
export const addHeader(pdf: jsPDF, title, subtitle?, color?)
export const addFooter(pdf: jsPDF, pageNumber, totalPages)

// Funciones específicas por módulo
export const exportPacientesPDF(pacientes)
export const exportCarpetaMedicaPDF(paciente)
export const exportAsignacionesPDF(asignaciones)
export const exportCitasPDF(citas)
export const exportTratamientosPDF(tratamientos)
export const exportUsuariosPDF(usuarios)
```

### Excel Exporter (`lib/exporters/excel-exporter.ts`)

```typescript
// Función genérica
export const exportExcel(options: ExcelOptions)

// Funciones específicas por módulo
export const exportPacientesExcel(pacientes)
export const exportCarpetaMedicaExcel(paciente)
export const exportAsignacionesExcel(asignaciones)
export const exportCitasExcel(citas)
export const exportTratamientosExcel(tratamientos)
export const exportUsuariosExcel(usuarios)
```

## 🎨 Colores por Módulo

```typescript
const COLORS = {
  pacientes: [41, 128, 185],       // Azul
  asignaciones: [52, 152, 219],    // Azul Claro
  citas: [46, 204, 113],           // Verde
  tratamientos: [155, 89, 182],    // Púrpura
  usuarios: [241, 196, 15]         // Naranja
}
```

## 🔗 Flujos de Integración

### Flujo 1: Exportación desde Página Principal

```
PacientesPage.tsx
  ├─ Importa PacientesExport
  ├─ Pasa datos: <PacientesExport pacientes={pacientes} />
  └─ PacientesExport.tsx
      ├─ Botón dropdown en header
      ├─ Opciones: Listado PDF/Excel
      ├─ Opciones: Carpeta Médica PDF/Excel (si seleccionó paciente)
      └─ Llama a exportadores
```

### Flujo 2: Exportación Individual desde Tabla

```
TablaPacientes.tsx
  ├─ En cada fila agrega botón 📥
  ├─ onClick → handleExportPaciente(paciente)
  ├─ Llama a exportCarpetaMedicaPDF(paciente)
  └─ Se descarga PDF de ese paciente
```

### Flujo 3: Exportación en Asignaciones

```
AsignacionesPage.tsx
  ├─ Estado: asignaciones = []
  ├─ TablaAsignacion llama onDataChange(data)
  ├─ Actualiza AsignacionesExport con datos
  └─ Usuario hace clic en Exportar
```

## 📦 Dependencias

```json
{
  "jspdf": "Genera PDFs desde JavaScript",
  "jspdf-autotable": "Plugin para tablas en PDF",
  "xlsx": "Genera archivos Excel",
  "sonner": "Notificaciones (toast)"
}
```

## 🎯 Campos Exportados por Módulo

### Pacientes PDF
- ci, nombres, apellido_paterno, apellido_materno
- sexo, edad, celular, telefono
- direccion, ocupacion
- **Antecedentes:** familiares, personales, no_patologicos, ginecologicos
- contacto_emergencia, telefono_emergencia

### Pacientes Excel
- Todos los anteriores + fecha_nacimiento

### Asignaciones
- paciente_nombre, paciente_ci
- estudiante_nombre, docente_nombre
- estado, fecha_asignacion, observaciones

### Citas
- paciente_nombre, fecha, hora, sillon
- estudiante_nombre, docente_nombre
- estado, motivo

### Tratamientos
- paciente_nombre, tipo, descripcion, estado
- fecha_inicio, fecha_fin, costo, notas

### Usuarios
- id, nombre_completo, email, username
- rol, is_active, date_joined

## 🚀 Cómo Agregar Exportación a un Nuevo Módulo

1. **Crear componente exportador:**
   ```
   components/exporters/nuevo-modulo-export.tsx
   ```

2. **Agregar funciones en exportadores:**
   ```
   lib/exporters/pdf-exporter.ts → exportNuevoModuloPDF()
   lib/exporters/excel-exporter.ts → exportNuevoModuloExcel()
   ```

3. **Importar en la página:**
   ```tsx
   import { NuevoModuloExport } from '@/components/exporters/nuevo-modulo-export'
   ```

4. **Agregar en JSX:**
   ```tsx
   <NuevoModuloExport datos={datos} />
   ```

## ✅ Checklist de Implementación

- [x] Instalación de dependencias
- [x] Creación de PDF exporter
- [x] Creación de Excel exporter
- [x] Botones de exportación
- [x] Integración Pacientes
- [x] Integración Asignaciones
- [x] Integración Citas (componente listo)
- [x] Integración Tratamientos (componente listo)
- [x] Integración Usuarios (componente listo)
- [x] Documentación completa
- [x] Guía de inicio rápido
- [ ] Agregar en módulo de Reportes
- [ ] Agregar gráficos en PDFs
- [ ] Plantillas personalizables

---

**Actualizado:** 29 de abril de 2026
