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
  const { filename, sheets, headerColor = 'FF00805F' } = options; // Verde clínico de la marca

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

// Exportar paciente con diferentes niveles de granularidad en Excel
export const exportPacienteDetalleExcel = (
  paciente: any, 
  config: { incluirAntecedentes: boolean; incluirCarpetaMedica: boolean }
) => {
  const { incluirAntecedentes, incluirCarpetaMedica } = config;
  const workbook = XLSX.utils.book_new();

  // 1. Hoja de información básica del paciente
  const infoPaciente = [
    ['FICHA DE IDENTIFICACIÓN Y CONTACTO', ''],
    ['Cédula de Identidad', paciente.ci],
    ['Nombres', paciente.nombres],
    ['Apellido Paterno', paciente.apellido_paterno],
    ['Apellido Materno', paciente.apellido_materno || 'N/A'],
    ['Sexo', paciente.sexo],
    ['Edad', paciente.edad],
    ['Fecha de Nacimiento', paciente.fecha_nacimiento || 'N/A'],
    ['Número de Celular', paciente.celular || 'N/A'],
    ['Teléfono Fijo', paciente.telefono || 'N/A'],
    ['Dirección de Domicilio', paciente.direccion || 'N/A'],
    ['Ocupación', paciente.ocupacion || 'N/A'],
    ['Contacto de Emergencia', paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A'],
    ['Teléfono de Emergencia', paciente.telefono_emergencia || 'N/A'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Datos Personales');

  // Campos a excluir
  const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];

  // Función auxiliar para agregar sección como hoja
  const addSectionSheet = (sheetName: string, sectionData: any) => {
    const data: any[][] = [
      [sheetName.toUpperCase(), ''],
      ['Concepto / Condición', 'Registro / Observación'],
    ];

    Object.entries(sectionData).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key)) return;

      const label = key
        .replace(/_/g, ' ')
        .replace(/alergia_/g, '')
        .replace(/problema_/g, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayValue = '';
      if (typeof value === 'boolean') {
        displayValue = value ? 'Sí' : 'No';
      } else if (typeof value === 'string' && value) {
        displayValue = value;
      } else if (value) {
        displayValue = String(value);
      } else {
        displayValue = 'No registrado';
      }

      data.push([label, displayValue]);
    });

    if (data.length > 2) {
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 40 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  };

  // 2. Antecedentes (Si aplica)
  if (incluirAntecedentes) {
    addSectionSheet('A. Personales', paciente.antecedentes_personales || {});
    addSectionSheet('A. Familiares', paciente.antecedentes_familiares || {});
    addSectionSheet('A. No Patológicos', paciente.antecedentes_no_patologicos || {});
    if (paciente.sexo === 'Femenino') {
      addSectionSheet('A. Ginecología', paciente.antecedentes_ginecologicos || {});
    }
  }

  // 3. Carpeta Médica ampliada (Si aplica)
  if (incluirCarpetaMedica) {
    addSectionSheet('Examen Físico', paciente.examenes_clinicos_fisicos?.[0] || {});
    addSectionSheet('Examen Periodontal', paciente.examenes_periodontales?.[0] || {});

    // Opcional: Hoja de periodontogramas
    if (paciente.periodontogramas && paciente.periodontogramas.length > 0) {
      const dataPerio: any[][] = [
        ['EXÁMENES DE PERIODONTOGRAMA REGISTRADOS', ''],
        ['Fecha de Registro', 'Datos de Arcada Vestibular Superior'],
      ];
      paciente.periodontogramas.forEach((p: any) => {
        dataPerio.push([
          new Date(p.fecha_aprobacion || Date.now()).toLocaleDateString(),
          JSON.stringify(p.datos_vestibular_superior || {})
        ]);
      });
      const wsPerio = XLSX.utils.aoa_to_sheet(dataPerio);
      wsPerio['!cols'] = [{ wch: 25 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, wsPerio, 'Periodontograma');
    }
  }

  // Determinar nombre del archivo
  let suffix = 'basico';
  if (incluirAntecedentes && incluirCarpetaMedica) suffix = 'completo';
  else if (incluirAntecedentes) suffix = 'con_antecedentes';
  else if (incluirCarpetaMedica) suffix = 'con_carpeta_medica';

  XLSX.writeFile(workbook, `paciente_${paciente.ci}_${suffix}.xlsx`);
};

export const exportCarpetaMedicaExcel = (paciente: any) => {
  exportPacienteDetalleExcel(paciente, { incluirAntecedentes: true, incluirCarpetaMedica: true });
};

// Funciones específicas por módulo
export const exportPacientesExcel = (pacientes: any[]) => {
  exportExcel({
    filename: `pacientes_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Pacientes',
        columns: [
          { header: 'Cédula de Identidad', dataKey: 'ci' },
          { header: 'Nombres', dataKey: 'nombres' },
          { header: 'Apellido Paterno', dataKey: 'apellido_paterno' },
          { header: 'Apellido Materno', dataKey: 'apellido_materno' },
          { header: 'Sexo', dataKey: 'sexo' },
          { header: 'Edad (años)', dataKey: 'edad' },
          { header: 'Número de Celular', dataKey: 'celular' },
          { header: 'Teléfono Fijo', dataKey: 'telefono' },
          { header: 'Dirección de Domicilio', dataKey: 'direccion' },
          { header: 'Ocupación', dataKey: 'ocupacion' },
          { header: 'Contacto de Emergencia', dataKey: 'contacto_emergencia' },
          { header: 'Teléfono Emergencia', dataKey: 'telefono_emergencia' },
        ],
        data: pacientes,
      },
    ],
    headerColor: 'FF00805F', // Verde
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
          { header: 'Estudiante operador', dataKey: 'estudiante_nombre' },
          { header: 'Docente supervisor', dataKey: 'docente_nombre' },
          { header: 'Estado Académico', dataKey: 'estado' },
          { header: 'Fecha Asignación', dataKey: 'fecha_asignacion' },
          { header: 'Observaciones', dataKey: 'observaciones' },
        ],
        data: asignaciones,
      },
    ],
    headerColor: 'FF00805F',
  });
};

export const exportCitasExcel = (citas: any[]) => {
  exportExcel({
    filename: `citas_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Citas Odontológicas',
        columns: [
          { header: 'Paciente', dataKey: 'paciente_nombre' },
          { header: 'Fecha', dataKey: 'fecha' },
          { header: 'Hora', dataKey: 'hora' },
          { header: 'Sillón asignado', dataKey: 'sillon' },
          { header: 'Estudiante operador', dataKey: 'estudiante_nombre' },
          { header: 'Docente supervisor', dataKey: 'docente_nombre' },
          { header: 'Estado', dataKey: 'estado' },
          { header: 'Motivo de Consulta', dataKey: 'motivo' },
        ],
        data: citas,
      },
    ],
    headerColor: 'FF00805F',
  });
};

