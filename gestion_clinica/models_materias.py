# FILE: gestion_clinica/models_materias.py
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


# ==========================================
# MATERIAS CLÍNICAS
# ==========================================
class Materia(models.Model):
    """
    Representa una materia/asignatura clínica. 
    Cada materia define qué vistas/módulos están habilitados.
    """
    VISTAS_DISPONIBLES = [
        ('ODONTOGRAMA', 'Odontograma'),
        ('PERIODONTOGRAMA', 'Periodontograma'),
        ('RADIOGRAFIA', 'Radiografías / Imágenes'),
        ('OPERATORIA', 'Operatoria y Endodoncia'),
        ('PROSTODONCIA_REMOVIBLE', 'Prostodoncia Removible'),
        ('PROSTODONCIA_FIJA', 'Prostodoncia Fija'),
        ('CIRUGIA', 'Cirugía Bucal'),
        ('ODONTOPEDIATRIA', 'Odontopediatría'),
        ('ORTODONCIA', 'Ortodoncia'),
        ('EVALUACION_GENERAL', 'Evaluación General'),
        ('HISTORIAL_CLINICO', 'Historial Clínico Completo'),
        ('TRATAMIENTOS', 'Tratamientos'),
        ('CITAS', 'Citas'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=20, unique=True, help_text="Ej: OEN-611")
    nombre = models.CharField(max_length=200, help_text="Ej: Operatoria y Endodoncia I")
    semestre = models.IntegerField(default=5)
    
    # JSON list of allowed views: ["ODONTOGRAMA", "PERIODONTOGRAMA", ...]
    vistas_habilitadas = models.JSONField(
        default=list, 
        help_text="Lista de vistas/módulos que esta materia habilita"
    )
    
    activa = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'materias'
        ordering = ['semestre', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==========================================
# ASIGNACIÓN MATERIA → DOCENTE
# ==========================================
class MateriaDocente(models.Model):
    """
    Vincula un docente con una materia. 
    Un docente puede tener múltiples materias asignadas.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='docentes_asignados')
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='materias_docente',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    activo = models.BooleanField(default=True)
    asignado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'materia_docente'
        unique_together = ('materia', 'docente')

    def __str__(self):
        return f"{self.docente} → {self.materia}"


# ==========================================
# INSCRIPCIÓN MATERIA → ESTUDIANTE
# ==========================================
class MateriaEstudiante(models.Model):
    """
    Vincula un estudiante con una materia que está cursando.
    La asignación automática de docente se basa en MateriaDocente.
    """
    ESTADOS = [
        ('CURSANDO', 'Cursando'),
        ('APROBADA', 'Aprobada'),
        ('REPROBADA', 'Reprobada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='estudiantes_inscritos')
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='materias_estudiante',
        limit_choices_to={'rol': 'ESTUDIANTE'}
    )
    # Docente asignado automáticamente al inscribirse
    docente_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='estudiantes_supervisados_materia',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='CURSANDO')
    inscrito_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'materia_estudiante'
        unique_together = ('materia', 'estudiante')

    def __str__(self):
        return f"{self.estudiante} cursa {self.materia}"


# ==========================================
# SOLICITUD DE GUARDADO (Estudiante → Docente)
# ==========================================
class SolicitudGuardado(models.Model):
    """
    Cuando un estudiante quiere guardar su progreso,
    se crea una solicitud que el docente debe aprobar/rechazar.
    """
    ESTADOS = [
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('EXPIRADO', 'Expirado'),
    ]

    TIPOS_GUARDADO = [
        ('DIAGNOSTICO', 'Diagnóstico'),
        ('ODONTOGRAMA', 'Odontograma'),
        ('PERIODONTOGRAMA', 'Periodontograma'),
        ('TRATAMIENTO', 'Plan de Tratamiento'),
        ('AVANCE', 'Avance Clínico'),
        ('RADIOGRAFIA', 'Radiografía'),
        ('ANTECEDENTES', 'Antecedentes'),
        ('EVALUACION', 'Evaluación General'),
        ('EXPEDIENTE', 'Expediente Completo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='solicitudes_guardado'
    )
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='solicitudes_guardado_recibidas',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    # Contexto
    paciente = models.ForeignKey(
        'Paciente', on_delete=models.CASCADE, 
        related_name='solicitudes_guardado',
        null=True, blank=True
    )
    materia = models.ForeignKey(
        Materia, on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='solicitudes_guardado'
    )
    
    tipo_guardado = models.CharField(max_length=30, choices=TIPOS_GUARDADO)
    descripcion = models.TextField(blank=True, help_text="Descripción del trabajo que quiere guardar")
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    justificacion_rechazo = models.TextField(blank=True, null=True, help_text="Justificación del docente si rechaza")
    
    # Ventana de tiempo para guardar (en minutos)
    tiempo_ventana_minutos = models.IntegerField(default=30, help_text="Tiempo en minutos que tiene el estudiante para guardar después de la aprobación")
    
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    fecha_expiracion = models.DateTimeField(null=True, blank=True, help_text="Momento en que expira el permiso de guardar")

    class Meta:
        db_table = 'solicitud_guardado'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Solicitud {self.tipo_guardado} - {self.estudiante} ({self.estado})"
    
    @property
    def esta_vigente(self):
        """Retorna True si el permiso aún está vigente"""
        if self.estado != 'APROBADO':
            return False
        if self.fecha_expiracion and timezone.now() > self.fecha_expiracion:
            return False
        return True


# ==========================================
# REGISTRO DE ASISTENCIA CON MATERIA
# ==========================================
class RegistroAsistencia(models.Model):
    """
    Registra la asistencia de un docente o estudiante junto con la materia activa.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asistencias')
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='asistencias')
    
    hora_ingreso = models.DateTimeField(auto_now_add=True)
    hora_salida = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=True, help_text="True si el usuario aún está en la clínica")

    class Meta:
        db_table = 'registro_asistencia'
        ordering = ['-hora_ingreso']

    def __str__(self):
        return f"{self.usuario} - {self.materia} ({self.hora_ingreso.strftime('%H:%M')})"
