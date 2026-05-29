"use client"

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Mapa de rutas y secciones válidas con sus títulos e íconos estéticos del sistema de la Clínica Dental Pro
const MAPA_RUTAS: Record<string, { titulo: string; icono: string }> = {
  '/dashboard': { titulo: 'Inicio / Panel General', icono: '🏠' },
  '/asistencia': { titulo: 'Control de Asistencia', icono: '👣' },
  '/pacientes': { titulo: 'Módulo de Pacientes', icono: '👥' },
  '/mis-pacientes': { titulo: 'Mis Pacientes Asignados', icono: '👨‍⚕️' },
  '/asignacion': { titulo: 'Asignaciones de Pacientes', icono: '📋' },
  '/citas': { titulo: 'Agenda de Citas', icono: '📅' },
  '/tratamientos': { titulo: 'Tratamientos y Procedimientos', icono: '💉' },
  '/reportes': { titulo: 'Reportes Clínicos 3D', icono: '📊' },
  '/mantenimiento': { titulo: 'Mantenimiento de Equipos', icono: '🔧' },
  '/usuarios': { titulo: 'Gestión de Usuarios', icono: '👤' },
  '/configuracion': { titulo: 'Configuración del Sistema', icono: '⚙️' },
};

// Función para parsear el mensaje y extraer la directiva de navegación [NAV: /ruta]
interface MensajeProcesado {
  textoLimpio: string;
  rutaNavegacion: string | null;
}

function procesarMensajeTexto(contenido: string): MensajeProcesado {
  const regexNav = /\[NAV:\s*(.*?)\s*\]/;
  const match = contenido.match(regexNav);
  if (match) {
    const ruta = match[1].trim();
    // Remover la directiva del texto final visible
    const textoLimpio = contenido.replace(regexNav, '').trim();
    return { textoLimpio, rutaNavegacion: ruta };
  }
  return { textoLimpio: contenido, rutaNavegacion: null };
}

