<<<<<<< Updated upstream
import uuid
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateTimeRangeField
from django.db import models
from django.db.models import Q
from django.utils import timezone

TimeRangeField = DateTimeRangeField if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql' else models.JSONField

ROLE_CHOICES = [
    ('admin', 'Administrador'),
    ('dentist', 'Odontólogo'),
    ('student', 'Estudiante'),
    ('receptionist', 'Recepción'),
    ('assistant', 'Auxiliar'),
]


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    module = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'module')
        db_table = 'role_permissions'

    def __str__(self):
        return f"{self.role} - {self.module}"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=150)
    module = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action}"


class UserSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('terminated', 'Terminated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'user_sessions'

    def __str__(self):
        return f"{self.user.email} - {self.status} - {self.login_time}" 


# 1. PACIENTE
class Paciente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

<<<<<<< Updated upstream
=======
    # --- ASIGNACIÓN DE CLÍNICA ---
    estudiante_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.RESTRICT, 
        related_name='pacientes_asignados',
        limit_choices_to={'rol': 'ESTUDIANTE'},
        null=True, blank=True
    )

    docente_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='pacientes_docente_asignados',
        limit_choices_to={'rol': 'DOCENTE'},
        null=True,
        blank=True,
    )

>>>>>>> Stashed changes
    ci = models.CharField(max_length=20, unique=True, verbose_name="Cédula de Identidad")
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    
    sexo = models.CharField(max_length=20) 
    fecha_nacimiento = models.DateField()
    lugar_nacimiento = models.CharField(max_length=150, blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    ocupacion = models.CharField(max_length=150, blank=True, null=True)
    
    direccion = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    
    contacto_emergencia = models.CharField(max_length=150, blank=True, null=True, verbose_name="Comunicarse con (Emergencia)")
    telefono_emergencia = models.CharField(max_length=20, blank=True, null=True)
    
    fecha_ultima_consulta = models.DateField(blank=True, null=True)
    motivo_ultima_consulta = models.TextField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    activo = models.BooleanField(default=True) # <-- Nuevo campo para borrado lógico
    class Meta:
        db_table = 'pacientes'
        ordering = ['apellido_paterno', 'nombres']

    def __str__(self):
        return f"{self.apellido_paterno} {self.nombres}"

    @property
    def edad(self):
        if self.fecha_nacimiento:
            hoy = date.today()
            return hoy.year - self.fecha_nacimiento.year - ((hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        return None

# 2. ANTECEDENTES FAMILIARES
class AntecedentePatologicoFamiliar(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='antecedentes_familiares')

    alergia = models.BooleanField(default=False)
    alergia_familiar = models.CharField(max_length=150, blank=True, null=True)
    alergia_obs = models.TextField(blank=True, null=True)

    asma_bronquial = models.BooleanField(default=False)
    asma_familiar = models.CharField(max_length=150, blank=True, null=True)
    asma_obs = models.TextField(blank=True, null=True)

    cardiologicos = models.BooleanField(default=False)
    cardiologicos_familiar = models.CharField(max_length=150, blank=True, null=True)
    cardiologicos_obs = models.TextField(blank=True, null=True)

    oncologicos = models.BooleanField(default=False)
    oncologicos_familiar = models.CharField(max_length=150, blank=True, null=True)
    oncologicos_obs = models.TextField(blank=True, null=True)

    discrasias_sanguineas = models.BooleanField(default=False)
    discrasias_familiar = models.CharField(max_length=150, blank=True, null=True)
    discrasias_obs = models.TextField(blank=True, null=True)

    diabetes = models.BooleanField(default=False)
    diabetes_familiar = models.CharField(max_length=150, blank=True, null=True)
    diabetes_obs = models.TextField(blank=True, null=True)

    hipertension_arterial = models.BooleanField(default=False)
    hipertension_familiar = models.CharField(max_length=150, blank=True, null=True)
    hipertension_obs = models.TextField(blank=True, null=True)

    renales = models.BooleanField(default=False)
    renales_familiar = models.CharField(max_length=150, blank=True, null=True)
    renales_obs = models.TextField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecedentes_familiares'

# 3. ANTECEDENTES PERSONALES
class AntecedentePatologicoPersonal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='antecedentes_personales')

    estado_salud = models.CharField(max_length=100, blank=True, null=True)
    fecha_ultimo_examen_medico = models.DateField(blank=True, null=True)

    bajo_tratamiento_medico = models.BooleanField(default=False)
    tratamiento_obs = models.TextField(blank=True, null=True)
    toma_medicamentos = models.BooleanField(default=False)
    medicamentos_obs = models.TextField(blank=True, null=True)

    sangra_excesivamente = models.BooleanField(default=False)
    sangrado_obs = models.TextField(blank=True, null=True)
    problema_sanguineo = models.BooleanField(default=False)
    sanguineo_obs = models.TextField(blank=True, null=True)
    anemia = models.BooleanField(default=False)
    anemia_obs = models.TextField(blank=True, null=True)
    leucemia = models.BooleanField(default=False)
    leucemia_obs = models.TextField(blank=True, null=True)
    hemofilia = models.BooleanField(default=False)
    hemofilia_obs = models.TextField(blank=True, null=True)
    deficit_vitamina_k = models.BooleanField(default=False)
    vitamina_k_obs = models.TextField(blank=True, null=True)
    transfusion_sanguinea = models.BooleanField(default=False)
    transfusion_obs = models.TextField(blank=True, null=True)

    intervencion_quirurgica = models.BooleanField(default=False)
    quirurgica_obs = models.TextField(blank=True, null=True)
    problemas_oncologicos = models.BooleanField(default=False)
    oncologicos_obs = models.TextField(blank=True, null=True)
    problemas_renales = models.BooleanField(default=False)
    renales_obs = models.TextField(blank=True, null=True)
    problemas_corazon = models.BooleanField(default=False)
    corazon_obs = models.TextField(blank=True, null=True)
    hepatitis = models.BooleanField(default=False)
    hepatitis_obs = models.TextField(blank=True, null=True)

    tension_arterial = models.BooleanField(default=False)
    tension_arterial_tipo = models.CharField(max_length=50, blank=True, null=True)
    tension_obs = models.TextField(blank=True, null=True)

    aftas_herpes = models.BooleanField(default=False)
    aftas_herpes_obs = models.TextField(blank=True, null=True)
    consumo_drogas = models.BooleanField(default=False)
    drogas_obs = models.TextField(blank=True, null=True)
    enfermedades_venereas = models.BooleanField(default=False)
    venereas_obs = models.TextField(blank=True, null=True)
    vih_positivo = models.BooleanField(default=False)
    vih_obs = models.TextField(blank=True, null=True)

    alergia_penicilina = models.BooleanField(default=False)
    alergia_anestesia = models.BooleanField(default=False)
    alergia_aspirina = models.BooleanField(default=False)
    alergia_yodo = models.BooleanField(default=False)
    fiebre_reumatica = models.BooleanField(default=False)
    asma = models.BooleanField(default=False)
    diabetes = models.BooleanField(default=False)
    ulcera_gastrica = models.BooleanField(default=False)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecedentes_personales'

# 4. ANTECEDENTES NO PATOLÓGICOS
class AntecedenteNoPatologicoPersonal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='antecedentes_no_patologicos')

    respira_boca = models.BooleanField(default=False)
    respira_boca_obs = models.TextField(blank=True, null=True)
    consume_citricos = models.BooleanField(default=False)
    citricos_obs = models.TextField(blank=True, null=True)

    muerde_unas_labios = models.BooleanField(default=False)
    muerde_unas_obs = models.TextField(blank=True, null=True)
    muerde_objetos = models.BooleanField(default=False)
    muerde_objetos_obs = models.TextField(blank=True, null=True)
    apretamiento_dentario = models.BooleanField(default=False)
    apretamiento_obs = models.TextField(blank=True, null=True)

    fuma = models.BooleanField(default=False)
    fuma_cantidad_diaria = models.CharField(max_length=100, blank=True, null=True)
    fuma_obs = models.TextField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecedentes_no_patologicos'

# 5. ANTECEDENTES GINECOLÓGICOS
class AntecedenteGinecologico(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='antecedentes_ginecologicos')

    posibilidad_embarazo = models.BooleanField(default=False)
    embarazo_meses = models.CharField(max_length=50, blank=True, null=True)
    embarazo_obs = models.TextField(blank=True, null=True)

    toma_anticonceptivos = models.BooleanField(default=False)
    anticonceptivos_obs = models.TextField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'antecedentes_ginecologicos'


# Historia clinica
class Habitos(models.Model):
    # Relación 1 a 1 con el paciente
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='habitos')
    
    # Textos
    tecnica_cepillado = models.CharField(max_length=255, blank=True, null=True, verbose_name="Técnica de cepillado")
    elementos_higiene = models.CharField(max_length=255, blank=True, null=True, help_text="Ej: enjuagues, hilo dental, palillo dental, otros")
    
    # Booleanos (Sí / No)
    onicofagia = models.BooleanField(default=False, verbose_name="Onicofagia (Muerde uñas)")
    interposicion_lingual = models.BooleanField(default=False)
    bruxismo = models.BooleanField(default=False)
    bruxomania = models.BooleanField(default=False)
    succiona_citricos = models.BooleanField(default=False)
    respirador_bucal = models.BooleanField(default=False)
    fuma = models.BooleanField(default=False)
    bebe = models.BooleanField(default=False, verbose_name="Bebe alcohol")
    interposicion_objetos = models.BooleanField(default=False)
    
    # Otros
    otros_habitos = models.TextField(blank=True, null=True, verbose_name="Otros hábitos")

    def __str__(self):
        return f"Hábitos de {self.paciente}"

    class Meta:
        verbose_name = "Hábito"
        verbose_name_plural = "Hábitos"


