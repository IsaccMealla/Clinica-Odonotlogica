export const maxDuration = 30;

// ============= FUNCIONES PARA CONECTAR AL BACKEND =============

const BACKEND_URL = 'http://localhost:8000/api';

// Buscar pacientes por nombre
async function buscarPacientes(nombre: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/pacientes/?search=${encodeURIComponent(nombre)}`);
    if (!response.ok) throw new Error('Error al buscar pacientes');
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return [];
  }
}

// Obtener citas disponibles
async function obtenerCitas(fecha?: string) {
  try {
    const url = fecha 
      ? `${BACKEND_URL}/citas/?fecha=${fecha}`
      : `${BACKEND_URL}/citas/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener citas');
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    return [];
  }
}

// Obtener información de un paciente específico
async function obtenerPaciente(id: number) {
  try {
    const response = await fetch(`${BACKEND_URL}/pacientes/${id}/`);
    if (!response.ok) throw new Error('Paciente no encontrado');
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return null;
  }
}

// Obtener usuarios del sistema
async function obtenerUsuarios() {
  try {
    const response = await fetch(`${BACKEND_URL}/usuarios/`);
    if (!response.ok) throw new Error('Error al obtener usuarios');
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

// Obtener información estadística general
async function obtenerEstadisticas() {
  try {
    const [pacientes, citas, usuarios] = await Promise.all([
      fetch(`${BACKEND_URL}/pacientes/?limit=1`).then(r => r.json()).catch(() => ({ count: 0 })),
      fetch(`${BACKEND_URL}/citas/?limit=1`).then(r => r.json()).catch(() => ({ count: 0 })),
      fetch(`${BACKEND_URL}/usuarios/?limit=1`).then(r => r.json()).catch(() => ({ count: 0 })),
    ]);
    
    return {
      totalPacientes: pacientes.count || 0,
      totalCitas: citas.count || 0,
      totalUsuarios: usuarios.count || 0,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { totalPacientes: 0, totalCitas: 0, totalUsuarios: 0 };
  }
}

// ============= PROCESADOR DE CONTEXTO PARA EL AGENTE =============

async function procesarContextoDeAgente(mensajeUsuario: string) {
  const mensajeLower = mensajeUsuario.toLowerCase();
  const contexto = {
    buscandoPaciente: false,
    buscandoCitas: false,
    pidiendo: '',
    datosEncontrados: null as any,
  };

  // Detectar si busca pacientes
  if (
    mensajeLower.includes('paciente') || 
    mensajeLower.includes('buscar') ||
    mensajeLower.includes('encontrar') ||
    mensajeLower.includes('ver a')
  ) {
    contexto.buscandoPaciente = true;
    // Extraer el nombre si está disponible
    const palabras = mensajeUsuario.split(' ');
    const indicePalabra = palabras.findIndex(p => 
      p.toLowerCase().includes('buscar') || p.toLowerCase().includes('paciente')
    );
    const nombrePaciente = indicePalabra !== -1 ? palabras.slice(indicePalabra + 1).join(' ') : '';
    
    if (nombrePaciente && nombrePaciente.length > 2) {
      contexto.datosEncontrados = await buscarPacientes(nombrePaciente);
    }
  }

  // Detectar si busca citas
  if (
    mensajeLower.includes('cita') || 
    mensajeLower.includes('agendar') ||
    mensajeLower.includes('disponible') ||
    mensajeLower.includes('horario')
  ) {
    contexto.buscandoCitas = true;
    contexto.datosEncontrados = await obtenerCitas();
  }

  // Detectar si pide estadísticas
  if (
    mensajeLower.includes('estadística') || 
    mensajeLower.includes('total') ||
    mensajeLower.includes('cuántos') ||
    mensajeLower.includes('resumen')
  ) {
    contexto.datosEncontrados = await obtenerEstadisticas();
  }

  return contexto;
}

// ============= RUTA PRINCIPAL =============

export async function POST(req: Request) {
  try {
    const { messages, userRole, currentPath, currentData } = await req.json();
    const ultimoMensaje = messages[messages.length - 1]?.content || '';
    
    console.log("📨 Mensaje recibido:", ultimoMensaje);
    console.log("👥 Contexto de Usuario recibido:", { userRole, currentPath, currentData });

    // Obtener contexto del backend basado en las palabras clave del usuario
    const contextoAgente = await procesarContextoDeAgente(ultimoMensaje);
    console.log("🔍 Contexto base de datos detectado:", contextoAgente);

    let contextoDatos = 'Ninguno en particular.';
    if (contextoAgente.datosEncontrados) {
      if (Array.isArray(contextoAgente.datosEncontrados) && contextoAgente.datosEncontrados.length > 0) {
        if (contextoAgente.buscandoPaciente) {
          contextoDatos = `PACIENTES ENCONTRADOS EN BD:\n${
            contextoAgente.datosEncontrados
              .slice(0, 3)
              .map((p: any, i: number) => `${i + 1}. ${p.nombre_completo} - ID: ${p.id} - Cédula: ${p.cedula}`)
              .join('\n')
          }`;
        } else if (contextoAgente.buscandoCitas) {
          contextoDatos = `CITAS ACTIVAS EN BD: ${contextoAgente.datosEncontrados.length} citas registradas.`;
        }
      } else if (typeof contextoAgente.datosEncontrados === 'object') {
        contextoDatos = `ESTADÍSTICAS GENERALES DE BD:\n- Pacientes totales: ${contextoAgente.datosEncontrados.totalPacientes}\n- Citas totales: ${contextoAgente.datosEncontrados.totalCitas}\n- Usuarios: ${contextoAgente.datosEncontrados.totalUsuarios}`;
      }
    }

    // Normalizar datos de contexto del usuario
    const normalizedRole = userRole ? String(userRole).toUpperCase() : 'ESTUDIANTE';
    const normalizedPath = currentPath || '/dashboard';
    const normalizedData = currentData ? JSON.stringify(currentData) : 'Ninguno';

    // System Prompt altamente optimizado para Phi-3
    const systemPrompt = `Eres Byte, el asistente virtual inteligente de la "Clínica Dental Pro". Tu objetivo es ayudar al personal a operar el sistema de manera eficiente y guiarlos a las secciones correctas.

CONTEXTO EN TIEMPO REAL DEL SISTEMA (BASE DE DATOS):
${contextoDatos}

CONTEXTO DEL USUARIO ACTUAL EN PANTALLA:
- Rol del Usuario: ${normalizedRole}
- Ruta/Pantalla actual: ${normalizedPath}
- Datos en pantalla: ${normalizedData}

Secciones válidas del sistema a las que puedes guiar:
- Inicio / Dashboard: \`/dashboard\` (Todos los roles)
- Control de Asistencia: \`/asistencia\` (Todos los roles)
- Pacientes (Ver todos / Buscar): \`/pacientes\` (Solo ADMIN, DOCENTE, RECEPCIONISTA)
- Mis Pacientes: \`/mis-pacientes\` (Solo ESTUDIANTE)
- Asignación de Pacientes: \`/asignacion\` (Solo ADMIN, DOCENTE)
- Agenda de Citas: \`/citas\` (Todos los roles)
- Tratamientos y Procedimientos: \`/tratamientos\` (ADMIN, DOCENTE, ESTUDIANTE)
- Reportes Clínicos 3D: \`/reportes\` (Solo ADMIN, DOCENTE)
- Mantenimiento de Equipos: \`/mantenimiento\` (Todos los roles)
- Gestión de Usuarios: \`/usuarios\` (Solo ADMIN)
- Configuración del Sistema: \`/configuracion\` (Todos los roles)

REGLAS DE NAVEGACIÓN Y COMPORTAMIENTO:
1. Sé muy amable, profesional, conciso y clínico en tus explicaciones. Usa emojis moderadamente (🦷, 🚀, 📅).
2. Si el usuario te pide ir a una sección, te pregunta cómo llegar, o si crees que requiere ir a un módulo para completar su tarea, debes incluir la directiva exacta de navegación en una nueva línea al final:
   [NAV: /ruta]
   Ejemplo: "Por supuesto. Vamos a la sección de citas para que puedas agendar una nueva consulta.\\n[NAV: /citas]"
3. Si el usuario no tiene los permisos para una sección (según su Rol), explícales amablemente que no cuenta con el rol requerido para ver esa información y no incluyas la directiva de navegación.
4. Manten tus respuestas directas y breves para garantizar que el modelo responda de manera óptima y veloz.`;

    // Formatear mensajes para la API de Ollama
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    // Conectar a Ollama local
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'phi3:latest',
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: 0.2, // Baja temperatura para más estabilidad
        }
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Error al conectar con Ollama: ${ollamaResponse.statusText}`);
    }

    // Configurar stream de respuesta
    const reader = ollamaResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const content = parsed.message?.content || '';
                if (content) {
                  // Enviar en el formato SSE que espera el frontend
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', text: content })}\n\n`)
                  );
                }
              } catch (e) {
                console.error("Error al parsear línea de Ollama:", e, line);
              }
            }
          }
          controller.close();
        } catch (err) {
          console.error("Error procesando stream de Ollama:", err);
          controller.error(err);
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("❌ Error en el agente Ollama:", error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Error procesando solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}