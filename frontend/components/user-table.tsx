"use client"

import React from 'react'

type User = {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

type UserTableProps = {
  users: User[]
  onDelete?: (id: string) => void
}

export function UserTable({ users, onDelete }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            {onDelete && <th className="px-3 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="px-3 py-2">{user.name}</td>
              <td className="px-3 py-2">{user.email}</td>
              <td className="px-3 py-2">{user.role}</td>
              <td className="px-3 py-2">{user.is_active ? 'Active' : 'Inactive'}</td>
              {onDelete && (
                <td className="px-3 py-2">
                  <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800">
                    Deactivate
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
