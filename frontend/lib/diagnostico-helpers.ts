export interface Hallazgo {
  etiqueta: string;
  bounding_box: [number, number, number, number];
  observaciones: string;
  confianza?: number;
  color?: string;
}

export interface EstadoRadiografia {
  imagen_id: string;
  imagen_url?: string;
  imagen_anotada_url?: string | null;
  estado: 'Pendiente' | 'Procesando' | 'Procesado' | 'Error';
  estado_tarea: string;
  hallazgos_ia: any;
  hallazgos_manuales: Hallazgo[];
  tiene_imagen_anotada: boolean;
}

export const ETIQUETAS_DIAGNOSTICO = [
  'Caries',
  'Pérdida Ósea',
  'Sarro',
  'Inflamación',
  'Fractura',
  'Malposición',
  'Implante',
  'Corona',
  'Otro'
];

export function dibujarAnotaciones(
  canvas: HTMLCanvasElement,
  imagen: HTMLImageElement,
  hallazgos: Hallazgo[]
) {
  const ctx = canvas.getContext('2d')!;
  canvas.width = imagen.width;
  canvas.height = imagen.height;
  
  ctx.drawImage(imagen, 0, 0);
  ctx.lineWidth = 3;
  ctx.font = '14px Arial';
  
  hallazgos.forEach(h => {
    const color = h.color || '#ff0000';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const [x1, y1, x2, y2] = h.bounding_box;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillText(h.etiqueta, x1, y1 - 5);
  });
}

export function dibujarHallazgos(
  canvas: HTMLCanvasElement,
  hallazgos: Hallazgo[],
  defaultColor = '#ff0000'
) {
  const ctx = canvas.getContext('2d')!;
  ctx.lineWidth = 3;
  ctx.font = '14px Arial';
  
  hallazgos.forEach(h => {
    const color = h.color || defaultColor;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    const [x1, y1, x2, y2] = h.bounding_box;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.fillText(h.etiqueta, x1, y1 - 5);
  });
}

export function extraerCoordenadas(event: MouseEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return [
    (event.clientX - rect.left) * scaleX,
    (event.clientY - rect.top) * scaleY
  ];
}

export function calcularBoundingBox(inicio: [number, number], fin: [number, number]) {
  return [
    Math.min(inicio[0], fin[0]),
    Math.min(inicio[1], fin[1]),
    Math.max(inicio[0], fin[0]),
    Math.max(inicio[1], fin[1])
  ] as [number, number, number, number];
}
