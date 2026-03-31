"use client"

import React from 'react'

type AuditLog = {
  id: string
  user: { name: string; email: string } | null
  action: string
  module: string
  record_id: string | null
  timestamp: string
  ip_address: string | null
}

type AuditLogTableProps = {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2">Timestamp</th>
            <th className="px-3 py-2">User</th>
            <th className="px-3 py-2">Action</th>
            <th class2="px-3 py-2">Module</th>
            <th className="px-3 py-2">Record</th>
            <th className="px-3 py-2">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="px-3 py-2">{log.user ? `${log.user.name} (${log.user.email})` : 'System'}</td>
              <td className="px-3 py-2">{log.action}</td>
              <td className="px-3 py-2">{log.module}</td>
              <td className="px-3 py-2">{log.record_id || '-'}</td>
              <td className="px-3 py-2">{log.ip_address || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
