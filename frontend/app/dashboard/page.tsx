"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  TrendingUp,
  ChevronRight,
  Plus,
  User,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Loader,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  pacienteService, 
  citaService, 
  tratamientoService,
  Paciente,
  Cita,
  Tratamiento 
} from '@/lib/api'

// Contenedor animado para tarjetas
const AnimatedCard = ({ children, index = 0, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay + index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  )
}

// Skeleton Loading
const SkeletonCard = () => (
  <Card className="!bg-[#02211c]/60 !border-emerald-500/20 p-6 animate-pulse rounded-2xl">
    <div className="space-y-3">
      <div className="h-4 bg-emerald-500/10 rounded w-3/4 animate-pulse" />
      <div className="h-8 bg-emerald-500/10 rounded w-1/2 animate-pulse" />
      <div className="h-4 bg-emerald-500/10 rounded w-2/3 animate-pulse" />
    </div>
  </Card>
)

// Tarjeta de Estadística
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  color: 'blue' | 'cyan' | 'purple' | 'green'
  index?: number
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  color,
  index = 0,
  loading = false 
}) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-400',
    cyan: 'from-cyan-600 to-cyan-400',
    purple: 'from-purple-600 to-purple-400',
    green: 'from-emerald-600 to-emerald-400',
  }

  const bgClasses = {
    blue: '!bg-gradient-to-br !from-[#082a3a]/80 !to-[#031520]/80 !border-blue-500/30 shadow-[0_4px_25px_rgba(59,130,246,0.1)] hover:!border-blue-400',
    cyan: '!bg-gradient-to-br !from-[#033036]/80 !to-[#01191d]/80 !border-cyan-500/30 shadow-[0_4px_25px_rgba(6,182,212,0.1)] hover:!border-cyan-400',
    purple: '!bg-gradient-to-br !from-[#24163b]/80 !to-[#120a20]/80 !border-purple-500/30 shadow-[0_4px_25px_rgba(168,85,247,0.1)] hover:!border-purple-400',
    green: '!bg-gradient-to-br !from-[#052e25]/80 !to-[#021813]/80 !border-emerald-500/30 shadow-[0_4px_25px_rgba(16,185,129,0.1)] hover:!border-emerald-400',
  }

  return (
    <AnimatedCard index={index}>
      <Card className={`${bgClasses[color]} !border backdrop-blur-sm transition-all duration-300 overflow-hidden relative group rounded-2xl`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        <div className="p-6 relative z-10">
          {/* Icono */}
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} p-2.5 mb-4 flex items-center justify-center`}>
            <div className="text-white">
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : icon}
            </div>
          </div>

          {/* Contenido */}
          <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
          <div className="flex items-baseline gap-3 mb-2">
            <h3 className="text-3xl font-bold text-white">
              {loading ? '-' : value}
            </h3>
            {trend !== undefined && !loading && (
              <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </Card>
    </AnimatedCard>
  )
}

// Tarjeta de Paciente
interface PacienteCardProps {
  paciente: Paciente
  index?: number
}

const PacienteCard: React.FC<PacienteCardProps> = ({ paciente, index = 0 }) => {
  const nombreCompleto = `${paciente.nombres || ''} ${paciente.apellido_paterno || ''} ${paciente.apellido_materno || ''}`.trim()
  
  return (
    <AnimatedCard index={index} delay={0.6}>
      <Card className="!bg-[#02211c]/90 !border-emerald-500/20 hover:!border-cyan-500/40 hover:!bg-[#011814] transition-all duration-300 p-4 group cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10 rounded-2xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-sm">
                {nombreCompleto || 'Sin nombre'}
              </p>
              <p className="text-xs text-slate-400">CI: {paciente.ci}</p>
            </div>
          </div>
          {paciente.alerta_abandono && (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
        </div>

        <div className="space-y-2 text-sm">
          {paciente.celular && (
            <div className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors truncate">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
              <span className="truncate">{paciente.celular}</span>
            </div>
          )}
          {paciente.email && (
            <div className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
              <span className="truncate text-xs">{paciente.email}</span>
            </div>
          )}
        </div>

        <Badge className="mt-3 !bg-cyan-500/20 !text-cyan-300 !border-cyan-500/30 w-full justify-center py-1 text-xs">
          {paciente.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </Card>
    </AnimatedCard>
  )
}

// Tarjeta de Cita
interface CitaCardProps {
  cita: Cita
  index?: number
}

const CitaCard: React.FC<CitaCardProps> = ({ cita, index = 0 }) => {
  const estadoColors: Record<string, string> = {
    RESERVADA: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    CONFIRMADA: 'bg-green-500/20 text-green-300 border-green-500/30',
    CANCELADA: 'bg-red-500/20 text-red-300 border-red-500/30',
    COMPLETADA: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    EN_ESPERA: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ATENDIENDO: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  }

  const formatoHora = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Hora inválida'
    }
  }

  const formatoFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  const pacienteInfo = typeof cita.paciente === 'object' ? cita.paciente : null
  const pacienteNombre = pacienteInfo ? `${pacienteInfo.nombres || ''} ${pacienteInfo.apellido_paterno || ''}`.trim() : `Paciente #${cita.paciente}`

  return (
    <AnimatedCard index={index} delay={1.2}>
      <Card className="!bg-[#02211c]/90 !border-emerald-500/20 hover:!border-cyan-500/40 hover:!bg-[#011814] transition-all duration-300 p-4 group cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white mb-1 text-sm">
                {pacienteNombre}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                <span>{formatoFecha(cita.fecha_hora)} - {formatoHora(cita.fecha_hora)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">{cita.motivo || 'Sin motivo'}</p>
            </div>
          </div>
          <Badge className={`${estadoColors[cita.estado as keyof typeof estadoColors] || estadoColors['RESERVADA']} !border text-xs flex-shrink-0`}>
            {cita.estado}
          </Badge>
        </div>
      </Card>
    </AnimatedCard>
  )
}

// Estado vacío
const EmptyState = ({ title, message }: any) => (
  <Card className="!bg-[#02211c]/60 !border-emerald-500/20 p-12 text-center rounded-2xl">
    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3 opacity-55" />
    <p className="text-slate-200 font-semibold mb-1">{title}</p>
    <p className="text-slate-400 text-sm">{message}</p>
  </Card>
)

// Dashboard Principal
export default function DashboardPage() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total_pacientes: 0,
    citas_hoy: 0,
    tratamientos_activos: 0,
  })

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener token si existe
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

        // Cargar todos los datos en paralelo
        const [respPacientes, respCitas, respTratamientos] = await Promise.all([
          pacienteService.getActivos(token || undefined),
          citaService.getHoy(token || undefined),
          tratamientoService.getActivos(token || undefined),
        ])

        // Verificar errores
        if (respPacientes.error && !respPacientes.data) {
          console.warn('Error cargando pacientes:', respPacientes.error)
        }
        if (respCitas.error && !respCitas.data) {
          console.warn('Error cargando citas:', respCitas.error)
        }
        if (respTratamientos.error && !respTratamientos.data) {
          console.warn('Error cargando tratamientos:', respTratamientos.error)
        }

        // Actualizar datos
        if (respPacientes.data) {
          setPacientes(respPacientes.data.slice(0, 4)) // Primeros 4
        }
        if (respCitas.data) {
          setCitas(respCitas.data.slice(0, 3)) // Primeras 3
        }
        if (respTratamientos.data) {
          setTratamientos(respTratamientos.data.slice(0, 5))
        }

        // Actualizar estadísticas
        setStats({
          total_pacientes: respPacientes.data?.length || 0,
          citas_hoy: respCitas.data?.length || 0,
          tratamientos_activos: respTratamientos.data?.length || 0,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error cargando datos:', errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()

    // Recargar cada 5 minutos
    const interval = setInterval(cargarDatos, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#021815] via-[#052924] to-[#01110f] p-8 text-white">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white">
              Dashboard Clínico
            </h1>
            <Button onClick={() => router.push('/pacientes')} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
              Nuevo Paciente
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-slate-400">
              {error ? (
                <span className="text-amber-400">{error}</span>
              ) : (
                <>Sistema operativo • Última sincronización <span className="font-semibold">ahora</span></>
              )}
            </p>
          </div>
        </motion.div>

        {/* Estadísticas Principales */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Pacientes Activos"
            value={stats.total_pacientes}
            subtitle="En el sistema"
            color="blue"
            index={0}
            loading={loading}
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Citas Hoy"
            value={stats.citas_hoy}
            subtitle={`${stats.citas_hoy} cita${stats.citas_hoy !== 1 ? 's' : ''} programada${stats.citas_hoy !== 1 ? 's' : ''}`}
            color="cyan"
            index={1}
            loading={loading}
          />
          <StatCard
            icon={<Stethoscope className="w-6 h-6" />}
            title="Tratamientos"
            value={stats.tratamientos_activos}
            subtitle="En proceso"
            color="purple"
            index={2}
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Desempeño"
            value={loading ? '-' : "98%"}
            subtitle="Eficiencia general"
            trend={12}
            color="green"
            index={3}
            loading={loading}
          />
        </motion.div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Izquierdo - Pacientes y Citas */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Pacientes Recientes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Pacientes Recientes
                </h2>
                <Button onClick={() => router.push('/pacientes')} variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                  Ver todo <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : pacientes.length > 0 ? (
                  pacientes.map((paciente, idx) => (
                    <PacienteCard key={paciente.id} paciente={paciente} index={idx} />
                  ))
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState 
                      title="Sin pacientes" 
                      message="No hay pacientes registrados en el sistema"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Citas de Hoy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Próximas Citas
                </h2>
                <Button onClick={() => router.push('/citas')} variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                  Ver calendario <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : citas.length > 0 ? (
                  citas.map((cita, idx) => (
                    <CitaCard key={cita.id} cita={cita} index={idx} />
                  ))
                ) : (
                  <EmptyState 
                    title="Sin citas hoy" 
                    message="No hay citas programadas para hoy"
                  />
                )}
              </div>
            </motion.div>

          </div>

          {/* Panel Derecho - Widget de Resumen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Card - Estado del Sistema */}
            <Card className="!bg-gradient-to-br !from-cyan-950/40 !to-blue-950/40 !border-cyan-500/20 overflow-hidden relative rounded-2xl">
              <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Estado del Sistema</h3>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <p className="text-sm text-slate-300 mb-4">
                  {loading ? 'Sincronizando...' : 'Sistema operativo y sincronizado'}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">API</span>
                    <Badge className={`${loading ? '!bg-amber-500/20 !text-amber-300 !border-amber-500/30' : '!bg-green-500/20 !text-green-300 !border-green-500/30'}`}>
                      {loading ? 'Sincronizando' : 'Conectado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Base de Datos</span>
                    <Badge className={`${loading ? '!bg-amber-500/20 !text-amber-300 !border-amber-500/30' : '!bg-green-500/20 !text-green-300 !border-green-500/30'}`}>
                      {loading ? 'Cargando' : 'Sincronizado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Sesión</span>
                    <Badge className="!bg-blue-500/20 !text-blue-300 !border-blue-500/30">Activa</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card - Quick Actions */}
            <Card className="!bg-[#02211c]/90 !border-emerald-500/20 p-6 rounded-2xl">
              <h3 className="font-bold text-white mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Button onClick={() => router.push('/citas')} className="w-full justify-start gap-2 !bg-[#03362e] hover:!bg-[#054d42] text-slate-200 text-sm border !border-emerald-500/20 hover:!border-emerald-400 rounded-xl">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Registrar Cita
                </Button>
                <Button onClick={() => router.push('/pacientes')} className="w-full justify-start gap-2 !bg-[#03362e] hover:!bg-[#054d42] text-slate-200 text-sm border !border-emerald-500/20 hover:!border-emerald-400 rounded-xl">
                  <User className="w-4 h-4 text-cyan-400" />
                  Ver Pacientes
                </Button>
                <Button onClick={() => router.push('/tratamientos')} className="w-full justify-start gap-2 !bg-[#03362e] hover:!bg-[#054d42] text-slate-200 text-sm border !border-emerald-500/20 hover:!border-emerald-400 rounded-xl">
                  <Stethoscope className="w-4 h-4 text-cyan-400" />
                  Tratamientos
                </Button>
              </div>
            </Card>

            {/* Card - Tip del Día */}
            <Card className="!bg-gradient-to-br !from-purple-950/40 !to-pink-950/40 !border-purple-500/20 p-6 rounded-2xl">
              <h3 className="font-bold text-white mb-2">💡 Tip del Día</h3>
              <p className="text-sm text-slate-300">
                Mantén actualizada la información de los pacientes para un mejor seguimiento y atención de calidad.
              </p>
            </Card>
          </motion.div>

        </div>
      </div>
    </main>
  )
}