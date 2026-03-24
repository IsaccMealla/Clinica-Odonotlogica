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
    ExamenClinicoFisico
)

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
            'ocupacion', 'direccion', 'celular', 'telefono', 
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