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

    class Meta:
        model = Paciente
        fields = [
            'id', 'ci', 'nombres', 'apellido_paterno', 'apellido_materno', 
            'sexo', 'fecha_nacimiento', 'lugar_nacimiento', 'estado_civil', 
            'ocupacion', 'direccion', 'email', 'celular', 'telefono', 
            'contacto_emergencia', 'telefono_emergencia', 
            'fecha_ultima_consulta', 'motivo_ultima_consulta', 
            'activo', 'edad',
            
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

    def to_representation(self, instance):
        """
        Este método ayuda a que si un antecedente no existe (es None), 
        el frontend reciba un objeto vacío o null de forma limpia.
        """
        ret = super().to_representation(instance)
        # Opcional: Podrías forzar valores por defecto aquí si fuera necesario
        return ret