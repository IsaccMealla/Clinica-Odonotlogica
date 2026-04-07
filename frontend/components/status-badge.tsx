"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type AppointmentStatus =
  | "scheduled"
  | "waiting"
  | "sala_de_espera"
  | "in_progress"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

interface StatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string
    color: string
    bgColor: string
    pulseAnimation: boolean
  }
> = {
  scheduled: {
    label: "Programada",
    color: "text-blue-700",
    bgColor: "bg-blue-100 hover:bg-blue-200",
    pulseAnimation: false,
  },
  waiting: {
    label: "En Espera",
    color: "text-amber-700",
    bgColor: "bg-amber-100 hover:bg-amber-200",
    pulseAnimation: true,
  },
  sala_de_espera: {
    label: "Sala de Espera",
    color: "text-orange-700",
    bgColor: "bg-orange-100 hover:bg-orange-200",
    pulseAnimation: true,
  },
  in_progress: {
    label: "En Progreso",
    color: "text-purple-700",
    bgColor: "bg-purple-100 hover:bg-purple-200",
    pulseAnimation: false,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100 hover:bg-cyan-200",
    pulseAnimation: false,
  },
  completed: {
    label: "Completada",
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200",
    pulseAnimation: false,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-red-700",
    bgColor: "bg-red-100 hover:bg-red-200",
    pulseAnimation: false,
  },
  no_show: {
    label: "No Asistió",
    color: "text-red-900",
    bgColor: "bg-red-200 hover:bg-red-300",
    pulseAnimation: false,
  },
}

const pulseKeyframes = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (!config) {
    return <Badge className={className}>Desconocido</Badge>
  }

  const shouldPulse = config.pulseAnimation

  return (
    <motion.div
      initial={shouldPulse ? "initial" : false}
      animate={shouldPulse ? "animate" : false}
      variants={shouldPulse ? pulseKeyframes : undefined}
      className="inline-block"
    >
      <Badge
        className={cn(
          "font-semibold transition-all duration-200 cursor-default",
          config.bgColor,
          config.color,
          className
        )}
      >
        {config.label}
      </Badge>
    </motion.div>
  )
}

/**
 * Badge compacto para mostrar solo un punto de color
 */
export function StatusBadgeDot({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (!config) {
    return <div className={cn("w-3 h-3 rounded-full bg-gray-300", className)} />
  }

  const shouldPulse = config.pulseAnimation

  // Extract color number from bgColor (e.g., "bg-blue-100" -> "blue-500")
  const colorMap: Record<string, string> = {
    "bg-blue-100": "bg-blue-500",
    "bg-amber-100": "bg-amber-500",
    "bg-orange-100": "bg-orange-500",
    "bg-purple-100": "bg-purple-500",
    "bg-cyan-100": "bg-cyan-500",
    "bg-green-100": "bg-green-500",
    "bg-red-100": "bg-red-500",
    "bg-red-200": "bg-red-600",
  }

  const dotColor = colorMap[config.bgColor] || "bg-gray-400"

  return (
    <motion.div
      initial={shouldPulse ? "initial" : false}
      animate={shouldPulse ? "animate" : false}
      variants={shouldPulse ? pulseKeyframes : undefined}
    >
      <div
        className={cn(
          "w-3 h-3 rounded-full transition-all duration-200",
          dotColor,
          className
        )}
        title={config.label}
      />
    </motion.div>
  )
}
