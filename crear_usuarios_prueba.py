#!/usr/bin/env python
"""
Script para crear usuarios de prueba con diferentes roles.
Ejecutar: python manage.py shell < crear_usuarios_prueba.py
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from gestion_clinica.models import Paciente
from datetime import date

User = get_user_model()

# Usuarios de prueba
usuarios_prueba = [
    {
        'username': 'admin@clinica.com',
        'email': 'admin@clinica.com',
        'password': 'Admin123!@#',
        'rol': 'ADMIN',
        'nombre': 'Administrador',
        'first_name': 'Admin',
        'last_name': 'Sistema',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'docente@clinica.com',
        'email': 'docente@clinica.com',
        'password': 'Docente123!@#',
        'rol': 'DOCENTE',
        'nombre': 'Dr. Rafael Flores',
        'first_name': 'Rafael',
        'last_name': 'Flores',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'username': 'estudiante1@clinica.com',
        'email': 'estudiante1@clinica.com',
        'password': 'Estudiante123!@#',
        'rol': 'ESTUDIANTE',
        'nombre': 'Carlos Mendez',
        'first_name': 'Carlos',
        'last_name': 'Mendez',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'estudiante2@clinica.com',
        'email': 'estudiante2@clinica.com',
        'password': 'Estudiante123!@#',
        'rol': 'ESTUDIANTE',
        'nombre': 'Ana García',
        'first_name': 'Ana',
        'last_name': 'García',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'recepcionista@clinica.com',
        'email': 'recepcionista@clinica.com',
        'password': 'Recepcion123!@#',
        'rol': 'RECEPCIONISTA',
        'nombre': 'María López',
        'first_name': 'María',
        'last_name': 'López',
        'is_staff': True,
        'is_superuser': False,
    },
]

print("\n" + "="*70)
print("CREANDO USUARIOS DE PRUEBA")
print("="*70)

for user_data in usuarios_prueba:
    rol = user_data.pop('rol')
    nombre = user_data.pop('nombre')
    password = user_data.pop('password')
    
    username = user_data['username']
    
    # Verificar si usuario ya existe
    if User.objects.filter(username=username).exists():
        print(f"\n✓ Usuario '{username}' ya existe - OMITIDO")
        continue
    
    try:
        user = User.objects.create_user(
            **user_data,
            password=password,
            rol=rol,
            nombre=nombre,
        )
        print(f"\n✅ Usuario creado exitosamente:")
        print(f"   Usuario: {username}")
        print(f"   Contraseña: {password}")
        print(f"   Rol: {rol}")
        print(f"   Nombre: {nombre}")
    except Exception as e:
        print(f"\n❌ Error al crear usuario '{username}':")
        print(f"   {str(e)}")

# Crear pacientes de prueba si no existen
print("\n" + "="*70)
print("CREANDO PACIENTES DE PRUEBA")
print("="*70)

pacientes_prueba = [
    {
        'ci': '12345678',
        'nombres': 'Juan',
        'apellido_paterno': 'Pérez',
        'apellido_materno': 'García',
        'sexo': 'M',
        'fecha_nacimiento': date(1990, 5, 15),
        'ocupacion': 'Ingeniero',
        'celular': '70123456',
        'direccion': 'Calle Principal 123',
    },
    {
        'ci': '87654321',
        'nombres': 'María',
        'apellido_paterno': 'López',
        'apellido_materno': 'Rodríguez',
        'sexo': 'F',
        'fecha_nacimiento': date(1985, 8, 22),
        'ocupacion': 'Abogada',
        'celular': '71234567',
        'direccion': 'Avenida Secundaria 456',
    },
    {
        'ci': '11223344',
        'nombres': 'Carlos',
        'apellido_paterno': 'Martínez',
        'apellido_materno': 'Sánchez',
        'sexo': 'M',
        'fecha_nacimiento': date(1995, 3, 10),
        'ocupacion': 'Profesor',
        'celular': '72345678',
        'direccion': 'Calle Tercera 789',
    },
]

for pac_data in pacientes_prueba:
    ci = pac_data['ci']
    
    if Paciente.objects.filter(ci=ci).exists():
        print(f"\n✓ Paciente con CI '{ci}' ya existe - OMITIDO")
        continue
    
    try:
        paciente = Paciente.objects.create(**pac_data)
        print(f"\n✅ Paciente creado exitosamente:")
        print(f"   CI: {ci}")
        print(f"   Nombre: {pac_data['nombres']} {pac_data['apellido_paterno']}")
    except Exception as e:
        print(f"\n❌ Error al crear paciente con CI '{ci}':")
        print(f"   {str(e)}")

print("\n" + "="*70)
print("PROCESO COMPLETADO")
print("="*70 + "\n")
