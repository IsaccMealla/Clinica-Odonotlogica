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
    Sillon  # <-- NUEVO MODELO IMPORTADO AQUÍ
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