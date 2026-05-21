from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Paciente, 
    AntecedentePatologicoFamiliar, 
    AntecedentePatologicoPersonal, 
    AntecedenteNoPatologicoPersonal, 
    AntecedenteGinecologico,
    Habitos,
    AntecedentesPeriodontales,
    ExamenPeriodontal,
    HistoriaOdontopediatrica,
    ProstodonciaRemovible,
    ProstodonciaFija,
    ProtocoloQuirurgico,
    ExamenClinicoFisico,
<<<<<<< Updated upstream
    Gabinete,
    DentalChair,
    Dentist,
    Student,
    Resource,
    Appointment,
    MedicalImage,
    ClinicalAnimation,
    Subject,
    AcademicGroup,
    StudentGroup,
    PatientAssignment,
    TeacherApproval,
    RolePermission,
    AuditLog,
    UserSession,
=======
    Tratamiento, 
    AvanceClinico, 
    Evidencia, 
    Transferencia,
    Sillon,  # <-- NUEVO MODELO IMPORTADO AQUÍ
    Cita , # <-- NUEVO MODELO IMPORTADO AQUÍ
    ImagenClinica,
    Periodontograma,  # <-- PERIODONTOGRAMA IMPORTADO
    ControlAcademico,
    PagoFactura,
    DespachoAlmacen,
    Inventario,
>>>>>>> Stashed changes
)

User = get_user_model()

# 1. Serializers Individuales (Hijos)
# -------------------------------------------------------------------------

class AntecedenteFamiliarSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedentePatologicoFamiliar
        exclude = ('paciente', 'creado_en', 'actualizado_en')

class AntecedentePersonalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedentePatologicoPersonal
        exclude = ('paciente', 'creado_en', 'actualizado_en')

class AntecedenteNoPatologicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedenteNoPatologicoPersonal
        exclude = ('paciente', 'creado_en', 'actualizado_en')

class AntecedenteGinecologicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedenteGinecologico
        exclude = ('paciente', 'creado_en', 'actualizado_en')

# --- NUEVOS SERIALIZADORES ---

class HabitosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habitos
        exclude = ('paciente',)

class AntecedentesPeriodontalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedentesPeriodontales
        exclude = ('paciente',)

class ExamenPeriodontalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenPeriodontal
        exclude = ('paciente',)

class HistoriaOdontopediatricaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriaOdontopediatrica
        exclude = ('paciente',)

class ProstodonciaRemovibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProstodonciaRemovible
        exclude = ('paciente',)

class ProstodonciaFijaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProstodonciaFija
        exclude = ('paciente',)

class ProtocoloQuirurgicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtocoloQuirurgico
        exclude = ('paciente',)

class ExamenClinicoFisicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenClinicoFisico
        exclude = ('paciente',)


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = ['id', 'ci', 'nombres', 'apellido_paterno', 'apellido_materno', 'email', 'celular']


class DentalChairSerializer(serializers.ModelSerializer):
    class Meta:
        model = DentalChair
        fields = '__all__'


class GabineteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gabinete
        fields = '__all__'


class DentistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dentist
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    dentist = DentistSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    chair = DentalChairSerializer(read_only=True)

    patient_id = serializers.PrimaryKeyRelatedField(queryset=Paciente.objects.all(), source='patient', write_only=True)
    dentist_id = serializers.PrimaryKeyRelatedField(queryset=Dentist.objects.all(), source='dentist', write_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source='student', allow_null=True, required=False, write_only=True)
    chair_id = serializers.PrimaryKeyRelatedField(queryset=DentalChair.objects.all(), source='chair', write_only=True)
    gabinete_id = serializers.PrimaryKeyRelatedField(queryset=Gabinete.objects.all(), source='gabinete', allow_null=True, required=False, write_only=True)

    start_datetime = serializers.DateTimeField(required=False, write_only=True)
    end_datetime = serializers.DateTimeField(required=False, write_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'

    def validate(self, attrs):
        start_dt = attrs.pop('start_datetime', None)
        end_dt = attrs.pop('end_datetime', None)

        if start_dt and end_dt:
            attrs['appointment_date'] = start_dt.date()
            attrs['start_time'] = start_dt.time()
            attrs['end_time'] = end_dt.time()

        if 'appointment_date' in attrs and 'start_time' in attrs and 'end_time' in attrs:
            appointment_date = attrs['appointment_date']
            start_time = attrs['start_time']
            end_time = attrs['end_time']
            if end_time <= start_time:
                raise serializers.ValidationError({'end_time': 'El fin de cita debe ser posterior al inicio'})

        return super().validate(attrs)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Estos campos solo existen si se enviaron al crear, no en la instancia guardada
        if hasattr(instance, 'start_datetime'):
            data['start_datetime'] = instance.start_datetime.isoformat()
        if hasattr(instance, 'end_datetime'):
            data['end_datetime'] = instance.end_datetime.isoformat()
        # Construir resource_ids a partir de los campos reales
        resource_ids = []
        if instance.chair_id:
            resource_ids.append(str(instance.chair_id))
        if instance.dentist_id:
            resource_ids.append(str(instance.dentist_id))
        if instance.student_id:
            resource_ids.append(str(instance.student_id))
        data['resource_ids'] = resource_ids
        return data


class MedicalImageSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalImage
        fields = ['id', 'patient', 'file', 'file_url', 'image_type', 'description', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return obj.file.url
        return request.build_absolute_uri(obj.file.url)


class ClinicalAnimationSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = ClinicalAnimation
        fields = ['id', 'title', 'description', 'video_file', 'video_url', 'category', 'created_at']
        read_only_fields = ['created_at']

    def get_video_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return obj.video_file.url
        return request.build_absolute_uri(obj.video_file.url)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class AcademicGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicGroup
        fields = '__all__'


class StudentGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGroup
        fields = '__all__'


class PatientAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAssignment
        fields = '__all__'

    def validate(self, attrs):
        patient = attrs.get('patient')
        treatment_area = attrs.get('treatment_area')
        status = attrs.get('status', PatientAssignment.STATUS_ACTIVE)
        assignment_id = self.instance.id if self.instance else None

        if status == PatientAssignment.STATUS_ACTIVE and patient and treatment_area:
            conflict = PatientAssignment.objects.filter(
                patient=patient,
                treatment_area__iexact=treatment_area,
                status=PatientAssignment.STATUS_ACTIVE,
            )
            if assignment_id:
                conflict = conflict.exclude(pk=assignment_id)
            if conflict.exists():
                raise serializers.ValidationError('El paciente ya tiene una asignación activa para esta área de tratamiento.')

        return attrs


class TeacherApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherApproval
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_active', 'is_staff', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']


class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'module', 'can_view', 'can_create', 'can_edit', 'can_delete']
        read_only_fields = ['id']


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'module', 'record_id', 'timestamp', 'ip_address']


class UserSessionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserSession
        fields = ['id', 'user', 'login_time', 'ip_address', 'status']


# 2. Serializer Principal (Maestro)
# -------------------------------------------------------------------------

