import uuid
from datetime import date, timedelta

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import os
from django.contrib.auth.models import AbstractUser

# ==========================================
# MODELO DE USUARIO PERSONALIZADO
# ==========================================
class CustomUser(AbstractUser):
    ROLES = [
        ('ADMIN', 'Administrador'),
        ('DOCENTE', 'Docente / Odontólogo'),
        ('RECEPCIONISTA', 'Recepcionista'),
        ('ESTUDIANTE', 'Estudiante'),
    ]
    rol = models.CharField(max_length=20, choices=ROLES, default='ESTUDIANTE')

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"
# ==========================================
# 0. CLASE ABSTRACTA DE AUDITORÍA ACADÉMICA
# ==========================================
class SeguimientoAcademico(models.Model):
    """
    Plantilla base para cualquier registro que requiera nota o firma del docente.
    """
    ESTADOS_APROBACION = [
        ('BORRADOR', 'Borrador (Editando)'),
        ('REVISION', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado por Docente'),
        ('RECHAZADO', 'Rechazado / Con Observaciones'),
    ]

    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name="%(class)s_creados")
    docente_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name="%(class)s_supervisados", 
        limit_choices_to={'rol': 'DOCENTE'}
    )
    
    estado_academico = models.CharField(max_length=20, choices=ESTADOS_APROBACION, default='BORRADOR')
    comentarios_docente = models.TextField(blank=True, null=True, help_text="Observaciones si rechaza el trabajo")
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        abstract = True


# ==========================================
# 1. PACIENTE
# ==========================================
class Paciente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # --- ASIGNACIÓN DE CLÍNICA ---
    estudiante_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.RESTRICT, 
        related_name='pacientes_asignados',
        limit_choices_to={'rol': 'ESTUDIANTE'},
        null=True, blank=True
    )

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
    celular = models.CharField(max_length=20, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    
    contacto_emergencia = models.CharField(max_length=150, blank=True, null=True, verbose_name="Comunicarse con (Emergencia)")
    telefono_emergencia = models.CharField(max_length=20, blank=True, null=True)
    
    fecha_ultima_consulta = models.DateField(blank=True, null=True)
    motivo_ultima_consulta = models.TextField(blank=True, null=True)

    inasistencias = models.IntegerField(default=0, help_text="Número de citas no asistidas")
    alerta_abandono = models.BooleanField(default=False, help_text="Indica si el paciente está en alerta por abandono")

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    activo = models.BooleanField(default=True)
    
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


# ==========================================
# 2. ANTECEDENTES (OneToOneField - Únicos por paciente)
# ==========================================
class AntecedentePatologicoFamiliar(SeguimientoAcademico):
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

class AntecedentePatologicoPersonal(SeguimientoAcademico):
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

class AntecedenteNoPatologicoPersonal(SeguimientoAcademico):
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

class AntecedenteGinecologico(SeguimientoAcademico):
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

class Habitos(SeguimientoAcademico):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='habitos')
    
    tecnica_cepillado = models.CharField(max_length=255, blank=True, null=True, verbose_name="Técnica de cepillado")
    elementos_higiene = models.CharField(max_length=255, blank=True, null=True, help_text="Ej: enjuagues, hilo dental, palillo dental, otros")
    onicofagia = models.BooleanField(default=False, verbose_name="Onicofagia (Muerde uñas)")
    interposicion_lingual = models.BooleanField(default=False)
    bruxismo = models.BooleanField(default=False)
    bruxomania = models.BooleanField(default=False)
    succiona_citricos = models.BooleanField(default=False)
    respirador_bucal = models.BooleanField(default=False)
    fuma = models.BooleanField(default=False)
    bebe = models.BooleanField(default=False, verbose_name="Bebe alcohol")
    interposicion_objetos = models.BooleanField(default=False)
    otros_habitos = models.TextField(blank=True, null=True, verbose_name="Otros hábitos")

    def __str__(self):
        return f"Hábitos de {self.paciente}"

    class Meta:
        verbose_name = "Hábito"
        verbose_name_plural = "Hábitos"

