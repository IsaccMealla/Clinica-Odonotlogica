import { ImageUploader } from "@/components/image-uploader"

export default function ImagesUploadPage() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Subir Imágenes</h1>
      <p className="text-muted-foreground mt-2">Arrastra .dcm, .png, .jpg y asócialo a un paciente.</p>
      <div className="mt-6">
        <ImageUploader />
      </div>
    </div>
  )
}