class PacienteSerializer(serializers.ModelSerializer):
    # Usamos los related_name definidos en tus modelos
    # read_only=True porque los antecedentes suelen tener su propio flujo de guardado post-registro
    antecedentes_familiares = AntecedenteFamiliarSerializer(read_only=True)
    antecedentes_personales = AntecedentePersonalSerializer(read_only=True)
    antecedentes_no_patologicos = AntecedenteNoPatologicoSerializer(read_only=True)
    antecedentes_ginecologicos = AntecedenteGinecologicoSerializer(read_only=True)
    
    # --- NUEVAS RELACIONES ---
    habitos = HabitosSerializer(read_only=True)
    antecedentes_periodontales = AntecedentesPeriodontalesSerializer(read_only=True)
    examen_periodontal = ExamenPeriodontalSerializer(read_only=True)
    historia_odontopediatrica = HistoriaOdontopediatricaSerializer(read_only=True)
    prostodoncia_removible = ProstodonciaRemovibleSerializer(read_only=True)
    prostodoncia_fija = ProstodonciaFijaSerializer(read_only=True)
    protocolo_quirurgico = ProtocoloQuirurgicoSerializer(read_only=True)
    examen_clinico_fisico = ExamenClinicoFisicoSerializer(read_only=True)
    
    # Campo calculado en el modelo (recuerda tener el método @property edad en tu modelo)
    edad = serializers.ReadOnlyField()
    docente_asignado_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = [
            'id', 'ci', 'nombres', 'apellido_paterno', 'apellido_materno', 
            'sexo', 'fecha_nacimiento', 'lugar_nacimiento', 'estado_civil', 
            'ocupacion', 'direccion', 'email', 'celular', 'telefono', 
            'contacto_emergencia', 'telefono_emergencia', 
            'fecha_ultima_consulta', 'motivo_ultima_consulta', 
            'activo', 'edad',
<<<<<<< Updated upstream
=======
            'estudiante_asignado',
            'docente_asignado',
            'docente_asignado_nombre',
>>>>>>> Stashed changes
            
            # Relaciones anidadas
            'antecedentes_familiares', 
            'antecedentes_personales', 
            'antecedentes_no_patologicos', 
            'antecedentes_ginecologicos',
            'habitos',
            'antecedentes_periodontales',
            'examen_periodontal',
            'historia_odontopediatrica',
            'prostodoncia_removible',
            'prostodoncia_fija',
            'protocolo_quirurgico',
            'examen_clinico_fisico'
        ]

    def get_docente_asignado_nombre(self, obj):
        if obj.docente_asignado:
            first = obj.docente_asignado.first_name or ''
            last = obj.docente_asignado.last_name or ''
            return f"{first} {last}".strip() or obj.docente_asignado.username
        return None

    def to_representation(self, instance):
        """
        Este método ayuda a que si un antecedente no existe (es None), 
        el frontend reciba un objeto vacío o null de forma limpia.
        """
        ret = super().to_representation(instance)
<<<<<<< Updated upstream
        # Opcional: Podrías forzar valores por defecto aquí si fuera necesario
        return ret
=======
        return ret

# ==========================================
# SERIALIZADORES DEL FLUJO CLÍNICO
# ==========================================

class TratamientoSerializer(serializers.ModelSerializer):
    # Agregamos un campo virtual de solo lectura
    paciente_nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Tratamiento
        fields = '__all__' # Esto enviará todos los campos normales + el nuevo campo

    # Esta función le dice a Django cómo llenar 'paciente_nombre_completo'
    def get_paciente_nombre_completo(self, obj):
        # Verificamos que tenga paciente asignado
        if obj.paciente:
            # Une nombre y apellidos, y usa strip() por si algún apellido está vacío
            return f"{obj.paciente.nombres} {obj.paciente.apellido_paterno} {obj.paciente.apellido_materno}".strip()
        return "Desconocido"

class EvidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidencia
        fields = '__all__'

class AvanceClinicoSerializer(serializers.ModelSerializer):
    # Anidamos las evidencias para que al pedir un avance, vengan sus fotos de una vez
    evidencias = EvidenciaSerializer(many=True, read_only=True)

    class Meta:
        model = AvanceClinico
        fields = '__all__'

class TransferenciaSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para ver el nombre de los estudiantes y no solo su ID
    estudiante_origen_nombre = serializers.CharField(source='estudiante_origen.username', read_only=True)
    estudiante_destino_nombre = serializers.CharField(source='estudiante_destino.username', read_only=True)
    
    class Meta:
        model = Transferencia
        fields = '__all__'

# ==========================================
# SERIALIZADORES DE MANTENIMIENTO (SILLONES)
# ==========================================