class AntecedentesPeriodontales(SeguimientoAcademico):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='antecedentes_periodontales')
    
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

class HistoriaClinica(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='historias_clinicas')
    titulo = models.CharField(max_length=255, default='Acta de abandono', help_text='Título del registro clínico')
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='historias_clinicas_creadas')
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Historia Clínica'
        verbose_name_plural = 'Historias Clínicas'

    def __str__(self):
        return f"Historia Clínica - {self.paciente}"

class HistoriaOdontopediatrica(SeguimientoAcademico):
    paciente = models.OneToOneField('Paciente', on_delete=models.CASCADE, related_name='historia_odontopediatrica')

    apodo = models.CharField(max_length=100, blank=True, null=True, verbose_name="¿Cómo llaman al niño en casa?")
    hobbie = models.CharField(max_length=200, blank=True, null=True)
    nombre_padres = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nombre de padre o madre")
    telefono_padres = models.CharField(max_length=50, blank=True, null=True)
    nombre_representante = models.CharField(max_length=255, blank=True, null=True)
    telefono_representante = models.CharField(max_length=50, blank=True, null=True)

    duracion_parto = models.CharField(max_length=100, blank=True, null=True)
    edad_madre_embarazo = models.CharField(max_length=50, blank=True, null=True)
    numero_embarazo = models.IntegerField(blank=True, null=True)
    embarazo_controlado = models.BooleanField(default=False)
    antecedentes_embarazo = models.TextField(blank=True, null=True)
    parto_normal = models.BooleanField(default=False)
    cesarea = models.BooleanField(default=False)
    observaciones_nacimiento = models.TextField(blank=True, null=True)
    tratamiento_medico_actual = models.TextField(blank=True, null=True)

    edad_sento = models.CharField(max_length=50, blank=True, null=True)
    edad_gateo = models.CharField(max_length=50, blank=True, null=True)
    edad_paro = models.CharField(max_length=50, blank=True, null=True)
    edad_camino = models.CharField(max_length=50, blank=True, null=True)
    edad_primer_diente = models.CharField(max_length=50, blank=True, null=True)
    edad_primera_palabra = models.CharField(max_length=50, blank=True, null=True)
    evolucion_escolar = models.CharField(max_length=255, blank=True, null=True)
    vacunas = models.CharField(max_length=255, blank=True, null=True)

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

    lactancia_materna = models.BooleanField(default=False)
    edad_lactancia_materna = models.CharField(max_length=50, blank=True, null=True)
    lactancia_artificial = models.BooleanField(default=False)
    edad_lactancia_artificial = models.CharField(max_length=50, blank=True, null=True)
    lactancia_mixta = models.BooleanField(default=False)
    edad_lactancia_mixta = models.CharField(max_length=50, blank=True, null=True)
    obs_alimentacion = models.TextField(blank=True, null=True)

    peso = models.CharField(max_length=50, blank=True, null=True)
    talla = models.CharField(max_length=50, blank=True, null=True)
    temperatura = models.CharField(max_length=50, blank=True, null=True)
    presion_arterial = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_respiratoria = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_cardiaca = models.CharField(max_length=50, blank=True, null=True)
    tipo_denticion = models.CharField(max_length=100, blank=True, null=True)

    competencia_labial = models.CharField(max_length=100, blank=True, null=True)
    tipo_perfil = models.CharField(max_length=100, blank=True, null=True)
    linea_media = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_baume = models.CharField(max_length=100, blank=True, null=True)
    tipo_arco_baume = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_angle = models.CharField(max_length=100, blank=True, null=True)
    relacion_canina = models.CharField(max_length=100, blank=True, null=True)
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

    tipo_escobar = models.CharField(max_length=100, blank=True, null=True)
    rasgo_timido = models.BooleanField(default=False)
    rasgo_agresivo = models.BooleanField(default=False)
    rasgo_mimado = models.BooleanField(default=False)
    rasgo_miedoso = models.BooleanField(default=False)
    rasgo_desafiante = models.BooleanField(default=False)
    rasgo_lloroso = models.BooleanField(default=False)
    padres_cooperador = models.BooleanField(default=False)
    padres_despreocupado = models.BooleanField(default=False)
    padres_sobreprotector = models.BooleanField(default=False)
    padres_reganon = models.BooleanField(default=False)
    padres_debil = models.BooleanField(default=False)
    obs_conductual = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Historia Odontopediátrica de {self.paciente}"


