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
    ExamenClinicoFisico
)

User = get_user_model()

# =========================================================================
# 0. Serializer de Usuarios (Personal de la Clínica)
# =========================================================================

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # 👇 ¡AQUÍ ESTÁ LA CLAVE! Agregamos 'rol' a los fields 👇
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
    antecedentes_familiares = AntecedenteFamiliarSerializer(read_only=True)
    antecedentes_personales = AntecedentePersonalSerializer(read_only=True)
    antecedentes_no_patologicos = AntecedenteNoPatologicoSerializer(read_only=True)
    antecedentes_ginecologicos = AntecedenteGinecologicoSerializer(read_only=True)
    
    habitos = HabitosSerializer(read_only=True)
    antecedentes_periodontales = AntecedentesPeriodontalesSerializer(read_only=True)
    examen_periodontal = ExamenPeriodontalSerializer(read_only=True)
    historia_odontopediatrica = HistoriaOdontopediatricaSerializer(read_only=True)
    prostodoncia_removible = ProstodonciaRemovibleSerializer(read_only=True)
    prostodoncia_fija = ProstodonciaFijaSerializer(read_only=True)
    protocolo_quirurgico = ProtocoloQuirurgicoSerializer(read_only=True)
    examen_clinico_fisico = ExamenClinicoFisicoSerializer(read_only=True)
    
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