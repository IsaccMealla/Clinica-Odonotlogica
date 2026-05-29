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
  pdf.setDrawColor(headerColor?.[0] || 0, headerColor?.[1] || 128, headerColor?.[2] || 95);
  pdf.setLineWidth(2);
  pdf.line(margin, margin + 8, pageWidth - margin, margin + 8);

  // Nombre de la clínica
  pdf.setFontSize(12);
  pdf.setTextColor(headerColor?.[0] || 0, headerColor?.[1] || 128, headerColor?.[2] || 95);
  pdf.setFont(undefined, 'bold');
  pdf.text(CLINIC_NAME, pageWidth / 2, margin + 15, { align: 'center' });

  // Información de contacto
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont(undefined, 'normal');
  pdf.text(`${CLINIC_PHONE} | ${CLINIC_ADDRESS}`, pageWidth / 2, margin + 20, { align: 'center' });

  // Título principal
  pdf.setFontSize(14);
  pdf.setTextColor(headerColor?.[0] || 0, headerColor?.[1] || 128, headerColor?.[2] || 95);
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
    headerColor = [0, 128, 95], // Verde clínico
    footerText = CLINIC_NAME
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');
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
      fillColor: [240, 251, 248], // Tono verde menta sumamente suave
    },
    margin: margin,
    didDrawPage: (data: any) => {
      const totalPages = (pdf as any).internal.pages.length - 1;
      addFooter(pdf, data.pageNumber, totalPages);
    },
  });

  pdf.save(filename);
};

