// FILE: lib/supervision-store.ts
// Motor central de supervisión bidireccional (localStorage para demo)
"use client"

export interface SolicitudDocente {
  id: string
  estudianteId: string
  estudianteNombre: string
  pacienteId: string
  pacienteNombre: string
  modulo: string // 'M2_DIAGNOSTICO' | 'M3_TRATAMIENTO' | 'M4_CITAS' | 'M5_RADIOGRAFIA'
  accion: string
  timestamp: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  docenteId?: string
  docenteNombre?: string
  timestampRespuesta?: string
}

export interface PermisoProactivo {
  estudianteId: string
  modulo: string
  habilitado: boolean
  docenteId: string
  docenteNombre: string
  timestamp: string
}

const STORAGE_KEY_SOLICITUDES = 'supervision_solicitudes'
const STORAGE_KEY_PERMISOS = 'supervision_permisos_proactivos'
const STORAGE_KEY_STATS = 'supervision_stats_hoy'

// ==================== SOLICITUDES (Flujo A: Estudiante → Docente) ====================

export function crearSolicitud(data: Omit<SolicitudDocente, 'id' | 'timestamp' | 'estado'>): SolicitudDocente {
  const solicitudes = obtenerSolicitudes()
  const nueva: SolicitudDocente = {
    ...data,
    id: `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    estado: 'PENDIENTE'
  }
  solicitudes.push(nueva)
  localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes))
  
  // Disparar evento personalizado para notificar en tiempo real
  window.dispatchEvent(new CustomEvent('supervision-update', { detail: { tipo: 'nueva-solicitud', solicitud: nueva } }))
  return nueva
}

export function obtenerSolicitudes(): SolicitudDocente[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_SOLICITUDES) || '[]')
  } catch { return [] }
}

export function aprobarSolicitud(solicitudId: string, docenteId: string, docenteNombre: string) {
  const solicitudes = obtenerSolicitudes()
  const idx = solicitudes.findIndex(s => s.id === solicitudId)
  if (idx !== -1) {
    solicitudes[idx].estado = 'APROBADO'
    solicitudes[idx].docenteId = docenteId
    solicitudes[idx].docenteNombre = docenteNombre
    solicitudes[idx].timestampRespuesta = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes))
    
    // Incrementar stats
    incrementarProcedimientosHoy()
    
    window.dispatchEvent(new CustomEvent('supervision-update', { detail: { tipo: 'solicitud-aprobada', solicitud: solicitudes[idx] } }))
  }
}

export function rechazarSolicitud(solicitudId: string, docenteId: string, docenteNombre: string) {
  const solicitudes = obtenerSolicitudes()
  const idx = solicitudes.findIndex(s => s.id === solicitudId)
  if (idx !== -1) {
    solicitudes[idx].estado = 'RECHAZADO'
    solicitudes[idx].docenteId = docenteId
    solicitudes[idx].docenteNombre = docenteNombre
    solicitudes[idx].timestampRespuesta = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes))
    window.dispatchEvent(new CustomEvent('supervision-update', { detail: { tipo: 'solicitud-rechazada', solicitud: solicitudes[idx] } }))
  }
}

export function obtenerSolicitudesPendientes(): SolicitudDocente[] {
  return obtenerSolicitudes().filter(s => s.estado === 'PENDIENTE')
}

// ==================== PERMISOS PROACTIVOS (Flujo B: Docente → Estudiante) ====================

export function obtenerPermisosProactivos(): PermisoProactivo[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PERMISOS) || '[]')
  } catch { return [] }
}

export function togglePermisoProactivo(estudianteId: string, modulo: string, docenteId: string, docenteNombre: string): boolean {
  const permisos = obtenerPermisosProactivos()
  const idx = permisos.findIndex(p => p.estudianteId === estudianteId && p.modulo === modulo)
  
  let nuevoEstado: boolean
  
  if (idx !== -1) {
    permisos[idx].habilitado = !permisos[idx].habilitado
    permisos[idx].timestamp = new Date().toISOString()
    nuevoEstado = permisos[idx].habilitado
  } else {
    permisos.push({
      estudianteId,
      modulo,
      habilitado: true,
      docenteId,
      docenteNombre,
      timestamp: new Date().toISOString()
    })
    nuevoEstado = true
  }
  
  localStorage.setItem(STORAGE_KEY_PERMISOS, JSON.stringify(permisos))
  window.dispatchEvent(new CustomEvent('supervision-update', { detail: { tipo: 'permiso-proactivo', estudianteId, modulo, habilitado: nuevoEstado } }))
  return nuevoEstado
}

export function tienePermisoProactivo(estudianteId: string, modulo: string): boolean {
  const permisos = obtenerPermisosProactivos()
  const permiso = permisos.find(p => p.estudianteId === estudianteId && p.modulo === modulo)
  return permiso?.habilitado ?? false
}

export function verificarAccesoModulo(estudianteId: string, modulo: string): 'BLOQUEADO' | 'PERMISO_PROACTIVO' | 'SOLICITUD_PENDIENTE' | 'SOLICITUD_APROBADA' {
  // ========================================
  // BYPASS ADMIN / DOCENTE — Acceso irrestricto
  // ========================================
  if (typeof window !== 'undefined') {
    const userRol = (localStorage.getItem('user_rol') || '').toUpperCase().trim();
    const isSuperuser = localStorage.getItem('is_superuser') === 'true';
    if (isSuperuser || userRol === 'ADMIN' || userRol === 'ADMINISTRADOR' || userRol === 'DOCENTE' || userRol === 'RECEPCIONISTA') {
      return 'PERMISO_PROACTIVO'; // Acceso total sin modal
    }
  }

  // 1. ¿Tiene permiso proactivo del docente?
  if (tienePermisoProactivo(estudianteId, modulo)) return 'PERMISO_PROACTIVO'
  
  // 2. ¿Hay solicitud pendiente?
  const solicitudes = obtenerSolicitudes()
  const solicitudPendiente = solicitudes.find(s => s.estudianteId === estudianteId && s.modulo === modulo && s.estado === 'PENDIENTE')
  if (solicitudPendiente) return 'SOLICITUD_PENDIENTE'
  
  // 3. ¿Hay solicitud aprobada reciente (últimas 4 horas)?
  const ahora = Date.now()
  const solicitudAprobada = solicitudes.find(s => 
    s.estudianteId === estudianteId && 
    s.modulo === modulo && 
    s.estado === 'APROBADO' &&
    s.timestampRespuesta &&
    (ahora - new Date(s.timestampRespuesta).getTime()) < 4 * 60 * 60 * 1000
  )
  if (solicitudAprobada) return 'SOLICITUD_APROBADA'
  
  return 'BLOQUEADO'
}

// ==================== ESTADÍSTICAS DEL DÍA ====================

export function incrementarProcedimientosHoy() {
  const hoy = new Date().toISOString().slice(0, 10)
  const stats = obtenerStatsHoy()
  stats.procedimientos = (stats.procedimientos || 0) + 1
  stats.fecha = hoy
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
}

export function obtenerStatsHoy(): { fecha: string; procedimientos: number } {
  if (typeof window === 'undefined') return { fecha: '', procedimientos: 0 }
  try {
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEY_STATS) || '{}')
    const hoy = new Date().toISOString().slice(0, 10)
    if (stats.fecha !== hoy) return { fecha: hoy, procedimientos: 0 }
    return stats
  } catch { return { fecha: '', procedimientos: 0 } }
}

// ==================== DATOS DEMO (Estudiantes simulados) ====================

const DEFAULT_ESTUDIANTES = [
  { id: '4', nombre: 'Est. García López', paciente: 'Juan Pérez M.', pacienteId: '1', sillon: 'S-01', materia: 'Clínica de Operatoria I' },
  { id: '5', nombre: 'Est. Rodríguez V.', paciente: 'María Condori', pacienteId: '2', sillon: 'S-03', materia: 'Clínica de Endodoncia' },
  { id: '6', nombre: 'Est. Mamani T.', paciente: 'Carlos Quispe', pacienteId: '3', sillon: 'S-05', materia: 'Cirugía Bucal' },
  { id: '7', nombre: 'Est. Choque H.', paciente: 'Rosa Flores', pacienteId: '4', sillon: 'S-02', materia: 'Clínica de Operatoria I' },
]

export function getEstudiantesDemo(): any[] {
  if (typeof window === 'undefined') return DEFAULT_ESTUDIANTES
  try {
    let list = DEFAULT_ESTUDIANTES;
    const stored = localStorage.getItem('estudiantes_demo')
    if (stored) {
      list = JSON.parse(stored)
    } else {
      localStorage.setItem('estudiantes_demo', JSON.stringify(DEFAULT_ESTUDIANTES))
    }

    // Inyección dinámica del estudiante local (para pruebas cross-tab Recepción/Docente)
    const isPresente = localStorage.getItem("estudiante_presente") === "true";
    if (isPresente) {
       const nombre = localStorage.getItem("estudiante_nombre") || "Estudiante Local";
       const materia = localStorage.getItem("estudiante_materia") || "";
       if (!list.find(e => e.nombre === nombre)) {
         list = [...list, {
           id: `LOCAL-${Date.now()}`,
           nombre,
           paciente: "Paciente de Turno",
           pacienteId: "0",
           sillon: "S-Pendiente",
           materia
         }];
       }
    }
    return list;
  } catch {
    return DEFAULT_ESTUDIANTES
  }
}

export function saveEstudiantesDemo(estudiantes: any[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('estudiantes_demo', JSON.stringify(estudiantes))
    window.dispatchEvent(new CustomEvent('supervision-update'))
  }
}

// Para compatibilidad con código existente que use ESTUDIANTES_DEMO como array fijo (idealmente deberían migrar a getEstudiantesDemo)
export const ESTUDIANTES_DEMO = typeof window !== 'undefined' 
  ? (JSON.parse(localStorage.getItem('estudiantes_demo') || 'null') || DEFAULT_ESTUDIANTES) 
  : DEFAULT_ESTUDIANTES;

export const SILLONES_CLINICOS = [
  { id: 'S-01', nombre: 'Sillón 01', ocupado: true, estudiante: 'Est. García López' },
  { id: 'S-02', nombre: 'Sillón 02', ocupado: false, estudiante: null },
  { id: 'S-03', nombre: 'Sillón 03', ocupado: true, estudiante: 'Est. Rodríguez V.' },
  { id: 'S-04', nombre: 'Sillón 04', ocupado: false, estudiante: null },
  { id: 'S-05', nombre: 'Sillón 05', ocupado: true, estudiante: 'Est. Mamani T.' },
  { id: 'S-06', nombre: 'Sillón 06', ocupado: false, estudiante: null },
]

export const MODULOS_SUPERVISABLES = [
  { key: 'M2_DIAGNOSTICO', label: 'Diagnóstico / Odontograma', color: 'purple' },
  { key: 'M3_TRATAMIENTO', label: 'Plan de Tratamiento', color: 'indigo' },
  { key: 'M4_CITAS', label: 'Agendar Cita', color: 'cyan' },
  { key: 'M5_RADIOGRAFIA', label: 'Radiografías / Imágenes', color: 'blue' },
]
