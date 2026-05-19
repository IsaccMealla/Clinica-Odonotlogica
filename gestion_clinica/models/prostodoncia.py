"""
Modelos de Prostodoncia (Prótesis Dentales).
Incluye: Prostodoncia Removible y Prostodoncia Fija.
"""
from django.db import models

from .base import SeguimientoAcademico
from .paciente import Paciente


class ProstodonciaRemovible(SeguimientoAcademico):
    """
    Manejo de pacientes con prótesis dentales removibles (parciales o completas).
    Registra el proceso de confección y ajuste de la prótesis.
    """
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='prostodoncias_removibles'
    )

    # --- ANTECEDENTES PROTÉSICOS ---
    portador_protesis = models.CharField(max_length=50, blank=True, null=True)
    experiencia_protesica = models.CharField(max_length=50, blank=True, null=True)
    tiempo_uso_protesis = models.CharField(max_length=100, blank=True, null=True)

    # --- EXPLORACIÓN ---
    tamano_labio = models.CharField(max_length=50, blank=True, null=True)
    tamano_lengua = models.CharField(max_length=50, blank=True, null=True)
    examen_radiografico = models.TextField(blank=True, null=True)

    # --- DIAGNÓSTICO Y PRONÓSTICO ---
    diagnostico_removible = models.TextField(blank=True, null=True)
    pronostico_removible = models.TextField(blank=True, null=True)

    # --- PROCEDIMIENTOS REALIZADOS ---
    impresiones_iniciales = models.BooleanField(default=False)
    impresiones_finales = models.BooleanField(default=False)
    relaciones_intermaxilares = models.BooleanField(default=False)
    enfilado_y_articulado = models.BooleanField(default=False)
    terminado = models.BooleanField(default=False)
    observaciones_procedimiento = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Prostodoncia Removible de {self.paciente}"

    class Meta:
        verbose_name = "Prostodoncia Removible"
        verbose_name_plural = "Prostodoncias Removibles"


class ProstodonciaFija(SeguimientoAcademico):
    """
    Manejo de pacientes con prótesis dentales fijas (coronas, puentes).
    Registra el diagnóstico radiográfico, planificación y procedimientos realizados.
    """
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='prostodoncias_fijas'
    )

    # --- ANÁLISIS OCLUSAL ---
    tipo_oclusion = models.CharField(max_length=100, blank=True, null=True)
    apinamiento_dental = models.CharField(max_length=100, blank=True, null=True)
    rotacion = models.CharField(max_length=100, blank=True, null=True)
    sobreerupcion = models.CharField(max_length=100, blank=True, null=True)
    diastemas = models.CharField(max_length=100, blank=True, null=True)
    relacion_centrica = models.CharField(max_length=100, blank=True, null=True)

    # --- ANÁLISIS RADIOGRÁFICO ---
    nivel_hueso_alveolar = models.CharField(max_length=255, blank=True, null=True)
    proporcion_coronaria = models.CharField(max_length=255, blank=True, null=True)
    ley_de_ante = models.CharField(max_length=255, blank=True, null=True)

    # --- ANÁLISIS DE RAÍCES ---
    raiz_longitud = models.CharField(max_length=100, blank=True, null=True)
    raiz_configuracion = models.CharField(max_length=100, blank=True, null=True)
    raiz_direccion = models.CharField(max_length=100, blank=True, null=True)

    # --- ANÁLISIS ÓSEO ---
    cresta_alveolar_osea = models.CharField(max_length=255, blank=True, null=True)
    altura_coronaria = models.CharField(max_length=255, blank=True, null=True)

    # --- CONDICIONES ESPECIALES ---
    trauma_oclusion = models.BooleanField(default=False)
    espacios_edentulos = models.BooleanField(default=False)

    # --- ANÁLISIS DE ABUTMENTS ---
    pilares = models.CharField(max_length=255, blank=True, null=True)
    curva_spee = models.CharField(max_length=255, blank=True, null=True)

    # --- DIAGNÓSTICO Y PLAN ---
    diagnostico_radiologico = models.TextField(blank=True, null=True)
    diagnostico_clinico = models.TextField(blank=True, null=True)
    plan_tratamiento = models.TextField(blank=True, null=True)

    # --- PROCEDIMIENTOS REALIZADOS ---
    toma_impresiones_cementado = models.CharField(max_length=255, blank=True, null=True)
    pruebas_iniciales = models.BooleanField(default=False)
    control = models.BooleanField(default=False)
    prueba_final = models.BooleanField(default=False)

    def __str__(self):
        return f"Prostodoncia Fija de {self.paciente}"

    class Meta:
        verbose_name = "Prostodoncia Fija"
        verbose_name_plural = "Prostodoncias Fijas"
