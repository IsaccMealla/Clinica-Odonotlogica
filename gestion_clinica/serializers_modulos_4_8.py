from rest_framework import serializers
from .models import ControlAcademico, PagoFactura, DespachoAlmacen, Inventario, Tratamiento
from django.contrib.auth import get_user_model

User = get_user_model()


# =========================================================================
# SERIALIZERS: FLUJO CLÍNICO-ACADÉMICO (MÓDULOS 4-8)
# =========================================================================

class ControlAcademicoSerializer(serializers.ModelSerializer):
    """Serializer para Control Académico (Aprobación de Tratamientos)"""
    tratamiento_nombre = serializers.CharField(source='tratamiento.nombre_tratamiento', read_only=True)
    docente_nombre = serializers.CharField(source='docente.get_full_name', read_only=True)
    paciente_id = serializers.CharField(source='tratamiento.paciente_id', read_only=True)
    estudiante_id = serializers.CharField(source='tratamiento.estudiante_id', read_only=True)

    def validate(self, attrs):
        aprobado = attrs.get('aprobado')
        nota_rubrica = attrs.get('nota_rubrica')

        if aprobado and nota_rubrica is None:
            raise serializers.ValidationError('Se requiere nota de rúbrica cuando el docente aprueba el control.')

        return super().validate(attrs)

    class Meta:
        model = ControlAcademico
        fields = [
            'id', 'tratamiento', 'tratamiento_nombre', 'docente', 'docente_nombre',
            'tipo_control', 'aprobado', 'nota_rubrica', 'observaciones',
            'paciente_id', 'estudiante_id', 'creado_en', 'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class PagoFacturaSerializer(serializers.ModelSerializer):
    """Serializer para Pagos y Facturas"""
    tratamiento_nombre = serializers.CharField(source='tratamiento.nombre_tratamiento', read_only=True)
    paciente_id = serializers.CharField(source='tratamiento.paciente_id', read_only=True)
    estudiante_id = serializers.CharField(source='tratamiento.estudiante_id', read_only=True)
    monto_tratamiento = serializers.DecimalField(source='tratamiento.precio', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = PagoFactura
        fields = [
            'id', 'tratamiento', 'tratamiento_nombre', 'nro_factura', 'monto_pagado',
            'estado_pago', 'cumplimiento_tributario_id', 'monto_tratamiento',
            'paciente_id', 'estudiante_id', 'creado_en', 'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class DespachoAlmacenSerializer(serializers.ModelSerializer):
    """Serializer para Despacho de Almacén"""
    tratamiento_nombre = serializers.CharField(source='tratamiento.nombre_tratamiento', read_only=True)
    inventario_nombre = serializers.CharField(source='inventario.material_nombre', read_only=True)
    stock_actual = serializers.IntegerField(source='inventario.stock_actual', read_only=True)
    stock_minimo = serializers.IntegerField(source='inventario.stock_minimo', read_only=True)
    paciente_id = serializers.CharField(source='tratamiento.paciente_id', read_only=True)
    estudiante_id = serializers.CharField(source='tratamiento.estudiante_id', read_only=True)

    class Meta:
        model = DespachoAlmacen
        fields = [
            'id', 'tratamiento', 'tratamiento_nombre', 'inventario', 'inventario_nombre',
            'insumo_nombre', 'cantidad_despachada', 'estado_entrega',
            'stock_actual', 'stock_minimo', 'paciente_id', 'estudiante_id',
            'creado_en', 'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class InventarioSerializer(serializers.ModelSerializer):
    """Serializer para Gestión de Inventario"""
    estado_stock = serializers.SerializerMethodField()

    def get_estado_stock(self, obj):
        """Retorna el estado del stock: 'Crítico', 'Bajo' o 'Disponible'"""
        if obj.stock_actual == 0:
            return 'Agotado'
        elif obj.stock_actual <= obj.stock_minimo:
            return 'Crítico'
        elif obj.stock_actual <= obj.stock_minimo * 1.5:
            return 'Bajo'
        return 'Disponible'

    class Meta:
        model = Inventario
        fields = [
            'id', 'material_nombre', 'stock_actual', 'stock_minimo',
            'estado_stock', 'creado_en', 'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class TratamientoFlowSerializer(serializers.ModelSerializer):
    """
    Serializer para Tratamiento con información del flujo completo.
    Incluye información de controles, pagos y despachos asociados.
    """
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    paciente_nombre = serializers.CharField(source='paciente.__str__', read_only=True)
    
    controles_academicos = ControlAcademicoSerializer(source='controles_academicos', many=True, read_only=True)
    pagos = PagoFacturaSerializer(source='pagos', many=True, read_only=True)
    despachos = DespachoAlmacenSerializer(source='despachos_almacen', many=True, read_only=True)
    
    progreso = serializers.SerializerMethodField()

    def get_progreso(self, obj):
        """
        Calcula el progreso del tratamiento basado en su estado.
        Retorna un diccionario con porcentaje y pasos completados.
        """
        estados_progreso = {
            'Pendiente_Aprobacion': 0,
            'Aprobado_Por_Pagar': 25,
            'Pagado_Autorizado': 50,
            'En_Ejecucion': 75,
            'Finalizado_Pendiente_Nota': 90,
            'Evaluado': 100,
        }
        porcentaje = estados_progreso.get(obj.estado, 0)
        
        return {
            'porcentaje': porcentaje,
            'pasos': [
                {'nombre': 'Aprobación Docente', 'completado': porcentaje >= 25},
                {'nombre': 'Pago Procesado', 'completado': porcentaje >= 50},
                {'nombre': 'Despacho Almacén', 'completado': porcentaje >= 75},
                {'nombre': 'Ejecución', 'completado': porcentaje >= 75},
                {'nombre': 'Evaluación Final', 'completado': porcentaje >= 100},
            ]
        }

    class Meta:
        model = Tratamiento
        fields = [
            'id', 'paciente', 'paciente_nombre', 'estudiante', 'estudiante_nombre',
            'nombre_tratamiento', 'procedimiento', 'pieza_dental', 'precio',
            'estado', 'controles_academicos', 'pagos', 'despachos',
            'progreso', 'creado_en', 'actualizado_en'
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']
