import { PatientImageGallery } from "@/components/patient-image-gallery"

export default function ImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Imágenes</h1>
        <p className="text-muted-foreground">Carga, visualiza y filtra imágenes dentales por paciente.</p>
      </div>
      <PatientImageGallery />
    </div>
  )
}
