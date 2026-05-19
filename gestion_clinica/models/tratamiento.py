"""
Modelos del flujo clínico: Tratamientos, Avances y Transferencias.
Incluye: Tratamiento, AvanceClinico, Evidencia, Transferencia.
"""
import uuid
from datetime import date

from django.conf import settings
from django.db import models

from .base import SeguimientoAcademico
from .paciente import Paciente


class Tratamiento(models.Model):
    """
    Registro de un tratamiento específico asignado a un paciente.
    El estudiante registra aquí qué tipo de tratamiento realizará.
    """
    ESTADOS_TRATAMIENTO = [
        ('EN_PROGRESO', 'En Progreso'),
        ('FINALIZADO', 'Finalizado con Éxito'),
        ('DERIVADO', 'Derivado a otro estudiante'),
        ('ABANDONADO', 'Abandonado por el paciente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='tratamientos'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='tratamientos_realizados'
    )

    nombre_tratamiento = models.CharField(
        max_length=200,
        help_text="Ej: Profilaxis, Exodoncia de 3er Molar"
    )
    diente_pieza = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Ej: 14, 46, Toda la boca"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_TRATAMIENTO,
        default='EN_PROGRESO'
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre_tratamiento} - {self.paciente}"

    class Meta:
        verbose_name = "Tratamiento"
        verbose_name_plural = "Tratamientos"


class AvanceClinico(SeguimientoAcademico):
    """
    Registro de cada sesión clínica realizada en un tratamiento.
    Hereda de SeguimientoAcademico (requiere aprobación del docente).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tratamiento = models.ForeignKey(
        Tratamiento,
        on_delete=models.CASCADE,
        related_name='avances'
    )

    fecha_sesion = models.DateField(default=date.today)
    descripcion_procedimiento = models.TextField(
        help_text="¿Qué se le hizo al paciente hoy?"
    )
    proxima_cita = models.DateField(
        blank=True,
        null=True,
        help_text="Fecha de la siguiente sesión si es necesaria"
    )

    def __str__(self):
        return f"Avance {self.fecha_sesion} - {self.tratamiento}"

    class Meta:
        verbose_name = "Avance de Sesión"
        verbose_name_plural = "Avances de Sesiones"
        ordering = ['-fecha_sesion']


class Evidencia(models.Model):
    """
    Fotos, radiografías o documentos que prueban el avance clínico.
    Se asocian a cada AvanceClinico para evaluación del docente.
    """
    TIPOS_EVIDENCIA = [
        ('RADIOGRAFIA', 'Radiografía'),
        ('FOTO_INICIAL', 'Fotografía Clínica Inicial'),
        ('FOTO_PROCESO', 'Fotografía Clínica en Proceso'),
        ('FOTO_FINAL', 'Fotografía Clínica Final'),
        ('DOCUMENTO', 'Documento / Consentimiento'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avance = models.ForeignKey(
        AvanceClinico,
        on_delete=models.CASCADE,
        related_name='evidencias'
    )

    tipo_evidencia = models.CharField(max_length=20, choices=TIPOS_EVIDENCIA)
    archivo = models.FileField(upload_to='evidencias_clinicas/%Y/%m/')
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidencia: {self.get_tipo_evidencia_display()} - Avance {self.avance.fecha_sesion}"

    class Meta:
        verbose_name = "Evidencia Clínica"
        verbose_name_plural = "Evidencias Clínicas"


class Transferencia(models.Model):
    """
    Registro histórico de derivación de un paciente
    de un estudiante a otro (normalmente por abandono o especialidad).
    """
    ESTADOS_TRANSFERENCIA = [
        ('PENDIENTE', 'Pendiente de Aprobación Docente'),
        ('APROBADA', 'Transferencia Aprobada'),
        ('RECHAZADA', 'Transferencia Rechazada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='historial_transferencias'
    )

    estudiante_origen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='transferencias_emitidas'
    )
    estudiante_destino = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='transferencias_recibidas'
    )

    docente_aprobador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transferencias_evaluadas',
        limit_choices_to={'rol': 'DOCENTE'}
    )

    motivo_transferencia = models.TextField(
        help_text="¿Por qué se deriva al paciente?"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_TRANSFERENCIA,
        default='PENDIENTE'
    )

    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Cuando el docente aprobó/rechazó"
    )

    def __str__(self):
        return f"Transferencia de {self.paciente}"

    class Meta:
        verbose_name = "Transferencia de Paciente"
        verbose_name_plural = "Transferencias de Pacientes"
