"use client"

import { useMemo, useState } from "react"
import Joyride, { Step } from "react-joyride"

export default function TutorialPage() {
  const [run, setRun] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  const steps: Step[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        content: "Bienvenido al tutorial de la Clínica Dental Universitaria. Sigue los pasos para conocer el flujo de trabajo.",
      },
      {
        target: "#assigned-patients",
        content: "En esta sección verás los pacientes asignados a cada estudiante.",
      },
      {
        target: "#upload-images",
        content: "Sigue aquí para subir imágenes clínicas y DICOM del tratamiento.",
      },
      {
        target: "#register-treatment",
        content: "Registra el tratamiento realizado y su progreso.",
      },
      {
        target: "#request-approval",
        content: "Solicita aprobación del docente una vez finalizado el trabajo.",
      },
    ],
    []
  )

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Tutorial interactivo</h1>
      <p className="text-muted-foreground">Te guiará por las funciones clave del módulo académico.</p>

      <div id="assigned-patients" className="p-4 rounded-lg border">
        <h2 className="text-xl font-semibold">Paso 1: Ver pacientes asignados</h2>
        <p>En la página de asignaciones puedes ver y filtrar pacientes por estudiante y tutor.</p>
      </div>

      <div id="upload-images" className="p-4 rounded-lg border">
        <h2 className="text-xl font-semibold">Paso 2: Subir imágenes clínicas</h2>
        <p>Usa la página de imágenes para cargar radiografías, fotos y archivos DICOM.</p>
      </div>

      <div id="register-treatment" className="p-4 rounded-lg border">
        <h2 className="text-xl font-semibold">Paso 3: Registrar tratamientos</h2>
        <p>Agrega notas clínicas y actualiza el estado de la atención para cada paciente.</p>
      </div>

      <div id="request-approval" className="p-4 rounded-lg border">
        <h2 className="text-xl font-semibold">Paso 4: Solicitar aprobación docente</h2>
        <p>En la página de aprobaciones, el docente puede firmar digitalmente y aprobar/rechazar el tratamiento.</p>
      </div>

      <button className="btn btn-primary" onClick={() => { setStepIndex(0); setRun(true) }}>
        Repetir tutorial
      </button>

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
        callback={(data) => {
          if (["finished", "skipped"].includes(data.status)) setRun(false)
          if (typeof data.index === "number") setStepIndex(data.index)
        }}
      />
    </div>
  )
}
