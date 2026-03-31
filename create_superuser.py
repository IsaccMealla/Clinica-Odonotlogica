#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Crear nuevo superusuario
name = 'Doctor Admin'
email = 'doctor@clinica.com'
password = 'Doctor@2025'

# Verificar si el usuario ya existe
if User.objects.filter(email=email).exists():
    print(f"El usuario con email '{email}' ya existe")
else:
    user = User.objects.create_superuser(email=email, name=name, password=password)
    print(f"✅ Superusuario creado correctamente")
    print(f"   Nombre: {name}")
    print(f"   Email: {email}")
    print(f"   Contraseña: {password}")
