import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Interceptor global para inyectar automáticamente el Token de autenticación en cada llamada
axios.interceptors.request.use(
  (config) => {
    // Recuperamos el token almacenado en el login (JWT con Bearer)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const radiografiaAPI = {
  
  async cargarRadiografia(pacienteId: string, archivo: File, categoria: string, descripcion = '') {
    const formData = new FormData();
    formData.append('paciente', pacienteId);
    formData.append('archivo', archivo);
    formData.append('categoria', categoria);
    formData.append('descripcion', descripcion);
    
    const response = await axios.post(`${API_BASE}/imagenes/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async procesarConIA(radiografiaId: string) {
    const response = await axios.post(
      `${API_BASE}/imagenes/${radiografiaId}/procesar_ia/`,
      {}
    );
    return response.data;
  },

  async obtenerEstado(radiografiaId: string) {
    const response = await axios.get(
      `${API_BASE}/imagenes/${radiografiaId}/estado_procesamiento/`
    );
    return response.data;
  },

  async registrarDiagnosticoManual(radiografiaId: string, hallazgos: any[]) {
    const response = await axios.post(
      `${API_BASE}/imagenes/${radiografiaId}/diagnostico_manual/`,
      { hallazgos },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  async descargarImagenAnotada(radiografiaId: string) {
    const response = await axios.get(
      `${API_BASE}/imagenes/${radiografiaId}/descargar_imagen_anotada/`
    );
    return response.data;
  },

  async listarPorPaciente(pacienteId: string) {
    const response = await axios.get(
      `${API_BASE}/imagenes/?paciente=${pacienteId}`
    );
    return response.data;
  },

  async listarParaAnalizar(pacienteId: string) {
    const response = await axios.get(
      `${API_BASE}/imagenes/listar_para_analizar/?paciente=${pacienteId}`
    );
    return response.data;
  },

  async obtenerHistorialAnalisis(radiografiaId: string) {
    const response = await axios.get(
      `${API_BASE}/imagenes/${radiografiaId}/historial_analisis/`
    );
    return response.data;
  }
};

export const hallazgosAPI = {
  crearAnotacion(canvasData: any, hallazgos: any[]) {
    return hallazgos.map((h: any) => ({
      ...h,
      timestamp: new Date().toISOString()
    }));
  },

  validarHallazgos(hallazgos: any[]) {
    const campos_requeridos = ['etiqueta', 'bounding_box', 'observaciones'];
    return hallazgos.every((h: any) =>
      campos_requeridos.every(c => c in h)
    );
  }
};