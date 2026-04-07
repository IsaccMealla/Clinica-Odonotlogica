"use client"

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldCheck, Users, GraduationCap, Stethoscope, PhoneForwarded } from 'lucide-react'

type RoleOption = {
  value: 'admin' | 'teacher' | 'student' | 'receptionist' | 'dentist'
  label: string
  description: string
  icon: React.ReactNode
}

const roles: RoleOption[] = [
  { 
    value: 'admin',
    label: 'Administrador',
    description: 'Control total del sistema',
    icon: <ShieldCheck className="w-4 h-4" />
  },
  { 
    value: 'teacher',
    label: 'Docente',
    description: 'Supervisa estudiantes',
    icon: <Users className="w-4 h-4" />
  },
  { 
    value: 'student',
    label: 'Estudiante',
    description: 'Acceso a prácticas',
    icon: <GraduationCap className="w-4 h-4" />
  },
  { 
    value: 'receptionist',
    label: 'Recepcionista',
    description: 'Gestión de citas',
    icon: <PhoneForwarded className="w-4 h-4" />
  },
  { 
    value: 'dentist',
    label: 'Odontólogo',
    description: 'Tratamientos y procedimientos',
    icon: <Stethoscope className="w-4 h-4" />
  },
]

interface RoleSelectorProps {
  value: string
  onChange: (value: string) => void
  variant?: 'select' | 'button-group'
}

export function RoleSelector({ value, onChange, variant = 'select' }: RoleSelectorProps) {
  if (variant === 'button-group') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
              value === role.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={value === role.value ? 'text-blue-600' : 'text-slate-600'}>
              {role.icon}
            </div>
            <span className="text-xs font-semibold mt-1">{role.label}</span>
            <span className="text-xs text-slate-500 text-center">{role.description}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-10 border-slate-200 focus:border-blue-500">
        <SelectValue placeholder="Selecciona un rol" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {role.icon}
              <span>{role.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
