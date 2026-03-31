"use client"

import React from 'react'

type RoleOption = {
  value: 'admin' | 'teacher' | 'student' | 'receptionist' | 'dentist'
  label: string
}

const roles: RoleOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'dentist', label: 'Dentist' },
]

interface RoleSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border rounded p-2 w-full"
      aria-label="Role"
    >
      {roles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  )
}
