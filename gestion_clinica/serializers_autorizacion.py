from rest_framework import serializers
from django.utils import timezone
from .models import AutorizacionCargaImage, HistorialAuditoriaImagen


class AutorizacionCargaImageSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    docente_nombre = serializers.SerializerMethodField()
    paciente_nombre = serializers.SerializerMethodField()
    paciente_id = serializers.IntegerField(write_only=True, required=False)
    estudiante_id = serializers.IntegerField(write_only=True, required=False)
    # Campos calculados
    tiempo_restante_minutos = serializers.SerializerMethodField()
    es_valida = serializers.SerializerMethodField()

    class Meta:
        model = AutorizacionCargaImage
        fields = ['id', 'estudiante', 'estudiante_id', 'estudiante_nombre', 'docente', 'docente_nombre', 'paciente', 'paciente_id', 'paciente_nombre', 'estado', 'fecha_solicitud', 'fecha_aprobacion', 'expiracion', 'fecha_intento_envio', 'motivo', 'mensaje_rechazo', 'razon_no_envio', 'solicitud_anterior', 'tiempo_permitido_minutos', 'tiempo_restante_minutos', 'es_valida']
        read_only_fields = ['id', 'estado', 'fecha_solicitud', 'fecha_aprobacion', 'estudiante', 'docente', 'mensaje_rechazo', 'razon_no_envio', 'fecha_intento_envio', 'tiempo_restante_minutos', 'es_valida']

    def to_internal_value(self, data):
        # Permitir que paciente sea enviado como UUID string o int y se convierta a ID
        if 'paciente' in data and isinstance(data['paciente'], str):
            # Si es un UUID string, dejarlo como está para que DRF lo maneje
            # Si es un número, convertir a int
            try:
                data['paciente'] = int(data['paciente'])
            except ValueError:
                # Es probablemente un UUID, dejarlo como string
                pass
        return super().to_internal_value(data)

    def get_estudiante_nombre(self, obj):
        if obj.estudiante:
            if obj.estudiante.first_name or obj.estudiante.last_name:
                return f"{obj.estudiante.first_name} {obj.estudiante.last_name}".strip()
            return obj.estudiante.username
        return None

    def get_docente_nombre(self, obj):
        if obj.docente:
            if obj.docente.first_name or obj.docente.last_name:
                return f"{obj.docente.first_name} {obj.docente.last_name}".strip()
            return obj.docente.username
        return None

    def get_paciente_nombre(self, obj):
        if obj.paciente:
            return str(obj.paciente)
        return None
    
    def get_tiempo_restante_minutos(self, obj):
        """Retorna los minutos restantes para enviar la radiografía"""
        return obj.get_tiempo_restante()
    
    def get_es_valida(self, obj):
        """Retorna True si la autorización es válida"""
        return obj.is_valid()

    def create(self, validated_data):
        # validated_data contiene 'paciente' como objeto Paciente (convertido por DRF)
        paciente = validated_data.get('paciente')
        estudiante = validated_data.get('estudiante')
        
        if not paciente:
            raise serializers.ValidationError({'paciente': 'Paciente es requerido'})
        
        # Verificar que el estudiante no haya solicitado ya para este paciente
        if estudiante:
            existing = AutorizacionCargaImage.objects.filter(
                estudiante=estudiante,
                paciente=paciente,
                estado='PENDIENTE'
            ).exists()
            if existing:
                raise serializers.ValidationError({'detail': 'Ya existe una solicitud pendiente para este paciente'})
        
        autorizacion = AutorizacionCargaImage.objects.create(**validated_data)
        HistorialAuditoriaImagen.objects.create(
            accion='SOLICITUD',
            estudiante=autorizacion.estudiante,
            docente=None,
            paciente=autorizacion.paciente,
            detalles={'autorizacion_id': str(autorizacion.id)}
        )
        return autorizacion

    def validate(self, data):
        if data.get('expiracion') and data.get('expiracion') < timezone.now():
            raise serializers.ValidationError('La fecha de expiración no puede ser en el pasado')
        return data


class HistorialAuditoriaImagenSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    docente_nombre = serializers.SerializerMethodField()
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialAuditoriaImagen
        fields = ['id', 'accion', 'estudiante', 'estudiante_nombre', 'docente', 'docente_nombre', 'paciente', 'paciente_nombre', 'timestamp', 'detalles']

    def get_estudiante_nombre(self, obj):
        if obj.estudiante:
            if obj.estudiante.first_name or obj.estudiante.last_name:
                return f"{obj.estudiante.first_name} {obj.estudiante.last_name}".strip()
            return obj.estudiante.username
        return None

    def get_docente_nombre(self, obj):
        if obj.docente:
            if obj.docente.first_name or obj.docente.last_name:
                return f"{obj.docente.first_name} {obj.docente.last_name}".strip()
            return obj.docente.username
        return None

    def get_paciente_nombre(self, obj):
        if obj.paciente:
            return str(obj.paciente)
        return None
