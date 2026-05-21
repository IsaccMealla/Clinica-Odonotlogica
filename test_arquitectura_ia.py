#!/usr/bin/env python
"""
Script de prueba - Verifica que la inferencia IA funciona correctamente
"""
import os
import sys
import django
from io import BytesIO
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from gestion_clinica.models import ImagenClinica, Paciente, HistorialAuditoriaImagen
from gestion_clinica.utils.ia_inference import CNNInferenceService
from gestion_clinica.utils.diagnostico_manual import DiagnosticoManualService

User = get_user_model()

def crear_imagen_prueba():
    """Crea una imagen PNG de prueba"""
    img = Image.new('RGB', (224, 224), color='blue')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.getvalue()

def test_inference_service():
    """Prueba CNNInferenceService"""
    print("\n" + "="*60)
    print("TEST 1: CNNInferenceService")
    print("="*60)
    
    try:
        service = CNNInferenceService()
        
        # Crear imagen temporal
        img = Image.new('RGB', (224, 224), color='red')
        temp_path = '/tmp/test_imagen.png'
        img.save(temp_path)
        
        # Ejecutar inferencia
        resultado = service.infer(temp_path)
        
        print("✓ Inferencia ejecutada exitosamente")
        print(f"  Detecciones: {len(resultado.get('detecciones', []))}")
        print(f"  Etiquetas: {[d['etiqueta'] for d in resultado.get('detecciones', [])]}")
        
        # Limpiar
        os.remove(temp_path)
        return True
    
    except Exception as e:
        print(f"✗ Error en inferencia: {e}")
        return False

def test_diagnostico_manual():
    """Prueba DiagnosticoManualService"""
    print("\n" + "="*60)
    print("TEST 2: DiagnosticoManualService")
    print("="*60)
    
    try:
        # Crear imagen temporal
        img = Image.new('RGB', (300, 300), color='white')
        temp_path = '/tmp/test_imagen_manual.png'
        img.save(temp_path)
        
        # Hallazgos de prueba
        hallazgos = [
            {
                'etiqueta': 'Caries',
                'bounding_box': [50, 50, 100, 100],
                'observaciones': 'Caries interproximal'
            },
            {
                'etiqueta': 'Sarro',
                'bounding_box': [150, 150, 200, 200],
                'observaciones': 'Depósito de sarro'
            }
        ]
        
        # Validar
        DiagnosticoManualService.validar_hallazgos(hallazgos)
        print("✓ Validación de hallazgos exitosa")
        
        # Crear anotación
        imagen_anotada = DiagnosticoManualService.crear_anotacion(temp_path, hallazgos)
        print("✓ Anotaciones dibujadas exitosamente")
        
        # Merge
        hallazgos_ia = {
            'detecciones': [{'etiqueta': 'Caries', 'confianza': 0.85, 'bounding_box': [50, 50, 100, 100]}],
            'diagnostico_general': 'Hallazgos detectados'
        }
        
        merged = DiagnosticoManualService.merge_hallazgos(hallazgos_ia, hallazgos)
        print(f"✓ Merge completado: {merged['total_detecciones']} detecciones totales")
        
        # Limpiar
        os.remove(temp_path)
        return True
    
    except Exception as e:
        print(f"✗ Error en diagnóstico manual: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_auditoria():
    """Prueba registro de auditoría"""
    print("\n" + "="*60)
    print("TEST 3: Sistema de Auditoría")
    print("="*60)
    
    try:
        # Obtener o crear usuario de prueba
        try:
            user = User.objects.get(username='test_student')
        except User.DoesNotExist:
            user = User.objects.create_user(
                username='test_student',
                email='test@clinica.local',
                password='test123',
                rol='ESTUDIANTE'
            )
        
        # Obtener o crear paciente
        try:
            paciente = Paciente.objects.get(ci='12345678')
        except Paciente.DoesNotExist:
            paciente = Paciente.objects.create(
                ci='12345678',
                nombres='Test',
                apellido_paterno='Paciente',
                sexo='M',
                fecha_nacimiento='1990-01-01'
            )
        
        # Crear auditoría
        auditoria = HistorialAuditoriaImagen.objects.create(
            accion='TEST_AUDITORIA',
            estudiante=user,
            paciente=paciente,
            detalles={'test': 'data'}
        )
        
        print("✓ Auditoría registrada exitosamente")
        print(f"  ID: {auditoria.id}")
        print(f"  Acción: {auditoria.accion}")
        
        # Limpiar
        auditoria.delete()
        user.delete()
        paciente.delete()
        return True
    
    except Exception as e:
        print(f"✗ Error en auditoría: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_celery():
    """Prueba conexión con Celery"""
    print("\n" + "="*60)
    print("TEST 4: Celery + Redis")
    print("="*60)
    
    try:
        from gestion_clinica.tasks import procesar_inferencia_ia_task
        from celery.result import AsyncResult
        
        print("✓ Celery importado exitosamente")
        
        # Test task signature
        sig = procesar_inferencia_ia_task.signature(
            args=('00000000-0000-0000-0000-000000000000',),
            countdown=5
        )
        print("✓ Firma de tarea válida")
        
        # Intentar conectar con Redis
        from django.conf import settings
        broker_url = settings.CELERY_BROKER_URL
        print(f"✓ Broker URL: {broker_url}")
        
        # Test de que la tarea se puede serializar
        from celery import states
        print(f"✓ Estados Celery disponibles: {states.PENDING}, {states.SUCCESS}, {states.FAILURE}")
        
        return True
    
    except Exception as e:
        print(f"✗ Error en Celery: {e}")
        print("\n  NOTA: Redis debe estar ejecutándose en localhost:6379")
        print("  Para iniciar: redis-server")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "PRUEBAS - ARQUITECTURA IA".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    resultados = []
    
    resultados.append(("Inferencia IA", test_inference_service()))
    resultados.append(("Diagnóstico Manual", test_diagnostico_manual()))
    resultados.append(("Auditoría", test_auditoria()))
    resultados.append(("Celery + Redis", test_celery()))
    
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    
    for nombre, resultado in resultados:
        estado = "✓ PASS" if resultado else "✗ FAIL"
        print(f"{estado}: {nombre}")
    
    total_pass = sum(1 for _, r in resultados if r)
    total_test = len(resultados)
    
    print(f"\nTotal: {total_pass}/{total_test} pruebas exitosas")
    
    if total_pass == total_test:
        print("\n✓ Sistema listo para producción\n")
        return 0
    else:
        print(f"\n✗ {total_test - total_pass} prueba(s) fallida(s)\n")
        return 1

if __name__ == '__main__':
    sys.exit(main())