class SillonSerializer(serializers.ModelSerializer):
    # Creamos un campo virtual llamado 'posicion' para el 3D (Solo lectura)
    posicion = serializers.SerializerMethodField()

    class Meta:
        model = Sillon
        # 🟢 SOLUCIÓN: Agregamos las posiciones individuales a la lista
        fields = [
            'id', 'nombre', 'estado', 'posicion', 
            'posicion_x', 'posicion_y', 'posicion_z',  # <- ¡AQUÍ ESTÁ LA MAGIA!
            'marca', 'modelo', 'numero_serie', 'descripcion', 
            'ultima_revision', 'dias_frecuencia_mantenimiento', 'notas_tecnicas'
        ]
        
        # 🟢 EXTRA: Las ocultamos en las respuestas GET para mantener el JSON limpio
        extra_kwargs = {
            'posicion_x': {'write_only': True},
            'posicion_y': {'write_only': True},
            'posicion_z': {'write_only': True},
        }

    # Esta función empaqueta [x, y, z] para que React Fiber lo lea correctamente
    def get_posicion(self, obj):
        return [obj.posicion_x, obj.posicion_y, obj.posicion_z]

# =========================================================================
# 7. Serializer de Citas
# =========================================================================
class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.__str__', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    docente_nombre = serializers.CharField(source='docente.get_full_name', read_only=True)
    gabinete_nombre = serializers.CharField(source='gabinete.nombre', read_only=True)
    motivo_nombre = serializers.CharField(source='motivo.nombre_tratamiento', read_only=True)
    cancelada_por_nombre = serializers.CharField(source='cancelada_por.get_full_name', read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id', 'paciente', 'paciente_nombre', 'estudiante', 'estudiante_nombre', 
            'docente', 'docente_nombre', 'gabinete', 'gabinete_nombre', 
            'motivo', 'motivo_nombre', 'fecha_hora', 'estado', 'check_in_time', 
            'duracion_estimada', 'cita_recurrente',
            'cancelada_en', 'razon_cancelacion', 'motivo_cancelacion', 'cancelada_por', 'cancelada_por_nombre',
            'creado_en', 'actualizado_en'
        ]


from rest_framework import serializers
from .models import CitaRecurrente, ConfiguracionAlertas, AuditoriaCita, HistoricoAbandonoPaciente


# =========================================================================
# SERIALIZERS PARA CITAS RECURRENTES
# =========================================================================
class CitaRecurrenteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.__str__', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    docente_nombre = serializers.CharField(source='docente.get_full_name', read_only=True)
    gabinete_nombre = serializers.CharField(source='gabinete.nombre', read_only=True)
    motivo_nombre = serializers.CharField(source='motivo.nombre_tratamiento', read_only=True)
    citas_generadas = serializers.SerializerMethodField()

    class Meta:
        model = CitaRecurrente
        fields = [
            'id', 'paciente', 'paciente_nombre', 'estudiante', 'estudiante_nombre',
            'docente', 'docente_nombre', 'gabinete', 'gabinete_nombre',
            'motivo', 'motivo_nombre', 'frecuencia', 'hora', 'dias_semana',
            'duracion_estimada', 'fecha_inicio', 'fecha_fin', 'max_ocurrencias',
            'activa', 'citas_generadas', 'ultima_generacion', 'creado_en'
        ]

    def get_citas_generadas(self, obj):
        return obj.citas.count()


# =========================================================================
# SERIALIZERS PARA CONFIGURACI� N DE ALERTAS
# =========================================================================
class ConfiguracionAlertasSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionAlertas
        fields = [
            'id', 'minutos_espera_alerta', 'inasistencias_alerta_abandono',
            'dias_notificacion_previa', 'activa', 'actualizado_en'
        ]


# =========================================================================
# SERIALIZERS PARA AUDITORÍA DE CITAS
# =========================================================================
class AuditoriaCitaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)

    class Meta:
        model = AuditoriaCita
        fields = [
            'id', 'cita', 'tipo_cambio', 'usuario', 'usuario_nombre',
            'campos_modificados', 'valores_anteriores', 'valores_nuevos',
            'descripcion', 'creado_en'
        ]


