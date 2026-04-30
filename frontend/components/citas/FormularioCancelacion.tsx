"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface FormularioCancelacionProps {
  citaId: string
  onCancelado: () => void
}

export function FormularioCancelacion({ citaId, onCancelado }: FormularioCancelacionProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    razon: '',
    motivo: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = localStorage.getItem('access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/citas/${citaId}/cancelar/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setOpen(false)
        setFormData({ razon: '', motivo: '' })
        onCancelado()
      } else {
        alert('Error al cancelar cita')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cancelar cita')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="gap-2">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Cita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Razón de Cancelación *</Label>
            <Select value={formData.razon} onValueChange={(val) => setFormData({...formData, razon: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PACIENTE">Cancelada por Paciente</SelectItem>
                <SelectItem value="ESTUDIANTE">Cancelada por Estudiante</SelectItem>
                <SelectItem value="DOCENTE">Cancelada por Docente</SelectItem>
                <SelectItem value="MANTENIMIENTO">Cancelada por Mantenimiento</SelectItem>
                <SelectItem value="OTRA">Otra Razón</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo Detallado</Label>
            <Textarea
              placeholder="Describa el motivo de la cancelación..."
              value={formData.motivo}
              onChange={(e) => setFormData({...formData, motivo: e.target.value})}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" variant="destructive">
            Confirmar Cancelación
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
