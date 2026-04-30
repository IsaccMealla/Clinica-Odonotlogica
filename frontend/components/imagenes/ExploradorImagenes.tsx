"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileImage, Scissors, Scan } from "lucide-react"

export default function ExploradorImagenes({ imagenes }: { imagenes: any[] }) {
  return (
    <Tabs defaultValue="todas" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="todas">Todas</TabsTrigger>
        <TabsTrigger value="radiografias">Radiografías (PSP)</TabsTrigger>
        <TabsTrigger value="proceso">Proceso de Trabajo</TabsTrigger>
      </TabsList>

      <TabsContent value="todas" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {imagenes.map((img) => (
          <Card key={img.id} className="group cursor-pointer overflow-hidden">
            <div className="relative aspect-square">
              <img 
                src={img.archivo} 
                alt={img.descripcion} 
                className="object-cover w-full h-full transition-transform group-hover:scale-110" 
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {img.categoria} - {new Date(img.fecha_adquisicion).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  )
}