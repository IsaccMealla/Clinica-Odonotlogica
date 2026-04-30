import * as XLSX from 'xlsx';

interface ExcelOptions {
  filename: string;
  sheets: Array<{
    name: string;
    columns: Array<{
      header: string;
      dataKey: string;
    }>;
    data: any[];
  }>;
  headerColor?: string;
}

export const exportExcel = (options: ExcelOptions) => {
  const { filename, sheets, headerColor = 'FF2980B9' } = options;

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Transformar datos
    const data = sheet.data.map((row) =>
      sheet.columns.reduce((acc, col) => {
        let value = row[col.dataKey] ?? '';
        
        // Formatear valores booleanos
        if (typeof value === 'boolean') {
          value = value ? 'Sí' : 'No';
        }
        // Formatear objetos
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        acc[col.header] = value;
        return acc;
      }, {} as Record<string, any>)
    );

    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Aplicar estilos a encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        fill: { fgColor: { rgb: headerColor } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'FF000000' } },
          bottom: { style: 'thin', color: { rgb: 'FF000000' } },
          left: { style: 'thin', color: { rgb: 'FF000000' } },
          right: { style: 'thin', color: { rgb: 'FF000000' } },
        },
      };
    }

    // Aplicar bordes a celdas de datos
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
          },
        };
      }
    }

    // Ajustar ancho de columnas
    const maxWidth = 25;
    const colWidths = sheet.columns.map((col) => ({
      wch: Math.min(Math.max(col.header.length + 2, 12), maxWidth),
    }));
    worksheet['!cols'] = colWidths;

    // Altura de filas
    worksheet['!rows'] = [{ hpx: 25 }]; // Primera fila más alta

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Descargar archivo
  XLSX.writeFile(workbook, filename);
};

// Funciones específicas por módulo
export const exportPacientesExcel = (pacientes: any[]) => {
  exportExcel({
    filename: `pacientes_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Pacientes',
        columns: [
          { header: 'Cédula', dataKey: 'ci' },
          { header: 'Nombres', dataKey: 'nombres' },
          { header: 'Apellido Paterno', dataKey: 'apellido_paterno' },
          { header: 'Apellido Materno', dataKey: 'apellido_materno' },
          { header: 'Sexo', dataKey: 'sexo' },
          { header: 'Edad', dataKey: 'edad' },
          { header: 'Celular', dataKey: 'celular' },
          { header: 'Teléfono', dataKey: 'telefono' },
          { header: 'Dirección', dataKey: 'direccion' },
          { header: 'Ocupación', dataKey: 'ocupacion' },
          { header: 'Contacto Emergencia', dataKey: 'contacto_emergencia' },
          { header: 'Teléfono Emergencia', dataKey: 'telefono_emergencia' },
        ],
        data: pacientes,
      },
    ],
    headerColor: 'FF2980B9', // Azul
  });
};

export const exportAsignacionesExcel = (asignaciones: any[]) => {
  exportExcel({
    filename: `asignaciones_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Asignaciones',
        columns: [
          { header: 'Paciente', dataKey: 'paciente_nombre' },
          { header: 'CI Paciente', dataKey: 'paciente_ci' },
          { header: 'Estudiante', dataKey: 'estudiante_nombre' },
          { header: 'Docente', dataKey: 'docente_nombre' },
          { header: 'Estado', dataKey: 'estado' },
          { header: 'Fecha Asignación', dataKey: 'fecha_asignacion' },
          { header: 'Observaciones', dataKey: 'observaciones' },
        ],
        data: asignaciones,
      },
    ],
    headerColor: 'FF3498DB', // Azul más claro
  });
};

