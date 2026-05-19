"""
Modelos para Módulo 6: Formación y Supervisión.
Gestión de cupos, casos, supervisión y evaluación de estudiantes.
"""
import uuid
from django.conf import settings
from django.db import models

from .paciente import Paciente


class ConfiguracionCupo(models.Model):
    """
    Define los cupos mínimos y máximos de casos que cada estudiante
    debe completar por asignatura y procedimiento.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    asignatura = models.CharField(
        max_length=200,
        help_text="Ej: Operatoria, Periodoncia, Cirugía"
    )
    procedimiento = models.CharField(
        max_length=200,
        help_text="Ej: Amalgama, Periodontograma, Extracción"
    )
    cupo_minimo = models.PositiveIntegerField(
        help_text="Número mínimo de casos a realizar"
    )
    cupo_maximo = models.PositiveIntegerField(
        help_text="Número máximo de casos a realizar"
    )
    
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'configuracion_cupo'
        verbose_name = "Configuración de Cupo"
        verbose_name_plural = "Configuraciones de Cupos"

    def __str__(self):
        return f"{self.asignatura} - {self.procedimiento}"


class AsignacionCaso(models.Model):
    """
    Asignación de un caso clínico (paciente + procedimiento) a un estudiante
    para que lo complete en una asignatura específica.
    """
    ESTADOS = [
        ('ASIGNADO', 'Asignado'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADO', 'Completado'),
        ('REPROBADO', 'Reprobado'),
        ('CANCELADO', 'Cancelado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='asignaciones_casos'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='asignaciones_casos'
    )
    
    asignatura = models.CharField(max_length=200)
    procedimiento_principal = models.CharField(max_length=200)
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='ASIGNADO'
    )
    
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_completacion = models.DateTimeField(blank=True, null=True)
    
    procedimientos_aprobados = models.JSONField(
        default=list,
        help_text="Lista de procedimientos aprobados por el docente"
    )
    fecha_ultima_actualizacion_avance = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'asignacion_caso'
        verbose_name = "Asignación de Caso"
        verbose_name_plural = "Asignaciones de Casos"

    def calcular_porcentaje_avance(self):
        """Calcula el porcentaje de procedimientos aprobados vs total"""
        if not self.procedimientos_aprobados:
            return 0
        # Placeholder: Implementar lógica real según tus requisitos
        return len(self.procedimientos_aprobados) * 100 // 10

    def __str__(self):
        return f"{self.estudiante.username} - {self.paciente}"


class SolicitudSupervision(models.Model):
    """
    Solicitud del estudiante al docente para supervisión de un hito importante
    (ej: diagnóstico, procedimiento clave, caso completado).
    """
    TIPOS_HITO = [
        ('DIAGNOSTICO', 'Diagnóstico'),
        ('PLAN_TRATAMIENTO', 'Plan de Tratamiento'),
        ('PROCEDIMIENTO_INICIAL', 'Procedimiento Inicial'),
        ('PROCEDIMIENTO_CRÍTICO', 'Procedimiento Crítico'),
        ('CASO_COMPLETADO', 'Caso Completado'),
        ('OTRO', 'Otro'),
    ]

    ESTADOS_SOLICITUD = [
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('REVISADO', 'Revisado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    asignacion_caso = models.ForeignKey(
        AsignacionCaso,
        on_delete=models.CASCADE,
        related_name='solicitudes_supervision'
    )
    
    tipo_hito = models.CharField(max_length=20, choices=TIPOS_HITO)
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_SOLICITUD,
        default='PENDIENTE'
    )
    
    docente_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_supervision_asignadas',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    descripcion_solicitud = models.TextField(
        help_text="¿Qué solicita el estudiante que revise el docente?"
    )
    observaciones_docente = models.TextField(
        blank=True,
        null=True,
        help_text="Feedback del docente"
    )
    
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'solicitud_supervision'
        verbose_name = "Solicitud de Supervisión"
        verbose_name_plural = "Solicitudes de Supervisión"

    def __str__(self):
        return f"Solicitud {self.tipo_hito} - {self.asignacion_caso}"


class EvaluacionDesempeño(models.Model):
    """
    Evaluación del desempeño del estudiante en un hito específico.
    Incluye criterios de evaluación y alertas tempranas.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    solicitud_supervision = models.OneToOneField(
        SolicitudSupervision,
        on_delete=models.CASCADE,
        related_name='evaluacion_desempeño'
    )
    
    # --- CALIFICACIÓN ---
    calificacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Calificación del 0 al 100"
    )
    
    # --- ALERTA TEMPRANA ---
    alerta_temprana = models.BooleanField(
        default=False,
        help_text="Indica si el estudiante está en riesgo académico"
    )
    motivo_detalle = models.TextField(
        blank=True,
        null=True,
        help_text="Detalle del motivo de la alerta"
    )
    
    # --- CRITERIOS DE EVALUACIÓN ---
    manejo_tecnica = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Evaluación del manejo técnico (0-100)"
    )
    bioseguridad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cumplimiento de protocolos de bioseguridad (0-100)"
    )
    comunicacion_paciente = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Comunicación con el paciente (0-100)"
    )
    cumplimiento_tiempo = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cumplimiento de tiempos (0-100)"
    )
    documentacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calidad de documentación clínica (0-100)"
    )
    
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluacion_desempeño'
        verbose_name = "Evaluación de Desempeño"
        verbose_name_plural = "Evaluaciones de Desempeño"

    @property
    def promedio_criterios(self):
        """Calcula el promedio de todos los criterios"""
        criterios = [
            self.manejo_tecnica,
            self.bioseguridad,
            self.comunicacion_paciente,
            self.cumplimiento_tiempo,
            self.documentacion,
        ]
        criterios_validos = [c for c in criterios if c is not None]
        if criterios_validos:
            return sum(criterios_validos) / len(criterios_validos)
        return 0

    def __str__(self):
        return f"Evaluación {self.solicitud_supervision} - {self.calificacion}"
