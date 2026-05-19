"""
Modelos de exámenes clínicos y físicos del paciente.
Incluye: Examen Clínico Físico y Examen Periodontal.
"""
import uuid
from django.db import models

from .base import SeguimientoAcademico
from .paciente import Paciente


class ExamenClinicoFisico(SeguimientoAcademico):
    """Examen general de salud del paciente"""
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='examenes_clinicos_fisicos'
    )

    # --- SIGNOS VITALES ---
    temperatura_c = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Temperatura (°C)"
    )
    presion_arterial = models.CharField(max_length=50, blank=True, null=True)
    pulso = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_respiratoria = models.CharField(max_length=50, blank=True, null=True)

    # --- ESTADO GENERAL ---
    estado_general = models.CharField(max_length=100, blank=True, null=True)
    estado_nutricional = models.CharField(max_length=100, blank=True, null=True)
    estado_hidratacion = models.CharField(max_length=100, blank=True, null=True)
    actitud_posicion = models.CharField(max_length=100, blank=True, null=True)
    consciencia = models.CharField(max_length=100, blank=True, null=True)
    orientacion_etp = models.BooleanField(
        default=False,
        verbose_name="Orientación en Espacio, Tiempo y Persona"
    )

    # --- ANTROPOMETRÍA ---
    tipo_constitucion = models.CharField(max_length=100, blank=True, null=True)
    peso_kg = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Peso (kg)"
    )
    talla_m = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Talla (metros)"
    )

    # --- INSPECCIÓN CRANEOFACIAL ---
    craneo = models.CharField(max_length=100, blank=True, null=True)
    cara_simetria = models.BooleanField(
        default=True,
        verbose_name="Simetría facial"
    )
    perfil = models.CharField(max_length=100, blank=True, null=True)
    ojos = models.CharField(max_length=255, blank=True, null=True)
    nariz = models.CharField(max_length=255, blank=True, null=True)
    oidos = models.CharField(max_length=255, blank=True, null=True)
    cuello = models.CharField(max_length=255, blank=True, null=True)
    ganglios_linfaticos = models.CharField(max_length=255, blank=True, null=True)

    # --- EXPLORACIÓN DE ATM Y MUSCULATURA ---
    lateralidad = models.BooleanField(default=False)
    lateralidad_obs = models.CharField(max_length=255, blank=True, null=True)

    apertura = models.BooleanField(default=False)
    apertura_obs = models.CharField(max_length=255, blank=True, null=True)

    chasquidos = models.BooleanField(default=False)
    chasquidos_obs = models.CharField(max_length=255, blank=True, null=True)

    crepitacion = models.BooleanField(default=False)
    crepitacion_obs = models.CharField(max_length=255, blank=True, null=True)

    desviacion_apertura_cierre = models.BooleanField(default=False)
    desviacion_apertura_cierre_obs = models.CharField(max_length=255, blank=True, null=True)

    dificultad_abrir_boca = models.BooleanField(default=False)
    dificultad_abrir_boca_obs = models.CharField(max_length=255, blank=True, null=True)

    fatiga_dolor_muscular = models.BooleanField(default=False)
    fatiga_dolor_muscular_obs = models.CharField(max_length=255, blank=True, null=True)

    disminucion_apertura = models.BooleanField(default=False)
    disminucion_apertura_obs = models.CharField(max_length=255, blank=True, null=True)

    dolor_apertura = models.BooleanField(default=False)
    dolor_apertura_obs = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Examen Clínico de {self.paciente}"

    class Meta:
        verbose_name = "Examen Clínico y Físico"
        verbose_name_plural = "Exámenes Clínicos y Físicos"


class ExamenPeriodontal(SeguimientoAcademico):
    """Examen específico del estado periodontal del paciente"""
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='examenes_periodontales'
    )

    caracteristica_encia = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Característica de la encía"
    )
    color = models.CharField(max_length=100, blank=True, null=True)
    textura = models.CharField(max_length=100, blank=True, null=True)
    consistencia = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Examen Periodontal de {self.paciente}"

    class Meta:
        verbose_name = "Examen Periodontal"
        verbose_name_plural = "Exámenes Periodontales"
