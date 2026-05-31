// FILE: components/metadatos/MetadataPanels.tsx
"use client"
import { useState, useEffect } from "react"
import { Server, MonitorSmartphone, Globe, Clock, Stethoscope, Wrench, RefreshCcw, Radio, Zap, Timer, Box, QrCode, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- MÓDULO 1: ADMISIÓN ---
export function PanelAdmisionMetadata() {
    const [metadata, setMetadata] = useState({ dispositivo: "", ip: "Cargando...", userAgent: "", timestamp: "" })

    useEffect(() => {
        setMetadata({
            dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? "Dispositivo Móvil" : "Computadora/Escritorio",
            ip: `192.168.1.${Math.floor(Math.random() * 200 + 10)}`, // IP Simulada para demo local
            userAgent: navigator.userAgent.substring(0, 45) + "...",
            timestamp: new Date().toISOString()
        })
    }, [])

    return (
        <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50/80 text-sm shadow-sm">
            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" /> Auditoría de Origen
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600">
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispositivo</span>
                    <span className="flex items-center gap-1 mt-1 text-xs"><MonitorSmartphone className="w-3 h-3" /> {metadata.dispositivo}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">IP Local</span>
                    <span className="flex items-center gap-1 mt-1 text-xs"><Globe className="w-3 h-3" /> {metadata.ip}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Huella de Tiempo</span>
                    <span className="flex items-center gap-1 mt-1 text-xs"><Clock className="w-3 h-3" /> {new Date(metadata.timestamp).toLocaleTimeString()}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Agent</span>
                    <span className="truncate block mt-1 text-xs" title={navigator.userAgent}>{metadata.userAgent}</span>
                </div>
            </div>
        </div>
    )
}

// --- MÓDULO 4: CITAS ---
export function PanelCitasMetadata({ metadatos, setMetadatos }: { metadatos: any, setMetadatos: any }) {
    return (
        <div className="mt-4 p-4 border border-indigo-100 rounded-lg bg-indigo-50/50 shadow-sm">
            <h4 className="font-bold text-indigo-800 mb-3 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Triple Recurso Clínico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-indigo-600">ID Específico Sillón</Label>
                    <div className="relative">
                        <Stethoscope className="w-4 h-4 absolute left-2.5 top-2 text-indigo-400" />
                        <Input className="pl-9 h-8 text-xs bg-white border-indigo-200" placeholder="Ej. SILL-04-A" value={metadatos.idSillon || ''} onChange={(e) => setMetadatos({ ...metadatos, idSillon: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-indigo-600">Cód. Mantenimiento</Label>
                    <div className="relative">
                        <Wrench className="w-4 h-4 absolute left-2.5 top-2 text-indigo-400" />
                        <Input className="pl-9 h-8 text-xs bg-white border-indigo-200" placeholder="MANT-2026-05" value={metadatos.codigoMantenimiento || ''} onChange={(e) => setMetadatos({ ...metadatos, codigoMantenimiento: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-indigo-600">Turno / Rotación</Label>
                    <div className="relative">
                        <RefreshCcw className="w-4 h-4 absolute left-2.5 top-2 text-indigo-400" />
                        <Input className="pl-9 h-8 text-xs bg-white border-indigo-200" placeholder="Rotación Mañana (G2)" value={metadatos.turno || ''} onChange={(e) => setMetadatos({ ...metadatos, turno: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MÓDULO 5: RADIOGRAFÍAS ---
export function PanelRadiografiasMetadata({ metadatos, setMetadatos }: { metadatos: any, setMetadatos: any }) {
    return (
        <div className="mt-4 p-4 border border-cyan-200 rounded-lg bg-cyan-50/60 shadow-sm text-sm">
            <h4 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4" /> Parámetros de Exposición
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-cyan-700">kVp (Tensión)</Label>
                    <div className="relative">
                        <Zap className="w-3 h-3 absolute left-2.5 top-2.5 text-cyan-500" />
                        <Input className="pl-8 h-8 text-xs border-cyan-200" placeholder="Ej: 70" value={metadatos.kvp || ''} onChange={(e) => setMetadatos({ ...metadatos, kvp: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-cyan-700">mA (Corriente)</Label>
                    <Input className="h-8 text-xs border-cyan-200 pl-3" placeholder="Ej: 8" value={metadatos.ma || ''} onChange={(e) => setMetadatos({ ...metadatos, ma: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-cyan-700">Tiempo (s)</Label>
                    <div className="relative">
                        <Timer className="w-3 h-3 absolute left-2.5 top-2.5 text-cyan-500" />
                        <Input className="pl-8 h-8 text-xs border-cyan-200" placeholder="0.32" value={metadatos.tiempo || ''} onChange={(e) => setMetadatos({ ...metadatos, tiempo: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-cyan-700">Sensor X</Label>
                    <Select value={metadatos.sensor || ''} onValueChange={(v) => setMetadatos({ ...metadatos, sensor: v })}>
                        <SelectTrigger className="h-8 text-xs border-cyan-200"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="psp">PSP Soredex</SelectItem>
                            <SelectItem value="cbct">CBCT 8100</SelectItem>
                            <SelectItem value="rvg">RVG Kodak</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}

// --- MÓDULO 8: INVENTARIO ---
export function PanelInventarioMetadata({ metadatos, setMetadatos }: { metadatos: any, setMetadatos: any }) {
    return (
        <div className="mt-4 p-4 border border-emerald-200 rounded-lg bg-emerald-50/60 shadow-sm text-sm">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <Box className="w-4 h-4" /> Trazabilidad Transaccional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-emerald-700">Lote QR / Barras</Label>
                    <div className="relative">
                        <QrCode className="w-4 h-4 absolute left-2.5 top-2.5 text-emerald-500" />
                        <Input className="pl-8 h-9 text-xs border-emerald-200" placeholder="Escanear o ingresar..." value={metadatos.loteQR || ''} onChange={(e) => setMetadatos({ ...metadatos, loteQR: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-emerald-700">Vencimiento Lote</Label>
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-2.5 top-2.5 text-emerald-500" />
                        <Input type="date" className="pl-8 h-9 text-xs border-emerald-200" value={metadatos.vencimiento || ''} onChange={(e) => setMetadatos({ ...metadatos, vencimiento: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-emerald-700">Depósito Origen</Label>
                    <Input className="h-9 text-xs border-emerald-200 pl-3" placeholder="Ej: ALM-CENTRAL-01" value={metadatos.depositoOrigen || ''} onChange={(e) => setMetadatos({ ...metadatos, depositoOrigen: e.target.value })} />
                </div>
            </div>
        </div>
    )
}
