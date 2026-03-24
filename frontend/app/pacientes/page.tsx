import { NuevoPaciente } from "@/components/nuevo-paciente"
import { PapeleraPacientes } from "@/components/papelera-pacientes"
import { TablaPacientes } from "@/components/tabla-pacientes" // Importamos el nuevo componente

async function getPacientes() {
  try {
    // Django ahora filtra activos por defecto gracias al get_queryset
    const res = await fetch("http://localhost:8000/api/pacientes/", { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error conectando con Django:", error);
    return [];
  }
}

export default async function PacientesPage() {
  const pacientes = await getPacientes();

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
          {/* Módulo de papelera */}
          <PapeleraPacientes />
          {/* Botón de creación */}
          <NuevoPaciente />
        </div>
      </div>

      {/* TABLA CON BUSCADOR INTEGRADO 
          Le pasamos los datos del servidor al componente de cliente
      */}
      <TablaPacientes pacientesIniciales={pacientes} />
      
    </div>
  );
}