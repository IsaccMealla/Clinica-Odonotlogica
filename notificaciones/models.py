from django.db import models
from django.conf import settings

class Notificacion(models.Model):
    TIPOS = (
        ('CITA', 'Nueva Cita'),
        ('ASIGNACION', 'Nueva Asignación'),
        ('SISTEMA', 'Aviso del Sistema'),
        ('SOLICITUD_GUARDADO', 'Solicitud de Guardado'),
        ('RESPUESTA_GUARDADO', 'Respuesta de Guardado'),
        ('SUPERVISION', 'Supervisión Requerida'),
    )

    usuario_destino = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_notificaciones')
    titulo = models.CharField(max_length=150)
    mensaje = models.TextField()
    tipo = models.CharField(max_length=30, choices=TIPOS, default='SISTEMA')
    leido = models.BooleanField(default=False)
    
    # Datos adicionales para acciones rápidas
    datos_extra = models.JSONField(default=dict, blank=True, help_text="Datos extra como solicitud_id, paciente_id, etc.")
    sonido = models.BooleanField(default=False, help_text="True si la notificación debe reproducir un sonido")
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.titulo} - {self.usuario_destino.username}"