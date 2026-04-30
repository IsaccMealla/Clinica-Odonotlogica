# 📊 Guía Completa de Exportación - Clínica Dental Pro

## ✅ Estado de Implementación

### Archivos Creados ✨

#### 1. **Exportadores Core**
- `frontend/lib/exporters/pdf-exporter.ts` - Exportación profesional a PDF con header/footer
- `frontend/lib/exporters/excel-exporter.ts` - Exportación a Excel con estilos
- `frontend/components/export-buttons-v2.tsx` - Botones de exportación mejorados

#### 2. **Componentes por Módulo**
- `frontend/components/exporters/pacientes-export.tsx` - Exportación de pacientes y carpetas médicas
- `frontend/components/exporters/asignaciones-export.tsx` - Exportación de asignaciones
- `frontend/components/exporters/citas-export.tsx` - Exportación de citas
- `frontend/components/exporters/tratamientos-export.tsx` - Exportación de tratamientos
- `frontend/components/exporters/usuarios-export.tsx` - Exportación de usuarios

#### 3. **Páginas Actualizadas**
- ✅ `frontend/app/pacientes/page.tsx` - Botón de exportación agregado
- ✅ `frontend/components/tabla-pacientes.tsx` - Botón de descarga individual por paciente
- ✅ `frontend/app/asignacion/page.tsx` - Exportación de asignaciones

---

## 🎯 Funcionalidades Implementadas

### **Módulo de Pacientes**
| Función | Formato | Detalles |
|---------|---------|----------|
| Listado Completo | PDF | Todos los pacientes con datos básicos |
| Listado Completo | Excel | Tabla con todos los campos |
| Carpeta Médica Individual | PDF | Información completa del paciente + antecedentes |
| Carpeta Médica Individual | Excel | Múltiples hojas por sección de antecedentes |
| Exportación desde Tabla | PDF | Botón directo en cada fila |

**Campos incluidos en PDF:**
- Nombre, CI, Edad, Sexo
- Contacto (Celular, Teléfono)
- Dirección, Ocupación
- **Antecedentes:** Familiares, Personales, No Patológicos, Ginecológicos
- Contacto de Emergencia

**Campos incluidos en Excel:**
- Todos los anteriores más fecha de nacimiento

---

### **Módulo de Asignaciones**
| Función | Formato | Detalles |
|---------|---------|----------|
| Listado de Asignaciones | PDF | Paciente, Docente, Estudiante, Estado |
| Listado de Asignaciones | Excel | Vista tabular con filtrado posible |

**Campos:**
- Paciente (nombre + CI)
- Estudiante asignado
- Docente supervisor
- Estado de la asignación
- Fecha de asignación

---

### **Módulo de Citas**
| Función | Formato | Detalles |
|---------|---------|----------|
| Listado de Citas | PDF | Paciente, Fecha, Hora, Sillón |
| Listado de Citas | Excel | Con estado y observaciones |

**Campos:**
- Paciente
- Fecha y Hora
- Sillón asignado
- Estudiante y Docente
- Estado
- Motivo de la cita

---

### **Módulo de Tratamientos**
| Función | Formato | Detalles |
|---------|---------|----------|
| Listado de Tratamientos | PDF | Tipo, Estado, Fechas |
| Listado de Tratamientos | Excel | Con costo y notas |

**Campos:**
- Paciente
- Tipo de tratamiento
- Descripción
- Estado
- Fechas (Inicio/Fin)
- Costo
- Notas

---

## 🚀 Cómo Usar

### **Exportar Todos los Pacientes**
```
1. Ve a Módulo → Pacientes
2. Haz clic en botón "Exportar (N)" en la esquina superior derecha
3. Selecciona: "Listado Pacientes (PDF)" o "Listado Pacientes (Excel)"
4. Se descargará automáticamente
```

### **Exportar Carpeta Médica Individual**
```
1. Ve a Módulo → Pacientes
2. En la fila del paciente, haz clic en el ícono de descarga (📥)
3. Se descargará la carpeta completa en PDF
4. O usa el menú de opciones del paciente para Excel
```

### **Exportar Asignaciones**
```
1. Ve a Módulo → Asignaciones
2. Haz clic en "Exportar (N)" en la parte superior
3. Selecciona formato PDF o Excel
4. Se abre una pestaña de descarga
```

---

## 📋 Ejemplo de PDF Generado