// Exportar paciente con diferentes niveles de granularidad
export const exportPacienteDetallePDF = (
  paciente: any, 
  config: { incluirAntecedentes: boolean; incluirCarpetaMedica: boolean }
) => {
  const { incluirAntecedentes, incluirCarpetaMedica } = config;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95]; // Verde clínico de la marca

  let yPosition = addHeader(pdf, `Expediente de Paciente`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // ========== 1. INFORMACIÓN BÁSICA DEL PACIENTE ==========
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('DATOS DE IDENTIFICACIÓN Y CONTACTO', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Fecha de Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`],
    [`Lugar de Nacimiento: ${paciente.lugar_nacimiento || 'N/A'}`, `Estado Civil: ${paciente.estado_civil || 'N/A'}`],
    [`Número de Celular: ${paciente.celular || 'N/A'}`, `Teléfono Fijo: ${paciente.telefono || 'N/A'}`],
    [`Dirección de Domicilio: ${paciente.direccion || 'N/A'}`, `Ocupación: ${paciente.ocupacion || 'N/A'}`],
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  // ========== CONTACTO DE EMERGENCIA ==========
  yPosition += 2;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(192, 57, 43); // Rojo suave para emergencias
  pdf.text('CONTACTO DE EMERGENCIA', margin, yPosition);
  yPosition += 6;
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);
  const emergenciaNombre = paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A';
  const emergenciaTel = paciente.telefono_emergencia || 'N/A';
  pdf.text(`${emergenciaNombre} - Teléfono: ${emergenciaTel}`, margin, yPosition);
  yPosition += 8;

  // ========== FUNCIÓN AUXILIAR PARA AGREGAR ANTECEDENTES Y EXÁMENES ==========
  const addSection = (title: string, data: any, isGynecology: boolean = false) => {
    if (isGynecology && paciente.sexo !== 'Femenino') return;

    if (yPosition > pageHeight - margin - 35) {
      pdf.addPage();
      yPosition = addHeader(pdf, 'Expediente de Paciente (continuación)', '', headerColor) + 10;
    }

    yPosition += 6;
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.setFontSize(10);
    pdf.text(title, margin, yPosition);
    
    // Línea decorativa
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    
    yPosition += 6;

    if (!data || Object.keys(data).length === 0) {
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(9);
      pdf.text('Sin registros clínicos en esta sección', margin + 5, yPosition);
      yPosition += 6;
      return;
    }

    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(9);

    const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];
    
    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key)) return;

      if (yPosition > pageHeight - margin - 15) {
        pdf.addPage();
        yPosition = addHeader(pdf, 'Expediente de Paciente (continuación)', '', headerColor) + 10;
      }

      // Formatear label
      const label = key
        .replace(/_/g, ' ')
        .replace(/alergia_/g, '')
        .replace(/problema_/g, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (typeof value === 'boolean') {
        const status = value ? '✓ Sí' : '✗ No';
        pdf.text(`${label}: ${status}`, margin + 5, yPosition);
        yPosition += 5;
      } else if (typeof value === 'string' && value) {
        const truncated = value.length > 80 ? value.substring(0, 80) + '...' : value;
        pdf.text(`${label}: ${truncated}`, margin + 5, yPosition);
        yPosition += 5;
      } else if (value && typeof value === 'number') {
        pdf.text(`${label}: ${value}`, margin + 5, yPosition);
        yPosition += 5;
      }
    });
  };

  // ========== 2. ANTECEDENTES (SI SE ACTIVAN) ==========
  if (incluirAntecedentes) {
    const antecedentesPersonales = paciente.antecedentes_personales || {};
    const antecedentesfamiliares = paciente.antecedentes_familiares || {};
    const antecedentesNoPatologicos = paciente.antecedentes_no_patologicos || {};
    const antecedentesGinecologicos = paciente.antecedentes_ginecologicos || {};

    addSection('ANTECEDENTES CLÍNICOS PERSONALES (PATOLÓGICOS)', antecedentesPersonales);
    addSection('ANTECEDENTES CLÍNICOS FAMILIARES', antecedentesfamiliares);
    addSection('ANTECEDENTES NO PATOLÓGICOS / HÁBITOS', antecedentesNoPatologicos);
    addSection('ANTECEDENTES GINECOLÓGICOS', antecedentesGinecologicos, true);
  }

  // ========== 3. CARPETA MÉDICA AMPLIADA (SI SE ACTIVA) ==========
  if (incluirCarpetaMedica) {
    const examenesFisicos = paciente.examenes_clinicos_fisicos?.[0] || {};
    const examenesPeriodontales = paciente.examenes_periodontales?.[0] || {};
    
    addSection('FICHA CLÍNICA DE EXAMEN FÍSICO GENERAL Y FACIAL', examenesFisicos);
    addSection('FICHA CLÍNICA DE EXAMEN PERIODONTAL Y ENCÍAS', examenesPeriodontales);

    // Mapear Periodontograma (Explicar en la carpeta médica de forma profesional)
    if (paciente.periodontogramas && paciente.periodontogramas.length > 0) {
      if (yPosition > pageHeight - margin - 35) {
        pdf.addPage();
        yPosition = addHeader(pdf, 'Expediente de Paciente (continuación)', '', headerColor) + 10;
      }
      yPosition += 6;
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.setFontSize(10);
      pdf.text('REGISTRO DE PERIODONTOGRAMA ACTIVO', margin, yPosition);

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);

      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`✓ Se encuentra registrado ${paciente.periodontogramas.length} examen(es) de Periodontograma en el expediente digital.`, margin + 5, yPosition);
      yPosition += 5;
      pdf.text(`   Último registro cargado el: ${new Date(paciente.periodontogramas[0].fecha_aprobacion || Date.now()).toLocaleDateString()}`, margin + 5, yPosition);
      yPosition += 6;
    }
  }

  const totalPages = (pdf as any).internal.pages.length - 1;
  addFooter(pdf, totalPages, totalPages);
  
  // Determinar nombre del archivo
  let suffix = 'basico';
  if (incluirAntecedentes && incluirCarpetaMedica) suffix = 'completo';
  else if (incluirAntecedentes) suffix = 'con_antecedentes';
  else if (incluirCarpetaMedica) suffix = 'con_carpeta_medica';

  pdf.save(`paciente_${paciente.ci}_${suffix}.pdf`);
};

export const exportCarpetaMedicaPDF = (paciente: any) => {
  exportPacienteDetallePDF(paciente, { incluirAntecedentes: true, incluirCarpetaMedica: true });
};

// Funciones específicas para cada módulo
export const exportPacientesPDF = (pacientes: any[]) => {
  exportPDF({
    title: 'Listado General de Pacientes',
    subtitle: `Total: ${pacientes.length} pacientes registrados`,
    filename: `pacientes_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Cédula', dataKey: 'ci' },
      { header: 'Nombre Completo', dataKey: 'nombres' },
      { header: 'Celular', dataKey: 'celular' },
      { header: 'Sexo', dataKey: 'sexo' },
      { header: 'Edad', dataKey: 'edad' },
    ],
    data: pacientes.map(p => ({
      ...p,
      nombres: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`
    })),
    headerColor: [0, 128, 95], // Verde
  });
};

export const exportAsignacionesPDF = (asignaciones: any[]) => {
  exportPDF({
    title: 'Control de Asignaciones Clínicas',
    subtitle: `Total: ${asignaciones.length} vinculaciones`,
    filename: `asignaciones_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'paciente_nombre' },
      { header: 'CI Paciente', dataKey: 'paciente_ci' },
      { header: 'Estudiante asignado', dataKey: 'estudiante_nombre' },
      { header: 'Docente supervisor', dataKey: 'docente_nombre' },
      { header: 'Estado Académico', dataKey: 'estado' },
    ],
    data: asignaciones,
    headerColor: [0, 128, 95],
  });
};

