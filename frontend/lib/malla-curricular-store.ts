export type MateriaEstado = 'APROBADA' | 'REPROBADA' | 'CURSANDO' | 'PENDIENTE' | 'BLOQUEADA';

export interface MateriaCurricular {
  id: string; // Ej: OEN-611
  nombre: string;
  semestre: number;
  prerequisitos: string[]; // IDs de materias que deben estar APROBADAS para cursarla
}

export const MALLA_ODONTOLOGIA: MateriaCurricular[] = [
  // Semestre 5 (Pre-clínica y Básicas)
  { id: 'SGE-511', nombre: 'Semiología General', semestre: 5, prerequisitos: [] },
  { id: 'PSA-511', nombre: 'Psicología de la Salud', semestre: 5, prerequisitos: [] },
  { id: 'FOC-511', nombre: 'Fisiología de la Oclusión', semestre: 5, prerequisitos: [] },
  { id: 'IES-511', nombre: 'Imagenología Estomatológica I', semestre: 5, prerequisitos: [] },
  { id: 'BIO-511', nombre: 'Biomateriales', semestre: 5, prerequisitos: [] },
  { id: 'FES-511', nombre: 'Farmacología Estomatológica', semestre: 5, prerequisitos: [] },
  
  // Semestre 6 (Inicio Clínica)
  { id: 'SES-611', nombre: 'Semiología Estomatológica', semestre: 6, prerequisitos: ['SGE-511'] },
  { id: 'IES-612', nombre: 'Imagenología Estomatológica II', semestre: 6, prerequisitos: ['IES-511'] },
  { id: 'OEN-611', nombre: 'Operatoria y Endodoncia I', semestre: 6, prerequisitos: ['BIO-511'] },
  { id: 'PRE-611', nombre: 'Prostodoncia Removible I', semestre: 6, prerequisitos: ['BIO-511'] },
  { id: 'CBU-611', nombre: 'Cirugía Bucal I', semestre: 6, prerequisitos: ['FES-511', 'SGE-511'] },
  { id: 'PFI-611', nombre: 'Prostodoncia Fija I', semestre: 6, prerequisitos: ['FOC-511'] },
  { id: 'TOD-611', nombre: 'Tecnología Odontológica', semestre: 6, prerequisitos: [] },
  
  // Semestre 7
  { id: 'UEO-711', nombre: 'Urgencias y Emergencias', semestre: 7, prerequisitos: ['SES-611', 'FES-511'] },
  { id: 'PER-711', nombre: 'Periodoncia I', semestre: 7, prerequisitos: ['SES-611'] },
  { id: 'OEN-712', nombre: 'Operatoria y Endodoncia II', semestre: 7, prerequisitos: ['OEN-611'] },
  { id: 'PRE-712', nombre: 'Prostodoncia Removible II', semestre: 7, prerequisitos: ['PRE-611'] },
  { id: 'CBU-712', nombre: 'Cirugía Bucal II', semestre: 7, prerequisitos: ['CBU-611'] },
  { id: 'PFI-712', nombre: 'Prostodoncia Fija II', semestre: 7, prerequisitos: ['PFI-611'] },
  { id: 'OLD-711', nombre: 'Odontología Legal y Deontología', semestre: 7, prerequisitos: [] },

  // Semestre 8
  { id: 'ORT-811', nombre: 'Ortodoncia', semestre: 8, prerequisitos: ['FOC-511'] },
  { id: 'PER-812', nombre: 'Periodoncia II', semestre: 8, prerequisitos: ['PER-711'] },
  { id: 'OEN-813', nombre: 'Operatoria y Endodoncia III', semestre: 8, prerequisitos: ['OEN-712'] },
  { id: 'PRE-813', nombre: 'Prostodoncia Removible III', semestre: 8, prerequisitos: ['PRE-712'] },
  { id: 'CBU-813', nombre: 'Cirugía Bucal III', semestre: 8, prerequisitos: ['CBU-712'] },
  { id: 'PFI-813', nombre: 'Prostodoncia Fija III', semestre: 8, prerequisitos: ['PFI-712'] },
  { id: 'ODO-811', nombre: 'Odontopediatría', semestre: 8, prerequisitos: ['OEN-712'] },
];

// Estado de notas del estudiante (demo)
export interface RecordEstudiante {
  estudianteId: string;
  nombre: string;
  semestreActual: number;
  historial: Record<string, MateriaEstado>; // ID Materia -> Estado
}

const DEFAULT_RECORD: RecordEstudiante = {
  estudianteId: 'demo-1',
  nombre: 'Est. Demo Académico',
  semestreActual: 7,
  historial: {
    'SGE-511': 'APROBADA',
    'PSA-511': 'APROBADA',
    'FOC-511': 'APROBADA',
    'IES-511': 'APROBADA',
    'BIO-511': 'APROBADA',
    'FES-511': 'APROBADA',
    
    'SES-611': 'APROBADA',
    'IES-612': 'APROBADA',
    'OEN-611': 'APROBADA',
    'PRE-611': 'APROBADA',
    'CBU-611': 'APROBADA',
    'PFI-611': 'APROBADA',
    'TOD-611': 'APROBADA',

    'UEO-711': 'CURSANDO',
    'PER-711': 'CURSANDO',
    'OEN-712': 'CURSANDO',
    'PRE-712': 'CURSANDO',
    'CBU-712': 'CURSANDO',
    'PFI-712': 'CURSANDO',
    'OLD-711': 'CURSANDO',
  }
};

export function getRecordAcademico(): RecordEstudiante {
  if (typeof window === 'undefined') return DEFAULT_RECORD;
  try {
    const stored = localStorage.getItem('record_academico');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('record_academico', JSON.stringify(DEFAULT_RECORD));
    return DEFAULT_RECORD;
  } catch {
    return DEFAULT_RECORD;
  }
}

export function saveRecordAcademico(record: RecordEstudiante) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('record_academico', JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('academico-update'));
  }
}

// Lógica del Motor de Pre-requisitos
export function calcularEstadoMateria(materiaId: string, record: RecordEstudiante): MateriaEstado {
  // 1. Si ya tiene un estado explícito, devolverlo
  if (record.historial[materiaId]) {
    // Pero espera, si es CURSANDO, debemos asegurarnos de que no haya reprobado un prerequisito.
    // Aunque normalmente el sistema no lo dejaría seleccionar, lo verificamos:
    const materia = MALLA_ODONTOLOGIA.find(m => m.id === materiaId);
    if (!materia) return 'PENDIENTE';
    
    const prerreqFallido = materia.prerequisitos.some(req => 
      record.historial[req] !== 'APROBADA'
    );
    
    // Si lo tenía cursando o aprobado pero de repente se reprobó un prerequisito, se bloquea.
    if (prerreqFallido && (record.historial[materiaId] === 'CURSANDO' || record.historial[materiaId] === 'PENDIENTE')) {
      return 'BLOQUEADA';
    }
    
    return record.historial[materiaId];
  }

  // 2. Buscar en la malla
  const materia = MALLA_ODONTOLOGIA.find(m => m.id === materiaId);
  if (!materia) return 'PENDIENTE';

  // 3. Verificar si algún prerequisito no está aprobado
  const bloqueada = materia.prerequisitos.some(reqId => {
    const estadoReq = record.historial[reqId];
    return estadoReq !== 'APROBADA';
  });

  if (bloqueada) return 'BLOQUEADA';

  // Si no está bloqueada ni tiene estado, está pendiente para ser cursada
  return 'PENDIENTE';
}
