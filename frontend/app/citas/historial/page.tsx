"use client"

import { HistorialCitasGeneral } from "@/components/citas/HistorialCitasGeneral"

export default function HistorialCitasPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historial General de Citas</h1>
        <p className="text-muted-foreground mt-2">
          Visualiza y filtra todos los cambios de estado de citas de la clínica
        </p>
      </div>
      
      <HistorialCitasGeneral />
    </div>
  )
}