# ==========================================
# 3. EXÁMENES Y TRATAMIENTOS (ForeignKey - Pueden ser múltiples)
# ==========================================
class ExamenClinicoFisico(SeguimientoAcademico):
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='examenes_clinicos_fisicos')

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

    craneo = models.CharField(max_length=100, blank=True, null=True)
    cara_simetria = models.BooleanField(default=True, verbose_name="Simetría facial")
    perfil = models.CharField(max_length=100, blank=True, null=True)
    ojos = models.CharField(max_length=255, blank=True, null=True)
    nariz = models.CharField(max_length=255, blank=True, null=True)
    oidos = models.CharField(max_length=255, blank=True, null=True)
    cuello = models.CharField(max_length=255, blank=True, null=True)
    ganglios_linfaticos = models.CharField(max_length=255, blank=True, null=True)

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
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='examenes_periodontales')
    
    caracteristica_encia = models.CharField(max_length=255, blank=True, null=True, verbose_name="Característica de la encía")
    color = models.CharField(max_length=100, blank=True, null=True)
    textura = models.CharField(max_length=100, blank=True, null=True)
    consistencia = models.CharField(max_length=100, blank=True, null=True)

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
        ('EN_PROGRESO', 'En Progreso'),
        ('FINALIZADO', 'Finalizado con Éxito'),
        ('DERIVADO', 'Derivado a otro estudiante'),
        ('ABANDONADO', 'Abandonado por el paciente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='tratamientos')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='tratamientos_realizados')
    
    nombre_tratamiento = models.CharField(max_length=200, help_text="Ej: Profilaxis, Exodoncia de 3er Molar")
    diente_pieza = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: 14, 46, Toda la boca")
    estado = models.CharField(max_length=20, choices=ESTADOS_TRATAMIENTO, default='EN_PROGRESO')
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre_tratamiento} - {self.paciente}"

    class Meta:
        verbose_name = "Tratamiento"
        verbose_name_plural = "Tratamientos"

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
    motivo = models.ForeignKey('Tratamiento', on_delete=models.CASCADE, related_name='citas')
    
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
    
    descripcion = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auditoria_citas'
        ordering = ['-creado_en']

    def __str__(self):
        return f"Auditoría {self.tipo_cambio} - Cita {self.cita.id}"


# ==========================================
# HISTÓRICO DE ABANDONO DE PACIENTES
# ==========================================
class HistoricoAbandonoPaciente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='historico_abandonos')
    
    # Información del abandono
    fecha_abandono = models.DateTimeField(auto_now_add=True)
    inasistencias_totales = models.IntegerField(help_text="Número de inasistencias que provocaron el abandono")
    
    # Notas
    nota_coordinacion = models.TextField(blank=True, null=True, help_text="Observaciones de coordinación")
    usuario_que_registro = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='abandonos_registrados')
    
    # Reinicio
    reactivado = models.BooleanField(default=False)
    fecha_reactivacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'historico_abandono_pacientes'
        ordering = ['-fecha_abandono']

    def __str__(self):
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

    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE, related_name='imagenes')
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    archivo = models.ImageField(upload_to=upload_to_paciente)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    pieza_dental = models.IntegerField(null=True, blank=True) # Para radiografías o intraorales
    descripcion = models.TextField(blank=True)
    fecha_adquisicion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Imagen Clínica"
        verbose_name_plural = "Imágenes Clínicas"