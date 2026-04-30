import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CLINIC_NAME = 'CLÍNICA DENTAL PRO';
const CLINIC_PHONE = '+591 XXXXXX';
const CLINIC_ADDRESS = 'Santa Cruz, Bolivia';

interface PDFOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: Array<{
    header: string;
    dataKey: string;
  }>;
  data: any[];
  headerColor?: [number, number, number];
  footerText?: string;
}

const addHeader = (pdf: jsPDF, title: string, subtitle?: string, headerColor?: [number, number, number]) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  
  // Línea decorativa superior
  pdf.setDrawColor(headerColor?.[0] || 41, headerColor?.[1] || 128, headerColor?.[2] || 185);
  pdf.setLineWidth(2);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  // Nombre de la clínica
  pdf.setFontSize(12);
  pdf.setTextColor(headerColor?.[0] || 41, headerColor?.[1] || 128, headerColor?.[2] || 185);
  pdf.setFont(undefined, 'bold');
  pdf.text(CLINIC_NAME, pageWidth / 2, margin + 15, { align: 'center' });

  // Información de contacto
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont(undefined, 'normal');
  pdf.text(`${CLINIC_PHONE} | ${CLINIC_ADDRESS}`, pageWidth / 2, margin + 20, { align: 'center' });

  // Título principal
  pdf.setFontSize(14);
  pdf.setTextColor(headerColor?.[0] || 41, headerColor?.[1] || 128, headerColor?.[2] || 185);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, margin, margin + 30);

  // Subtítulo si existe
  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont(undefined, 'normal');
    pdf.text(subtitle, margin, margin + 36);
  }

  // Fecha de generación
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  const fecha = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`Generado: ${fecha}`, pageWidth - margin - 30, margin + 30);

  return margin + (subtitle ? 42 : 36);
};

const addFooter = (pdf: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // Línea decorativa inferior
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);

  // Texto footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(CLINIC_NAME, pageWidth / 2, pageHeight - margin, { align: 'center' });

  // Números de página
  pdf.text(
    `Página ${pageNumber} de ${totalPages}`,
    pageWidth - margin - 25,
    pageHeight - margin
  );
};

export const exportPDF = async (options: PDFOptions) => {
  const {
    title,
    subtitle,
    filename,
    columns,
    data,
    headerColor = [41, 128, 185],
    footerText = CLINIC_NAME
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const startY = addHeader(pdf, title, subtitle, headerColor);

  // Tabla
  autoTable(pdf, {
    startY,
    head: [columns.map(col => col.header)],
    body: data.map(row =>
      columns.map(col => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).substring(0, 50);
      })
    ),
    headStyles: {
      fillColor: headerColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 5,
      fontSize: 10,
    },
    bodyStyles: {
      textColor: 40,
      cellPadding: 4,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252],
    },
    margin: margin,
    didDrawPage: (data: any) => {
      const totalPages = (pdf as any).internal.pages.length - 1;
      addFooter(pdf, data.pageNumber, totalPages);
    },
  });

  pdf.save(filename);
};

