"use client"

import React, { useState } from 'react'
import { RoleSelector } from './role-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

type UserFormProps = {
  onSubmit: (data: { name: string; email: string; password: string; role: string }) => void
  isLoading: boolean
}

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'El nombre es requerido'
    if (!email.trim()) newErrors.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido'
    if (!password) newErrors.password = 'La contraseña es requerida'
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({ name, email, password, role })
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('student')
    }
  }

  return (
    <Card className="p-6 bg-white shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 font-semibold">
            Nombre Completo
          </Label>
          <Input
            id="name"
            placeholder="Juan Pérez"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-semibold">
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@clinica.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-slate-700 font-semibold">
            Rol o Puesto
          </Label>
          <RoleSelector value={role} onChange={setRole} variant="select" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700 font-semibold">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors({ ...errors, password: '' })
            }}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">
            Confirmar Contraseña
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
            }}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 mt-6"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Crear Usuario'}
        </Button>
      </form>
    </Card>
  )
}
