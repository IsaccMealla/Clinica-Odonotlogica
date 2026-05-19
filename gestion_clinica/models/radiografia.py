"""
Modelos de radiografías, imágenes clínicas y periodontogramas.
Incluye: ImagenClinica, HistorialEntregable, Periodontograma.
"""
import os
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models

from .base import SeguimientoAcademico, AutorizacionImagen
from .paciente import Paciente


def upload_to_paciente(instance, filename):
    """Función para organizar automáticamente imágenes por paciente y categoría"""
    paciente_id = str(instance.paciente.id)
    return os.path.join('evidencias_clinicas', paciente_id, instance.categoria, filename)


class ImagenClinica(models.Model):
    """
    Almacenamiento de imágenes clínicas del paciente (radiografías, fotos, etc.).
    Cada imagen se asocia a una autorización del docente (Módulo 6).
    """
    CATEGORIAS = [
        ('FACIAL', 'Fotografía Facial'),
        ('INTRAORAL', 'Fotografía Intraoral'),
        ('PSP', 'Radiografía Placa de Fósforo'),
        ('CBCT', 'Captura de Tomografía'),
        ('PROCESO', 'Seguimiento de Proceso/Laboratorio'),
        ('FINAL', 'Resultado Final (Post-tratamiento)'),
        ('DICOM', 'Archivo DICOM Nativo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='imagenes'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    # --- ENLACE CON MÓDULO 6 (Formación y Supervisión) ---
    autorizacion = models.OneToOneField(
        AutorizacionImagen,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    # --- DETALLES DE LA IMAGEN ---
    archivo = models.ImageField(upload_to=upload_to_paciente)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    pieza_dental = models.IntegerField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    fecha_adquisicion = models.DateTimeField(auto_now_add=True)

    # --- IA: ANÁLISIS AUTOMÁTICO ---
    metadatos_extraidos = models.JSONField(
        blank=True,
        null=True,
        help_text="Datos extraídos del DICOM"
    )
    analizada_por_ia = models.BooleanField(default=False)
    coordenadas_patologia = models.JSONField(
        blank=True,
        null=True,
        help_text="Bounding Boxes de la CNN"
    )

    class Meta:
        db_table = 'imagen_clinica'
        verbose_name = "Imagen Clínica"
        verbose_name_plural = "Imágenes Clínicas"

    def __str__(self):
        return f"{self.categoria} - {self.paciente}"


class HistorialEntregable(models.Model):
    """
    Bitácora inmutable de eventos en una autorización de imagen.
    Parte del Módulo 6: Formación y Supervisión.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    autorizacion = models.ForeignKey(
        AutorizacionImagen,
        on_delete=models.CASCADE,
        related_name='historial'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    accion = models.CharField(max_length=50)
    detalles = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historial_entregable'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.fecha.strftime('%H:%M')} | {self.actor} -> {self.accion}"


class Periodontograma(SeguimientoAcademico):
    """
    Registro del estado periodontal del paciente con datos por pieza dental.
    Puede haber múltiples periodontogramas (inicial, reevaluación, mantenimiento).
    Hereda de SeguimientoAcademico (requiere aprobación del docente).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='periodontogramas'
    )

    # --- DATOS POR ARCADA Y CARA ---
    # Formato: { "48": { "movilidad": "", "implante": false, "sangrado": [...], ... } }
    datos_vestibular_superior = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos de la arcada superior vestibular"
    )
    datos_palatino_superior = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos de la arcada superior palatino"
    )
    datos_vestibular_inferior = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos de la arcada inferior vestibular"
    )
    datos_lingual_inferior = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos de la arcada inferior lingual"
    )

    # --- ÍNDICES Y DIAGNÓSTICO ---
    placa_bacteriana_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="% de Placa (O'Leary)"
    )
    sangrado_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="% de Sangrado"
    )
    diagnostico = models.TextField(
        blank=True,
        null=True,
        verbose_name="Diagnóstico Periodontal"
    )
    pronostico = models.TextField(
        blank=True,
        null=True,
        verbose_name="Pronóstico General y por piezas"
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Periodontograma de {self.paciente} - {self.creado_en.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Periodontograma"
        verbose_name_plural = "Periodontogramas"
        ordering = ['-creado_en']
