"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type ImageCardProps = {
  id: string
  file_url: string
  image_type: string
  description?: string
  uploaded_at: string
  onDeleted?: () => void
}

export function ImageCard({ id, file_url, image_type, description, uploaded_at, onDeleted }: ImageCardProps) {
  const onDelete = async () => {
    if (!confirm('¿Eliminar esta imagen?')) return
    const res = await fetch(`http://localhost:8000/api/images/${id}/`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('No se pudo eliminar imagen')
      return
    }
    toast.success('Imagen eliminada')
    onDeleted?.()
  }

  return (
    <Card className="rounded-lg border shadow-sm overflow-hidden">
      <img src={file_url} className="h-48 w-full object-cover" alt={description || 'Imagen dental'} />
      <CardContent>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{image_type.replaceAll('_', ' ')}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{new Date(uploaded_at).toLocaleString()}</CardDescription>
        </CardHeader>
        <p className="text-sm text-muted-foreground py-2">{description || 'Sin descripción'}</p>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </Button>
      </CardContent>
    </Card>
  )
}
