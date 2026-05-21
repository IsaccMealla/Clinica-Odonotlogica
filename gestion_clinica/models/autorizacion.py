from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class AutorizacionCargaImage(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('USADO', 'Usado'),
        ('EXPIRADO', 'Expirado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='autorizaciones_recibidas')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='autorizaciones_emitidas')
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='autorizaciones_imagen')

    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    expiracion = models.DateTimeField(blank=True, null=True)
    fecha_intento_envio = models.DateTimeField(blank=True, null=True)

    motivo = models.TextField(blank=True, null=True)
    mensaje_rechazo = models.TextField(blank=True, null=True)
    razon_no_envio = models.TextField(blank=True, null=True)
    solicitud_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolicitudes')

    class Meta:
        db_table = 'autorizacion_carga_image'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Autorizacion {self.estudiante} -> {self.paciente} [{self.estado}]"

    def is_valid(self):
        if self.estado != 'APROBADO':
            return False
        if self.expiracion and timezone.now() > self.expiracion:
            return False
        return True


class HistorialAuditoriaImagen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.CharField(max_length=100)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='auditoria_estudiante')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='auditoria_docente')
    paciente = models.ForeignKey('Paciente', on_delete=models.SET_NULL, null=True, related_name='auditoria_paciente')
    timestamp = models.DateTimeField(auto_now_add=True)
    detalles = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'historial_auditoria_imagen'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.accion} - {self.estudiante} / {self.paciente} @ {self.timestamp}"
