from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
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
    Tratamiento, 
    AvanceClinico, 
    Evidencia, 
    Transferencia,
    Sillon,  # <-- NUEVO MODELO IMPORTADO AQUÍ
    Cita , # <-- NUEVO MODELO IMPORTADO AQUÍ
    ImagenClinica
)

User = get_user_model()

# =========================================================================
# 0. Serializer de Usuarios (Personal de la Clínica)
# =========================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': False} # Le decimos a Django que no obligue al frontend a enviarlo
        }

    def create(self, validated_data):
        # Si el frontend no envía 'username', copiamos el 'email' en ese campo
        if 'username' not in validated_data:
            validated_data['username'] = validated_data.get('email')

        # Encriptamos la contraseña
        if 'password' in validated_data:
             validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Manejamos la actualización, asegurando que si envían password, se encripte
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data.pop('password'))
        return super().update(instance, validated_data)

# =========================================================================
# 1. Serializers Individuales (Hijos)
# =========================================================================

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


# =========================================================================
# 2. Serializer Principal (Maestro)
# =========================================================================

class PacienteSerializer(serializers.ModelSerializer):
    # Usamos 'source' para apuntar al nombre real de la relación en la base de datos (OneToOneField)
    antecedentes_familiares = AntecedenteFamiliarSerializer(read_only=True, source='antecedentepatologicofamiliar')
    antecedentes_personales = AntecedentePersonalSerializer(read_only=True, source='antecedentepatologicopersonal')
    antecedentes_no_patologicos = AntecedenteNoPatologicoSerializer(read_only=True, source='antecedentenopatologicopersonal')
    antecedentes_ginecologicos = AntecedenteGinecologicoSerializer(read_only=True, source='antecedenteginecologico')
    
    # Si estos son OneToOneField que ya coinciden con el nombre exacto, se quedan sin source
    habitos = HabitosSerializer(read_only=True)
    antecedentes_periodontales = AntecedentesPeriodontalesSerializer(read_only=True)
    historia_odontopediatrica = HistoriaOdontopediatricaSerializer(read_only=True)

    # Si en models.py estos son ForeignKey, agregamos many=True y el related_name en plural
    examen_periodontal = ExamenPeriodontalSerializer(many=True, read_only=True, source='examenes_periodontales')
    prostodoncia_removible = ProstodonciaRemovibleSerializer(many=True, read_only=True, source='prostodoncias_removibles')
    prostodoncia_fija = ProstodonciaFijaSerializer(many=True, read_only=True, source='prostodoncias_fijas')
    protocolo_quirurgico = ProtocoloQuirurgicoSerializer(many=True, read_only=True, source='protocolos_quirurgicos')
    examen_clinico_fisico = ExamenClinicoFisicoSerializer(many=True, read_only=True, source='examenes_clinicos_fisicos')
    
    edad = serializers.ReadOnlyField()

    class Meta:
        model = Paciente
        fields = [
            'id', 'ci', 'nombres', 'apellido_paterno', 'apellido_materno', 
            'sexo', 'fecha_nacimiento', 'lugar_nacimiento', 'estado_civil', 
            'ocupacion', 'direccion', 'celular', 'telefono', 
            'contacto_emergencia', 'telefono_emergencia', 
            'fecha_ultima_consulta', 'motivo_ultima_consulta', 
            'activo', 'edad',
            'estudiante_asignado',
            
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
        ret = super().to_representation(instance)
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
    # Aseguramos que el paciente se reciba como el ID (UUID)
    paciente = serializers.PrimaryKeyRelatedField(queryset=Paciente.objects.all())

    class Meta:
        model = ImagenClinica
        fields = [
            'id', 'paciente', 'archivo', 'categoria', 
            'pieza_dental', 'descripcion', 'fecha_adquisicion'
           ]
        # ESTO ES LO MÁS IMPORTANTE:
        # Quitamos 'estudiante' de los campos requeridos en el POST
        read_only_fields = ['id', 'estudiante', 'fecha_adquisicion']


# =========================================================================
# SERIALIZERS MÓDULO 6: FORMACIÓN Y SUPERVISIÓN
# =========================================================================

from .models import ConfiguracionCupo, AsignacionCaso, SolicitudSupervision, EvaluacionDesempeño


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
    