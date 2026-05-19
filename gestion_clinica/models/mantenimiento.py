"""
Modelos de mantenimiento de equipos clínicos.
Incluye: Sillon (unidad dental).
"""
from django.db import models
from django.utils import timezone


class Sillon(models.Model):
    """
    Registro de una unidad dental (sillón) en la clínica.
    Incluye datos técnicos, estado y coordenadas 3D para visualización en el mapa.
    """
    ESTADOS = [
        ('operativo', 'Operativo'),
        ('revision', 'En Revisión'),
        ('falla', 'Con Falla'),
    ]

    # --- IDENTIFICACIÓN ---
    nombre = models.CharField(
        max_length=50,
        help_text="Ej: Sillón 01"
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='operativo'
    )

    # --- DATOS DEL EQUIPO ---
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        help_text="Características especiales del equipo"
    )

    # --- MANTENIMIENTO ---
    ultima_revision = models.DateTimeField(default=timezone.now)
    dias_frecuencia_mantenimiento = models.IntegerField(
        default=180,
        help_text="Cada cuántos días necesita revisión"
    )
    notas_tecnicas = models.TextField(
        blank=True,
        null=True,
        help_text="Registro de fallas comunes o piezas cambiadas"
    )

    # --- COORDENADAS 3D (Para visualización en React Fiber) ---
    posicion_x = models.FloatField(default=0.0)
    posicion_y = models.FloatField(default=0.0)
    posicion_z = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.nombre} - {self.estado.upper()}"

    class Meta:
        db_table = 'sillones'
        verbose_name = "Sillón"
        verbose_name_plural = "Sillones"
