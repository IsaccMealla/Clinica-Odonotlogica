"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  Sheet, 
  Loader2, 
  User, 
  Heart, 
  Stethoscope, 
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { exportPacienteDetallePDF } from '@/lib/exporters/pdf-exporter';
import { exportPacienteDetalleExcel } from '@/lib/exporters/excel-exporter';
import { motion } from 'framer-motion';

interface ModalExportacionPacienteProps {
  paciente: any;
  trigger?: React.ReactNode;
}

export function ModalExportacionPaciente({ paciente, trigger }: ModalExportacionPacienteProps) {
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados independientes de confirmación de exportación
  const [incluirAntecedentes, setIncluirAntecedentes] = useState(true);

  const handleExport = async (formato: 'PDF' | 'Excel') => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      
      // 1. Cargar el registro COMPLETO del paciente desde el backend de Django
      const res = await fetch(`http://localhost:8000/api/pacientes/${paciente.id}/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!res.ok) throw new Error("Error al obtener los datos actualizados de la base de datos");
      
      const pacienteCompleto = await res.json();

      const config = {
        incluirAntecedentes,
        incluirCarpetaMedica: false
      };

      // 2. Ejecutar exportador correspondiente con la configuración modular elegida
      if (formato === 'PDF') {
        exportPacienteDetallePDF(pacienteCompleto, config);
      } else {
        exportPacienteDetalleExcel(pacienteCompleto, config);
      }
      
      toast.success(`Ficha exportada exitosamente a ${formato}`);
      setAbierto(false);
    } catch (error) {
      console.error("Error exportando paciente:", error);
      toast.error("Ocurrió un error al procesar el expediente clínico");
    } finally {
      setLoading(false);
    }
  };

  const marcarTodo = () => {
    setIncluirAntecedentes(true);
    toast.info("Se han seleccionado todos los antecedentes.");
  };

  const desmarcarTodo = () => {
    setIncluirAntecedentes(false);
    toast.info("Se ha seleccionado únicamente la Ficha Básica Personal.");
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            title="Exportar Expediente..."
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border border-emerald-500/25 bg-slate-50 dark:bg-[#0c1a17]/95 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Confirmar Contenido de Exportación
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Personaliza el reporte de <span className="font-semibold text-slate-800 dark:text-slate-200">{paciente.nombres} {paciente.apellido_paterno}</span> marcando o desmarcando las secciones que deseas incluir.
          </DialogDescription>
        </DialogHeader>
 
        {/* Botones de Selección Rápida */}
        <div className="flex gap-2.5 my-3">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={marcarTodo}
            className="flex-1 rounded-xl text-xs font-semibold py-1.5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          >
            ✓ Seleccionar Todo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={desmarcarTodo}
            className="flex-1 rounded-xl text-xs font-semibold py-1.5 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          >
            ✗ Ficha Básica Solo
          </Button>
        </div>

        {/* Panel de Opciones Clínicas (Checklist Interactivo) */}
        <div className="flex flex-col gap-3 my-4">
          
          {/* Opción 1: Datos Personales (Bloqueado por defecto) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex gap-4 items-center opacity-85">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-880 text-slate-500 dark:text-slate-400">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Datos de Identificación Personal
                </h4>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Requerido
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                Información general, CI, edad, celular, dirección y contacto de emergencia.
              </p>
            </div>
            <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Opción 2: Antecedentes Clínicos (Confirmación mediante Checkbox) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIncluirAntecedentes(!incluirAntecedentes)}
            className={`group cursor-pointer rounded-2xl border p-4 flex gap-4 items-center transition-all bg-gradient-to-br from-emerald-500/5 to-teal-500/5 
              ${incluirAntecedentes 
                ? 'border-emerald-500/40 dark:border-emerald-400/40 shadow-md shadow-emerald-500/5' 
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/30'
              }`}
          >
            <div className={`p-3 rounded-xl transition-all ${incluirAntecedentes ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/10' : 'bg-slate-200/50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'}`}>
              <Heart className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className={`text-sm font-bold leading-none ${incluirAntecedentes ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                Antecedentes Médicos
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Incluye los 4 bloques clínicos: patológicos personales, familiares, hábitos y ginecológicos (si aplica).
              </p>
            </div>
            <div className="flex items-center justify-center p-1">
              {incluirAntecedentes ? (
                <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="h-5 w-5 text-slate-400 dark:text-slate-600" />
              )}
            </div>
          </motion.div>

        </div>

        {/* Aviso de Sincronización en Tiempo Real */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-start mb-6">
          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-normal">
            El sistema consultará de forma segura el expediente en la API de Django y generará el listado consolidado con las secciones de antecedentes confirmadas.
          </p>
        </div>

        {/* Acciones de Exportación */}
        <div className="flex gap-3 justify-end border-t pt-4 dark:border-emerald-500/10">
          <Button
            variant="outline"
            onClick={() => setAbierto(false)}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:bg-slate-100 transition-all font-semibold"
          >
            Cancelar
          </Button>

          <Button
            onClick={() => handleExport('PDF')}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl shadow-md shadow-red-500/20 hover:shadow-red-500/40 border-0 flex gap-2 font-bold px-4 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generar PDF
          </Button>

          <Button
            onClick={() => handleExport('Excel')}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 border-0 flex gap-2 font-bold px-4 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sheet className="h-4 w-4" />
            )}
            Generar Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
