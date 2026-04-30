"use client"

import { useState, useEffect } from "react"
import { NuevoPaciente } from "@/components/nuevo-paciente"
import { PapeleraPacientes } from "@/components/papelera-pacientes"
import { TablaPacientes } from "@/components/tabla-pacientes"
import { PacientesExport } from "@/components/exporters/pacientes-export"

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)

  // Creamos la función para buscar pacientes con el token
  const fetchPacientes = async () => {
    try {
      setCargando(true)
      
      // Obtenemos la llave de seguridad
      const token = localStorage.getItem("access_token") || ""

      const res = await fetch("http://localhost:8000/api/pacientes/", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Le mostramos la credencial a Django
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        
        // 👇 AQUÍ ESTÁ LA MAGIA 👇
        // Extraemos 'results' si existe (por la paginación de Django), 
        // caso contrario usamos 'data' directo.
        setPacientes(data.results || data) 
        
      } else {
        console.error("Error de autorización o servidor. Status:", res.status)
      }
    } catch (error) {
      console.error("Error conectando con Django:", error)
    } finally {
      setCargando(false)
    }
  }

  // Ejecutamos la búsqueda al cargar la página
  useEffect(() => {
    fetchPacientes()
  }, [])

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona el registro y la información de los pacientes de la clínica.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Exportación */}
          <PacientesExport pacientes={pacientes} />
          
          {/* Módulo de papelera */}
          <PapeleraPacientes />
          
          {/* Botón de creación */}
          <NuevoPaciente onPacienteCreado={fetchPacientes} />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: Loading o la Tabla */}
      {cargando ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <TablaPacientes 
          pacientesIniciales={pacientes} 
          onRefresh={fetchPacientes} 
        />
      )}
      
    </div>
  )
}
