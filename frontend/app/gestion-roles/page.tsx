//# FILE: frontend/app/gestion-roles/page.tsx
"use client"

import RoleList from '@/components/roles/RoleList'
import { DocenteList } from '@/components/roles/DocenteList'

export default function Page(){
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto p-6">
        <RoleList />
        <DocenteList />
      </div>
    </div>
  )
}