// Exportar Carpeta Médica Completa de un Paciente
export const exportCarpetaMedicaPDF = (paciente: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerColor: [number, number, number] = [41, 128, 185];

  let yPosition = addHeader(pdf, `Carpeta Médica`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // ========== INFORMACIÓN DEL PACIENTE ==========
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('INFORMACIÓN DEL PACIENTE', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Fecha Nac.: ${paciente.fecha_nacimiento || 'N/A'}`],
    [`Celular: ${paciente.celular || 'N/A'}`, `Teléfono: ${paciente.telefono || 'N/A'}`],
    [`Dirección: ${paciente.direccion || 'N/A'}`, `Ocupación: ${paciente.ocupacion || 'N/A'}`],
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  // ========== CONTACTO DE EMERGENCIA ==========
  yPosition += 2;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(192, 57, 43);
  pdf.text('CONTACTO DE EMERGENCIA', margin, yPosition);
  yPosition += 6;
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);
  const emergenciaNombre = paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A';
  const emergenciaTel = paciente.telefono_emergencia || 'N/A';
  pdf.text(`${emergenciaNombre} - ${emergenciaTel}`, margin, yPosition);

  // ========== FUNCIÓN AUXILIAR PARA SECCIONES ==========
  const addSection = (title: string, data: any, isGynecology: boolean = false) => {
    if (isGynecology && paciente.sexo !== 'Femenino') return;

    if (yPosition > pageHeight - margin - 25) {
      pdf.addPage();
      yPosition = addHeader(pdf, 'Carpeta Médica (continuación)', '', headerColor) + 10;
    }

    yPosition += 8;
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.setFontSize(10);
    pdf.text(title, margin, yPosition);
    
    // Línea decorativa
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    
    yPosition += 7;

    if (!data || Object.keys(data).length === 0) {
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(9);
      pdf.text('Sin información registrada', margin + 5, yPosition);
      yPosition += 5;
      return;
    }

    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(9);

    // Filtrar campos que NO queremos mostrar
    const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];
    
    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key)) return;

      if (yPosition > pageHeight - margin - 10) {
        pdf.addPage();
        yPosition = addHeader(pdf, 'Carpeta Médica (continuación)', '', headerColor) + 10;
      }

      // Formatear label
      const label = key
        .replace(/_/g, ' ')
        .replace(/alergia_/g, '')
        .replace(/problema_/g, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Mostrar item
      if (typeof value === 'boolean') {
        const status = value ? '✓ SÍ' : '✗ NO';
        pdf.text(`${label}: ${status}`, margin + 5, yPosition);
      } else if (typeof value === 'string' && value) {
        // Limitar el texto muy largo
        const truncated = value.length > 60 ? value.substring(0, 60) + '...' : value;
        pdf.text(`${label}: ${truncated}`, margin + 5, yPosition);
      } else if (value && typeof value === 'number') {
        pdf.text(`${label}: ${value}`, margin + 5, yPosition);
      }
      
      yPosition += 5;
    });
  };

  // ========== OBTENER LOS DATOS DE ANTECEDENTES ==========
  // Si son objetos, úsalos tal cual. Si son null/undefined, usa objeto vacío
  const antecedentesPersonales = paciente.antecedentes_personales || {};
  const antecedentesfamiliares = paciente.antecedentes_familiares || {};
  const antecedentesNoPatologicos = paciente.antecedentes_no_patologicos || {};
  const antecedentesGinecologicos = paciente.antecedentes_ginecologicos || {};

  // ========== ANTECEDENTES PERSONALES (PATOLÓGICOS) ==========
  addSection('ANTECEDENTES PERSONALES', antecedentesPersonales);

  // ========== ANTECEDENTES FAMILIARES ==========
  addSection('ANTECEDENTES FAMILIARES', antecedentesfamiliares);

  // ========== ANTECEDENTES NO PATOLÓGICOS ==========
  addSection('ANTECEDENTES NO PATOLÓGICOS', antecedentesNoPatologicos);

  // ========== ANTECEDENTES GINECOLÓGICOS (Solo si es mujer) ==========
  addSection('ANTECEDENTES GINECOLÓGICOS', antecedentesGinecologicos, true);

  addFooter(pdf, 1, 1);
  pdf.save(`carpeta_medica_${paciente.ci}_${new Date().getTime()}.pdf`);
};

// Funciones específicas para cada módulo
export const exportPacientesPDF = (pacientes: any[]) => {
  exportPDF({
    title: 'Listado de Pacientes',
    subtitle: `Total: ${pacientes.length} pacientes`,
    filename: `pacientes_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Cédula', dataKey: 'ci' },
      { header: 'Nombre Completo', dataKey: 'nombres' },
      { header: 'Celular', dataKey: 'celular' },
      { header: 'Sexo', dataKey: 'sexo' },
      { header: 'Edad', dataKey: 'edad' },
    ],
    data: pacientes,
    headerColor: [41, 128, 185],
  });
};

export const exportAsignacionesPDF = (asignaciones: any[]) => {
  exportPDF({
    title: 'Listado de Asignaciones',
    subtitle: `Total: ${asignaciones.length} asignaciones`,
    filename: `asignaciones_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'paciente_nombre' },
      { header: 'CI Paciente', dataKey: 'paciente_ci' },
      { header: 'Estudiante', dataKey: 'estudiante_nombre' },
      { header: 'Docente', dataKey: 'docente_nombre' },
      { header: 'Estado', dataKey: 'estado' },
    ],
    data: asignaciones,
    headerColor: [52, 152, 219],
  });
};

export const exportCitasPDF = (citas: any[]) => {
  exportPDF({
    title: 'Listado de Citas',
    subtitle: `Total: ${citas.length} citas`,
    filename: `citas_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'paciente_nombre' },
      { header: 'Fecha', dataKey: 'fecha' },
      { header: 'Hora', dataKey: 'hora' },
      { header: 'Sillón', dataKey: 'sillon' },
      { header: 'Estudiante', dataKey: 'estudiante_nombre' },
      { header: 'Estado', dataKey: 'estado' },
    ],
    data: citas,
    headerColor: [46, 204, 113],
  });
};

export const exportTratamientosPDF = (tratamientos: any[]) => {
  exportPDF({
    title: 'Listado de Tratamientos',
    subtitle: `Total: ${tratamientos.length} tratamientos`,
    filename: `tratamientos_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'paciente_nombre' },
      { header: 'Tipo', dataKey: 'tipo' },
      { header: 'Estado', dataKey: 'estado' },
      { header: 'Fecha Inicio', dataKey: 'fecha_inicio' },
      { header: 'Fecha Fin', dataKey: 'fecha_fin' },
    ],
    data: tratamientos,
    headerColor: [155, 89, 182],
  });
};

export const exportUsuariosPDF = (usuarios: any[]) => {
  exportPDF({
    title: 'Listado de Usuarios',
    subtitle: `Total: ${usuarios.length} usuarios`,
    filename: `usuarios_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Nombre', dataKey: 'nombre_completo' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Usuario', dataKey: 'username' },
      { header: 'Rol', dataKey: 'rol' },
      { header: 'Estado', dataKey: 'is_active' },
    ],
    data: usuarios,
    headerColor: [241, 196, 15],
  });
};
