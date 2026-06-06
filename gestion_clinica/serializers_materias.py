# FILE: gestion_clinica/serializers_materias.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models_materias import Materia, MateriaDocente, MateriaEstudiante, SolicitudGuardado, RegistroAsistencia

User = get_user_model()


class MateriaSerializer(serializers.ModelSerializer):
    docentes_count = serializers.SerializerMethodField()
    estudiantes_count = serializers.SerializerMethodField()

    class Meta:
        model = Materia
        fields = [
            'id', 'codigo', 'nombre', 'semestre', 
            'vistas_habilitadas', 'activa', 'creado_en',
            'docentes_count', 'estudiantes_count'
        ]

    def get_docentes_count(self, obj):
        return obj.docentes_asignados.filter(activo=True).count()
    
    def get_estudiantes_count(self, obj):
        return obj.estudiantes_inscritos.filter(estado='CURSANDO').count()


class MateriaDocenteSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.CharField(source='docente.get_full_name', read_only=True)
    docente_email = serializers.CharField(source='docente.email', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    materia_codigo = serializers.CharField(source='materia.codigo', read_only=True)

    class Meta:
        model = MateriaDocente
        fields = [
            'id', 'materia', 'docente', 'activo', 'asignado_en',
            'docente_nombre', 'docente_email', 'materia_nombre', 'materia_codigo'
        ]


class MateriaEstudianteSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    docente_nombre = serializers.CharField(source='docente_asignado.get_full_name', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    materia_codigo = serializers.CharField(source='materia.codigo', read_only=True)
    vistas_habilitadas = serializers.JSONField(source='materia.vistas_habilitadas', read_only=True)

    class Meta:
        model = MateriaEstudiante
        fields = [
            'id', 'materia', 'estudiante', 'docente_asignado', 'estado', 'inscrito_en',
            'estudiante_nombre', 'docente_nombre', 'materia_nombre', 'materia_codigo',
            'vistas_habilitadas'
        ]


class SolicitudGuardadoSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    docente_nombre = serializers.CharField(source='docente.get_full_name', read_only=True)
    paciente_nombre = serializers.SerializerMethodField()
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = SolicitudGuardado
        fields = [
            'id', 'estudiante', 'docente', 'paciente', 'materia',
            'tipo_guardado', 'descripcion', 'estado', 
            'justificacion_rechazo', 'tiempo_ventana_minutos',
            'fecha_solicitud', 'fecha_respuesta', 'fecha_expiracion',
            'estudiante_nombre', 'docente_nombre', 'paciente_nombre', 
            'materia_nombre', 'esta_vigente'
        ]

    def get_paciente_nombre(self, obj):
        if obj.paciente:
            return str(obj.paciente)
        return None


class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_rol = serializers.CharField(source='usuario.rol', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    materia_codigo = serializers.CharField(source='materia.codigo', read_only=True)
    vistas_habilitadas = serializers.JSONField(source='materia.vistas_habilitadas', read_only=True)

    class Meta:
        model = RegistroAsistencia
        fields = [
            'id', 'usuario', 'materia', 'hora_ingreso', 'hora_salida', 'activo',
            'usuario_nombre', 'usuario_rol', 'materia_nombre', 'materia_codigo',
            'vistas_habilitadas'
        ]
