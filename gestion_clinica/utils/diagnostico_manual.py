from PIL import Image, ImageDraw
import json
import base64
from io import BytesIO


class DiagnosticoManualService:
    
    @staticmethod
    def crear_anotacion(image_path, hallazgos_manual):
        imagen = Image.open(image_path).convert('RGB')
        draw = ImageDraw.Draw(imagen)
        
        for hallazgo in hallazgos_manual:
            bbox = hallazgo.get('bounding_box', [])
            etiqueta = hallazgo.get('etiqueta', '')
            
            if len(bbox) == 4:
                draw.rectangle(bbox, outline='red', width=3)
                draw.text((bbox[0], bbox[1] - 15), etiqueta, fill='red')
        
        buffer = BytesIO()
        imagen.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def guardar_hallazgos_manual(image_path, hallazgos, output_path=None):
        imagen_anotada = DiagnosticoManualService.crear_anotacion(image_path, hallazgos)
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(imagen_anotada.getvalue())
        
        return imagen_anotada
    
    @staticmethod
    def validar_hallazgos(hallazgos):
        required_fields = ['etiqueta', 'bounding_box', 'observaciones']
        for hallazgo in hallazgos:
            for field in required_fields:
                if field not in hallazgo:
                    raise ValueError(f"Campo requerido faltante: {field}")
        return True
    
    @staticmethod
    def merge_hallazgos(hallazgos_ia, hallazgos_manual):
        merged = {
            'automaticos': hallazgos_ia,
            'manuales': hallazgos_manual,
            'total_detecciones': len(hallazgos_ia.get('detecciones', [])) + len(hallazgos_manual)
        }
        return merged