class AntecedentesPeriodontales(models.Model):
    # Relación 1 a 1 con el paciente
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='antecedentes_periodontales')
    
    # Booleanos (Sí / No)
    sangrado_espontaneo = models.BooleanField(default=False, verbose_name="Sangrado Espontáneo")
    sangrado_provocado = models.BooleanField(default=False, verbose_name="Sangrado Provocado")
    movilidad = models.BooleanField(default=False, verbose_name="Movilidad Dental")
    se_han_separado = models.BooleanField(default=False, verbose_name="¿Se han separado los dientes?")
    se_han_elongado = models.BooleanField(default=False, verbose_name="¿Se han elongado los dientes?")
    halitosis = models.BooleanField(default=False, verbose_name="Halitosis (Mal aliento)")

    def __str__(self):
        return f"Antecedentes Periodontales de {self.paciente}"

    class Meta:
        verbose_name = "Antecedente Periodontal"
        verbose_name_plural = "Antecedentes Periodontales"


# ¡AQUÍ ESTÁ LA CLASE QUE FALTABA!
class ExamenPeriodontal(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='examen_periodontal')
    
    caracteristica_encia = models.CharField(max_length=255, blank=True, null=True, verbose_name="Característica de la encía")
    color = models.CharField(max_length=100, blank=True, null=True)
    textura = models.CharField(max_length=100, blank=True, null=True)
    consistencia = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Examen Periodontal de {self.paciente}"

    class Meta:
        verbose_name = "Examen Periodontal"
        verbose_name_plural = "Exámenes Periodontales"

        
class HistoriaOdontopediatrica(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='historia_odontopediatrica')

    # --- DATOS CLÍNICOS Y PERSONALES ---
    apodo = models.CharField(max_length=100, blank=True, null=True, verbose_name="¿Cómo llaman al niño en casa?")
    hobbie = models.CharField(max_length=200, blank=True, null=True)
    nombre_padres = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nombre de padre o madre")
    telefono_padres = models.CharField(max_length=50, blank=True, null=True)
    nombre_representante = models.CharField(max_length=255, blank=True, null=True)
    telefono_representante = models.CharField(max_length=50, blank=True, null=True)

    # --- ANTECEDENTES PERSONALES Y PERINATALES ---
    duracion_parto = models.CharField(max_length=100, blank=True, null=True)
    edad_madre_embarazo = models.CharField(max_length=50, blank=True, null=True)
    numero_embarazo = models.IntegerField(blank=True, null=True)
    embarazo_controlado = models.BooleanField(default=False)
    antecedentes_embarazo = models.TextField(blank=True, null=True)
    parto_normal = models.BooleanField(default=False)
    cesarea = models.BooleanField(default=False)
    observaciones_nacimiento = models.TextField(blank=True, null=True)
    tratamiento_medico_actual = models.TextField(blank=True, null=True)

    # --- DESARROLLO PSICOMOTOR ---
    edad_sento = models.CharField(max_length=50, blank=True, null=True)
    edad_gateo = models.CharField(max_length=50, blank=True, null=True)
    edad_paro = models.CharField(max_length=50, blank=True, null=True)
    edad_camino = models.CharField(max_length=50, blank=True, null=True)
    edad_primer_diente = models.CharField(max_length=50, blank=True, null=True)
    edad_primera_palabra = models.CharField(max_length=50, blank=True, null=True)
    evolucion_escolar = models.CharField(max_length=255, blank=True, null=True)
    vacunas = models.CharField(max_length=255, blank=True, null=True)

    # Hábitos infantiles (Check + Observación)
    biberon = models.BooleanField(default=False)
    biberon_obs = models.CharField(max_length=255, blank=True, null=True)
    chupon = models.BooleanField(default=False)
    chupon_obs = models.CharField(max_length=255, blank=True, null=True)
    succion_digital = models.BooleanField(default=False)
    succion_digital_obs = models.CharField(max_length=255, blank=True, null=True)
    enuresis = models.BooleanField(default=False)
    enuresis_obs = models.CharField(max_length=255, blank=True, null=True)
    onicofagia = models.BooleanField(default=False)
    onicofagia_obs = models.CharField(max_length=255, blank=True, null=True)
    queilofagia = models.BooleanField(default=False, verbose_name="Queilofagia (Muerde labios)")
    queilofagia_obs = models.CharField(max_length=255, blank=True, null=True)
    geofagia = models.BooleanField(default=False, verbose_name="Geofagia (Come tierra)")
    geofagia_obs = models.CharField(max_length=255, blank=True, null=True)
    golosinas = models.BooleanField(default=False)
    golosinas_obs = models.CharField(max_length=255, blank=True, null=True)
    otros_habitos_inf = models.BooleanField(default=False)
    otros_habitos_inf_obs = models.CharField(max_length=255, blank=True, null=True)

    # --- HÁBITOS DE HIGIENE BUCAL ---
    veces_cepilla_dia = models.CharField(max_length=50, blank=True, null=True)
    cuando_cepilla = models.CharField(max_length=100, blank=True, null=True)
    usa_enjuague = models.BooleanField(default=False)
    usa_hilo = models.BooleanField(default=False)
    tipo_higiene = models.CharField(max_length=100, blank=True, null=True, help_text="Solo, asistido, etc.")
    pasta_y_cepillo = models.CharField(max_length=255, blank=True, null=True)
    atencion_previa = models.BooleanField(default=False)
    cuando_donde_atencion = models.CharField(max_length=255, blank=True, null=True)
    experiencia_positiva = models.BooleanField(default=True, verbose_name="¿Experiencia positiva?")
    por_que_experiencia = models.TextField(blank=True, null=True)

    # --- ALIMENTACIÓN PRIMER AÑO ---
    lactancia_materna = models.BooleanField(default=False)
    edad_lactancia_materna = models.CharField(max_length=50, blank=True, null=True)
    lactancia_artificial = models.BooleanField(default=False)
    edad_lactancia_artificial = models.CharField(max_length=50, blank=True, null=True)
    lactancia_mixta = models.BooleanField(default=False)
    edad_lactancia_mixta = models.CharField(max_length=50, blank=True, null=True)
    obs_alimentacion = models.TextField(blank=True, null=True)

    # --- EXAMEN FÍSICO Y DENTICIÓN ---
    peso = models.CharField(max_length=50, blank=True, null=True)
    talla = models.CharField(max_length=50, blank=True, null=True)
    temperatura = models.CharField(max_length=50, blank=True, null=True)
    presion_arterial = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_respiratoria = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_cardiaca = models.CharField(max_length=50, blank=True, null=True)
    tipo_denticion = models.CharField(max_length=100, blank=True, null=True, help_text="Temporal, Mixta, Permanente")

    # --- OCLUSIÓN Y ANÁLISIS FACIAL ---
    competencia_labial = models.CharField(max_length=100, blank=True, null=True)
    tipo_perfil = models.CharField(max_length=100, blank=True, null=True)
    linea_media = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_baume = models.CharField(max_length=100, blank=True, null=True)
    tipo_arco_baume = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_angle = models.CharField(max_length=100, blank=True, null=True)
    relacion_canina = models.CharField(max_length=100, blank=True, null=True)
    # Booleanos Oclusión
    mordida_abierta = models.BooleanField(default=False)
    apinamiento = models.BooleanField(default=False)
    mordida_cubierta = models.BooleanField(default=False)
    diastemas = models.BooleanField(default=False)
    mordida_borde_borde = models.BooleanField(default=False)
    transposicion = models.BooleanField(default=False)
    mordida_cruzada_anterior = models.BooleanField(default=False)
    version_rotacion = models.BooleanField(default=False)
    mordida_cruzada_uni_der = models.BooleanField(default=False)
    mordida_cruzada_uni_izq = models.BooleanField(default=False)
    mordida_cruzada_bilateral = models.BooleanField(default=False)
    obs_oclusion = models.TextField(blank=True, null=True)
    anomalias_formacion_dental = models.TextField(blank=True, null=True)

    # --- ANÁLISIS CONDUCTUAL ---
    tipo_escobar = models.CharField(max_length=100, blank=True, null=True, help_text="Colaborador, No colaborador, Colaborador en potencia")
    # Rasgos del niño
    rasgo_timido = models.BooleanField(default=False)
    rasgo_agresivo = models.BooleanField(default=False)
    rasgo_mimado = models.BooleanField(default=False)
    rasgo_miedoso = models.BooleanField(default=False)
    rasgo_desafiante = models.BooleanField(default=False)
    rasgo_lloroso = models.BooleanField(default=False)
    # Rasgos de los padres
    padres_cooperador = models.BooleanField(default=False)
    padres_despreocupado = models.BooleanField(default=False)
    padres_sobreprotector = models.BooleanField(default=False)
    padres_reganon = models.BooleanField(default=False)
    padres_debil = models.BooleanField(default=False)
    obs_conductual = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Historia Odontopediátrica de {self.paciente}"
    
