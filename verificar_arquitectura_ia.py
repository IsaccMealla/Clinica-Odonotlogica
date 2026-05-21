#!/usr/bin/env python
"""
Verificador de arquitectura IA - Validate implementation
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.management import call_command
from django.db import models
from gestion_clinica.models import ImagenClinica

def verificar_archivos():
    """Verifica que todos los archivos existan"""
    archivos_requeridos = [
        'gestion_clinica/utils/dicom_processor.py',
        'gestion_clinica/utils/ia_inference.py',
        'gestion_clinica/utils/diagnostico_manual.py',
        'backend/celery.py',
        'gestion_clinica/tasks.py',
    ]
    
    print("\n" + "="*60)
    print("VERIFICACIÓN DE ARCHIVOS")
    print("="*60)
    
    for archivo in archivos_requeridos:
        ruta = os.path.join(os.path.dirname(__file__), archivo)
        if os.path.exists(ruta):
            print(f"✓ {archivo}")
        else:
            print(f"✗ FALTA: {archivo}")

def verificar_modelos():
    """Verifica que los campos del modelo existan"""
    print("\n" + "="*60)
    print("VERIFICACIÓN DE CAMPOS EN MODELO")
    print("="*60)
    
    campos_requeridos = [
        'hallazgos_ia',
        'hallazgos_manuales',
        'estado_procesamiento',
        'imagen_anotada',
        'tarea_celery_id'
    ]
    
    for campo in campos_requeridos:
        if hasattr(ImagenClinica, campo):
            print(f"✓ ImagenClinica.{campo}")
        else:
            print(f"✗ FALTA: ImagenClinica.{campo}")

def verificar_configuracion():
    """Verifica que Celery esté configurado"""
    print("\n" + "="*60)
    print("VERIFICACIÓN DE CONFIGURACIÓN CELERY")
    print("="*60)
    
    from django.conf import settings
    
    celery_settings = [
        'CELERY_BROKER_URL',
        'CELERY_RESULT_BACKEND',
        'CELERY_ACCEPT_CONTENT',
        'CELERY_TASK_SERIALIZER',
    ]
    
    for setting in celery_settings:
        if hasattr(settings, setting):
            print(f"✓ {setting}")
        else:
            print(f"✗ FALTA: {setting}")

def verificar_imports():
    """Verifica que todos los imports funcionen"""
    print("\n" + "="*60)
    print("VERIFICACIÓN DE IMPORTS")
    print("="*60)
    
    try:
        from gestion_clinica.utils.dicom_processor import DICOMProcessor, BiosafetyFilterError
        print("✓ dicom_processor")
    except ImportError as e:
        print(f"✗ dicom_processor: {e}")
    
    try:
        from gestion_clinica.utils.ia_inference import CNNInferenceService
        print("✓ ia_inference")
    except ImportError as e:
        print(f"✗ ia_inference: {e}")
    
    try:
        from gestion_clinica.utils.diagnostico_manual import DiagnosticoManualService
        print("✓ diagnostico_manual")
    except ImportError as e:
        print(f"✗ diagnostico_manual: {e}")
    
    try:
        from gestion_clinica.tasks import procesar_inferencia_ia_task
        print("✓ tasks")
    except ImportError as e:
        print(f"✗ tasks: {e}")
    
    try:
        from backend.celery import app
        print("✓ celery")
    except ImportError as e:
        print(f"✗ celery: {e}")

def verificar_viewset():
    """Verifica que el ViewSet tenga las nuevas acciones"""
    print("\n" + "="*60)
    print("VERIFICACIÓN DE VIEWSET")
    print("="*60)
    
    from gestion_clinica.views import ImagenClinicaViewSet
    
    acciones_requeridas = [
        'procesar_ia',
        'diagnostico_manual',
        'estado_procesamiento',
        'descargar_imagen_anotada'
    ]
    
    for accion in acciones_requeridas:
        if hasattr(ImagenClinicaViewSet, accion):
            print(f"✓ {accion}")
        else:
            print(f"✗ FALTA: {accion}")

def verificar_dependencias():
    """Verifica que las dependencias estén instaladas"""
    print("\n" + "="*60)
    print("VERIFICACIÓN DE DEPENDENCIAS PYTHON")
    print("="*60)
    
    dependencias = {
        'pydicom': 'DICOM processing',
        'celery': 'Task queue',
        'redis': 'Message broker',
        'PIL': 'Image processing',
        'numpy': 'Numerical computing',
        'torch': 'PyTorch',
        'onnxruntime': 'ONNX inference',
    }
    
    for paquete, descripcion in dependencias.items():
        try:
            __import__(paquete)
            print(f"✓ {paquete} ({descripcion})")
        except ImportError:
            print(f"✗ {paquete} ({descripcion}) - Instalar: pip install {paquete}")

def main():
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "VERIFICACIÓN ARQUITECTURA IA - RADIOGRAFÍAS".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    verificar_archivos()
    verificar_modelos()
    verificar_configuracion()
    verificar_imports()
    verificar_viewset()
    verificar_dependencias()
    
    print("\n" + "="*60)
    print("PRÓXIMOS PASOS:")
    print("="*60)
    print("1. python manage.py makemigrations")
    print("2. python manage.py migrate")
    print("3. redis-server (en otra terminal)")
    print("4. celery -A backend worker -l info (en otra terminal)")
    print("5. python manage.py runserver (en otra terminal)")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
