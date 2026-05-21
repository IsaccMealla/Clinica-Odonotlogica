"use client"

import { useState } from "react"

type Props = {
  pacientes: { id: string; nombre: string }[]
  onSuccess?: () => void
}

const API_URL = 'http://localhost:8000/api'

export default function SolicitudPermisoForm({ pacientes, onSuccess }: Props) {
  const [pacienteId, setPacienteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const enviarSolicitud = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!pacienteId) return
    setLoading(true)
    setMensaje('')
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_URL}/autorizaciones/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paciente: pacienteId }),
    })
    const contentType = response.headers.get('content-type') || ''
    let errorMessage = 'Error al enviar la solicitud.'
    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        if (typeof errorData === 'object' && errorData !== null) {
          errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData)
        }
      } else {
        errorMessage = await response.text()
      }
    }
    setLoading(false)
    if (response.ok) {
      setMensaje('✅ Solicitud enviada correctamente.')
      onSuccess?.()
      setPacienteId('')
    } else {
      // Solo mostrar mensaje simple, sin HTML
      const displayMsg = errorMessage.length > 200 
        ? 'Error al enviar la solicitud. Intenta de nuevo.'
        : errorMessage.includes('<') 
        ? 'Error de servidor. Intenta de nuevo.'
        : errorMessage
      setMensaje(`❌ ${displayMsg}`)
    }
  }

  return (
    <form onSubmit={enviarSolicitud} className="space-y-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">Solicitud de Permiso de Carga</h3>
      <label className="block text-sm font-medium text-slate-700">Seleccione Paciente</label>
      <select
        value={pacienteId}
        onChange={(e) => setPacienteId(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2"
      >
        <option value="">Seleccionar paciente</option>
        {pacientes.map((paciente) => (
          <option key={paciente.id} value={paciente.id}>
            {paciente.nombre}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Solicitar Permiso'}
      </button>
      {mensaje ? <p className="text-sm text-slate-600">{mensaje}</p> : null}
    </form>
  )
}