# =========================================================================
# SERIALIZERS PARA HISTRICO DE ABANDONO
# =========================================================================
class HistoricoAbandonoPacienteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.__str__', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_que_registro.get_full_name', read_only=True)

    class Meta:
        model = HistoricoAbandonoPaciente
        fields = [
            'id', 'paciente', 'paciente_nombre', 'fecha_abandono',
            'inasistencias_totales', 'nota_coordinacion', 'usuario_que_registro',
            'usuario_nombre', 'reactivado', 'fecha_reactivacion'
        ]

# =========================================================================
# SERIALIZERS RADIOGRAFIAS
# =========================================================================

class ImagenClinicaSerializer(serializers.ModelSerializer):
    paciente = serializers.PrimaryKeyRelatedField(queryset=Paciente.objects.all())
    # Campos calculados
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    historial_analisis = serializers.JSONField(read_only=True)

    class Meta:
        model = ImagenClinica
        fields = [
            'id', 'paciente', 'estudiante', 'estudiante_nombre', 'archivo', 'categoria', 
            'pieza_dental', 'descripcion', 'fecha_adquisicion',
            'estado_procesamiento', 'hallazgos_ia', 'hallazgos_manuales',
            'imagen_anotada', 'tarea_celery_id', 'historial_analisis'
        ]
        read_only_fields = ['id', 'estudiante', 'fecha_adquisicion', 'hallazgos_ia', 'imagen_anotada', 'tarea_celery_id', 'historial_analisis', 'estudiante_nombre']

# =========================================================================
# SERIALIZERS MÓDULO 6: FORMACIÓN Y SUPERVISIÓN
# =========================================================================




class ConfiguracionCupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionCupo
        fields = [
            'id', 'asignatura', 'procedimiento', 'cupo_minimo', 'cupo_maximo',
            'activo', 'creado_en', 'actualizado_en'
        ]


class AsignacionCasoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.__str__', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    porcentaje_avance = serializers.SerializerMethodField()

    class Meta:
        model = AsignacionCaso
        fields = [
            'id', 'paciente', 'paciente_nombre', 'estudiante', 'estudiante_nombre',
            'asignatura', 'procedimiento_principal', 'estado', 'fecha_asignacion',
            'fecha_completacion', 'procedimientos_aprobados', 'porcentaje_avance',
            'fecha_ultima_actualizacion_avance'
        ]

    def get_porcentaje_avance(self, obj):
        return obj.calcular_porcentaje_avance()


class SolicitudSupervisionSerializer(serializers.ModelSerializer):
    asignacion_caso_paciente = serializers.CharField(source='asignacion_caso.paciente.__str__', read_only=True)
    asignacion_caso_estudiante = serializers.CharField(source='asignacion_caso.estudiante.get_full_name', read_only=True)
    docente_nombre = serializers.CharField(source='docente_supervisor.get_full_name', read_only=True)

    class Meta:
        model = SolicitudSupervision
        fields = [
            'id', 'asignacion_caso', 'asignacion_caso_paciente', 'asignacion_caso_estudiante',
            'tipo_hito', 'estado', 'docente_supervisor', 'docente_nombre',
            'descripcion_solicitud', 'observaciones_docente',
            'fecha_solicitud', 'fecha_aprobacion'
        ]


class EvaluacionDesempeñoSerializer(serializers.ModelSerializer):
    solicitud_supervision_hito = serializers.CharField(source='solicitud_supervision.get_tipo_hito_display', read_only=True)
    estudiante_nombre = serializers.CharField(source='solicitud_supervision.asignacion_caso.estudiante.get_full_name', read_only=True)
    promedio_criterios = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionDesempeño
        fields = [
            'id', 'solicitud_supervision', 'solicitud_supervision_hito', 'estudiante_nombre',
            'calificacion', 'alerta_temprana', 'motivo_detalle',
            'manejo_tecnica', 'bioseguridad', 'comunicacion_paciente',
            'cumplimiento_tiempo', 'documentacion', 'promedio_criterios',
            'fecha_evaluacion', 'actualizado_en'
        ]

    def get_promedio_criterios(self, obj):
        return obj.promedio_criterios
    
>>>>>>> Stashed changes
