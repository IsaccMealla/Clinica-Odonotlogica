export interface Cita {
  id: string
  paciente: string
  paciente_nombre: string
  estudiante: string
  estudiante_nombre: string
  docente: string
  docente_nombre: string
  gabinete: string
  gabinete_nombre: string
  motivo: string
  motivo_nombre: string
  fecha_hora: string
  estado: 'RESERVADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'ATENDIENDO' | 'NO_ASISTIO'
  check_in_time: string | null
  duracion_estimada: number
  creado_en: string
  actualizado_en: string
}

export interface Paciente {
  id: string
  ci: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  fecha_nacimiento: string
  sexo: string
  estado_civil: string
  ocupacion: string
  direccion: string
  celular: string
  telefono: string
  contacto_emergencia: string
  telefono_emergencia: string
  fecha_ultima_consulta: string | null
  motivo_ultima_consulta: string | null
  inasistencias: number
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface Usuario {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  rol: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE' | 'RECEPCIONISTA'
}

export interface Tratamiento {
  id: string
  paciente: string
  estudiante: string
  nombre_tratamiento: string
  diente_pieza: string | null
  estado: string
  creado_en: string
  actualizado_en: string
}

export interface Sillon {
  id: number
  nombre: string
  estado: string
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  descripcion: string | null
  ultima_revision: string
  dias_frecuencia_mantenimiento: number
  notas_tecnicas: string | null
  posicion_x: number
  posicion_y: number
  posicion_z: number
}