"""
Modelos para registro de procedimientos quirúrgicos.
Incluye: Protocolo Quirúrgico.
"""
from django.db import models

from .base import SeguimientoAcademico
from .paciente import Paciente


class ProtocoloQuirurgico(SeguimientoAcademico):
    """
    Registro completo de un procedimiento quirúrgico realizado al paciente.
    Incluye diagnóstico pre/post-operatorio, descripción del procedimiento y indicaciones.
    """
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='protocolos_quirurgicos'
    )

    # --- EQUIPO QUIRÚRGICO ---
    cirujano = models.CharField(max_length=255, blank=True, null=True)
    anestesiologo = models.CharField(max_length=255, blank=True, null=True)
    ayudantes = models.CharField(max_length=255, blank=True, null=True)
    instrumentista = models.CharField(max_length=255, blank=True, null=True)
    circulantes = models.CharField(max_length=255, blank=True, null=True)

    # --- ANESTESIA Y DURACIÓN ---
    tecnica_anestesia = models.CharField(max_length=255, blank=True, null=True)
    duracion_cirugia = models.CharField(max_length=100, blank=True, null=True)

    # --- DIAGNÓSTICO ---
    diagnostico_pre_operatorio = models.TextField(blank=True, null=True)
    diagnostico_post_operatorio = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    # --- HALLAZGOS PRE-OPERATORIOS ---
    hallazgos_clinicos = models.TextField(blank=True, null=True)
    hallazgos_radiograficos = models.TextField(blank=True, null=True)
    hallazgos_laboratoriales = models.TextField(blank=True, null=True)
    otros_hallazgos_pre = models.TextField(blank=True, null=True)

    # --- DESCRIPCIÓN DEL PROCEDIMIENTO ---
    descripcion_procedimiento = models.TextField(blank=True, null=True)
    hallazgos_quirurgicos = models.TextField(blank=True, null=True)
    accidentes_quirurgicos = models.TextField(blank=True, null=True)

    # --- CUIDADOS POST-OPERATORIOS ---
    indicaciones_post_quirurgicas = models.TextField(blank=True, null=True)
    receta = models.TextField(blank=True, null=True)

    # --- FIRMA DE CONSENTIMIENTO ---
    estudiante_firmo = models.BooleanField(default=False)
    paciente_firmo = models.BooleanField(default=False)
    fecha_firma = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Protocolo Quirúrgico de {self.paciente}"

    class Meta:
        verbose_name = "Protocolo Quirúrgico"
        verbose_name_plural = "Protocolos Quirúrgicos"
