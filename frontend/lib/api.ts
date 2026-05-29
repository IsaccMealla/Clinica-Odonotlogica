// API Service para conectar con el backend Django

const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:8000/api`
  : 'http://localhost:8000/api'

// Interfaz para la respuesta
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Función para obtener token de autenticación JWT
async function getJWTToken(): Promise<string | null> {
  try {
    // En desarrollo, intentar obtener token del localStorage pero no es obligatorio
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('access_token')
      if (stored) {
        console.log('✅ Token de sesión encontrado')
        return stored
      }
    }

    // En desarrollo, los endpoints permiten acceso sin token
    console.log('ℹ️ Modo desarrollo: acceso sin token habilitado')
    return null
  } catch (error) {
    console.log('ℹ️ Continuando sin token')
    return null
  }
}

// Función genérica para hacer requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    // Usar token pasado o del localStorage si existe
    let authToken = token
    if (!authToken && typeof window !== 'undefined') {
      authToken = localStorage.getItem('access_token') || undefined
    }

    if (authToken) {
      // JWT usa "Bearer" token
      headers['Authorization'] = `Bearer ${authToken}`
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
    const method = options.method || 'GET'
    
    console.log(`📡 ${method} ${endpoint}`)
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`⚠️ HTTP ${response.status}: ${errorText.substring(0, 100)}`)
      return {
        error: `HTTP ${response.status}`,
        status: response.status,
      }
    }

    const data = await response.json()
    const dataInfo = Array.isArray(data) 
      ? `${data.length} items` 
      : typeof data === 'object' 
        ? 'object' 
        : 'value'
    
    console.log(`✅ ${endpoint} → ${dataInfo}`)
    return {
      data,
      status: response.status,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error(`❌ Error en ${endpoint}: ${errorMsg}`)
    return {
      error: errorMsg,
      status: 0,
    }
  }
}

// Tipos de datos
export interface Paciente {
  id: number
  nombres: string
  apellido_paterno: string
  apellido_materno?: string
  ci: string
  email?: string
  celular?: string
  fecha_nacimiento?: string
  genero?: string
  alerta_abandono: boolean
  activo: boolean
}

export interface Cita {
  id: number
  paciente: number | Paciente
  estudiante: number
  docente: number
  gabinete: number
  fecha_hora: string
  duracion_estimada: number
  estado: string
  motivo: string
  activo?: boolean
}

export interface Tratamiento {
  id: number
  paciente: number
  estudiante: number
  docente: number
  diagnostico?: string
  plan_tratamiento?: string
  estado?: string
  creado_en: string
  activo?: boolean
}

export interface Usuario {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  rol: string
}

export interface Dashboard {
  total_pacientes: number
  pacientes_activos: number
  citas_hoy: number
  tratamientos_en_proceso: number
}

// Servicios de API

export const pacienteService = {
  // Obtener todos los pacientes
  async getAll(token?: string) {
    return apiRequest<Paciente[]>('/pacientes/', {}, token)
  },

  // Obtener pacientes activos
  async getActivos(token?: string) {
    return apiRequest<Paciente[]>('/pacientes/?activo=true', {}, token)
  },

  // Obtener un paciente
  async getById(id: number, token?: string) {
    return apiRequest<Paciente>(`/pacientes/${id}/`, {}, token)
  },

  // Crear paciente
  async create(data: Partial<Paciente>, token?: string) {
    return apiRequest<Paciente>(
      '/pacientes/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    )
  },

  // Actualizar paciente
  async update(id: number, data: Partial<Paciente>, token?: string) {
    return apiRequest<Paciente>(
      `/pacientes/${id}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    )
  },

  // Soft delete
  async delete(id: number, token?: string) {
    return apiRequest(
      `/pacientes/${id}/papelera/`,
      {
        method: 'POST',
      },
      token
    )
  },
}

export const citaService = {
  // Obtener todas las citas
  async getAll(token?: string) {
    return apiRequest<Cita[]>('/citas/', {}, token)
  },

  // Obtener citas activas
  async getActivas(token?: string) {
    return apiRequest<Cita[]>('/citas/?activo=true', {}, token)
  },

  // Obtener citas de hoy
  async getHoy(token?: string) {
    try {
      const resp = await apiRequest<Cita[]>('/citas/', {}, token)
      if (resp.data) {
        const today = new Date().toISOString().split('T')[0]
        const filtered = resp.data.filter((cita) => {
          const citaDate = new Date(cita.fecha_hora).toISOString().split('T')[0]
          return citaDate === today
        })
        console.log(`📅 Citas filtradas para hoy: ${filtered.length}/${resp.data.length}`)
        return { ...resp, data: filtered }
      }
      return resp
    } catch (error) {
      return {
        error: 'Error cargando citas',
        status: 0,
      }
    }
  },

  // Obtener una cita
  async getById(id: number, token?: string) {
    return apiRequest<Cita>(`/citas/${id}/`, {}, token)
  },

  // Crear cita
  async create(data: Partial<Cita>, token?: string) {
    return apiRequest<Cita>(
      '/citas/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    )
  },

  // Actualizar cita
  async update(id: number, data: Partial<Cita>, token?: string) {
    return apiRequest<Cita>(
      `/citas/${id}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      token
    )
  },
}

export const tratamientoService = {
  // Obtener todos los tratamientos
  async getAll(token?: string) {
    return apiRequest<Tratamiento[]>('/tratamientos/', {}, token)
  },

  // Obtener tratamientos activos
  async getActivos(token?: string) {
    return apiRequest<Tratamiento[]>('/tratamientos/?activo=true', {}, token)
  },

  // Obtener mis asignaciones
  async getMisAsignaciones(token?: string) {
    return apiRequest<Tratamiento[]>(
      '/tratamientos/mis_asignaciones/',
      {},
      token
    )
  },

  // Obtener un tratamiento
  async getById(id: number, token?: string) {
    return apiRequest<Tratamiento>(`/tratamientos/${id}/`, {}, token)
  },

  // Crear tratamiento
  async create(data: Partial<Tratamiento>, token?: string) {
    return apiRequest<Tratamiento>(
      '/tratamientos/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token
    )
  },
}

export const dashboardService = {
  // Obtener estadísticas
  async getStats(token?: string) {
    try {
      const pacientes = await pacienteService.getActivos(token)
      const citas = await citaService.getHoy(token)
      const tratamientos = await tratamientoService.getActivos(token)

      return {
        data: {
          total_pacientes: pacientes.data?.length || 0,
          citas_hoy: citas.data?.length || 0,
          tratamientos_activos: tratamientos.data?.length || 0,
        },
        status: 200,
      }
    } catch (error) {
      return {
        error: 'Error cargando estadísticas',
        status: 0,
        data: {
          total_pacientes: 0,
          citas_hoy: 0,
          tratamientos_activos: 0,
        },
      }
    }
  },
}

export const usuarioService = {
  // Obtener usuario actual
  async getCurrentUser(token?: string) {
    return apiRequest<Usuario>('/usuarios/me/', {}, token)
  },
}