export const exportCitasPDF = (citas: any[]) => {
  exportPDF({
    title: 'Agenda de Citas Odontológicas',
    subtitle: `Total: ${citas.length} citas programadas`,
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
    headerColor: [0, 128, 95],
  });
};

export const exportTratamientosPDF = (tratamientos: any[]) => {
  exportPDF({
    title: 'Registro de Tratamientos Clínicos',
    subtitle: `Total: ${tratamientos.length} planes registrados`,
    filename: `tratamientos_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Paciente', dataKey: 'paciente_nombre_completo' },
      { header: 'Tratamiento', dataKey: 'nombre_tratamiento' },
      { header: 'Pieza Dental', dataKey: 'diente_pieza' },
      { header: 'Operador / Estudiante', dataKey: 'estudiante_nombre_completo' },
      { header: 'Estado', dataKey: 'estado' },
    ],
    data: tratamientos,
    headerColor: [0, 128, 95],
  });
};

export const exportUsuariosPDF = (usuarios: any[]) => {
  exportPDF({
    title: 'Gestión de Usuarios del Sistema',
    subtitle: `Total: ${usuarios.length} cuentas registradas`,
    filename: `usuarios_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Nombre Completo', dataKey: 'nombre_completo' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Usuario', dataKey: 'username' },
      { header: 'Rol', dataKey: 'rol' },
      { header: 'Activo', dataKey: 'is_active' },
    ],
    data: usuarios.map(u => ({
      ...u,
      nombre_completo: u.nombre_completo || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'
    })),
    headerColor: [0, 128, 95],
  });
};

export const exportAsistenciaPDF = (registros: any[]) => {
  exportPDF({
    title: 'Reporte de Asistencia Biométrica',
    subtitle: `Total: ${registros.length} marcas registradas`,
    filename: `asistencia_${new Date().getTime()}.pdf`,
    columns: [
      { header: 'Usuario', dataKey: 'usuario_nombre' },
      { header: 'Fecha y Hora', dataKey: 'fecha_hora_formateada' },
      { header: 'Acción', dataKey: 'accion' },
      { header: 'Sensor ID', dataKey: 'huella_id' },
      { header: 'Verificado', dataKey: 'verificado' },
    ],
    data: registros.map(r => ({
      ...r,
      usuario_nombre: r.usuario_detalle?.nombre_completo || r.usuario || 'N/A',
      fecha_hora_formateada: new Date(r.fecha_hora).toLocaleString('es-ES'),
      verificado: r.verificado ? 'Biométrico' : 'Manual'
    })),
    headerColor: [0, 128, 95],
  });
};