class ProstodonciaRemovible(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='prostodoncia_removible')

    # --- ANTECEDENTES PROTÉSICOS ---
    portador_protesis = models.CharField(max_length=50, blank=True, null=True, help_text="Parcial, Total")
    experiencia_protesica = models.CharField(max_length=50, blank=True, null=True, help_text="Favorable, Desfavorable")
    tiempo_uso_protesis = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tiempo que porta la prótesis")

    # --- RELACIÓN ALVEOLAR ---
    tamano_labio = models.CharField(max_length=50, blank=True, null=True, help_text="Largo, mediano, corto")
    tamano_lengua = models.CharField(max_length=50, blank=True, null=True, help_text="Grande, mediana, pequeña")
    examen_radiografico = models.TextField(blank=True, null=True)
    diagnostico_removible = models.TextField(blank=True, null=True)
    pronostico_removible = models.TextField(blank=True, null=True)

    # --- PROCEDIMIENTO ---
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


class ProstodonciaFija(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='prostodoncia_fija')

    # --- OCLUSIÓN ---
    tipo_oclusion = models.CharField(max_length=100, blank=True, null=True)
    apinamiento_dental = models.CharField(max_length=100, blank=True, null=True)
    rotacion = models.CharField(max_length=100, blank=True, null=True)
    sobreerupcion = models.CharField(max_length=100, blank=True, null=True)
    diastemas = models.CharField(max_length=100, blank=True, null=True)
    relacion_centrica = models.CharField(max_length=100, blank=True, null=True)

    # --- EXPLORACIÓN RADIOLÓGICA ---
    nivel_hueso_alveolar = models.CharField(max_length=255, blank=True, null=True)
    proporcion_coronaria = models.CharField(max_length=255, blank=True, null=True)
    ley_de_ante = models.CharField(max_length=255, blank=True, null=True)
    
    # Raíz (Lo dividí en 3 para que sea más fácil llenarlo en el formulario)
    raiz_longitud = models.CharField(max_length=100, blank=True, null=True)
    raiz_configuracion = models.CharField(max_length=100, blank=True, null=True)
    raiz_direccion = models.CharField(max_length=100, blank=True, null=True)
    
    cresta_alveolar_osea = models.CharField(max_length=255, blank=True, null=True)
    altura_coronaria = models.CharField(max_length=255, blank=True, null=True)
    
    # Booleanos de exploración
    trauma_oclusion = models.BooleanField(default=False)
    espacios_edentulos = models.BooleanField(default=False)
    
    pilares = models.CharField(max_length=255, blank=True, null=True)
    curva_spee = models.CharField(max_length=255, blank=True, null=True)
    
    # --- DIAGNÓSTICO Y PLAN ---
    diagnostico_radiologico = models.TextField(blank=True, null=True)
    diagnostico_clinico = models.TextField(blank=True, null=True)
    plan_tratamiento = models.TextField(blank=True, null=True)

    # --- PROCEDIMIENTOS FIJA ---
    toma_impresiones_cementado = models.CharField(max_length=255, blank=True, null=True)
    pruebas_iniciales = models.BooleanField(default=False)
    control = models.BooleanField(default=False)
    prueba_final = models.BooleanField(default=False)

    def __str__(self):
        return f"Prostodoncia Fija de {self.paciente}"

    class Meta:
        verbose_name = "Prostodoncia Fija"
        verbose_name_plural = "Prostodoncias Fijas"


class ProtocoloQuirurgico(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='protocolo_quirurgico')

    # --- DATOS DEL EQUIPO Y PROCEDIMIENTO ---
    cirujano = models.CharField(max_length=255, blank=True, null=True)
    anestesiologo = models.CharField(max_length=255, blank=True, null=True)
    ayudantes = models.CharField(max_length=255, blank=True, null=True)
    instrumentista = models.CharField(max_length=255, blank=True, null=True)
    circulantes = models.CharField(max_length=255, blank=True, null=True)
    docente = models.CharField(max_length=255, blank=True, null=True, verbose_name="Docente a cargo")
    
    tecnica_anestesia = models.CharField(max_length=255, blank=True, null=True)
    duracion_cirugia = models.CharField(max_length=100, blank=True, null=True, help_text="Ej: 1 hora 30 min")
    
    diagnostico_pre_operatorio = models.TextField(blank=True, null=True)
    diagnostico_post_operatorio = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    # --- HALLAZGOS PRE QUIRÚRGICOS ---
    hallazgos_clinicos = models.TextField(blank=True, null=True, verbose_name="Hallazgos Clínicos")
    hallazgos_radiograficos = models.TextField(blank=True, null=True, verbose_name="Hallazgos Radiográficos")
    hallazgos_laboratoriales = models.TextField(blank=True, null=True, verbose_name="Hallazgos Laboratoriales")
    otros_hallazgos_pre = models.TextField(blank=True, null=True, verbose_name="Otros Hallazgos Pre Quirúrgicos")

    # --- DESARROLLO DE LA CIRUGÍA ---
    descripcion_procedimiento = models.TextField(blank=True, null=True, verbose_name="Descripción del Procedimiento Quirúrgico")
    hallazgos_quirurgicos = models.TextField(blank=True, null=True, verbose_name="Hallazgos Quirúrgicos")
    accidentes_quirurgicos = models.TextField(blank=True, null=True, verbose_name="Accidentes Quirúrgicos")
    
    # --- POST OPERATORIO ---
    indicaciones_post_quirurgicas = models.TextField(blank=True, null=True, verbose_name="Indicaciones Post-Quirúrgicas")
    receta = models.TextField(blank=True, null=True, verbose_name="Receta Médica")

    # --- FIRMAS (Digitales - Preparando el terreno) ---
    # Por ahora los dejamos como booleanos para confirmar si ya firmaron o no en el sistema
    estudiante_firmo = models.BooleanField(default=False)
    paciente_firmo = models.BooleanField(default=False)
    fecha_firma = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Protocolo Quirúrgico de {self.paciente}"

    class Meta:
        verbose_name = "Protocolo Quirúrgico"
        verbose_name_plural = "Protocolos Quirúrgicos"