export const exportCitasExcel = (citas: any[]) => {
  exportExcel({
    filename: `citas_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Citas',
        columns: [
          { header: 'Paciente', dataKey: 'paciente_nombre' },
          { header: 'Fecha', dataKey: 'fecha' },
          { header: 'Hora', dataKey: 'hora' },
          { header: 'Sillón', dataKey: 'sillon' },
          { header: 'Estudiante', dataKey: 'estudiante_nombre' },
          { header: 'Docente', dataKey: 'docente_nombre' },
          { header: 'Estado', dataKey: 'estado' },
          { header: 'Motivo', dataKey: 'motivo' },
        ],
        data: citas,
      },
    ],
    headerColor: 'FF27AE60', // Verde
  });
};

export const exportTratamientosExcel = (tratamientos: any[]) => {
  exportExcel({
    filename: `tratamientos_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Tratamientos',
        columns: [
          { header: 'Paciente', dataKey: 'paciente_nombre' },
          { header: 'Tipo', dataKey: 'tipo' },
          { header: 'Descripción', dataKey: 'descripcion' },
          { header: 'Estado', dataKey: 'estado' },
          { header: 'Fecha Inicio', dataKey: 'fecha_inicio' },
          { header: 'Fecha Fin', dataKey: 'fecha_fin' },
          { header: 'Costo', dataKey: 'costo' },
          { header: 'Notas', dataKey: 'notas' },
        ],
        data: tratamientos,
      },
    ],
    headerColor: 'FF8E44AD', // Púrpura
  });
};

export const exportUsuariosExcel = (usuarios: any[]) => {
  exportExcel({
    filename: `usuarios_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Usuarios',
        columns: [
          { header: 'ID', dataKey: 'id' },
          { header: 'Nombre Completo', dataKey: 'nombre_completo' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Usuario', dataKey: 'username' },
          { header: 'Rol', dataKey: 'rol' },
          { header: 'Activo', dataKey: 'is_active' },
          { header: 'Fecha Creación', dataKey: 'date_joined' },
        ],
        data: usuarios,
      },
    ],
    headerColor: 'FFF39C12', // Naranja
  });
};

// Exportar carpeta médica completa
export const exportCarpetaMedicaExcel = (paciente: any) => {
  const antecedentes = [
    { tipo: 'FAMILIARES', datos: paciente.antecedentes_familiares || {} },
    { tipo: 'PERSONALES', datos: paciente.antecedentes_personales || {} },
    { tipo: 'NO PATOLÓGICOS', datos: paciente.antecedentes_no_patologicos || {} },
    ...(paciente.sexo === 'Femenino' ? [{ tipo: 'GINECOLÓGICOS', datos: paciente.antecedentes_ginecologicos || {} }] : []),
  ];

  const workbook = XLSX.utils.book_new();

  // Hoja de información del paciente
  const infoPaciente = [
    ['INFORMACIÓN DEL PACIENTE', ''],
    ['Cédula', paciente.ci],
    ['Nombres', paciente.nombres],
    ['Apellido Paterno', paciente.apellido_paterno],
    ['Apellido Materno', paciente.apellido_materno || 'N/A'],
    ['Sexo', paciente.sexo],
    ['Edad', paciente.edad],
    ['Fecha Nacimiento', paciente.fecha_nacimiento || 'N/A'],
    ['Celular', paciente.celular || 'N/A'],
    ['Teléfono', paciente.telefono || 'N/A'],
    ['Dirección', paciente.direccion || 'N/A'],
    ['Ocupación', paciente.ocupacion || 'N/A'],
    ['Contacto Emergencia', paciente.contacto_emergencia || 'N/A'],
    ['Teléfono Emergencia', paciente.telefono_emergencia || 'N/A'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Información');

  // Campos a excluir de la exportación
  const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];

  // Hoja de antecedentes
  antecedentes.forEach((section) => {
    const data: any[][] = [
      [section.tipo, ''],
      ['Condición', 'Valor'],
    ];

    Object.entries(section.datos).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key)) return;

      const label = key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayValue = '';
      if (typeof value === 'boolean') {
        displayValue = value ? '✓ Sí' : '✗ No';
      } else if (typeof value === 'string' && value) {
        displayValue = value;
      } else if (value) {
        displayValue = String(value);
      } else {
        displayValue = 'No especificado';
      }

      data.push([label, displayValue]);
    });

    if (data.length > 2) { // Solo agregar si hay datos además de los headers
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 40 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, ws, section.tipo.substring(0, 10));
    }
  });

  XLSX.writeFile(workbook, `carpeta_medica_${paciente.ci}_${new Date().getTime()}.xlsx`);
};
