"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Video, Package } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ProcedureType =
  | "Limpieza"
  | "Extracción"
  | "Cirugía"
  | "Implante"
  | "Endodoncia"
  | "Ortodoncia"

interface Material {
  name: string
  quantity?: string
  category?: string
}

interface ProcedureMediaProps {
  procedureType: ProcedureType
  materials?: Material[]
  videoPath?: string
  title?: string
  description?: string
}

const procedureDefaults: Record<ProcedureType, { materials: Material[]; title: string; description: string }> = {
  Limpieza: {
    title: "Limpieza Profesional",
    description: "Procedimiento de limpieza y profilaxis dental",
    materials: [
      { name: "Suero fisiológico", quantity: "500ml", category: "Líquido" },
      { name: "Copas de goma", quantity: "5", category: "Instrumental" },
      { name: "Pasta profiláctica", quantity: "1 tubo", category: "Químico" },
      { name: "Hilo dental", quantity: "50m", category: "Consumible" },
    ],
  },
  Extracción: {
    title: "Extracción Dental",
    description: "Procedimiento de extracción simple o quirúrgica",
    materials: [
      { name: "Anestésico local", quantity: "2 ampolletas", category: "Fármaco" },
      { name: "Elevadores", quantity: "3 piezas", category: "Instrumental" },
      { name: "Fórceps", quantity: "2 piezas", category: "Instrumental" },
      { name: "Torunda de gasa estéril", quantity: "10", category: "Material quirúrgico" },
      { name: "Sutura", quantity: "1 paquete", category: "Material quirúrgico" },
    ],
  },
  Cirugía: {
    title: "Cirugía Oral",
    description: "Procedimientos quirúrgicos complejos",
    materials: [
      { name: "Anestésico local infiltrativo", quantity: "3 ampolletas", category: "Fármaco" },
      { name: "Bisturi quirúrgico", quantity: "2 piezas", category: "Instrumental" },
      { name: "Pinzas hemostáticas", quantity: "4 piezas", category: "Instrumental" },
      { name: "Instrumental quirúrgico completo", quantity: "1 set", category: "Instrumental" },
      { name: "Gasa estéril", quantity: "20 paquetes", category: "Material quirúrgico" },
      { name: "Sutura reabsorbible", quantity: "2 paquetes", category: "Material quirúrgico" },
      { name: "Drenaje quirúrgico", quantity: "1", category: "Material quirúrgico" },
    ],
  },
  Implante: {
    title: "Implante Dental",
    description: "Colocación de implantes óseo integrados",
    materials: [
      { name: "Implante dental", quantity: "1", category: "Implante" },
      { name: "Abutment", quantity: "1", category: "Implante" },
      { name: "Anestésico local", quantity: "3 ampolletas", category: "Fármaco" },
      { name: "Instrumental de implantología", quantity: "1 set", category: "Instrumental" },
      { name: "Injerto óseo (si aplica)", quantity: "1 vial", category: "Biomaterial" },
    ],
  },
  Endodoncia: {
    title: "Tratamiento de Conducto",
    description: "Endodoncia o tratamiento del conducto radicular",
    materials: [
      { name: "Anestésico local", quantity: "2 ampolletas", category: "Fármaco" },
      { name: "Limas endodónticas", quantity: "1 set", category: "Instrumental" },
      { name: "Gutapercha", quantity: "1 paquete", category: "Material de relleno" },
      { name: "Hipoclorito de sodio", quantity: "250ml", category: "Desinfectante" },
      { name: "Cemento endodóntico", quantity: "1 tubo", category: "Químico" },
    ],
  },
  Ortodoncia: {
    title: "Procedimiento Ortodóncico",
    description: "Colocación y ajuste de aparatología ortodóncica",
    materials: [
      { name: "Brackets", quantity: "14-16", category: "Aparatología" },
      { name: "Alambres", quantity: "1 set", category: "Aparatología" },
      { name: "Ligaduras elásticas", quantity: "1 paquete", category: "Accesorios" },
      { name: "Bandas ortodóncicas", quantity: "8", category: "Aparatología" },
    ],
  },
}

export function ProcedureMedia({
  procedureType,
  materials,
  videoPath,
  title,
  description,
}: ProcedureMediaProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true)
  const defaults = procedureDefaults[procedureType]
  const finalMaterials = materials || defaults.materials
  const finalTitle = title || defaults.title
  const finalDescription = description || defaults.description
  const finalVideoPath = videoPath || `/media/procedures/${procedureType.toLowerCase().replace(/\s+/g, "-")}-preparation.mp4`

  return (
    <div className="w-full space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {finalTitle}
          </CardTitle>
          <CardDescription>{finalDescription}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Materiales
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Preparación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Materiales Necesarios</CardTitle>
              <CardDescription>Lista completa de materiales para el procedimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {finalMaterials && finalMaterials.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {finalMaterials.map((material, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{material.name}</p>
                        {material.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {material.category}
                          </Badge>
                        )}
                      </div>
                      {material.quantity && (
                        <div className="ml-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                          {material.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No hay materiales especificados para este procedimiento.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video de Preparación</CardTitle>
              <CardDescription>Tutorial de preparación clínica para el procedimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm text-slate-400">Cargando video...</span>
                    </div>
                  </div>
                )}
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay={false}
                  defaultMuted
                  onLoadedData={() => setIsVideoLoading(false)}
                  onError={() => {
                    setIsVideoLoading(false)
                  }}
                >
                  <source src={finalVideoPath} type="video/mp4" />
                  <track kind="captions" />
                </video>
              </div>

              {!isVideoLoading && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Visualiza el video completo antes de iniciar el procedimiento. Asegúrate de tener todos los
                    materiales preparados.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