class ExamenClinicoFisico(models.Model):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='examen_clinico_fisico')

    # --- SIGNOS VITALES Y ESTADO GENERAL ---
    temperatura_c = models.CharField(max_length=50, blank=True, null=True, verbose_name="Temperatura (°C)")
    presion_arterial = models.CharField(max_length=50, blank=True, null=True)
    pulso = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_respiratoria = models.CharField(max_length=50, blank=True, null=True)
    
    estado_general = models.CharField(max_length=100, blank=True, null=True)
    estado_nutricional = models.CharField(max_length=100, blank=True, null=True)
    estado_hidratacion = models.CharField(max_length=100, blank=True, null=True)
    actitud_posicion = models.CharField(max_length=100, blank=True, null=True)
    consciencia = models.CharField(max_length=100, blank=True, null=True)
    orientacion_etp = models.BooleanField(default=False, verbose_name="Orientación en Espacio, Tiempo y Persona")
    
    tipo_constitucion = models.CharField(max_length=100, blank=True, null=True)
    peso_kg = models.CharField(max_length=50, blank=True, null=True, verbose_name="Peso (kg)")
    talla_m = models.CharField(max_length=50, blank=True, null=True, verbose_name="Talla (metros)")

    # --- EXAMEN FÍSICO CABEZA Y CUELLO ---
    craneo = models.CharField(max_length=100, blank=True, null=True, help_text="Doliocefalo, mesocefalo, branquiocefalo")
    cara_simetria = models.BooleanField(default=True, verbose_name="Simetría facial")
    perfil = models.CharField(max_length=100, blank=True, null=True, help_text="Cóncavo, convexo, recto")
    
    ojos = models.CharField(max_length=255, blank=True, null=True)
    nariz = models.CharField(max_length=255, blank=True, null=True)
    oidos = models.CharField(max_length=255, blank=True, null=True)
    cuello = models.CharField(max_length=255, blank=True, null=True)
    ganglios_linfaticos = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Examen Clínico de {self.paciente}"

    class Meta:
        verbose_name = "Examen Clínico y Físico"
        verbose_name_plural = "Exámenes Clínicos y Físicos"