```
╔════════════════════════════════════════════════════════════════╗
║           CLÍNICA DENTAL PRO                                   ║
║   +591 XXXXXX | Santa Cruz, Bolivia                           ║
╠════════════════════════════════════════════════════════════════╣
║   Carpeta Médica                                              ║
║   Juan Carlos Pérez García                                    ║
║   Generado: 29 de abril de 2026, 14:32                       ║
╠════════════════════════════════════════════════════════════════╣
║  INFORMACIÓN DEL PACIENTE                                     ║
║  Cédula: 12345678         Sexo: Masculino                    ║
║  Edad: 35 años           Fecha Nac.: 15/04/1991             ║
│  Celular: +591 7234567   Teléfono: 4123456                  ║
║  Dirección: Calle Principal, Apto 5B                         ║
║  Ocupación: Profesional                                      ║
║  CONTACTO DE EMERGENCIA: María Pérez - +591 7654321         ║
╠════════════════════════════════════════════════════════════════╣
║  ANTECEDENTES FAMILIARES                                     ║
║  ✓ Hipertensión        ✓ Diabetes                            ║
║                                                               ║
║  ANTECEDENTES PERSONALES                                     ║
║  ✓ Cirugías previas    ✓ Alergias a penicilina              ║
║                                                               ║
║  ... más secciones ...                                        ║
╚════════════════════════════════════════════════════════════════╝
Página 1 de 2                              CLÍNICA DENTAL PRO
```

---

## 🎨 Diseño de Estilos

### **Colores por Módulo:**
- 🔵 **Pacientes**: Azul (#2980B9)
- 🔷 **Asignaciones**: Azul Claro (#3498DB)
- 🟢 **Citas**: Verde (#27AE60)
- 🟣 **Tratamientos**: Púrpura (#8E44AD)
- 🟠 **Usuarios**: Naranja (#F39C12)

### **Características de Estilos:**
- Header profesional con nombre de la clínica
- Tabla con bordes claros
- Alternancia de colores en filas (gris suave)
- Footer con número de página
- Tipografía clara y legible

---

## 🔧 Integración en Otros Módulos

Para agregar exportación a otros módulos, sigue este patrón:

### **1. Crear Componente Exportador**
```tsx
// components/exporters/nuevo-modulo-export.tsx
"use client";

import { useState } from "react";
import { exportNuevoModuloPDF } from "@/lib/exporters/pdf-exporter";
import { exportNuevoModuloExcel } from "@/lib/exporters/excel-exporter";
import { Button } from "@/components/ui/button";
// ... resto del componente
```

### **2. Agregar Funciones Exportadoras**
```tsx
// lib/exporters/pdf-exporter.ts
export const exportNuevoModuloPDF = (datos: any[]) => {
  exportPDF({
    title: 'Listado de Nuevo Módulo',
    subtitle: `Total: ${datos.length} items`,
    filename: `nuevo-modulo_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Campo 1', dataKey: 'campo1' },
      { header: 'Campo 2', dataKey: 'campo2' },
    ],
    data: datos,
    headerColor: [TU_COLOR_R, TU_COLOR_G, TU_COLOR_B],
  });
};
```

### **3. Integrar en Página**
```tsx
// app/nuevo-modulo/page.tsx
import { NuevoModuloExport } from "@/components/exporters/nuevo-modulo-export";

export default function NuevoModuloPage() {
  return (
    <div>
      <NuevoModuloExport datos={datos} />
    </div>
  );
}
```

---

## 📦 Dependencias Requeridas

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.31",
    "xlsx": "^0.18.5",
    "sonner": "^2.0.7"
  }
}
```

---

## 🐛 Solución de Problemas

### **El PDF no se descarga**
- Verifica que los datos no sean vacíos
- Revisa la consola para errores
- Asegúrate de que el nombre del archivo sea válido

### **Excel tiene formato incorrecto**
- Verifica que los dataKeys coincidan con los nombres de propiedades
- Revisa que los datos no contengan caracteres especiales

### **Los estilos no aparecen**
- Los estilos de jsPDF pueden variar según el navegador
- Prueba en Chrome o Firefox para mejor compatibilidad

---

## 📝 Próximos Pasos

- [ ] Agregar exportación a módulo de Reportes
- [ ] Agregar gráficos en PDFs
- [ ] Implementar exportación programada automática
- [ ] Agregar marcas de agua en PDFs
- [ ] Crear plantillas personalizables
- [ ] Exportación a otros formatos (CSV, XML)

---

**Última actualización:** 29 de abril de 2026  
**Versión:** 1.0.0
