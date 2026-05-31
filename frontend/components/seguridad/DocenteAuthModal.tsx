// FILE: components/seguridad/DocenteAuthModal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, ShieldCheck, AlertCircle } from "lucide-react"

interface DocenteAuthModalProps {
    onAprobado: (metadatosAuditoria: any) => void
    children: React.ReactNode
    accion: string
    disabled?: boolean
}

export function DocenteAuthModal({ onAprobado, children, accion, disabled = false }: DocenteAuthModalProps) {
    const [open, setOpen] = useState(false)
    const [docenteId, setDocenteId] = useState("")
    const [pin, setPin] = useState("")
    const [error, setError] = useState("")
    const [exito, setExito] = useState(false)

    const handleVerificar = () => {
        if (!docenteId || !pin) {
            setError("Selecciona un docente y digita el PIN.")
            return
        }

        // Simulando el PIN correcto "1234"
        if (pin === "1234") {
            setError("")
            setExito(true)

            const metadatosAuditoria = {
                aprobado_por: docenteId === "1" ? "Dr. Jaimes" : "Dra. Gomez",
                fecha_aprobacion: new Date().toISOString(),
                hito_alcanzado: "+1 Cupo Académico",
                accion_interceptada: accion
            }

            // Guardamos en localStorage para auditoría temporal en la demo
            const auditoriaPrevia = JSON.parse(localStorage.getItem('auditoria_docente') || '[]')
            localStorage.setItem('auditoria_docente', JSON.stringify([...auditoriaPrevia, metadatosAuditoria]))

            // Retraso para ver la animación verde antes de ejecutar la acción original
            setTimeout(() => {
                setOpen(false)
                setExito(false)
                setPin("")
                onAprobado(metadatosAuditoria)
            }, 1800)
        } else {
            setError("PIN de aprobación incorrecto.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !exito && setOpen(val)}>
            <DialogTrigger asChild>
                <div className={disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}>
                    {children}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-t-4 border-t-amber-500">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Lock className="w-5 h-5" />
                        Validación de Docente Requerida
                    </DialogTitle>
                </DialogHeader>

                {!exito ? (
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2 text-amber-800 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>La acción: <strong>{accion}</strong> requiere supervisión clínica y aprobación obligatoria.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Docente Supervisor</Label>
                            <Select onValueChange={setDocenteId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar docente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Dr. Jaimes (Cirugía / General)</SelectItem>
                                    <SelectItem value="2">Dra. Gomez (Periodoncia)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>PIN de Aprobación Clínica</Label>
                            <Input
                                type="password"
                                maxLength={4}
                                placeholder="Ej: 1234"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="text-center tracking-widest text-lg font-mono"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

                        <Button onClick={handleVerificar} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                            Validar y Desbloquear Acción
                        </Button>
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                            <ShieldCheck className="h-12 w-12 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-700 text-center">¡Procedimiento firmado exitosamente!</h3>
                        <p className="text-sm text-green-600 font-medium text-center bg-green-50 px-3 py-1 rounded-full border border-green-200">
                            Cupo académico registrado para el estudiante.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
