import { PatientImageGallery } from "@/components/patient-image-gallery"

export default function ImagesGalleryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Galería de Imágenes</h1>
        <p className="text-muted-foreground">Visualiza las imágenes guardadas por paciente y categoría.</p>
      </div>
      <PatientImageGallery />
    </div>
  )
}
