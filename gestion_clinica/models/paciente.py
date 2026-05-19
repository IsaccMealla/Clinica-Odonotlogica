"""
Modelos de Paciente y sus antecedentes clínicos.
Incluye: Paciente, Antecedentes Familiares, Personales, No Patológicos,
Ginecológicos, Hábitos, Antecedentes Periodontales, Historia Clínica
e Historia Odontopediátrica.
"""
import uuid
from datetime import date

from django.conf import settings
from django.db import models

from .base import SeguimientoAcademico


class Paciente(models.Model):
    """
    Modelo principal de Paciente con todos sus datos personales y de salud.
    Punto central del sistema - todos los registros clínicos se vinculan a este.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # --- ASIGNACIÓN DE CLÍNICA ---
    estudiante_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='pacientes_asignados',
        limit_choices_to={'rol': 'ESTUDIANTE'},
        null=True,
        blank=True
    )

    # --- DATOS PERSONALES ---
    ci = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Cédula de Identidad"
    )
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)

    sexo = models.CharField(max_length=20)
    fecha_nacimiento = models.DateField()
    lugar_nacimiento = models.CharField(max_length=150, blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    ocupacion = models.CharField(max_length=150, blank=True, null=True)

    # --- CONTACTO ---
    direccion = models.TextField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    contacto_emergencia = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Comunicarse con (Emergencia)"
    )
    telefono_emergencia = models.CharField(max_length=20, blank=True, null=True)

    # --- HISTORIAL CLÍNICO ---
    fecha_ultima_consulta = models.DateField(blank=True, null=True)
    motivo_ultima_consulta = models.TextField(blank=True, null=True)

    inasistencias = models.IntegerField(
        default=0,
        help_text="Número de citas no asistidas"
    )
    alerta_abandono = models.BooleanField(
        default=False,
        help_text="Indica si el paciente está en alerta por abandono"
    )

    # --- CONTROL ---
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
        """Calcula la edad actual del paciente"""
        if self.fecha_nacimiento:
            hoy = date.today()
            return hoy.year - self.fecha_nacimiento.year - (
                (hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
            )
        return None


# ==========================================
# ANTECEDENTES (OneToOneField - Únicos por paciente)
# ==========================================

class AntecedentePatologicoFamiliar(SeguimientoAcademico):
    """Historial de enfermedades familiares del paciente"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='antecedentes_familiares'
    )

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
    """Historial de enfermedades personales del paciente"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='antecedentes_personales'
    )

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
    """Antecedentes no patológicos (hábitos y conductas) del paciente"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='antecedentes_no_patologicos'
    )

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
    """Antecedentes ginecológicos (solo para pacientes femeninos)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='antecedentes_ginecologicos'
    )

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
    """Hábitos del paciente (higiene, fumar, beber, etc.)"""
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='habitos'
    )

    tecnica_cepillado = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Técnica de cepillado"
    )
    elementos_higiene = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Ej: enjuagues, hilo dental, palillo dental, otros"
    )
    onicofagia = models.BooleanField(
        default=False,
        verbose_name="Onicofagia (Muerde uñas)"
    )
    interposicion_lingual = models.BooleanField(default=False)
    bruxismo = models.BooleanField(default=False)
    bruxomania = models.BooleanField(default=False)
    succiona_citricos = models.BooleanField(default=False)
    respirador_bucal = models.BooleanField(default=False)
    fuma = models.BooleanField(default=False)
    bebe = models.BooleanField(default=False, verbose_name="Bebe alcohol")
    interposicion_objetos = models.BooleanField(default=False)
    otros_habitos = models.TextField(
        blank=True,
        null=True,
        verbose_name="Otros hábitos"
    )

    def __str__(self):
        return f"Hábitos de {self.paciente}"

    class Meta:
        verbose_name = "Hábito"
        verbose_name_plural = "Hábitos"


class AntecedentesPeriodontales(SeguimientoAcademico):
    """Antecedentes periodontales del paciente"""
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='antecedentes_periodontales'
    )

    sangrado_espontaneo = models.BooleanField(
        default=False,
        verbose_name="Sangrado Espontáneo"
    )
    sangrado_provocado = models.BooleanField(
        default=False,
        verbose_name="Sangrado Provocado"
    )
    movilidad = models.BooleanField(
        default=False,
        verbose_name="Movilidad Dental"
    )
    se_han_separado = models.BooleanField(
        default=False,
        verbose_name="¿Se han separado los dientes?"
    )
    se_han_elongado = models.BooleanField(
        default=False,
        verbose_name="¿Se han elongado los dientes?"
    )
    halitosis = models.BooleanField(
        default=False,
        verbose_name="Halitosis (Mal aliento)"
    )

    def __str__(self):
        return f"Antecedentes Periodontales de {self.paciente}"

    class Meta:
        verbose_name = "Antecedente Periodontal"
        verbose_name_plural = "Antecedentes Periodontales"


class HistoriaClinica(models.Model):
    """Registros clínicos generales del paciente (ej: acta de abandono)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='historias_clinicas'
    )
    titulo = models.CharField(
        max_length=255,
        default='Acta de abandono',
        help_text='Título del registro clínico'
    )
    descripcion = models.TextField(blank=True, null=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='historias_clinicas_creadas'
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Historia Clínica'
        verbose_name_plural = 'Historias Clínicas'

    def __str__(self):
        return f"Historia Clínica - {self.paciente}"


class HistoriaOdontopediatrica(SeguimientoAcademico):
    """Historia odontopediátrica completa para pacientes pediátricos"""
    paciente = models.OneToOneField(
        Paciente,
        on_delete=models.CASCADE,
        related_name='historia_odontopediatrica'
    )

    # --- FAMILIA Y HOGAR ---
    apodo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="¿Cómo llaman al niño en casa?"
    )
    hobbie = models.CharField(max_length=200, blank=True, null=True)
    nombre_padres = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nombre de padre o madre"
    )
    telefono_padres = models.CharField(max_length=50, blank=True, null=True)
    nombre_representante = models.CharField(max_length=255, blank=True, null=True)
    telefono_representante = models.CharField(max_length=50, blank=True, null=True)

    # --- NACIMIENTO Y DESARROLLO ---
    duracion_parto = models.CharField(max_length=100, blank=True, null=True)
    edad_madre_embarazo = models.CharField(max_length=50, blank=True, null=True)
    numero_embarazo = models.IntegerField(blank=True, null=True)
    embarazo_controlado = models.BooleanField(default=False)
    antecedentes_embarazo = models.TextField(blank=True, null=True)
    parto_normal = models.BooleanField(default=False)
    cesarea = models.BooleanField(default=False)
    observaciones_nacimiento = models.TextField(blank=True, null=True)
    tratamiento_medico_actual = models.TextField(blank=True, null=True)

    # --- HITOS DEL DESARROLLO ---
    edad_sento = models.CharField(max_length=50, blank=True, null=True)
    edad_gateo = models.CharField(max_length=50, blank=True, null=True)
    edad_paro = models.CharField(max_length=50, blank=True, null=True)
    edad_camino = models.CharField(max_length=50, blank=True, null=True)
    edad_primer_diente = models.CharField(max_length=50, blank=True, null=True)
    edad_primera_palabra = models.CharField(max_length=50, blank=True, null=True)
    evolucion_escolar = models.CharField(max_length=255, blank=True, null=True)
    vacunas = models.CharField(max_length=255, blank=True, null=True)

    # --- HÁBITOS DEL NIÑO ---
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
    queilofagia = models.BooleanField(
        default=False,
        verbose_name="Queilofagia (Muerde labios)"
    )
    queilofagia_obs = models.CharField(max_length=255, blank=True, null=True)
    geofagia = models.BooleanField(
        default=False,
        verbose_name="Geofagia (Come tierra)"
    )
    geofagia_obs = models.CharField(max_length=255, blank=True, null=True)
    golosinas = models.BooleanField(default=False)
    golosinas_obs = models.CharField(max_length=255, blank=True, null=True)
    otros_habitos_inf = models.BooleanField(default=False)
    otros_habitos_inf_obs = models.CharField(max_length=255, blank=True, null=True)

    # --- HIGIENE BUCAL ---
    veces_cepilla_dia = models.CharField(max_length=50, blank=True, null=True)
    cuando_cepilla = models.CharField(max_length=100, blank=True, null=True)
    usa_enjuague = models.BooleanField(default=False)
    usa_hilo = models.BooleanField(default=False)
    tipo_higiene = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Solo, asistido, etc."
    )
    pasta_y_cepillo = models.CharField(max_length=255, blank=True, null=True)
    atencion_previa = models.BooleanField(default=False)
    cuando_donde_atencion = models.CharField(max_length=255, blank=True, null=True)
    experiencia_positiva = models.BooleanField(
        default=True,
        verbose_name="¿Experiencia positiva?"
    )
    por_que_experiencia = models.TextField(blank=True, null=True)

    # --- ALIMENTACIÓN Y LACTANCIA ---
    lactancia_materna = models.BooleanField(default=False)
    edad_lactancia_materna = models.CharField(max_length=50, blank=True, null=True)
    lactancia_artificial = models.BooleanField(default=False)
    edad_lactancia_artificial = models.CharField(max_length=50, blank=True, null=True)
    lactancia_mixta = models.BooleanField(default=False)
    edad_lactancia_mixta = models.CharField(max_length=50, blank=True, null=True)
    obs_alimentacion = models.TextField(blank=True, null=True)

    # --- EXAMEN FÍSICO ---
    peso = models.CharField(max_length=50, blank=True, null=True)
    talla = models.CharField(max_length=50, blank=True, null=True)
    temperatura = models.CharField(max_length=50, blank=True, null=True)
    presion_arterial = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_respiratoria = models.CharField(max_length=50, blank=True, null=True)
    frecuencia_cardiaca = models.CharField(max_length=50, blank=True, null=True)
    tipo_denticion = models.CharField(max_length=100, blank=True, null=True)

    # --- EXAMEN OCLUSAL ---
    competencia_labial = models.CharField(max_length=100, blank=True, null=True)
    tipo_perfil = models.CharField(max_length=100, blank=True, null=True)
    linea_media = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_baume = models.CharField(max_length=100, blank=True, null=True)
    tipo_arco_baume = models.CharField(max_length=100, blank=True, null=True)
    relacion_molar_angle = models.CharField(max_length=100, blank=True, null=True)
    relacion_canina = models.CharField(max_length=100, blank=True, null=True)

    # --- MALOCLUSIONES ---
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

    # --- PSICOLOGÍA ---
    tipo_escobar = models.CharField(max_length=100, blank=True, null=True)
    rasgo_timido = models.BooleanField(default=False)
    rasgo_agresivo = models.BooleanField(default=False)
    rasgo_mimado = models.BooleanField(default=False)
    rasgo_miedoso = models.BooleanField(default=False)
    rasgo_desafiante = models.BooleanField(default=False)
    rasgo_lloroso = models.BooleanField(default=False)

    # --- PADRES ---
    padres_cooperador = models.BooleanField(default=False)
    padres_despreocupado = models.BooleanField(default=False)
    padres_sobreprotector = models.BooleanField(default=False)
    padres_reganon = models.BooleanField(default=False)
    padres_debil = models.BooleanField(default=False)
    obs_conductual = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Historia Odontopediátrica de {self.paciente}"

    class Meta:
        verbose_name = "Historia Odontopediátrica"
        verbose_name_plural = "Historias Odontopediátricas"