export const exportPacientesLotePDF = (
  pacientes: any[],
  config: { incluirAntecedentes: boolean; incluirCarpetaMedica: boolean },
  tituloListado: string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95];

  pacientes.forEach((paciente, idx) => {
    if (idx > 0) {
      pdf.addPage();
    }

    let yPosition = addHeader(pdf, `Dossier Clínico - ${tituloListado}`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

    // ========== 1. INFORMACIÓN BÁSICA DEL PACIENTE ==========
    yPosition += 5;
    pdf.setFontSize(11);
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DE IDENTIFICACIÓN Y CONTACTO', margin, yPosition);

    yPosition += 8;
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);

    const pacienteInfo = [
      [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
      [`Edad: ${paciente.edad} años`, `Fecha de Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`],
      [`Lugar de Nacimiento: ${paciente.lugar_nacimiento || 'N/A'}`, `Estado Civil: ${paciente.estado_civil || 'N/A'}`],
      [`Número de Celular: ${paciente.celular || 'N/A'}`, `Teléfono Fijo: ${paciente.telefono || 'N/A'}`],
      [`Dirección de Domicilio: ${paciente.direccion || 'N/A'}`, `Ocupación: ${paciente.ocupacion || 'N/A'}`],
    ];

    pacienteInfo.forEach((row) => {
      pdf.text(row[0], margin, yPosition);
      pdf.text(row[1], pageWidth / 2, yPosition);
      yPosition += 6;
    });

    // CONTACTO DE EMERGENCIA
    yPosition += 2;
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(192, 57, 43);
    pdf.text('CONTACTO DE EMERGENCIA', margin, yPosition);
    yPosition += 6;
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);
    const emergenciaNombre = paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A';
    const emergenciaTel = paciente.telefono_emergencia || 'N/A';
    pdf.text(`${emergenciaNombre} - Teléfono: ${emergenciaTel}`, margin, yPosition);
    yPosition += 8;

    const addSection = (title: string, data: any, isGynecology: boolean = false) => {
      if (isGynecology && paciente.sexo !== 'Femenino') return;

      if (yPosition > pageHeight - margin - 35) {
        pdf.addPage();
        yPosition = addHeader(pdf, 'Dossier Clínico (continuación)', '', headerColor) + 10;
      }

      yPosition += 6;
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.setFontSize(10);
      pdf.text(title, margin, yPosition);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
      
      yPosition += 6;

      if (!data || Object.keys(data).length === 0) {
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(9);
        pdf.text('Sin registros clínicos', margin + 5, yPosition);
        yPosition += 6;
        return;
      }

      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(9);

      const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];
      
      Object.entries(data).forEach(([key, value]) => {
        if (fieldsToExclude.includes(key)) return;

        if (yPosition > pageHeight - margin - 15) {
          pdf.addPage();
          yPosition = addHeader(pdf, 'Dossier Clínico (continuación)', '', headerColor) + 10;
        }

        const label = key
          .replace(/_/g, ' ')
          .replace(/alergia_/g, '')
          .replace(/problema_/g, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        if (typeof value === 'boolean') {
          pdf.text(`${label}: ${value ? '✓ Sí' : '✗ No'}`, margin + 5, yPosition);
          yPosition += 5;
        } else if (typeof value === 'string' && value) {
          pdf.text(`${label}: ${value.substring(0, 80)}`, margin + 5, yPosition);
          yPosition += 5;
        } else if (value && typeof value === 'number') {
          pdf.text(`${label}: ${value}`, margin + 5, yPosition);
          yPosition += 5;
        }
      });
    };

    // ========== 2. ANTECEDENTES ==========
    if (config.incluirAntecedentes) {
      addSection('ANTECEDENTES CLÍNICOS PERSONALES (PATOLÓGICOS)', paciente.antecedentes_personales || {});
      addSection('ANTECEDENTES CLÍNICOS FAMILIARES', paciente.antecedentes_familiares || {});
      addSection('ANTECEDENTES NO PATOLÓGICOS / HÁBITOS', paciente.antecedentes_no_patologicos || {});
      addSection('ANTECEDENTES GINECOLÓGICOS', paciente.antecedentes_ginecologicos || {}, true);
    }

    // ========== 3. CARPETA MÉDICA ==========
    if (config.incluirCarpetaMedica) {
      addSection('FICHA CLÍNICA DE EXAMEN FÍSICO GENERAL Y FACIAL', paciente.examenes_clinicos_fisicos?.[0] || {});
      addSection('FICHA CLÍNICA DE EXAMEN PERIODONTAL Y ENCÍAS', paciente.examenes_periodontales?.[0] || {});
      
      if (paciente.periodontogramas && paciente.periodontogramas.length > 0) {
        if (yPosition > pageHeight - margin - 35) {
          pdf.addPage();
          yPosition = addHeader(pdf, 'Dossier Clínico (continuación)', '', headerColor) + 10;
        }
        yPosition += 6;
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
        pdf.setFontSize(10);
        pdf.text('REGISTRO DE PERIODONTOGRAMA ACTIVO', margin, yPosition);

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);

        yPosition += 6;
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(40, 40, 40);
        pdf.text(`✓ Se encuentra registrado ${paciente.periodontogramas.length} examen(es) de Periodontograma en el expediente digital.`, margin + 5, yPosition);
        yPosition += 5;
      }
    }
  });

  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }

  pdf.save(`dossier_pacientes_${tituloListado.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

// ========== EXPORTADORES DE SUBMÓDULOS INDIVIDUALES ==========

export const exportSubmoduloHistoriaClinicaPDF = (paciente: any, formData: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95]; // Verde clínico de la marca

  let yPosition = addHeader(pdf, `Historia Clínica Detallada`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // ========== 1. INFORMACIÓN BÁSICA DEL PACIENTE ==========
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('DATOS DE IDENTIFICACIÓN Y CONTACTO', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Fecha de Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`],
    [`Lugar de Nacimiento: ${paciente.lugar_nacimiento || 'N/A'}`, `Estado Civil: ${paciente.estado_civil || 'N/A'}`],
    [`Número de Celular: ${paciente.celular || 'N/A'}`, `Teléfono Fijo: ${paciente.telefono || 'N/A'}`],
    [`Dirección de Domicilio: ${paciente.direccion || 'N/A'}`, `Ocupación: ${paciente.ocupacion || 'N/A'}`],
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  yPosition += 2;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(192, 57, 43); // Rojo suave para emergencias
  pdf.text('CONTACTO DE EMERGENCIA', margin, yPosition);
  yPosition += 6;
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);
  const emergenciaNombre = paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A';
  const emergenciaTel = paciente.telefono_emergencia || 'N/A';
  pdf.text(`${emergenciaNombre} - Teléfono: ${emergenciaTel}`, margin, yPosition);
  yPosition += 8;

  const addSection = (title: string, data: any, isGynecology: boolean = false) => {
    if (isGynecology && paciente.sexo !== 'Femenino') return;

    if (yPosition > pageHeight - margin - 35) {
      pdf.addPage();
      yPosition = addHeader(pdf, 'Historia Clínica Detallada (continuación)', '', headerColor) + 10;
    }

    yPosition += 6;
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.setFontSize(10);
    pdf.text(title, margin, yPosition);
    
    // Línea decorativa
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    
    yPosition += 6;

    if (!data || Object.keys(data).length === 0) {
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(9);
      pdf.text('Sin registros en esta sección', margin + 5, yPosition);
      yPosition += 6;
      return;
    }

    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(9);

    const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];
    const keysHandled = new Set<string>();

    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key) || keysHandled.has(key)) return;

      if (key.endsWith('_obs')) {
        const parentKey = key.slice(0, -4);
        if (parentKey in data) {
          return; // handled by parent
        }
      }

      if (yPosition > pageHeight - margin - 15) {
        pdf.addPage();
        yPosition = addHeader(pdf, 'Historia Clínica Detallada (continuación)', '', headerColor) + 10;
      }

      const label = key
        .replace(/_/g, ' ')
        .replace(/alergia_/g, '')
        .replace(/problema_/g, '')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (typeof value === 'boolean') {
        const obsKey = `${key}_obs`;
        const obsVal = data[obsKey];
        let status = value ? 'Sí' : 'No';
        if (value && obsVal) {
          status = `Sí (Obs: ${obsVal})`;
        }
        pdf.text(`${label}: ${status}`, margin + 5, yPosition);
        yPosition += 5;
        keysHandled.add(obsKey);
      } else if (typeof value === 'string' && value) {
        const truncated = value.length > 80 ? value.substring(0, 80) + '...' : value;
        pdf.text(`${label}: ${truncated}`, margin + 5, yPosition);
        yPosition += 5;
      } else if (value && typeof value === 'number') {
        pdf.text(`${label}: ${value}`, margin + 5, yPosition);
        yPosition += 5;
      }
      keysHandled.add(key);
    });
  };

  addSection('ANTECEDENTES CLÍNICOS PERSONALES (PATOLÓGICOS)', formData.personales || {});
  addSection('ANTECEDENTES CLÍNICOS FAMILIARES', formData.familiares || {});
  addSection('ANTECEDENTES NO PATOLÓGICOS', formData.no_patologicos || {});
  addSection('ANTECEDENTES GINECOLÓGICOS', formData.ginecologicos || {}, true);
  addSection('HÁBITOS DEL PACIENTE', formData.habitos || {});
  addSection('EXAMEN FÍSICO GENERAL Y FACIAL', formData.examen_clinico_fisico || {});
  
  if (paciente.edad <= 14) {
    addSection('HISTORIA CLÍNICA ODONTOPEDIÁTRICA', formData.historia_odontopediatrica || {});
  }
  
  addSection('ANTECEDENTES Y SÍNTOMAS PERIODONTALES', formData.antecedentes_periodontales || {});
  addSection('EXAMEN CLÍNICO PERIODONTAL', formData.examen_periodontal || {});

  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }

  pdf.save(`historia_clinica_${paciente.ci}.pdf`);
};

