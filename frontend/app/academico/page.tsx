"use client"

import { useEffect, useState } from "react"
import { MallaCurricularUI } from "@/components/academico/MallaCurricularUI"
import { EstudianteList } from "@/components/academico/EstudianteList"
import { loadMe } from "@/lib/permissions"
import { Loader2 } from "lucide-react"

export default function AcademicoPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const me = await loadMe()
      const role = me?.rol || localStorage.getItem("user_role")
      setIsAdmin(role === 'ADMIN')
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-clinica-bg">
      {isAdmin ? (
        <div className="max-w-7xl mx-auto space-y-6 pt-6">
          <EstudianteList />
        </div>
      ) : (
        <MallaCurricularUI />
      )}
    </div>
  )
}