export const exportTratamientosExcel = (tratamientos: any[]) => {
  exportExcel({
    filename: `tratamientos_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Tratamientos',
        columns: [
          { header: 'Paciente', dataKey: 'paciente_nombre_completo' },
          { header: 'Tratamiento Planificado', dataKey: 'nombre_tratamiento' },
          { header: 'Pieza Dental', dataKey: 'diente_pieza' },
          { header: 'Estudiante operador', dataKey: 'estudiante_nombre_completo' },
          { header: 'Estado', dataKey: 'estado' },
          { header: 'Fecha de Registro', dataKey: 'creado_en' },
        ],
        data: tratamientos,
      },
    ],
    headerColor: 'FF00805F',
  });
};

export const exportUsuariosExcel = (usuarios: any[]) => {
  exportExcel({
    filename: `usuarios_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Usuarios',
        columns: [
          { header: 'ID cuenta', dataKey: 'id' },
          { header: 'Nombre Completo', dataKey: 'nombre_completo' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Nombre de Usuario', dataKey: 'username' },
          { header: 'Rol asignado', dataKey: 'rol' },
          { header: 'Estado Cuenta', dataKey: 'is_active' },
        ],
        data: usuarios.map(u => ({
          ...u,
          nombre_completo: u.nombre_completo || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'
        })),
      },
    ],
    headerColor: 'FF00805F',
  });
};

