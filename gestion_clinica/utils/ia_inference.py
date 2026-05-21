import numpy as np
from PIL import Image
import os
import json
from datetime import datetime

_model_cache = None
_model_cache_path = None

class CNNInferenceService:
    
    def __init__(self, model_path=None):
        global _model_cache, _model_cache_path
        self.model_path = model_path or os.getenv('CNN_MODEL_PATH')
        if _model_cache is not None and self.model_path == _model_cache_path:
            self.model = _model_cache
        else:
            self.model = self._load_model()
            _model_cache = self.model
            _model_cache_path = self.model_path
    
    def _load_model(self):
        if self.model_path and os.path.exists(self.model_path):
            return self._load_from_file()
        # Si no hay modelo, retorna None para usar simulación como fallback
        return None
    
    def _load_from_file(self):
        if self.model_path.endswith('.h5'):
            try:
                import tensorflow as tf
                print(f"Cargando modelo Keras: {self.model_path}")
                return tf.keras.models.load_model(self.model_path)
            except Exception as e:
                print(f"Error loading Keras model: {e}")
                return None
        
        elif self.model_path.endswith('.pt'):
            try:
                import torch
                print(f"Cargando modelo PyTorch: {self.model_path}")
                return torch.load(self.model_path)
            except Exception as e:
                print(f"Error loading PyTorch model: {e}")
                return None
        
        elif self.model_path.endswith('.onnx'):
            try:
                import onnxruntime
                print(f"Cargando modelo ONNX: {self.model_path}")
                return onnxruntime.InferenceSession(self.model_path)
            except Exception as e:
                print(f"Error loading ONNX model: {e}")
                return None
        
        return None
    
    def preprocess_image(self, image_path, target_size=(224, 224)):
        try:
            image = Image.open(image_path).convert('RGB')
            image = image.resize(target_size)
            image_array = np.array(image) / 255.0
            return np.expand_dims(image_array, axis=0)
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def infer(self, image_path):
        """
        Ejecuta inferencia en la imagen. 
        Si hay modelo disponible, lo usa.
        Si no, usa simulación como fallback.
        """
        processed_image = self.preprocess_image(image_path)
        
        if self.model is not None and processed_image is not None:
            try:
                print(f"Ejecutando inferencia CNN en: {image_path}")
                predictions = self._run_model_inference(processed_image)
                if predictions is not None:
                    hallazgos = self._format_predictions(predictions)
                else:
                    print("CNN retornó None, usando simulación como fallback")
                    hallazgos = self._simulate_inference(image_path)
            except Exception as e:
                print(f"Error en inferencia CNN: {e}, usando simulación")
                hallazgos = self._simulate_inference(image_path)
        else:
            print("No hay modelo CNN disponible, usando simulación")
            hallazgos = self._simulate_inference(image_path)
        
        # Agregar metadata
        hallazgos['modelo_usado'] = 'CNN' if self.model is not None else 'SIMULACION'
        hallazgos['timestamp'] = datetime.now().isoformat()
        
        return hallazgos
    
    def _simulate_inference(self, image_path):
        """Simulación de hallazgos para testing"""
        return {
            'detecciones': [
                {
                    'etiqueta': 'Caries',
                    'confianza': 0.92,
                    'bounding_box': [120, 80, 180, 140]
                },
                {
                    'etiqueta': 'Pérdida Ósea',
                    'confianza': 0.78,
                    'bounding_box': [200, 100, 280, 200]
                },
                {
                    'etiqueta': 'Sarro',
                    'confianza': 0.65,
                    'bounding_box': [60, 120, 130, 180]
                }
            ],
            'diagnostico_general': 'Hallazgos detectados con severidad media (SIMULADO)',
            'confianza_promedio': 0.78
        }
    
    def _format_predictions(self, predictions):
        """Formatea predicciones del modelo a formato de hallazgos"""
        try:
            # Aquí depende del formato de salida del modelo
            # Este es un formato genérico de ejemplo
            detecciones = []
            
            if isinstance(predictions, dict):
                if 'detections' in predictions:
                    detecciones = predictions['detections']
                elif 'predictions' in predictions:
                    detecciones = predictions['predictions']
            elif isinstance(predictions, list):
                detecciones = predictions
            
            # Asegurar que tiene el formato correcto
            detecciones_formateadas = []
            for det in detecciones:
                if isinstance(det, dict):
                    detecciones_formateadas.append({
                        'etiqueta': det.get('label', det.get('class', 'Unknown')),
                        'confianza': float(det.get('confidence', det.get('score', 0.0))),
                        'bounding_box': det.get('bbox', det.get('box', [0, 0, 0, 0]))
                    })
            
            confianza_promedio = np.mean([d['confianza'] for d in detecciones_formateadas]) if detecciones_formateadas else 0
            
            return {
                'detecciones': detecciones_formateadas,
                'diagnostico_general': f'Detectadas {len(detecciones_formateadas)} anomalías',
                'confianza_promedio': float(confianza_promedio),
                'modelo_usado': 'CNN'
            }
        except Exception as e:
            print(f"Error formateando predicciones: {e}")
            return None
    
    def _run_model_inference(self, processed_image):
        """Ejecuta inferencia con el modelo cargado"""
        if self.model is None:
            return None
        
        try:
            # Para TensorFlow/Keras
            if hasattr(self.model, 'predict'):
                print("Ejecutando predicción TensorFlow")
                predictions = self.model.predict(processed_image, verbose=0)
                return predictions
            
            # Para PyTorch
            elif hasattr(self.model, 'eval'):
                print("Ejecutando predicción PyTorch")
                import torch
                self.model.eval()
                with torch.no_grad():
                    predictions = self.model(torch.from_numpy(processed_image).float())
                return predictions.cpu().numpy()
            
            # Para ONNX
            elif hasattr(self.model, 'run'):
                print("Ejecutando predicción ONNX")
                input_name = self.model.get_inputs()[0].name
                predictions = self.model.run(None, {input_name: processed_image})
                return predictions[0] if predictions else None
            
        except Exception as e:
            print(f"Error durante inferencia del modelo: {e}")
            return None
        
        return None
