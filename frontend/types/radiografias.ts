// types/radiografias.ts

export interface AutorizacionImagen {
    id: number;
    paciente: string | number;
    docente: number;
    docente_username?: string;
    estudiante: number;
    estudiante_username?: string;
    tipo_imagen: 'INTRAORAL' | 'EXTRAORAL' | 'PANORAMICA' | 'CEFALOMETRICA' | 'CBCT' | 'OTRO';
    estado: 'PENDIENTE' | 'COMPLETADA' | 'EXPIRADA';
    tiempo_limite_minutos: number;
    fecha_solicitud: string;
}