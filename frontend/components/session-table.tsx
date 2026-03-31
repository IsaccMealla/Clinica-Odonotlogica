"use client"

import React from 'react'

type Session = {
  id: string
  user: { name: string; email: string }
  login_time: string
  ip_address: string | null
  status: string
}

type SessionTableProps = {
  sessions: Session[]
  onForceLogout: (id: string) => void
}

export function SessionTable({ sessions, onForceLogout }: SessionTableProps) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2">User</th>
            <th className="px-3 py-2">Login</th>
            <th className="px-3 py-2">IP</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-t">
              <td className="px-3 py-2">{session.user.name}</td>
              <td className="px-3 py-2">{new Date(session.login_time).toLocaleString()}</td>
              <td className="px-3 py-2">{session.ip_address || '-'}</td>
              <td className="px-3 py-2">{session.status}</td>
              <td className="px-3 py-2">
                {session.status === 'active' && (
                  <button
                    onClick={() => onForceLogout(session.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Force logout
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