export const exportSubmoduloPeriodontogramaPDF = (paciente: any, periodontoData: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95];

  let yPosition = addHeader(pdf, `Reporte de Periodontograma`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // 1. INFORMACIÓN BÁSICA DEL PACIENTE
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('DATOS DE IDENTIFICACIÓN', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Fecha de Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`],
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  if (periodontoData && (periodontoData.diagnostico || periodontoData.pronostico)) {
    yPosition += 2;
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.text('DIAGNÓSTICO Y PRONÓSTICO PERIODONTAL', margin, yPosition);
    yPosition += 6;
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);
    if (periodontoData.diagnostico) {
      pdf.text(`Diagnóstico: ${periodontoData.diagnostico}`, margin, yPosition);
      yPosition += 5;
    }
    if (periodontoData.pronostico) {
      pdf.text(`Pronóstico: ${periodontoData.pronostico}`, margin, yPosition);
      yPosition += 5;
    }
  }

  yPosition += 4;

  const dientesSuperiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const dientesInferiores = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const headers = ['Pieza', 'Movilidad', 'Implante', 'BOP (Sangrado)', 'Supuración', 'Margen (MG)', 'Sondaje (PS)'];

  const buildArcadaRows = (arcadaData: Record<number, any>, dientes: number[]) => {
    return dientes.map(num => {
      const d = arcadaData?.[num] || {
        movilidad: "",
        implante: false,
        sangrado: [false, false, false],
        supuracion: [false, false, false],
        margen: [0, 0, 0],
        sondaje: [0, 0, 0],
      };
      return [
        String(num),
        d.movilidad || '-',
        d.implante ? 'Sí' : 'No',
        d.sangrado ? d.sangrado.map((b: boolean) => b ? '1' : '0').join('-') : '- - -',
        d.supuracion ? d.supuracion.map((b: boolean) => b ? '1' : '0').join('-') : '- - -',
        d.margen ? d.margen.join('-') : '0-0-0',
        d.sondaje ? d.sondaje.join('-') : '0-0-0'
      ];
    });
  };

  const addPerioTable = (title: string, dataKey: string, dientes: number[]) => {
    if (yPosition > pageHeight - margin - 50) {
      pdf.addPage();
      yPosition = addHeader(pdf, 'Reporte de Periodontograma (continuación)', '', headerColor) + 10;
    }

    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.setFontSize(10);
    pdf.text(title, margin, yPosition);
    yPosition += 4;

    const rows = buildArcadaRows(periodontoData?.[dataKey] || {}, dientes);

    autoTable(pdf, {
      startY: yPosition,
      head: [headers],
      body: rows,
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3,
        fontSize: 8,
      },
      bodyStyles: {
        textColor: 40,
        cellPadding: 2.5,
        fontSize: 8,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [240, 251, 248],
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 8;
  };

  addPerioTable('ARCADA SUPERIOR - VESTIBULAR', 'datos_vestibular_superior', dientesSuperiores);
  addPerioTable('ARCADA SUPERIOR - PALATINO', 'datos_palatino_superior', dientesSuperiores);
  
  if (yPosition > pageHeight - margin - 40) {
    pdf.addPage();
    yPosition = addHeader(pdf, 'Reporte de Periodontograma (continuación)', '', headerColor) + 10;
  }
  
  addPerioTable('ARCADA INFERIOR - VESTIBULAR', 'datos_vestibular_inferior', dientesInferiores);
  addPerioTable('ARCADA INFERIOR - LINGUAL', 'datos_lingual_inferior', dientesInferiores);

  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, totalPages);
  }

  pdf.save(`periodontograma_${paciente.ci}.pdf`);
};

export const exportSubmoduloTratamientosPDF = (paciente: any, tratamientos: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95];

  let yPosition = addHeader(pdf, `Plan de Tratamientos y Procedimientos`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // 1. INFORMACIÓN BÁSICA DEL PACIENTE
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('DATOS DE IDENTIFICACIÓN', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Alergias: ${paciente.alergias || 'Ninguna registrada'}`],
    [`Enfermedades Base: ${paciente.enfermedades_base || 'Ninguna registrada'}`]
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    if (row[1]) pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  yPosition += 4;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFontSize(10);
  pdf.text('HISTORIAL DE PROCEDIMIENTOS REALIZADOS', margin, yPosition);
  yPosition += 4;

  const columns = [
    { header: 'Fecha', dataKey: 'creado_en' },
    { header: 'Tratamiento', dataKey: 'nombre_tratamiento' },
    { header: 'Pieza Dental', dataKey: 'diente_pieza' },
    { header: 'Estado', dataKey: 'estado' },
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [columns.map(c => c.header)],
    body: tratamientos.map(t => [
      t.creado_en ? new Date(t.creado_en).toLocaleDateString('es-ES') : 'Sin fecha',
      t.nombre_tratamiento || 'N/A',
      t.diente_pieza || 'General',
      t.estado ? t.estado.replace('_', ' ').toUpperCase() : 'PENDIENTE'
    ]),
    headStyles: {
      fillColor: headerColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
      fontSize: 9,
    },
    bodyStyles: {
      textColor: 40,
      cellPadding: 3.5,
      fontSize: 9,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 251, 248],
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      const totalPages = (pdf as any).internal.pages.length - 1;
      addFooter(pdf, data.pageNumber, totalPages);
    }
  });

  pdf.save(`tratamientos_${paciente.ci}.pdf`);
};