export const exportAsistenciaExcel = (registros: any[]) => {
  exportExcel({
    filename: `asistencias_${new Date().getTime()}.xlsx`,
    sheets: [
      {
        name: 'Asistencia Biométrica',
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
      },
    ],
    headerColor: 'FF00805F',
  });
};

export const exportPacientesLoteExcel = (
  pacientes: any[],
  config: { incluirAntecedentes: boolean; incluirCarpetaMedica: boolean },
  tituloListado: string
) => {
  const workbook = XLSX.utils.book_new();
  const headerColor = 'FF00805F';

  // 1. Hoja de Listado General
  const dataGeneral = pacientes.map((p) => ({
    Cédula: p.ci,
    Paciente: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`,
    Sexo: p.sexo,
    Edad: p.edad,
    Celular: p.celular || 'N/A',
    Dirección: p.direccion || 'N/A'
  }));

  const wsGeneral = XLSX.utils.json_to_sheet(dataGeneral);
  wsGeneral['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsGeneral, 'Listado General');

  // 2. Hoja de Antecedentes consolidados (Si se activa)
  if (config.incluirAntecedentes) {
    const dataAntecedentes = pacientes.map((p) => {
      const antPers = p.antecedentes_personales || {};
      const antFam = p.antecedentes_familiares || {};
      
      return {
        Paciente: `${p.nombres} ${p.apellido_paterno}`,
        'Alergia Penicilina': antPers.alergia_penicilina ? 'Sí' : 'No',
        'Asma Bronquial': antPers.asma ? 'Sí' : 'No',
        Diabetes: antPers.diabetes ? 'Sí' : 'No',
        Hipertensión: antFam.hipertension_arterial ? 'Sí' : 'No',
        Cardiopatías: antFam.cardiologicos ? 'Sí' : 'No',
        ' VIH Positivo': antPers.vih_positivo ? 'Sí' : 'No',
      };
    });

    const wsAntecedentes = XLSX.utils.json_to_sheet(dataAntecedentes);
    wsAntecedentes['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsAntecedentes, 'Antecedentes');
  }

  // 3. Hoja de Fichas Clínicas consolidadas (Si se activa)
  if (config.incluirCarpetaMedica) {
    const dataFichas = pacientes.map((p) => {
      const ef = p.examenes_clinicos_fisicos?.[0] || {};
      const ep = p.examenes_periodontales?.[0] || {};
      
      return {
        Paciente: `${p.nombres} ${p.apellido_paterno}`,
        Temperatura: ef.temperatura_c ? `${ef.temperatura_c} °C` : 'N/A',
        'Presión Arterial': ef.presion_arterial || 'N/A',
        Pulso: ef.pulso || 'N/A',
        'Frecuencia Resp.': ef.frecuencia_respiratoria || 'N/A',
        'Simetría Facial': ef.cara_simetria ? 'Simétrico' : 'Asimétrico',
        'Color Encías': ep.color || 'N/A',
        'Textura Encías': ep.textura || 'N/A',
      };
    });

    const wsFichas = XLSX.utils.json_to_sheet(dataFichas);
    wsFichas['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, wsFichas, 'Fichas Clínicas');
  }

  XLSX.writeFile(workbook, `dossier_pacientes_${tituloListado.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
};

// ========== EXPORTADORES DE SUBMÓDULOS INDIVIDUALES ==========

export const exportSubmoduloHistoriaClinicaExcel = (paciente: any, formData: any) => {
  const workbook = XLSX.utils.book_new();

  // 1. Hoja de información básica del paciente
  const infoPaciente = [
    ['FICHA DE IDENTIFICACIÓN Y CONTACTO', ''],
    ['Cédula de Identidad', paciente.ci],
    ['Nombres', paciente.nombres],
    ['Apellido Paterno', paciente.apellido_paterno],
    ['Apellido Materno', paciente.apellido_materno || 'N/A'],
    ['Sexo', paciente.sexo],
    ['Edad', paciente.edad],
    ['Fecha de Nacimiento', paciente.fecha_nacimiento || 'N/A'],
    ['Número de Celular', paciente.celular || 'N/A'],
    ['Teléfono Fijo', paciente.telefono || 'N/A'],
    ['Dirección de Domicilio', paciente.direccion || 'N/A'],
    ['Ocupación', paciente.ocupacion || 'N/A'],
    ['Contacto de Emergencia', paciente.contacto_emergencia_nombre || paciente.contacto_emergencia || 'N/A'],
    ['Teléfono de Emergencia', paciente.telefono_emergencia || 'N/A'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Datos Personales');

  const fieldsToExclude = ['id', 'estado_academico', 'estudiante', 'docente_supervisor', 'fecha_aprobacion', 'comentarios_docente'];

  const addSectionSheet = (sheetName: string, sectionData: any, isGynecology: boolean = false) => {
    if (isGynecology && paciente.sexo !== 'Femenino') return;
    if (!sectionData || Object.keys(sectionData).length === 0) return;
    const data: any[][] = [
      [sheetName.toUpperCase(), ''],
      ['Concepto / Condición', 'Registro / Observación'],
    ];

    const keysHandled = new Set<string>();

    Object.entries(sectionData).forEach(([key, value]) => {
      if (fieldsToExclude.includes(key) || keysHandled.has(key)) return;

      if (key.endsWith('_obs')) {
        const parentKey = key.slice(0, -4);
        if (parentKey in sectionData) {
          return; // handled by parent
        }
      }

      const label = key
        .replace(/_/g, ' ')
        .replace(/alergia_/g, '')
        .replace(/problema_/g, '')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayValue = '';
      if (typeof value === 'boolean') {
        const obsKey = `${key}_obs`;
        const obsVal = sectionData[obsKey];
        displayValue = value ? 'Sí' : 'No';
        if (value && obsVal) {
          displayValue = `Sí (Obs: ${obsVal})`;
        }
        keysHandled.add(obsKey);
      } else if (typeof value === 'string' && value) {
        displayValue = value;
      } else if (value !== null && value !== undefined && value !== '') {
        displayValue = String(value);
      } else {
        displayValue = 'No registrado';
      }

      data.push([label, displayValue]);
      keysHandled.add(key);
    });

    if (data.length > 2) {
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 40 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  };

  addSectionSheet('A. Personales', formData.personales || {});
  addSectionSheet('A. Familiares', formData.familiares || {});
  addSectionSheet('A. No Patológicos', formData.no_patologicos || {});
  addSectionSheet('A. Ginecología', formData.ginecologicos || {}, true);
  addSectionSheet('Hábitos', formData.habitos || {});
  addSectionSheet('Examen Físico', formData.examen_clinico_fisico || {});
  
  if (paciente.edad <= 14) {
    addSectionSheet('Odontopediatría', formData.historia_odontopediatrica || {});
  }
  
  addSectionSheet('A. Periodontales', formData.antecedentes_periodontales || {});
  addSectionSheet('Examen Periodontal', formData.examen_periodontal || {});

  XLSX.writeFile(workbook, `historia_clinica_${paciente.ci}.xlsx`);
};

export const exportSubmoduloPeriodontogramaExcel = (paciente: any, periodontoData: any) => {
  const workbook = XLSX.utils.book_new();

  // Ficha de paciente resumida
  const infoPaciente = [
    ['FICHA DE IDENTIFICACIÓN', ''],
    ['Cédula de Identidad', paciente.ci],
    ['Paciente', `${paciente.nombres} ${paciente.apellido_paterno}`],
    ['Sexo', paciente.sexo],
    ['Edad', paciente.edad],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Datos Paciente');

  const dientesSuperiores = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const dientesInferiores = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const buildSheetData = (arcadaData: Record<number, any>, dientes: number[]) => {
    return dientes.map(num => {
      const d = arcadaData?.[num] || {
        movilidad: "",
        implante: false,
        sangrado: [false, false, false],
        supuracion: [false, false, false],
        margen: [0, 0, 0],
        sondaje: [0, 0, 0],
      };
      return {
        'Pieza Dental': num,
        'Movilidad': d.movilidad || '-',
        'Implante': d.implante ? 'Sí' : 'No',
        'Sangrado (BOP)': d.sangrado ? d.sangrado.map((b: boolean) => b ? '1' : '0').join('-') : '0-0-0',
        'Supuración': d.supuracion ? d.supuracion.map((b: boolean) => b ? '1' : '0').join('-') : '0-0-0',
        'Margen (MG)': d.margen ? d.margen.join('-') : '0-0-0',
        'Sondaje (PS)': d.sondaje ? d.sondaje.join('-') : '0-0-0',
      };
    });
  };

  const addArcadaSheet = (sheetName: string, dataKey: string, dientes: number[]) => {
    const data = buildSheetData(periodontoData?.[dataKey] || {}, dientes);
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  };

  addArcadaSheet('Sup. Vestibular', 'datos_vestibular_superior', dientesSuperiores);
  addArcadaSheet('Sup. Palatino', 'datos_palatino_superior', dientesSuperiores);
  addArcadaSheet('Inf. Vestibular', 'datos_vestibular_inferior', dientesInferiores);
  addArcadaSheet('Inf. Lingual', 'datos_lingual_inferior', dientesInferiores);

  XLSX.writeFile(workbook, `periodontograma_${paciente.ci}.xlsx`);
};

export const exportSubmoduloTratamientosExcel = (paciente: any, tratamientos: any[]) => {
  const workbook = XLSX.utils.book_new();

  // Hoja paciente
  const infoPaciente = [
    ['FICHA DE IDENTIFICACIÓN', ''],
    ['Cédula de Identidad', paciente.ci],
    ['Paciente', `${paciente.nombres} ${paciente.apellido_paterno}`],
    ['Alergias', paciente.alergias || 'Ninguna registrada'],
    ['Enfermedades Base', paciente.enfermedades_base || 'Ninguna registrada'],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Datos Paciente');

  // Hoja de tratamientos
  const data = tratamientos.map(t => ({
    'Fecha de Registro': t.creado_en ? new Date(t.creado_en).toLocaleDateString('es-ES') : 'Sin fecha',
    'Tratamiento Planificado': t.nombre_tratamiento || 'N/A',
    'Pieza Dental': t.diente_pieza || 'General / Todo',
    'Estado': t.estado ? t.estado.replace('_', ' ').toUpperCase() : 'PENDIENTE'
  }));

  const wsTrat = XLSX.utils.json_to_sheet(data);
  wsTrat['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, wsTrat, 'Historial Tratamientos');

  XLSX.writeFile(workbook, `tratamientos_${paciente.ci}.xlsx`);
};

export const exportSubmoduloImagenesExcel = (paciente: any, imagenes: any[]) => {
  const workbook = XLSX.utils.book_new();

  // Hoja paciente
  const infoPaciente = [
    ['FICHA DE IDENTIFICACIÓN', ''],
    ['Cédula de Identidad', paciente.ci],
    ['Paciente', `${paciente.nombres} ${paciente.apellido_paterno}`],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoPaciente);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Datos Paciente');

  // Hoja de imágenes
  const data = imagenes.map(img => ({
    'Fecha de Adquisición': img.fecha_adquisicion ? new Date(img.fecha_adquisicion).toLocaleDateString('es-ES') : 'Sin fecha',
    'Categoría / Tipo': img.categoria || 'N/A',
    'Pieza Dental (Opcional)': img.pieza_dental || 'General / Completa',
    'Ruta / Nombre de Archivo': img.archivo ? img.archivo.split('/').pop() : 'N/A'
  }));

  const wsImg = XLSX.utils.json_to_sheet(data);
  wsImg['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, wsImg, 'Historial Radiográfico');

  XLSX.writeFile(workbook, `imagenes_rx_${paciente.ci}.xlsx`);
};
