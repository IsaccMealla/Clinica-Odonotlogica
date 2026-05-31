# FILE: gestion_clinica/serializers_flujos.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models_flujos import AnamnesisDiagnostico, PlanTratamiento, Insumo, CupoEstudiante
from .models import Paciente, Cita

User = get_user_model()


class AnamnesisDiagnosticoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnamnesisDiagnostico
        fields = ['id', 'paciente_id', 'estudiante', 'datos', 'aprobado', 'docente_aprobador', 'fecha_creacion', 'fecha_aprobacion']
        read_only_fields = ['aprobado', 'docente_aprobador', 'fecha_creacion', 'fecha_aprobacion']


class PlanTratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanTratamiento
        fields = ['id', 'paciente_id', 'estudiante', 'descripcion', 'insumo', 'cantidad_usada', 'fecha', 'solicitud_generada']
        read_only_fields = ['fecha', 'solicitud_generada']


class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = ['id', 'nombre', 'stock']


class CupoEstudianteSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)

    class Meta:
        model = CupoEstudiante
        fields = ['id', 'estudiante', 'estudiante_nombre', 'cupos']


class PacienteMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = ['id', 'ci', 'nombres', 'apellido_paterno', 'apellido_materno']


class CitaMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = ['id', 'paciente', 'estudiante', 'docente', 'gabinete', 'fecha_hora', 'duracion_estimada']
