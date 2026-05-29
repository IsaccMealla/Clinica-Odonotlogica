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
import { 
  Download, 
  FileText, 
  Sheet, 
  Loader2, 
  Users,
  Heart, 
  Stethoscope, 
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { exportPacientesPDF, exportPacienteDetallePDF } from '@/lib/exporters/pdf-exporter';
import { exportPacientesExcel, exportPacienteDetalleExcel } from '@/lib/exporters/excel-exporter';
import { motion } from 'framer-motion';

interface ModalExportacionListadoProps {
  pacientes: any[];
  tituloListado: string; // ej: "Filtro Actual" o "Todo el Universo"
}

export function ModalExportacionListado({ pacientes, tituloListado }: ModalExportacionListadoProps) {
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState('');
  
  // Estados para checkboxes de confirmación
  const [incluirAntecedentes, setIncluirAntecedentes] = useState(false);

  const handleExportLote = async (formato: 'PDF' | 'Excel') => {
    if (pacientes.length === 0) {
      toast.error("No hay pacientes seleccionados para exportar");
      return;
    }

    setLoading(true);
    setProgreso('Iniciando procesamiento...');

    try {
      const token = localStorage.getItem("access_token");

      // CASO A: Exportación Básica Simple (Listado en tabla compacta como la foto 2 del usuario)
      if (!incluirAntecedentes) {
        setProgreso('Generando listado compacto...');
        if (formato === 'PDF') {
          exportPacientesPDF(pacientes);
        } else {
          exportPacientesExcel(pacientes);
        }
        toast.success(`Listado compacto exportado exitosamente a ${formato}`);
        setAbierto(false);
        return;
      }

      // CASO B: Exportación Clínica Avanzada en Lote (Dossier completo de pacientes)
      // Realizamos fetchs secuenciales/paralelos para obtener antecedentes de cada paciente en el lote
      const pacientesCompletos: any[] = [];
      let completados = 0;

      for (const p of pacientes) {
        setProgreso(`Obteniendo datos de: ${p.nombres} (${completados + 1}/${pacientes.length})`);
        
        try {
          const res = await fetch(`http://localhost:8000/api/pacientes/${p.id}/`, {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            }
          });
          
          if (res.ok) {
            const dataCompleta = await res.json();
            pacientesCompletos.push(dataCompleta);
          } else {
            // Fallback con los datos básicos que ya tenemos en caso de error
            pacientesCompletos.push(p);
          }
        } catch (e) {
          pacientesCompletos.push(p);
        }
        
        completados++;
      }

      setProgreso('Consolidando archivos de exportación...');

      // Generar el reporte avanzado por lotes
      const config = { incluirAntecedentes, incluirCarpetaMedica: false };

      if (formato === 'PDF') {
        // En PDF, para exportación en lote con detalles, generamos un PDF secuencial con saltos de página
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // El pdf-exporter requiere importar y llamar de forma elegante. 
        // Para hacerlo limpio y reutilizable sin duplicar lógica compleja, podemos iterar los pacientes
        // e ir añadiendo páginas al mismo documento usando la lógica de exportPacienteDetallePDF modificada
        // o llamando a una versión en lote.
        // Escribiremos la función exportPacientesLotePDF en pdf-exporter que hace exactamente esto de forma nativa.
        const { exportPacientesLotePDF } = await import('@/lib/exporters/pdf-exporter');
        exportPacientesLotePDF(pacientesCompletos, config, tituloListado);
      } else {
        const { exportPacientesLoteExcel } = await import('@/lib/exporters/excel-exporter');
        exportPacientesLoteExcel(pacientesCompletos, config, tituloListado);
      }

      toast.success(`Reporte detallado por lote exportado a ${formato}`);
      setAbierto(false);
    } catch (error) {
      console.error("Error en exportación en lote:", error);
      toast.error("Ocurrió un error al procesar el lote clínico");
    } finally {
      setLoading(false);
      setProgreso('');
    }
  };

  const seleccionarTodo = () => {
    setIncluirAntecedentes(true);
  };

  const deseleccionarTodo = () => {
    setIncluirAntecedentes(false);
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1.5 cursor-pointer border-0"
        >
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{tituloListado} ({pacientes.length})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-emerald-500/25 bg-slate-50 dark:bg-[#0c1a17]/95 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Exportar Listado de Pacientes
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Estás por exportar un lote de <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pacientes.length} pacientes</span> ({tituloListado}). Confirma qué datos deseas incluir en el reporte.
          </DialogDescription>
        </DialogHeader>

        {/* Botones rápidos de selección */}
        <div className="flex gap-2 my-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={seleccionarTodo}
            className="flex-1 rounded-lg text-[10px] font-bold py-1 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
          >
            ✓ Dossier Completo (Todo)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={deseleccionarTodo}
            className="flex-1 rounded-lg text-[10px] font-bold py-1 border border-slate-300 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          >
            ✗ Listado Simple Solo
          </Button>
        </div>

        {/* Checkbox Panel */}
        <div className="flex flex-col gap-3 my-4">
          
          {/* Opción 1: Listado Base (Siempre activo) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-4 flex gap-4 items-center opacity-85">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-500">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ficha Identificación Base (Listado)
                </h4>
                <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Obligatorio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Genera la tabla general con CI, Nombres, Celular, Sexo y Edad.
              </p>
            </div>
            <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Opción 2: Antecedentes */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIncluirAntecedentes(!incluirAntecedentes)}
            className={`group cursor-pointer rounded-2xl border p-4 flex gap-4 items-center transition-all bg-gradient-to-br from-emerald-500/5 to-teal-500/5 
              ${incluirAntecedentes 
                ? 'border-emerald-500/40 dark:border-emerald-400/40 shadow-md' 
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/25'
              }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${incluirAntecedentes ? 'bg-emerald-600 text-white' : 'bg-slate-200/50 dark:bg-slate-800/80 text-emerald-600'}`}>
              <Heart className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className={`text-xs font-bold ${incluirAntecedentes ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                Incluir Antecedentes Médicos
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Agrega historia patológica, familiar, no patológica y hábitos de cada paciente.
              </p>
            </div>
            <div>
              {incluirAntecedentes ? (
                <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="h-5 w-5 text-slate-400 dark:text-slate-600" />
              )}
            </div>
          </motion.div>

        </div>

        {/* Estado de carga / Progreso */}
        {loading && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-center mb-4">
            <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold leading-normal animate-pulse">
              {progreso}
            </p>
          </div>
        )}

        {/* Aviso */}
        {!loading && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-start mb-6">
            <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-normal">
              Si marcas antecedentes o carpeta médica, la app sincronizará en lote a los pacientes en segundo plano para consolidar el dossier clínico en un único archivo.
            </p>
          </div>
        )}

        {/* Acciones */}
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
            onClick={() => handleExportLote('PDF')}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl shadow-md border-0 flex gap-2 font-bold px-4 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generar PDF
          </Button>

          <Button
            onClick={() => handleExportLote('Excel')}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl shadow-md border-0 flex gap-2 font-bold px-4 transition-all cursor-pointer"
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
