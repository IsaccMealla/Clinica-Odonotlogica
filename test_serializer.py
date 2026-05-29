#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from gestion_clinica.models import Paciente
from gestion_clinica.serializers import PacienteSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

print("\n" + "="*70)
print("PROBANDO SERIALIZACIÓN DE PACIENTES")
print("="*70)

pacientes = Paciente.objects.all()
print(f"\nTotal pacientes: {pacientes.count()}\n")

for p in pacientes:
    try:
        serializer = PacienteSerializer(p)
        data = serializer.data
        print(f"✓ Paciente {p.nombres}: OK")
    except Exception as e:
        print(f"✗ Paciente {p.nombres}: {type(e).__name__}")
        print(f"  Error: {str(e)[:150]}\n")

print("\n" + "="*70)
print("PROBANDO ENDPOINT DE API")
print("="*70)

from rest_framework.test import APIRequestFactory
from gestion_clinica.views import PacienteViewSet

factory = APIRequestFactory()
request = factory.get('/api/pacientes/')
request.user = User.objects.filter(rol='ADMIN').first()

if request.user:
    print(f"Usuario de prueba: {request.user} (rol: {request.user.rol})")
    viewset = PacienteViewSet.as_view({'get': 'list'})
    response = viewset(request)
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error en respuesta:\n{response.data}")
else:
    print("No hay usuario ADMIN para testear")
