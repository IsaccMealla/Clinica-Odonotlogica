"""
Modelos base para la auditoría académica y autorizaciones.
Clases abstractas que heredan otros modelos.
"""
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid


class SeguimientoAcademico(models.Model):
    """
    Plantilla base para cualquier registro que requiera nota o firma del docente.
    Heredada por múltiples modelos de exámenes, procedimientos y avances clínicos.
    """
    ESTADOS_APROBACION = [
        ('BORRADOR', 'Borrador (Editando)'),
        ('REVISION', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado por Docente'),
        ('RECHAZADO', 'Rechazado / Con Observaciones'),
    ]

    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="%(class)s_creados"
    )
    docente_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_supervisados",
        limit_choices_to={'rol': 'DOCENTE'}
    )

    estado_academico = models.CharField(
        max_length=20,
        choices=ESTADOS_APROBACION,
        default='BORRADOR'
    )
    comentarios_docente = models.TextField(
        blank=True,
        null=True,
        help_text="Observaciones si rechaza el trabajo"
    )
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        abstract = True


class AutorizacionImagen(models.Model):
    """
    Control de tiempos: El docente autoriza al estudiante a subir una imagen/radiografía
    y le da una ventana de tiempo específica (en horas).
    Parte del Módulo 6: Formación y Supervisión.
    """
    ESTADOS = [
        ('PENDIENTE', 'Pendiente de Subida'),
        ('COMPLETADA', 'Imagen Subida'),
        ('EXPIRADA', 'Plazo Expirado'),
        ('RECHAZADA', 'Rechazada por Docente')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        'Paciente',
        on_delete=models.CASCADE,
        related_name='autorizaciones_imagenes'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='autorizaciones_recibidas'
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='autorizaciones_emitidas'
    )

    categoria_esperada = models.CharField(
        max_length=20,
        help_text="Ej: PSP (Radiografía) o INTRAORAL"
    )

    fecha_emision = models.DateTimeField(auto_now_add=True)
    plazo_horas = models.PositiveIntegerField(
        help_text="Horas límite que tiene el estudiante para subir la evidencia"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='PENDIENTE'
    )

    class Meta:
        db_table = 'autorizacion_imagen'
        verbose_name = "Autorización de Imagen"
        verbose_name_plural = "Autorizaciones de Imágenes"

    def esta_vigente(self):
        """Devuelve True si el plazo aún no ha expirado"""
        if self.estado != 'PENDIENTE':
            return False
        fecha_limite = self.fecha_emision + timedelta(hours=self.plazo_horas)
        return timezone.now() <= fecha_limite

    def __str__(self):
        return f"Auth {self.estudiante} -> {self.paciente} ({self.estado})"
