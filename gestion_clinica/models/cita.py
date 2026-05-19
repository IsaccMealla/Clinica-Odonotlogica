"""
Modelos de gestión de citas, auditoría y alertas.
Incluye: Cita, CitaRecurrente, ConfiguracionAlertas, AuditoriaCita, HistoricoAbandonoPaciente.
"""
import uuid

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from .paciente import Paciente


class Cita(models.Model):
    """
    Registro de una cita clínica específica entre un estudiante y paciente.
    Incluye estado, check-in, y motivos de cancelación.
    """
    ESTADOS_CITA = [
        ('RESERVADA', 'Reservada'),
        ('CONFIRMADA', 'Confirmada'),
        ('EN_ESPERA', 'En Espera'),
        ('ATENDIENDO', 'Atendiendo'),
        ('FINALIZADO', 'Finalizado'),
        ('REPROGRAMADA', 'Reprogramada'),
        ('NO_ASISTIO', 'No Asistió'),
        ('CANCELADA', 'Cancelada'),
    ]

    RAZONES_CANCELACION = [
        ('PACIENTE', 'Cancelada por Paciente'),
        ('ESTUDIANTE', 'Cancelada por Estudiante'),
        ('DOCENTE', 'Cancelada por Docente'),
        ('MANTENIMIENTO', 'Cancelada por Mantenimiento'),
        ('OTRA', 'Otra Razón'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='citas'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='citas_estudiante',
        limit_choices_to={'rol': 'ESTUDIANTE'}
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='citas_docente',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    gabinete = models.ForeignKey(
        'Sillon',
        on_delete=models.RESTRICT,
        related_name='citas'
    )
    motivo = models.ForeignKey(
        'Tratamiento',
        on_delete=models.CASCADE,
        related_name='citas'
    )

    # --- DETALLES DE LA CITA ---
    fecha_hora = models.DateTimeField(help_text="Fecha y hora de la cita")
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_CITA,
        default='RESERVADA'
    )
    check_in_time = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Hora de check-in del paciente"
    )
    duracion_estimada = models.IntegerField(
        default=30,
        help_text="Duración estimada en minutos"
    )

    # --- CANCELACIÓN ---
    cancelada_en = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha y hora de cancelación"
    )
    razon_cancelacion = models.CharField(
        max_length=20,
        choices=RAZONES_CANCELACION,
        blank=True,
        null=True
    )
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción del motivo de cancelación"
    )
    cancelada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='citas_canceladas'
    )

    # --- CITA RECURRENTE ---
    cita_recurrente = models.ForeignKey(
        'CitaRecurrente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='citas'
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cita {self.fecha_hora} - {self.paciente} ({self.estado})"

    class Meta:
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        ordering = ['fecha_hora']


@receiver(post_save, sender=Cita)
def actualizar_inasistencias_y_alerta(sender, instance, **kwargs):
    """
    Signal que actualiza el contador de inasistencias del paciente
    cuando una cita pasa a estado 'NO_ASISTIO'.
    Si hay 3+ inasistencias, activa la alerta de abandono.
    """
    paciente = instance.paciente
    no_asistio_count = Cita.objects.filter(
        paciente=paciente,
        estado='NO_ASISTIO'
    ).count()
    paciente.inasistencias = no_asistio_count
    paciente.alerta_abandono = no_asistio_count >= 3
    paciente.save(update_fields=['inasistencias', 'alerta_abandono'])


class CitaRecurrente(models.Model):
    """
    Configuración para generar citas automáticas de manera recurrente.
    Permite agendar citas que se repiten cada semana, mes, etc.
    """
    FRECUENCIAS = [
        ('DIARIA', 'Diaria'),
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
        ('MENSUAL', 'Mensual'),
    ]

    DIAS_SEMANA = [
        ('0', 'Lunes'),
        ('1', 'Martes'),
        ('2', 'Miércoles'),
        ('3', 'Jueves'),
        ('4', 'Viernes'),
        ('5', 'Sábado'),
        ('6', 'Domingo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='citas_recurrentes'
    )
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='citas_recurrentes_estudiante',
        limit_choices_to={'rol': 'ESTUDIANTE'}
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='citas_recurrentes_docente',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    gabinete = models.ForeignKey(
        'Sillon',
        on_delete=models.RESTRICT,
        related_name='citas_recurrentes'
    )
    motivo = models.ForeignKey(
        'Tratamiento',
        on_delete=models.CASCADE,
        related_name='citas_recurrentes'
    )

    # --- CONFIGURACIÓN DE RECURRENCIA ---
    frecuencia = models.CharField(
        max_length=20,
        choices=FRECUENCIAS,
        default='SEMANAL'
    )
    hora = models.TimeField(help_text="Hora del día para la cita")
    dias_semana = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Día(s) de la semana (0-6)"
    )
    duracion_estimada = models.IntegerField(
        default=30,
        help_text="Duración estimada en minutos"
    )

    # --- RANGO DE FECHAS ---
    fecha_inicio = models.DateField(
        help_text="Fecha de inicio de la recurrencia"
    )
    fecha_fin = models.DateField(
        blank=True,
        null=True,
        help_text="Fecha de fin (si no está rellena, es indefinida)"
    )
    max_ocurrencias = models.IntegerField(
        blank=True,
        null=True,
        help_text="Número máximo de citas a generar"
    )

    # --- CONTROL ---
    activa = models.BooleanField(default=True)
    ultima_generacion = models.DateTimeField(auto_now=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citas_recurrentes'
        ordering = ['fecha_inicio']

    def __str__(self):
        return f"Cita Recurrente {self.frecuencia} - {self.paciente}"


class ConfiguracionAlertas(models.Model):
    """
    Configuración global de alertas para toda la clínica.
    Define umbrales de espera, inasistencias y notificaciones.
    """
    minutos_espera_alerta = models.IntegerField(
        default=15,
        help_text="Minutos de espera antes de generar alerta roja"
    )
    inasistencias_alerta_abandono = models.IntegerField(
        default=3,
        help_text="Número de inasistencias para activar alerta de abandono"
    )
    dias_notificacion_previa = models.IntegerField(
        default=1,
        help_text="Días antes de la cita para enviar notificación"
    )

    activa = models.BooleanField(default=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'configuracion_alertas'
        verbose_name = "Configuración de Alertas"
        verbose_name_plural = "Configuración de Alertas"

    def __str__(self):
        return "Configuración de Alertas del Sistema"


class AuditoriaCita(models.Model):
    """
    Registro inmutable de todos los cambios realizados en una cita.
    Permite trazabilidad completa de modificaciones.
    """
    TIPOS_CAMBIO = [
        ('CREACION', 'Creación'),
        ('ACTUALIZACION', 'Actualización'),
        ('CANCELACION', 'Cancelación'),
        ('CHECK_IN', 'Check-in'),
        ('CAMBIO_ESTADO', 'Cambio de Estado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cita = models.ForeignKey(
        Cita,
        on_delete=models.CASCADE,
        related_name='auditoria'
    )
    tipo_cambio = models.CharField(max_length=20, choices=TIPOS_CAMBIO)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    # --- DETALLES DEL CAMBIO ---
    campos_modificados = models.JSONField(
        default=dict,
        help_text="JSON con los campos que se modificaron"
    )
    valores_anteriores = models.JSONField(
        default=dict,
        help_text="JSON con valores anteriores"
    )
    valores_nuevos = models.JSONField(
        default=dict,
        help_text="JSON con valores nuevos"
    )

    descripcion = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auditoria_citas'
        ordering = ['-creado_en']

    def __str__(self):
        return f"Auditoría {self.tipo_cambio} - Cita {self.cita.id}"


class HistoricoAbandonoPaciente(models.Model):
    """
    Registro histórico de cuando un paciente es marcado como abandonado.
    Permite reactivación posterior si el paciente regresa.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='historico_abandonos'
    )

    # --- INFORMACIÓN DEL ABANDONO ---
    fecha_abandono = models.DateTimeField(auto_now_add=True)
    inasistencias_totales = models.IntegerField(
        help_text="Número de inasistencias que provocaron el abandono"
    )

    # --- NOTAS ---
    nota_coordinacion = models.TextField(
        blank=True,
        null=True,
        help_text="Observaciones de coordinación"
    )
    usuario_que_registro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='abandonos_registrados'
    )

    # --- REACTIVACIÓN ---
    reactivado = models.BooleanField(default=False)
    fecha_reactivacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'historico_abandono_pacientes'
        ordering = ['-fecha_abandono']

    def __str__(self):
        return f"Abandono {self.paciente} - {self.fecha_abandono}"