export function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userRole, setUserRole] = useState('ESTUDIANTE');
  
  const router = useRouter();
  const pathname = usePathname();
  const mensajesFinRef = useRef<HTMLDivElement>(null);

  // Obtener rol del usuario dinámicamente
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role) {
      setUserRole(role.toUpperCase());
    }
  }, [abierto]);

  // Seguimiento del mouse para los ojos de Byte
  useEffect(() => {
    const handleMouseMove = (e: any) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-scroll hacia abajo cuando hay nuevos mensajes
  useEffect(() => {
    mensajesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userRole: userRole,
          currentPath: pathname,
          currentData: {
            pageTitle: typeof document !== 'undefined' ? document.title : '',
            url: typeof window !== 'undefined' ? window.location.href : '',
          }
        }),
      });

      if (!response.ok) throw new Error('Error al conectar con la API de Ollama');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      const assistantId = (Date.now() + 1).toString();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));

              if (data.type === 'text-delta') {
                assistantMessage += data.text;
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.role === 'assistant' && lastMsg.id === assistantId) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: assistantMessage },
                    ];
                  }
                  return [
                    ...prev,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content: assistantMessage,
                    },
                  ];
                });
              }
            } catch (e) {
              // Ignorar líneas no válidas
            }
          }
        }
      }
    } catch (error) {
      console.error('Error con Ollama:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Lo siento, no pude conectarme con mi cerebro de IA local (Ollama). Por favor, asegúrate de que Ollama está activo en el puerto 11434 y que el modelo phi3 está instalado.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const pupilMoveX = mousePosition.x * 12;
  const pupilMoveY = mousePosition.y * 12;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* VENTANA DEL CHAT */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-96 h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col"
          >
            {/* Fondo con gradiente y efecto glass (Verde oscuro clínico integrado) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a2622] to-[#0a1715] opacity-95 backdrop-blur-xl" />
            
            {/* Contenido */}
            <div className="relative flex flex-col h-full">
              {/* HEADER */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-emerald-500/30 px-6 py-5 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent leading-none">
                      Asistente Byte
                    </h3>
                    <span className="text-[10px] text-emerald-400/80 font-medium">IA Clínica Local · Phi-3</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAbierto(false)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* MENSAJES */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex items-center justify-center text-center p-4"
                  >
                    <div>
                      <Sparkles className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
                      <p className="text-sm text-emerald-300 font-semibold">
                        ¡Hola! Soy Byte 🦷🤖
                      </p>
                      <p className="text-xs text-slate-400 mt-2 max-w-[250px] mx-auto leading-relaxed">
                        Tu asistente odontológico inteligente ejecutándose localmente. ¿En qué módulo o proceso te asisto hoy?
                      </p>
                    </div>
                  </motion.div>
                )}

                {messages.map((m, idx) => {
                  const esAsistente = m.role === 'assistant';
                  const { textoLimpio, rutaNavegacion } = esAsistente 
                    ? procesarMensajeTexto(m.content)
                    : { textoLimpio: m.content, rutaNavegacion: null };

                  // Obtener datos estéticos de la ruta
                  const infoRuta = rutaNavegacion ? MAPA_RUTAS[rutaNavegacion] : null;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium backdrop-blur-sm transition-all
                          ${m.role === 'user'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-none shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-900/60 text-emerald-50 rounded-bl-none border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                          }`}
                      >
                        {/* Texto del mensaje */}
                        <p className="whitespace-pre-line leading-relaxed">{textoLimpio}</p>

                        {/* Tarjeta interactiva de navegación dinámica (Premium UI - Emerald System Color) */}
                        {rutaNavegacion && infoRuta && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            className="mt-3 pt-3 border-t border-emerald-500/20 flex flex-col gap-2"
                          >
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Navigation className="w-3 h-3 animate-pulse" /> Ruta recomendada
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                router.push(rutaNavegacion);
                              }}
                              className="w-full bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-400/30 hover:border-emerald-400 text-emerald-300 text-xs px-3 py-2.5 rounded-xl flex items-center justify-between font-semibold shadow-md backdrop-blur-md transition-all cursor-pointer text-left"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className="text-base flex-shrink-0">{infoRuta.icono}</span>
                                <span className="truncate">{infoRuta.titulo}</span>
                              </span>
                              <span className="text-[9px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 flex-shrink-0 font-bold uppercase">
                                Ir ahora 👉
                              </span>
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-emerald-400 text-sm font-medium pl-1"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Byte está preparando la respuesta...</span>
                  </motion.div>
                )}
                <div ref={mensajesFinRef} />
              </div>

              {/* INPUT */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-emerald-500/30 bg-gradient-to-t from-slate-950 to-slate-950/50 p-4 flex gap-3 backdrop-blur-sm"
              >
                <motion.input
                  type="text"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  placeholder="Pregúntale a Byte..."
                  whileFocus={{ scale: 1.02 }}
                  className="flex-1 px-4 py-3 bg-[#0d2a25]/50 border border-emerald-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-sm font-medium transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BYTE FLOTANTE */}
      <motion.div
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAbierto(!abierto)}
        className="cursor-pointer relative"
      >
        <motion.div
          animate={abierto ? { scale: [1, 1.2, 1.15], opacity: [1, 0.8, 1] } : { y: [-4, 4, -4] }}
          transition={{ repeat: abierto ? 0 : Infinity, duration: 4, ease: 'easeInOut' }}
          className={`h-20 w-20 rounded-full flex items-center justify-center shadow-2xl border-2 relative overflow-hidden transition-all duration-500
            ${abierto
              ? 'bg-gradient-to-br from-emerald-400 to-teal-600 border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,1)]'
              : 'bg-gradient-to-br from-[#0a3a32]/90 to-[#00805f]/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
            }`}
        >
          {/* SVG DE BYTE */}
          <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            <path
              d="M 30 20 C 30 5, 70 5, 70 20 C 70 45, 85 70, 75 85 C 65 100, 55 85, 50 70 C 45 85, 35 100, 25 85 C 15 70, 30 45, 30 20 Z"
              fill="#ffffff"
              stroke={abierto ? '#10b981' : '#34d399'}
              strokeWidth="2"
            />
            {/* OJOS DE BYTE */}
            <circle cx={40 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#0f172a" />
            <circle cx={60 + pupilMoveX} cy={40 + pupilMoveY} r="4" fill="#0f172a" />
            {/* SONRISA */}
            <path d="M 35 55 Q 50 65 65 55" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>

          {/* AURA ANIMADA */}
          {abierto && (
            <motion.div
              animate={{ scale: [1, 1.3, 1.1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-0"
            />
          )}
        </motion.div>

        {/* BADGE DE ESTADO */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
            isLoading ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
          }`}
        />
      </motion.div>

      {/* Estilos CSS personalizados */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 38, 34, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 10px;
          transition: background 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.8);
        }
      `}</style>
    </div>
  );
}