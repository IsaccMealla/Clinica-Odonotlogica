import uuid
from django.db import models
from datetime import date
from django.conf import settings
from django.utils import timezone


class RolePermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
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


class DentalChair(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=30, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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


class Appointment(models.Model):
    STATUS_SCHEDULED = 'scheduled'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_NO_SHOW = 'no_show'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
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

    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    check_in_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.appointment_date} {self.start_time.strftime('%H:%M')}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_time <= self.start_time:
            raise ValidationError({'end_time': 'El fin de cita debe ser posterior al inicio'})

        overlap_filter = (
            models.Q(appointment_date=self.appointment_date)
            & models.Q(start_time__lt=self.end_time)
            & models.Q(end_time__gt=self.start_time)
            & models.Q(status__in=[self.STATUS_SCHEDULED, self.STATUS_CONFIRMED])
            & (models.Q(chair=self.chair) | models.Q(dentist=self.dentist))
        )

        conflicts = Appointment.objects.filter(overlap_filter).exclude(pk=self.pk)
        if conflicts.exists():
            raise ValidationError('La cita se superpone con otra para el mismo sillón o dentista')

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        # Verificar superposición antes de guardar
        self.clean()

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

        if self.status in [self.STATUS_COMPLETED, self.STATUS_CANCELLED, self.STATUS_CONFIRMED, self.STATUS_SCHEDULED]:
            # actualizar estado del paciente si fue corregido manualmente
            p = self.patient
            if p.no_show_count >= 3:
                p.no_show_status = 'flagged'
                p.save()
            elif p.no_show_count >= 2:
                p.no_show_status = 'warning'
                p.save()

    @property
    def minutes_waiting(self):
        if not self.check_in_time:
            return 0
        from django.utils import timezone
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
