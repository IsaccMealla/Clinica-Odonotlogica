#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.filter(email='doctor@clinica.com').first()
if user:
    user.set_password('Admin@2025')
    user.save()
    print("Contraseña establecida correctamente: Admin@2025")
else:
    print("Usuario no encontrado: doctor@clinica.com")
