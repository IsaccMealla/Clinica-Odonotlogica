from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class Notificacion(models.Model):
    TIPOS = (
        ('CITA', 'Nueva Cita'),
        ('ASIGNACION', 'Nueva Asignación'),
        ('SISTEMA', 'Aviso del Sistema'),
    )

    # Usamos settings.AUTH_USER_MODEL para referenciar a tu modelo de Usuario personalizado
    usuario_destino = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_notificaciones')
    titulo = models.CharField(max_length=150)
    mensaje = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS, default='SISTEMA')
    leido = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titulo} - {self.usuario_destino.username}"