export const exportSubmoduloImagenesPDF = (paciente: any, imagenes: any[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const headerColor: [number, number, number] = [0, 128, 95];

  let yPosition = addHeader(pdf, `Historial de Diagnóstico por Imagen (Rayos X)`, `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`, headerColor);

  // 1. INFORMACIÓN BÁSICA DEL PACIENTE
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFont(undefined, 'bold');
  pdf.text('DATOS DE IDENTIFICACIÓN', margin, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(40, 40, 40);

  const pacienteInfo = [
    [`Cédula de Identidad: ${paciente.ci}`, `Sexo: ${paciente.sexo}`],
    [`Edad: ${paciente.edad} años`, `Fecha de Nacimiento: ${paciente.fecha_nacimiento || 'N/A'}`],
  ];

  pacienteInfo.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], pageWidth / 2, yPosition);
    yPosition += 6;
  });

  yPosition += 4;
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.setFontSize(10);
  pdf.text('REGISTRO DE IMÁGENES Y RADIOGRAFÍAS CLÍNICAS', margin, yPosition);
  yPosition += 4;

  const columns = [
    { header: 'Fecha de Adquisición', dataKey: 'fecha' },
    { header: 'Tipo / Categoría', dataKey: 'categoria' },
    { header: 'Pieza Dental (Opcional)', dataKey: 'pieza' },
    { header: 'Nombre del Archivo', dataKey: 'archivo' }
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [columns.map(c => c.header)],
    body: imagenes.map(img => {
      const filename = img.archivo ? img.archivo.split('/').pop() : 'N/A';
      return [
        img.fecha_adquisicion ? new Date(img.fecha_adquisicion).toLocaleDateString('es-ES') : 'Sin fecha',
        img.categoria || 'N/A',
        img.pieza_dental || 'General / Completa',
        filename
      ];
    }),
    headStyles: {
      fillColor: headerColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
      fontSize: 9,
    },
    bodyStyles: {
      textColor: 40,
      cellPadding: 3.5,
      fontSize: 9,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 251, 248],
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      const totalPages = (pdf as any).internal.pages.length - 1;
      addFooter(pdf, data.pageNumber, totalPages);
    }
  });

  pdf.save(`imagenes_rx_${paciente.ci}.pdf`);
};