class MedicalImage(models.Model):
    IMAGE_TYPES = [
        ('dicom', 'DICOM'),
        ('xray', 'X-ray'),
        ('intraoral_photo', 'Intraoral photo'),
        ('extraoral_photo', 'Extraoral photo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='medical_images')
    file = models.FileField(upload_to='medical_images/%Y/%m/%d/')
    image_type = models.CharField(max_length=30, choices=IMAGE_TYPES, default='xray')
    description = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.image_type} ({self.uploaded_at.date()})"


class ClinicalAnimation(models.Model):
    CATEGORIES = [
        ('implant', 'Implant'),
        ('orthodontics', 'Orthodontics'),
        ('cleaning', 'Cleaning'),
        ('extraction', 'Extraction'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    video_file = models.FileField(upload_to='clinical_animations/%Y/%m/%d/')
    category = models.CharField(max_length=30, choices=CATEGORIES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    # --- EXAMEN DE LA ATM (Articulación Temporomandibular) ---
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


<<<<<<< Updated upstream
class Gabinete(models.Model):
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('mantenimiento', 'En Mantenimiento'),
        ('ocupado', 'Ocupado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
=======
    def __str__(self):
        return f"Examen Periodontal de {self.paciente}"

    class Meta:
        verbose_name = "Examen Periodontal"
        verbose_name_plural = "Exámenes Periodontales"

class ProstodonciaRemovible(SeguimientoAcademico):
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='prostodoncias_removibles')

    portador_protesis = models.CharField(max_length=50, blank=True, null=True)
    experiencia_protesica = models.CharField(max_length=50, blank=True, null=True)
    tiempo_uso_protesis = models.CharField(max_length=100, blank=True, null=True)

    tamano_labio = models.CharField(max_length=50, blank=True, null=True)
    tamano_lengua = models.CharField(max_length=50, blank=True, null=True)
    examen_radiografico = models.TextField(blank=True, null=True)
    diagnostico_removible = models.TextField(blank=True, null=True)
    pronostico_removible = models.TextField(blank=True, null=True)

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
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='prostodoncias_fijas')

    tipo_oclusion = models.CharField(max_length=100, blank=True, null=True)
    apinamiento_dental = models.CharField(max_length=100, blank=True, null=True)
    rotacion = models.CharField(max_length=100, blank=True, null=True)
    sobreerupcion = models.CharField(max_length=100, blank=True, null=True)
    diastemas = models.CharField(max_length=100, blank=True, null=True)
    relacion_centrica = models.CharField(max_length=100, blank=True, null=True)

    nivel_hueso_alveolar = models.CharField(max_length=255, blank=True, null=True)
    proporcion_coronaria = models.CharField(max_length=255, blank=True, null=True)
    ley_de_ante = models.CharField(max_length=255, blank=True, null=True)
    
    raiz_longitud = models.CharField(max_length=100, blank=True, null=True)
    raiz_configuracion = models.CharField(max_length=100, blank=True, null=True)
    raiz_direccion = models.CharField(max_length=100, blank=True, null=True)
    
    cresta_alveolar_osea = models.CharField(max_length=255, blank=True, null=True)
    altura_coronaria = models.CharField(max_length=255, blank=True, null=True)
    
    trauma_oclusion = models.BooleanField(default=False)
    espacios_edentulos = models.BooleanField(default=False)
    
    pilares = models.CharField(max_length=255, blank=True, null=True)
    curva_spee = models.CharField(max_length=255, blank=True, null=True)
    
    diagnostico_radiologico = models.TextField(blank=True, null=True)
    diagnostico_clinico = models.TextField(blank=True, null=True)
    plan_tratamiento = models.TextField(blank=True, null=True)

    toma_impresiones_cementado = models.CharField(max_length=255, blank=True, null=True)
    pruebas_iniciales = models.BooleanField(default=False)
    control = models.BooleanField(default=False)
    prueba_final = models.BooleanField(default=False)

    def __str__(self):
        return f"Prostodoncia Fija de {self.paciente}"

    class Meta:
        verbose_name = "Prostodoncia Fija"
        verbose_name_plural = "Prostodoncias Fijas"

class ProtocoloQuirurgico(SeguimientoAcademico):
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='protocolos_quirurgicos')

    cirujano = models.CharField(max_length=255, blank=True, null=True)
    anestesiologo = models.CharField(max_length=255, blank=True, null=True)
    ayudantes = models.CharField(max_length=255, blank=True, null=True)
    instrumentista = models.CharField(max_length=255, blank=True, null=True)
    circulantes = models.CharField(max_length=255, blank=True, null=True)
    # NOTA: Quité el CharField "docente" porque ahora se hereda "docente_supervisor" desde SeguimientoAcademico
    
    tecnica_anestesia = models.CharField(max_length=255, blank=True, null=True)
    duracion_cirugia = models.CharField(max_length=100, blank=True, null=True)
    
    diagnostico_pre_operatorio = models.TextField(blank=True, null=True)
    diagnostico_post_operatorio = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    hallazgos_clinicos = models.TextField(blank=True, null=True)
    hallazgos_radiograficos = models.TextField(blank=True, null=True)
    hallazgos_laboratoriales = models.TextField(blank=True, null=True)
    otros_hallazgos_pre = models.TextField(blank=True, null=True)

    descripcion_procedimiento = models.TextField(blank=True, null=True)
    hallazgos_quirurgicos = models.TextField(blank=True, null=True)
    accidentes_quirurgicos = models.TextField(blank=True, null=True)
    
    indicaciones_post_quirurgicas = models.TextField(blank=True, null=True)
    receta = models.TextField(blank=True, null=True)

    estudiante_firmo = models.BooleanField(default=False)
    paciente_firmo = models.BooleanField(default=False)
    fecha_firma = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Protocolo Quirúrgico de {self.paciente}"

    class Meta:
        verbose_name = "Protocolo Quirúrgico"
        verbose_name_plural = "Protocolos Quirúrgicos"

        # ==========================================
# 4. TRATAMIENTOS, AVANCES (SESIONES) Y TRANSFERENCIAS
# ==========================================

class Tratamiento(models.Model):
    ESTADOS_TRATAMIENTO = [
        ('Pendiente_Aprobacion', 'Pendiente Aprobación Docente'),
        ('Aprobado_Por_Pagar', 'Aprobado por Pagar'),
        ('Pagado_Autorizado', 'Pagado y Autorizado'),
        ('En_Ejecucion', 'En Ejecución'),
        ('Finalizado_Pendiente_Nota', 'Finalizado Pendiente Nota'),
        ('Evaluado', 'Evaluado'),
        ('EN_PROGRESO', 'En Progreso'),
        ('FINALIZADO', 'Finalizado con Éxito'),
        ('DERIVADO', 'Derivado a otro estudiante'),
        ('ABANDONADO', 'Abandonado por el paciente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='tratamientos')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='tratamientos_realizados')
    
    nombre_tratamiento = models.CharField(max_length=200, help_text="Ej: Profilaxis, Exodoncia de 3er Molar")
    procedimiento = models.CharField(max_length=255, blank=True, null=True, help_text="Descripción detallada del procedimiento")
    pieza_dental = models.IntegerField(blank=True, null=True, help_text="Número de pieza dental (1-32)")
    diente_pieza = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 14, 46, Toda la boca")
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Precio del tratamiento")
    estado = models.CharField(max_length=30, choices=ESTADOS_TRATAMIENTO, default='Pendiente_Aprobacion')
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre_tratamiento} - {self.paciente} ({self.estado})"

    class Meta:
        verbose_name = "Tratamiento"
        verbose_name_plural = "Tratamientos"
        ordering = ['-creado_en']

class AvanceClinico(SeguimientoAcademico):
    """
    Cada sesión que el estudiante atiende al paciente.
    Hereda de SeguimientoAcademico (Requiere firma del docente).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='avances')
    
    fecha_sesion = models.DateField(default=date.today)
    descripcion_procedimiento = models.TextField(help_text="¿Qué se le hizo al paciente hoy?")
    proxima_cita = models.DateField(blank=True, null=True, help_text="Fecha de la siguiente sesión si es necesaria")

    def __str__(self):
        return f"Avance {self.fecha_sesion} - {self.tratamiento}"

    class Meta:
        verbose_name = "Avance de Sesión"
        verbose_name_plural = "Avances de Sesiones"
        ordering = ['-fecha_sesion']

class Evidencia(models.Model):
    """Fotos o documentos del avance para que el docente evalúe"""
    TIPOS_EVIDENCIA = [
        ('RADIOGRAFIA', 'Radiografía'),
        ('FOTO_INICIAL', 'Fotografía Clínica Inicial'),
        ('FOTO_PROCESO', 'Fotografía Clínica en Proceso'),
        ('FOTO_FINAL', 'Fotografía Clínica Final'),
        ('DOCUMENTO', 'Documento / Consentimiento'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avance = models.ForeignKey(AvanceClinico, on_delete=models.CASCADE, related_name='evidencias')
    
    tipo_evidencia = models.CharField(max_length=20, choices=TIPOS_EVIDENCIA)
    archivo = models.FileField(upload_to='evidencias_clinicas/%Y/%m/')
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidencia: {self.get_tipo_evidencia_display()} - Avance {self.avance.fecha_sesion}"

class Transferencia(models.Model):
    """Registro histórico de derivación de pacientes entre estudiantes"""
    ESTADOS_TRANSFERENCIA = [
        ('PENDIENTE', 'Pendiente de Aprobación Docente'),
        ('APROBADA', 'Transferencia Aprobada'),
        ('RECHAZADA', 'Transferencia Rechazada'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='historial_transferencias')
    
    estudiante_origen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='transferencias_emitidas')
    estudiante_destino = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='transferencias_recibidas')
    
    docente_aprobador = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='transferencias_evaluadas',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    motivo_transferencia = models.TextField(help_text="¿Por qué se deriva al paciente?")
    estado = models.CharField(max_length=20, choices=ESTADOS_TRANSFERENCIA, default='PENDIENTE')
    
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(blank=True, null=True, help_text="Cuando el docente aprobó/rechazó")

    def __str__(self):
        return f"Transferencia de {self.paciente}"
    

# Asegúrate de tener uuid importado (ya lo tienes)
# Importar JSONField (en Django 3.1+ viene incluido en models)

# ==========================================
# 5. PERIODONTOGRAMA
# ==========================================
class Periodontograma(SeguimientoAcademico):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Usamos ForeignKey y NO OneToOneField, porque un paciente necesitará 
    # múltiples periodontogramas a lo largo del tiempo (Inicial, Reevaluación, Mantenimiento)
    paciente = models.ForeignKey(
        'Paciente', 
        on_delete=models.CASCADE, 
        related_name='periodontogramas'
    )
    
    # Aquí guardaremos el estado de React tal cual (dictionaries anidados)
    # Ejemplo: { "48": { "movilidad": "", "implante": false, "sangrado": [...], ... } }
    datos_vestibular_superior = models.JSONField(default=dict, blank=True, help_text="Datos de la arcada superior vestibular")
    datos_palatino_superior = models.JSONField(default=dict, blank=True, help_text="Datos de la arcada superior palatino")
    datos_vestibular_inferior = models.JSONField(default=dict, blank=True, help_text="Datos de la arcada inferior vestibular")
    datos_lingual_inferior = models.JSONField(default=dict, blank=True, help_text="Datos de la arcada inferior lingual")
    
    # Campos adicionales útiles para el diagnóstico periodontal
    placa_bacteriana_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="% de Placa (O'Leary)")
    sangrado_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="% de Sangrado")
    diagnostico = models.TextField(blank=True, null=True, verbose_name="Diagnóstico Periodontal")
    pronostico = models.TextField(blank=True, null=True, verbose_name="Pronóstico General y por piezas")
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Como heredas de SeguimientoAcademico, asumimos que tienes acceso al estudiante
        return f"Periodontograma de {self.paciente} - {self.creado_en.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Periodontograma"
        verbose_name_plural = "Periodontogramas"
        ordering = ['-creado_en'] # Ordenar del más reciente al más antiguo


#==========================================
# 6. SILLONES Y EQUIPOS (Para tu mapa en React)
#+==========================================
class Sillon(models.Model): 
    ESTADOS = [
        ('operativo', 'Operativo'),
        ('revision', 'En Revisión'),
        ('falla', 'Con Falla'),
    ]

    # Datos básicos
    nombre = models.CharField(max_length=50, help_text="Ej: Sillón 01")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='operativo')
    
    # Detalles del equipo
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    numero_serie = models.CharField(max_length=100, blank=True, null=True, unique=True)
    descripcion = models.TextField(blank=True, null=True, help_text="Características especiales del equipo")

    # Cotas y Mantenimiento
    ultima_revision = models.DateTimeField(default=timezone.now)
    dias_frecuencia_mantenimiento = models.IntegerField(default=180, help_text="Cada cuántos días necesita revisión")
    notas_tecnicas = models.TextField(blank=True, null=True, help_text="Registro de fallas comunes o piezas cambiadas")

    # Coordenadas 3D (Para tu mapa en React)
    posicion_x = models.FloatField(default=0.0)
    posicion_y = models.FloatField(default=0.0)
    posicion_z = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.nombre} - {self.estado.upper()}"

# ==========================================
# 7. CITAS (Agendamiento)
# ==========================================
class Cita(models.Model):
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
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='citas')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='citas_estudiante', limit_choices_to={'rol': 'ESTUDIANTE'})
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='citas_docente', limit_choices_to={'rol': 'DOCENTE'})
    gabinete = models.ForeignKey('Sillon', on_delete=models.RESTRICT, related_name='citas')
    motivo = models.CharField(max_length=255, blank=True, null=True)
    
    fecha_hora = models.DateTimeField(help_text="Fecha y hora de la cita")
    estado = models.CharField(max_length=20, choices=ESTADOS_CITA, default='RESERVADA')
    check_in_time = models.DateTimeField(blank=True, null=True, help_text="Hora de check-in del paciente")
    duracion_estimada = models.IntegerField(default=30, help_text="Duración estimada en minutos")
    
    # Campos de cancelación
    cancelada_en = models.DateTimeField(blank=True, null=True, help_text="Fecha y hora de cancelación")
    razon_cancelacion = models.CharField(max_length=20, choices=RAZONES_CANCELACION, blank=True, null=True)
    motivo_cancelacion = models.TextField(blank=True, null=True, help_text="Descripción del motivo de cancelación")
    cancelada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='citas_canceladas')
    
    # Cita recurrente
    cita_recurrente = models.ForeignKey('CitaRecurrente', on_delete=models.SET_NULL, null=True, blank=True, related_name='citas')
    
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
    paciente = instance.paciente
    no_asistio_count = Cita.objects.filter(paciente=paciente, estado='NO_ASISTIO').count()
    paciente.inasistencias = no_asistio_count
    paciente.alerta_abandono = no_asistio_count >= 3
    paciente.save(update_fields=['inasistencias', 'alerta_abandono'])


# ==========================================
# CITAS RECURRENTES
# ==========================================
class CitaRecurrente(models.Model):
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
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='citas_recurrentes')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='citas_recurrentes_estudiante', limit_choices_to={'rol': 'ESTUDIANTE'})
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='citas_recurrentes_docente', limit_choices_to={'rol': 'DOCENTE'})
    gabinete = models.ForeignKey('Sillon', on_delete=models.RESTRICT, related_name='citas_recurrentes')
    motivo = models.ForeignKey('Tratamiento', on_delete=models.CASCADE, related_name='citas_recurrentes')

    # Configuración de recurrencia
    frecuencia = models.CharField(max_length=20, choices=FRECUENCIAS, default='SEMANAL')
    hora = models.TimeField(help_text="Hora del día para la cita")
    dias_semana = models.CharField(max_length=20, blank=True, null=True, help_text="Día(s) de la semana (0-6)")
    duracion_estimada = models.IntegerField(default=30, help_text="Duración estimada en minutos")

    # Fechas de rango
    fecha_inicio = models.DateField(help_text="Fecha de inicio de la recurrencia")
    fecha_fin = models.DateField(blank=True, null=True, help_text="Fecha de fin (si no está rellena, es indefinida)")
    max_ocurrencias = models.IntegerField(blank=True, null=True, help_text="Número máximo de citas a generar")

    # Control
    activa = models.BooleanField(default=True)
    ultima_generacion = models.DateTimeField(auto_now=True)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'citas_recurrentes'
        ordering = ['fecha_inicio']

    def __str__(self):
        return f"Cita Recurrente {self.frecuencia} - {self.paciente}"


# ==========================================
# MÓDULOS 4-8: FLUJO CLÍNICO-ACADÉMICO (CONTROL, PAGO, ALMACÉN)
# ==========================================

class ControlAcademico(models.Model):
    """
    Registro de supervisiones y aprobaciones del docente sobre tratamientos.
    Implementa el flujo académico: revisión, aprobación y evaluación.
    """
    TIPOS_CONTROL = [
        ('Inicial_Plan', 'Control Inicial del Plan'),
        ('Final_Ejecucion', 'Control Final de Ejecución'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='controles_academicos')
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.RESTRICT, 
        related_name='controles_academicos_realizados',
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    tipo_control = models.CharField(max_length=30, choices=TIPOS_CONTROL)
    aprobado = models.BooleanField(default=False)
    nota_rubrica = models.IntegerField(blank=True, null=True, help_text="Nota del 0 al 100")
    observaciones = models.TextField(blank=True, null=True, help_text="Observaciones del docente")
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Control {self.tipo_control} - {self.tratamiento} - {self.docente.username}"

    class Meta:
        db_table = 'controles_academicos'
        verbose_name = "Control Académico"
        verbose_name_plural = "Controles Académicos"
        ordering = ['-creado_en']


class PagoFactura(models.Model):
    """
    Gestión de pagos y facturas en la caja de la clínica.
    Vinculado a cada tratamiento para garantizar auditoría tributaria.
    """
    ESTADOS_PAGO = [
        ('Emitido', 'Emitido'),
        ('Anulado', 'Anulado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.RESTRICT, related_name='pagos')
    
    nro_factura = models.CharField(max_length=50, unique=True, help_text="Número secuencial de factura")
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monto cancelado")
    estado_pago = models.CharField(max_length=20, choices=ESTADOS_PAGO, default='Emitido')
    cumplimiento_tributario_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID de cumplimiento fiscal")
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Factura {self.nro_factura} - {self.monto_pagado} Bs - {self.estado_pago}"

    class Meta:
        db_table = 'pagos_facturas'
        verbose_name = "Pago Factura"
        verbose_name_plural = "Pagos y Facturas"
        ordering = ['-creado_en']


class Inventario(models.Model):
    """
    Control de stock de insumos y materiales de la clínica.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material_nombre = models.CharField(max_length=255, unique=True, help_text="Nombre del material")
    stock_actual = models.IntegerField(default=0, help_text="Cantidad actual en stock")
    stock_minimo = models.IntegerField(default=10, help_text="Stock mínimo para alertar")
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.material_nombre} (Stock: {self.stock_actual})"

    class Meta:
        db_table = 'inventario'
        verbose_name = "Inventario"
        verbose_name_plural = "Inventario"


class DespachoAlmacen(models.Model):
    """
    Registro de despacho de insumos desde almacén.
    Realiza descuentos automáticos del inventario al despachar.
    """
    ESTADOS_ENTREGA = [
        ('Entregado', 'Entregado'),
        ('Devuelto', 'Devuelto'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='despachos_almacen')
    inventario = models.ForeignKey(Inventario, on_delete=models.RESTRICT, related_name='despachos')
    
    insumo_nombre = models.CharField(max_length=255, help_text="Nombre del insumo")
    cantidad_despachada = models.IntegerField(help_text="Cantidad de unidades despachadas")
    estado_entrega = models.CharField(max_length=20, choices=ESTADOS_ENTREGA, default='Entregado')
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Despacho {self.insumo_nombre} ({self.cantidad_despachada} unidades) - {self.estado_entrega}"

    class Meta:
        db_table = 'despachos_almacen'
        verbose_name = "Despacho Almacén"
        verbose_name_plural = "Despachos Almacén"
        ordering = ['-creado_en']


# ==========================================
# CONFIGURACIÓN DE ALERTAS
# ==========================================
class ConfiguracionAlertas(models.Model):
    """Configuración global de alertas para la clínica"""
    
    minutos_espera_alerta = models.IntegerField(default=15, help_text="Minutos de espera antes de generar alerta roja")
    inasistencias_alerta_abandono = models.IntegerField(default=3, help_text="Número de inasistencias para activar alerta de abandono")
    dias_notificacion_previa = models.IntegerField(default=1, help_text="Días antes de la cita para enviar notificación")
    
    activa = models.BooleanField(default=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'configuracion_alertas'
        verbose_name = "Configuración de Alertas"
        verbose_name_plural = "Configuración de Alertas"

    def __str__(self):
        return "Configuración de Alertas del Sistema"


# ==========================================
# AUDITORÍA DE CITAS
# ==========================================
class AuditoriaCita(models.Model):
    TIPOS_CAMBIO = [
        ('CREACION', 'Creación'),
        ('ACTUALIZACION', 'Actualización'),
        ('CANCELACION', 'Cancelación'),
        ('CHECK_IN', 'Check-in'),
        ('CAMBIO_ESTADO', 'Cambio de Estado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cita = models.ForeignKey('Cita', on_delete=models.CASCADE, related_name='auditoria')
    tipo_cambio = models.CharField(max_length=20, choices=TIPOS_CAMBIO)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    # Detalles del cambio
    campos_modificados = models.JSONField(default=dict, help_text="JSON con los campos que se modificaron")
    valores_anteriores = models.JSONField(default=dict, help_text="JSON con valores anteriores")
    valores_nuevos = models.JSONField(default=dict, help_text="JSON con valores nuevos")
    
>>>>>>> Stashed changes
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='disponible')
    capacidad = models.PositiveIntegerField(default=1, help_text="Número máximo de citas simultáneas")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

    def esta_disponible_en_fecha(self, fecha_hora):
        """Verifica si el gabinete está disponible en una fecha y hora específica"""
        if self.estado != 'disponible':
            return False

        # Contar citas activas en ese horario
        citas_en_horario = Appointment.objects.filter(
            gabinete=self,
            appointment_date=fecha_hora.date(),
            start_time__lte=fecha_hora.time(),
            end_time__gt=fecha_hora.time(),
            status__in=['scheduled', 'confirmed']
        ).count()

        return citas_en_horario < self.capacidad


class DentalChair(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=30, blank=True, null=True, unique=True)
    gabinete = models.ForeignKey(Gabinete, on_delete=models.CASCADE, related_name='chairs', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
<<<<<<< Updated upstream
        return self.name
=======
        return f"Abandono {self.paciente} - {self.fecha_abandono}"

# ==========================================
# MODULO 5 RADIOGRAFIAS
# ==========================================

def upload_to_paciente(instance, filename):
    # Esto guardará los archivos en: evidencias_clinicas/IUP_PACIENTE/CATEGORIA/archivo.jpg
    paciente_id = str(instance.paciente.id)
    return os.path.join('evidencias_clinicas', paciente_id, instance.categoria, filename)

class ImagenClinica(models.Model):
    CATEGORIAS = [
        ('FACIAL', 'Fotografía Facial'),
        ('INTRAORAL', 'Fotografía Intraoral'),
        ('PSP', 'Radiografía Placa de Fósforo'),
        ('CBCT', 'Captura de Tomografía'),
        ('PROCESO', 'Seguimiento de Proceso/Laboratorio'),
        ('FINAL', 'Resultado Final (Post-tratamiento)'),
    ]
    
    ESTADOS_PROCESAMIENTO = [
        ('Pendiente', 'Pendiente'),
        ('Procesando', 'Procesando'),
        ('Procesado', 'Procesado'),
        ('Error', 'Error'),
    ]

    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='imagenes')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    archivo = models.ImageField(upload_to=upload_to_paciente)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    pieza_dental = models.IntegerField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    fecha_adquisicion = models.DateTimeField(auto_now_add=True)
    
    estado_procesamiento = models.CharField(max_length=20, choices=ESTADOS_PROCESAMIENTO, default='Pendiente')
    hallazgos_ia = models.JSONField(null=True, blank=True)
    hallazgos_manuales = models.JSONField(null=True, blank=True)
    imagen_anotada = models.ImageField(upload_to=upload_to_paciente, null=True, blank=True)
    tarea_celery_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Nuevo: Historial de análisis (línea de tiempo)
    historial_analisis = models.JSONField(null=True, blank=True, help_text="Línea de tiempo con todos los análisis realizados: [{timestamp, tipo, resultados, quien}]")

    class Meta:
        verbose_name = "Imagen Clínica"
        verbose_name_plural = "Imágenes Clínicas"
>>>>>>> Stashed changes


class Dentist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    specialty = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    cellphone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    cellphone = models.CharField(max_length=20, blank=True, null=True)
    tutor = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Resource(models.Model):
    RESOURCE_CHAIR = 'chair'
    RESOURCE_DOCTOR = 'doctor'
    RESOURCE_STUDENT = 'student'

    RESOURCE_TYPES = [
        (RESOURCE_CHAIR, 'Gabinete'),
        (RESOURCE_DOCTOR, 'Doctor'),
        (RESOURCE_STUDENT, 'Student'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    chair = models.ForeignKey('DentalChair', on_delete=models.CASCADE, null=True, blank=True, related_name='resources')
    dentist = models.ForeignKey('Dentist', on_delete=models.CASCADE, null=True, blank=True, related_name='resources')
    student = models.ForeignKey('Student', on_delete=models.CASCADE, null=True, blank=True, related_name='resources')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resources'
        ordering = ['resource_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_resource_type_display()})"


class Patient(Paciente):
    class Meta:
        proxy = True
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'


class Doctor(Dentist):
    class Meta:
        proxy = True
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'


class Appointment(models.Model):
    STATUS_SCHEDULED = 'scheduled'
    STATUS_WAITING = 'waiting'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_NO_SHOW = 'no_show'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_WAITING, 'Waiting'),
        (STATUS_IN_PROGRESS, 'In progress'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_NO_SHOW, 'No show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='appointments')
    dentist = models.ForeignKey(Dentist, on_delete=models.CASCADE, related_name='appointments')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    chair = models.ForeignKey(DentalChair, on_delete=models.CASCADE, related_name='appointments')
    gabinete = models.ForeignKey(Gabinete, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)

    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    procedure = models.CharField(max_length=250, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    time_range = TimeRangeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    check_in_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # constraints will be added later if needed
        pass

    def __str__(self):
        return f"{self.patient} - {self.appointment_date} {self.start_time.strftime('%H:%M')}"

    def _build_time_range(self):
        local_zone = ZoneInfo(settings.TIME_ZONE)
        start_dt = datetime.combine(self.appointment_date, self.start_time)
        end_dt = datetime.combine(self.appointment_date, self.end_time)

        aware_start = timezone.make_aware(start_dt, local_zone)
        aware_end = timezone.make_aware(end_dt, local_zone)
        if aware_start.tzinfo != timezone.utc:
            aware_start = aware_start.astimezone(timezone.utc)
        if aware_end.tzinfo != timezone.utc:
            aware_end = aware_end.astimezone(timezone.utc)

        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
            return (aware_start, aware_end)
        return {'start': aware_start, 'end': aware_end}

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_time <= self.start_time:
            raise ValidationError({'end_time': 'El fin de cita debe ser posterior al inicio'})

        self.time_range = self._build_time_range()
        overlap_statuses = [self.STATUS_SCHEDULED, self.STATUS_WAITING, self.STATUS_IN_PROGRESS, self.STATUS_CONFIRMED]

        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
            resource_filter = Q(chair=self.chair) | Q(dentist=self.dentist)
            if self.student:
                resource_filter |= Q(student=self.student)
            overlap_filter = (
                Q(time_range__overlap=self.time_range)
                & Q(status__in=overlap_statuses)
                & resource_filter
            )
        else:
            resource_filter = Q(chair=self.chair) | Q(dentist=self.dentist)
            if self.student:
                resource_filter |= Q(student=self.student)
            overlap_filter = (
                Q(appointment_date=self.appointment_date)
                & Q(start_time__lt=self.end_time)
                & Q(end_time__gt=self.start_time)
                & Q(status__in=overlap_statuses)
                & resource_filter
            )

        conflicts = Appointment.objects.filter(overlap_filter).exclude(pk=self.pk)
        if conflicts.exists():
            raise ValidationError('La cita se superpone con otra para el mismo recurso')

<<<<<<< Updated upstream
    def save(self, *args, **kwargs):
        self.time_range = self._build_time_range()
        self.clean()
=======
# Importar modelos adicionales modulares
try:
    from . import autorizacion  # noqa: F401
except Exception:
    pass


class SolicitudSupervision(models.Model):
    """
    Solicitudes de supervisión para hitos específicos: Diagnóstico, Inicio, Cierre
    La firma del docente queda registrada en docente_supervisor + timestamp en fecha_aprobacion
    """
    TIPOS_HITO = [
        ('DIAGNOSTICO', 'Diagnóstico'),
        ('INICIO', 'Inicio del Procedimiento'),
        ('CIERRE', 'Cierre del Procedimiento'),
    ]
>>>>>>> Stashed changes

        previous_status = None
        if self.pk:
            try:
                previous_status = Appointment.objects.get(pk=self.pk).status
            except Appointment.DoesNotExist:
                previous_status = None

        super().save(*args, **kwargs)

        if previous_status != self.STATUS_NO_SHOW and self.status == self.STATUS_NO_SHOW:
            p = self.patient
            p.no_show_count = (p.no_show_count or 0) + 1
            if p.no_show_count >= 3:
                p.no_show_status = 'flagged'
            elif p.no_show_count >= 2:
                p.no_show_status = 'warning'
            else:
                p.no_show_status = 'none'
            p.save()

        if self.status in [self.STATUS_COMPLETED, self.STATUS_CANCELLED, self.STATUS_CONFIRMED, self.STATUS_SCHEDULED, self.STATUS_WAITING, self.STATUS_IN_PROGRESS]:
            p = self.patient
            if p.no_show_count >= 3:
                p.no_show_status = 'flagged'
                p.save()
            elif p.no_show_count >= 2:
                p.no_show_status = 'warning'
                p.save()

    @property
<<<<<<< Updated upstream
    def start_datetime(self):
        if self.time_range:
            if isinstance(self.time_range, dict):
                return self.time_range.get('start')
            return self.time_range.lower
        return timezone.make_aware(datetime.combine(self.appointment_date, self.start_time), ZoneInfo(settings.TIME_ZONE)).astimezone(timezone.utc)

    @property
    def end_datetime(self):
        if self.time_range:
            if isinstance(self.time_range, dict):
                return self.time_range.get('end')
            return self.time_range.upper
        return timezone.make_aware(datetime.combine(self.appointment_date, self.end_time), ZoneInfo(settings.TIME_ZONE)).astimezone(timezone.utc)

    @property
    def resource_ids(self):
        ids = [str(self.chair_id), str(self.dentist_id)]
        if self.student_id:
            ids.append(str(self.student_id))
        return ids

    @property
    def minutes_waiting(self):
        if not self.check_in_time:
            return 0
        delta = timezone.now() - self.check_in_time
        return int(delta.total_seconds() // 60)


class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    semester = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.semester})"


class AcademicGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='groups')
    group_name = models.CharField(max_length=100)
    teacher = models.ForeignKey(Dentist, on_delete=models.SET_NULL, null=True, blank=True, related_name='academic_groups')
    semester = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('subject', 'group_name', 'semester')

    def __str__(self):
        return f"{self.group_name} - {self.subject.name} ({self.semester})"


class StudentGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_groups')
    group = models.ForeignKey(AcademicGroup, on_delete=models.CASCADE, related_name='student_groups')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'group')

    def __str__(self):
        return f"{self.student} in {self.group}"


class PatientAssignment(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignments')
    supervising_teacher = models.ForeignKey(Dentist, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_assignments')
    treatment_area = models.CharField(max_length=150)
    assigned_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.status == self.STATUS_ACTIVE:
            conflict = PatientAssignment.objects.filter(
                patient=self.patient,
                treatment_area__iexact=self.treatment_area,
                status=self.STATUS_ACTIVE,
            ).exclude(pk=self.pk).exists()
            if conflict:
                raise ValidationError('El paciente ya tiene una asignación activa para esta área de tratamiento.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient} -> {self.student} ({self.treatment_area}) [{self.status}]"


class TeacherApproval(models.Model):
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_PENDING = 'pending'

    STATUS_CHOICES = [
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_PENDING, 'Pending'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(PatientAssignment, on_delete=models.CASCADE, related_name='approvals')
    teacher = models.ForeignKey(Dentist, on_delete=models.SET_NULL, null=True, blank=True, related_name='approvals')
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approval_date = models.DateTimeField(blank=True, null=True)
    digital_signature = models.TextField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from django.utils import timezone

        if self.approval_status in [self.STATUS_APPROVED, self.STATUS_REJECTED] and not self.approval_date:
            self.approval_date = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Approval {self.assignment} by {self.teacher} -> {self.approval_status}"


# Agregar campos de no-show al paciente (conservamos histórico)
Paciente.add_to_class('no_show_count', models.PositiveSmallIntegerField(default=0))
Paciente.add_to_class('no_show_status', models.CharField(max_length=20, default='none', choices=[('none', 'None'), ('warning', 'Warning'), ('flagged', 'Flagged')]))
=======
"""
Modelos de la aplicación gestion_clinica.

NOTA: Esta aplicación ha sido refactorizada a una estructura modular.
Los modelos están organizados en la carpeta models/ con módulos específicos:

- models/base.py: Clases abstractas y base
- models/usuario.py: Usuario personalizado
- models/paciente.py: Paciente y antecedentes
- models/examen.py: Exámenes clínicos
- models/prostodoncia.py: Prótesis dentales
- models/cirugia.py: Procedimientos quirúrgicos
- models/tratamiento.py: Tratamientos y avances
- models/cita.py: Citas y agenda
- models/radiografia.py: Imágenes y periodontogramas
- models/mantenimiento.py: Equipos
- models/formacion.py: Supervisión y evaluación (Módulo 6)

Para mantener compatibilidad hacia atrás, todos los modelos se importan aquí.
Django sigue viendo estos modelos como si estuvieran en models.py
"""

# Importar todos los modelos de los submódulos
# Esto mantiene la compatibilidad con el resto del proyecto
from .models import *  # noqa: F401, F403
>>>>>>> Stashed changes
=======
    def promedio_criterios(self):
        """Calcula el promedio de todos los criterios"""
        criterios = [
            self.manejo_tecnica,
            self.bioseguridad,
            self.comunicacion_paciente,
            self.cumplimiento_tiempo,
            self.documentacion
        ]
        return sum(criterios) / len(criterios)
    
    
class AsignacionPaciente(models.Model):
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='asignaciones')
    
    # CAMBIAMOS EL RELATED_NAME AQUÍ:
    estudiante = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='asignaciones_registro' # <-- Nombre único
    )
    
    docente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='supervisiones_casos'
    )
    from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class AutorizacionCargaImage(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('USADO', 'Usado'),
        ('EXPIRADO', 'Expirado'),
        ('RESOLICITUD', 'Re-solicitud'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='autorizaciones_recibidas')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='autorizaciones_emitidas')
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='autorizaciones_imagen')

    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    expiracion = models.DateTimeField(blank=True, null=True)
    fecha_intento_envio = models.DateTimeField(blank=True, null=True)
    
    # Nuevo: Registrar cuántos minutos tiene para enviar la radiografía
    tiempo_permitido_minutos = models.IntegerField(null=True, blank=True, help_text="Minutos que el docente dio para enviar la radiografía")

    motivo = models.TextField(blank=True, null=True)
    mensaje_rechazo = models.TextField(blank=True, null=True)
    razon_no_envio = models.TextField(blank=True, null=True)
    solicitud_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolicitudes')

    class Meta:
        db_table = 'autorizacion_carga_image'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Autorizacion {self.estudiante} -> {self.paciente} [{self.estado}]"

    def is_valid(self):
        if self.estado != 'APROBADO':
            return False
        if self.expiracion and timezone.now() > self.expiracion:
            return False
        return True
    
    def get_tiempo_restante(self):
        """Retorna los minutos restantes para enviar la radiografía, o None si expiró"""
        if not self.expiracion or self.estado != 'APROBADO':
            return None
        ahora = timezone.now()
        if ahora > self.expiracion:
            return None
        delta = self.expiracion - ahora
        minutos = delta.total_seconds() / 60
        return max(0, int(minutos))


class HistorialAuditoriaImagen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    accion = models.CharField(max_length=100)
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='auditoria_estudiante')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='auditoria_docente')
    paciente = models.ForeignKey('Paciente', on_delete=models.SET_NULL, null=True, related_name='auditoria_paciente')
    timestamp = models.DateTimeField(auto_now_add=True)
    detalles = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = 'historial_auditoria_imagen'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.accion} - {self.estudiante} / {self.paciente} @ {self.timestamp}"
>>>>>>> Stashed changes
