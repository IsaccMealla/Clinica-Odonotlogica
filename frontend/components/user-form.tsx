"use client"

import React, { useState } from 'react'
import { RoleSelector } from './role-selector'

type UserFormProps = {
  onSubmit: (data: { name: string; email: string; password: string; role: string }) => void
  isLoading: boolean
}

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, email, password, role })
      }}
      className="space-y-3 p-4 border rounded bg-white"
    >
      <div>
        <label className="block font-semibold">Name</label>
        <input className="border rounded w-full p-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold">Email</label>
        <input className="border rounded w-full p-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold">Password</label>
        <input className="border rounded w-full p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="block font-semibold">Role</label>
        <RoleSelector value={role} onChange={setRole} />
      </div>
      <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Create User'}
      </button>
    </form>
  )
}
