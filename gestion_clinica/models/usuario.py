"""
Modelo de usuario personalizado con roles específicos para la clínica.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser de Django.
    Añade campo de roles específicos para la clínica odontológica.
    """
    ROLES = [
        ('ADMIN', 'Administrador'),
        ('DOCENTE', 'Docente / Odontólogo'),
        ('RECEPCIONISTA', 'Recepcionista'),
        ('ESTUDIANTE', 'Estudiante'),
    ]
    rol = models.CharField(
        max_length=20,
        choices=ROLES,
        default='ESTUDIANTE'
    )

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    class Meta:
        db_table = 'auth_customuser'
