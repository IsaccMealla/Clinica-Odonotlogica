#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from gestion_clinica.models import ImagenClinica

def crear_migraciones():
    print("✓ Migraciones de modelo actualizado (revisar manage.py migrate)")
    print("  python manage.py makemigrations")
    print("  python manage.py migrate")

def verificar_dependencias():
    print("\n✓ Verificando dependencias...")
    try:
        import pydicom
        print("  ✓ pydicom")
    except ImportError:
        print("  ✗ pydicom - pip install pydicom")
    
    try:
        import celery
        print("  ✓ celery")
    except ImportError:
        print("  ✗ celery - pip install celery")
    
    try:
        import redis
        print("  ✓ redis")
    except ImportError:
        print("  ✗ redis - pip install redis")
    
    try:
        import PIL
        print("  ✓ Pillow")
    except ImportError:
        print("  ✗ Pillow - pip install Pillow")

def verificar_redis():
    print("\n✓ Redis debe estar ejecutándose en localhost:6379")
    print("  En Windows: redis-server")
    print("  En Linux/Mac: redis-server")

def verificar_celery():
    print("\n✓ Celery worker debe estar ejecutándose")
    print("  celery -A backend worker -l info")

if __name__ == '__main__':
    print("="*60)
    print("SETUP INICIAL - SISTEMA IA RADIOGRAFÍAS")
    print("="*60)
    
    crear_migraciones()
    verificar_dependencias()
    verificar_redis()
    verificar_celery()
    
    print("\n" + "="*60)
    print("PASOS:")
    print("1. pip install -r requirements.txt")
    print("2. python manage.py makemigrations")
    print("3. python manage.py migrate")
    print("4. redis-server (en otra terminal)")
    print("5. celery -A backend worker -l info (en otra terminal)")
    print("6. python manage.py runserver (en otra terminal)")
    print("="*60)
