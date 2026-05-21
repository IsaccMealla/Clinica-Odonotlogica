from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import (
    Paciente,
    Cita,
    AuditoriaCita,
    Tratamiento,
    AvanceClinico,
    Transferencia,
    CitaRecurrente,
    ControlAcademico,
    PagoFactura,
    DespachoAlmacen,
)
from .services import enviar_notificacion_clinica, enviar_notificacion_asignacion
import logging
import json

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


def build_realtime_payload(instance, action, created=False, update_fields=None):
    payload = {
        'event': action,
        'model': instance._meta.model_name,
        'id': str(getattr(instance, 'pk', getattr(instance, 'id', None))),
        'created': bool(created),
        'data': {},
    }

    if hasattr(instance, 'estado'):
        payload['data']['estado'] = instance.estado

    if hasattr(instance, 'estado_academico'):
        payload['data']['estado_academico'] = instance.estado_academico

    if getattr(instance, 'paciente_id', None):
        payload['data']['paciente_id'] = str(instance.paciente_id)

    if getattr(instance, 'tratamiento_id', None):
        payload['data']['tratamiento_id'] = str(instance.tratamiento_id)

    if getattr(instance, 'fecha_hora', None):
        payload['data']['fecha_hora'] = instance.fecha_hora.isoformat()

    if getattr(instance, 'fecha_sesion', None):
        payload['data']['fecha_sesion'] = instance.fecha_sesion.isoformat()

    if update_fields:
        payload['data']['updated_fields'] = list(update_fields) if isinstance(update_fields, (list, tuple, set)) else [update_fields]

    return payload


def emit_websocket_event(group_name, event_type, event_data, timestamp=None):
    """
    Emite un evento a través del channel_layer de Redis.
    """
    if not timestamp:
        timestamp = timezone.now().isoformat()
    
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': event_type.replace('_', '.'),  # Convierte guiones a puntos
                'payload': event_data,
                'timestamp': timestamp,
                'data': event_data.get('data', {})
            }
        )
        logger.info(f"Evento emitido a {group_name}: {event_type}")
    except Exception as e:
        logger.error(f"Error emitiendo evento WebSocket: {str(e)}")


# ==========================================
# SIGNALS PARA TRATAMIENTO (Estado)
# ==========================================

@receiver(pre_save, sender=Tratamiento)
def track_tratamiento_estado_change(sender, instance, **kwargs):
    """
    Detecta cambios en el estado del tratamiento antes de guardar.
    """
    if instance.pk:
        try:
            previous = Tratamiento.objects.get(pk=instance.pk)
            instance._prev_estado = previous.estado
        except Tratamiento.DoesNotExist:
            instance._prev_estado = None
    else:
        instance._prev_estado = None


@receiver(post_save, sender=Tratamiento)
def tratamiento_estado_changed(sender, instance, created, update_fields, **kwargs):
    """
    Emite evento WebSocket cuando cambia el estado de un tratamiento.
    """
    if created:
        logger.info(f"Nuevo tratamiento creado: {instance.id}")
        return

    prev_estado = getattr(instance, '_prev_estado', None)
    if prev_estado and prev_estado != instance.estado:
        logger.info(f"Estado tratamiento {instance.id} cambió de {prev_estado} a {instance.estado}")
        
        event_data = {
            'event': 'tratamiento_estado_changed',
            'tratamiento_id': str(instance.id),
            'paciente_id': str(instance.paciente_id),
            'estado_anterior': prev_estado,
            'estado_nuevo': instance.estado,
            'estudiante_id': str(instance.estudiante_id),
            'data': {
                'id': str(instance.id),
                'paciente_id': str(instance.paciente_id),
                'estado': instance.estado,
                'nombre_tratamiento': instance.nombre_tratamiento,
                'precio': str(instance.precio),
                'pieza_dental': instance.pieza_dental,
                'procedimiento': instance.procedimiento,
            }
        }
        
        # Emitir a grupo global y grupo por tratamiento
        emit_websocket_event('clinica_realtime', 'clinica_event', event_data)
        emit_websocket_event(f'tratamiento_{instance.id}', 'tratamiento_estado_changed', event_data)


# ==========================================
# SIGNALS PARA CONTROL ACADÉMICO
# ==========================================

@receiver(post_save, sender=ControlAcademico)
def control_academico_saved(sender, instance, created, **kwargs):
    """
    Emite evento cuando se registra un control académico.
    Si es aprobado, actualiza automáticamente el estado del tratamiento.
    """
    tratamiento = instance.tratamiento
    
    event_data = {
        'event': 'control_academico_registrado',
        'control_academico_id': str(instance.id),
        'tratamiento_id': str(tratamiento.id),
        'docente_id': str(instance.docente_id),
        'data': {
            'id': str(instance.id),
            'tratamiento_id': str(tratamiento.id),
            'tipo_control': instance.tipo_control,
            'aprobado': instance.aprobado,
            'nota_rubrica': instance.nota_rubrica,
            'observaciones': instance.observaciones,
        }
    }
    
    if instance.aprobado:
        # Cambiar estado del tratamiento a "Aprobado_Por_Pagar"
        if tratamiento.estado == 'Pendiente_Aprobacion':
            tratamiento.estado = 'Aprobado_Por_Pagar'
            tratamiento.save()
            event_data['event'] = 'control_academico_aprobado'
        
        elif tratamiento.estado == 'Finalizado_Pendiente_Nota':
            tratamiento.estado = 'Evaluado'
            tratamiento.save()
            event_data['event'] = 'tratamiento_evaluado'
    
    # Emitir eventos
    emit_websocket_event('clinica_realtime', 'clinica_event', event_data)
    emit_websocket_event(f'tratamiento_{tratamiento.id}', 'control_academico_aprobado', event_data)
    emit_websocket_event(f'clinica_rol_DOCENTE', 'clinica_event', event_data)
    
    logger.info(f"Control académico guardado: {instance.id}, Aprobado: {instance.aprobado}")


# ==========================================
# SIGNALS PARA PAGO FACTURA
# ==========================================

@receiver(post_save, sender=PagoFactura)
def pago_factura_saved(sender, instance, created, **kwargs):
    """
    Emite evento cuando se procesa un pago.
    Actualiza automáticamente el estado del tratamiento a "Pagado_Autorizado".
    """
    if not created:
        return

    tratamiento = instance.tratamiento
    
    # Actualizar estado del tratamiento
    if tratamiento.estado == 'Aprobado_Por_Pagar':
        tratamiento.estado = 'Pagado_Autorizado'
        tratamiento.save()
    
    event_data = {
        'event': 'pago_procesado',
        'pago_id': str(instance.id),
        'tratamiento_id': str(tratamiento.id),
        'data': {
            'id': str(instance.id),
            'tratamiento_id': str(tratamiento.id),
            'nro_factura': instance.nro_factura,
            'monto_pagado': str(instance.monto_pagado),
            'estado_pago': instance.estado_pago,
            'cumplimiento_tributario_id': instance.cumplimiento_tributario_id,
        }
    }
    
    # Emitir eventos
    emit_websocket_event('clinica_realtime', 'clinica_event', event_data)
    emit_websocket_event(f'tratamiento_{tratamiento.id}', 'pago_procesado', event_data)
    emit_websocket_event('clinica_rol_RECEPCIONISTA', 'clinica_event', event_data)
    
    logger.info(f"Pago procesado: {instance.nro_factura} por Bs {instance.monto_pagado}")


# ==========================================
# SIGNALS PARA DESPACHO ALMACÉN
# ==========================================

@receiver(post_save, sender=DespachoAlmacen)
def despacho_almacen_saved(sender, instance, created, **kwargs):
    """
    Emite evento cuando se realiza un despacho.
    Descuenta automáticamente del inventario.
    """
    if not created:
        return

    tratamiento = instance.tratamiento
    inventario = instance.inventario
    
    # Descontar del inventario
    if inventario.stock_actual >= instance.cantidad_despachada:
        inventario.stock_actual -= instance.cantidad_despachada
        inventario.save()
    
    # Actualizar estado del tratamiento
    if tratamiento.estado == 'Pagado_Autorizado':
        tratamiento.estado = 'En_Ejecucion'
        tratamiento.save()
    
    event_data = {
        'event': 'despacho_almacen',
        'despacho_id': str(instance.id),
        'tratamiento_id': str(tratamiento.id),
        'data': {
            'id': str(instance.id),
            'tratamiento_id': str(tratamiento.id),
            'insumo_nombre': instance.insumo_nombre,
            'cantidad_despachada': instance.cantidad_despachada,
            'estado_entrega': instance.estado_entrega,
            'stock_actual': inventario.stock_actual,
            'stock_minimo': inventario.stock_minimo,
        }
    }
    
    # Emitir eventos
    emit_websocket_event('clinica_realtime', 'clinica_event', event_data)
    emit_websocket_event(f'tratamiento_{tratamiento.id}', 'despacho_almacen', event_data)
    emit_websocket_event('clinica_rol_ALMACENERO', 'clinica_event', event_data)
    
    logger.info(f"Despacho realizado: {instance.insumo_nombre} ({instance.cantidad_despachada} unidades)")


# ==========================================
# SIGNALS EXISTENTES (MANTENIDOS)
# ==========================================

@receiver(post_save, sender=Cita)
def actualizar_inasistencias_y_alerta(sender, instance, **kwargs):
    paciente = instance.paciente
    no_asistio_count = Cita.objects.filter(paciente=paciente, estado='NO_ASISTIO').count()
    paciente.inasistencias = no_asistio_count
    paciente.alerta_abandono = no_asistio_count >= 3
    paciente.save(update_fields=['inasistencias', 'alerta_abandono'])

    


def emit_realtime_event(instance, action, created=False, update_fields=None):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    try:
        async_to_sync(channel_layer.group_send)(
            'clinica_realtime',
            {
                'type': 'clinica.event',
                'payload': build_realtime_payload(instance, action, created, update_fields)
            }
        )
    except Exception as exc:
        logger.warning('No se pudo emitir evento WebSocket: %s', exc)

# ==========================================
# SEÑAL: Almacenar estado anterior antes de guardar
# ==========================================
@receiver(pre_save, sender=Cita)
def store_old_estado(sender, instance, **kwargs):
    """
    Almacena el estado anterior de la cita antes de guardar
    """
    if instance.pk:
        try:
            old_instance = Cita.objects.get(pk=instance.pk)
            instance._old_estado = old_instance.estado
        except Cita.DoesNotExist:
            instance._old_estado = None
    else:
        instance._old_estado = None

# ==========================================
# SEÑAL: Notificación de Asignación de Paciente
# ==========================================
@receiver(post_save, sender=Paciente)
def notificar_cambio_asignacion(sender, instance, created, **kwargs):
    """
    Envía correo cuando se asigna un paciente a un estudiante
    """
    if hasattr(instance, 'estudiante_asignado') and instance.estudiante_asignado: 
        estudiante = instance.estudiante_asignado
        
        # Obtener nombre completo del paciente
        nom = getattr(instance, 'nombres', 'Sin nombre')
        ape = getattr(instance, 'apellido_paterno', '')
        nombre_completo = f"{ape} {nom}".strip()
        iup_paciente = getattr(instance, 'ci', 'N/A')  # IUP es el CI del paciente
        
        # Enviar notificación
        resultado = enviar_notificacion_asignacion(
            estudiante_email=estudiante.email,
            estudiante_nombre=estudiante.first_name,
            paciente_nombre=nombre_completo,
            iup=iup_paciente
        )
        
        if resultado:
            logger.info(f"✅ Notificación de asignación enviada a {estudiante.email}")
        else:
            logger.warning(f"⚠️ Falló el envío de notificación de asignación a {estudiante.email}")


# ==========================================
# SEÑAL: Notificación de Cambios de Estado de Citas
# ==========================================
@receiver(post_save, sender=Cita)
def notificar_cambio_estado_cita(sender, instance, created, update_fields, **kwargs):
    """
    Envía notificaciones cuando cambia el estado de una cita
    """
    # Solo notificar si se actualizó el estado (no es creación)
    if not created and update_fields and 'estado' in update_fields:
        estado_anterior = getattr(instance, '_old_estado', None)
        
        # Datos para la notificación
        datos = {
            'paciente': str(instance.paciente),
            'fecha': instance.fecha_hora.strftime('%d/%m/%Y %H:%M') if instance.fecha_hora else 'Sin fecha',
            'estado_anterior': estado_anterior or 'Desconocido',
            'nuevo_estado': instance.estado,
            'usuario': instance.estudiante.get_full_name() if instance.estudiante else 'Sistema',
            'gabinete': instance.gabinete.nombre if instance.gabinete else 'No especificado',
            'razon_cancelacion': instance.razon_cancelacion or 'No especificada',
            'motivo_cancelacion': instance.motivo_cancelacion or 'Sin detalles',
        }
        
        # Notificar al estudiante
        if instance.estudiante and instance.estudiante.email:
            enviar_notificacion_clinica(
                email_destino=instance.estudiante.email,
                nombre_destino=instance.estudiante.first_name,
                tipo_evento='CAMBIO_ESTADO',
                datos=datos
            )
        
        # Notificar al docente
        if instance.docente and instance.docente.email:
            enviar_notificacion_clinica(
                email_destino=instance.docente.email,
                nombre_destino=instance.docente.first_name,
                tipo_evento='CAMBIO_ESTADO',
                datos=datos
            )
        
        logger.info(f"✅ Notificaciones de cambio de estado enviadas para cita {instance.id}")


# ==========================================
# SEÑAL: Crear Registro de Auditoría Automáticamente
# ==========================================
@receiver(post_save, sender=Cita)
def registrar_auditoria_cita(sender, instance, created, update_fields, **kwargs):
    """
    Registra automáticamente los cambios de estado en la auditoría
    """
    if not created and update_fields and 'estado' in update_fields:
        estado_anterior = getattr(instance, '_old_estado', None)
        
        AuditoriaCita.objects.create(
            cita=instance,
            tipo_cambio='CAMBIO_ESTADO',
            usuario=None,  # Se puede obtener del request si es posible, pero por ahora None
            campos_modificados=['estado'],
            valores_anteriores={'estado': estado_anterior} if estado_anterior else {},
            valores_nuevos={'estado': instance.estado},
            descripcion=f'Cambio de estado: {estado_anterior or "Desconocido"} → {instance.estado}'
        )
        
        logger.info(f"📝 Cambio de estado registrado para cita {instance.id} - {estado_anterior} → {instance.estado}")


# ==========================================
# SEÑALES: Difusión en tiempo real por WebSocket
# ==========================================
@receiver(post_save, sender=Tratamiento)
def broadcast_tratamiento(sender, instance, created, update_fields=None, **kwargs):
    emit_realtime_event(instance, 'tratamiento_created' if created else 'tratamiento_updated', created, update_fields)


@receiver(post_save, sender=AvanceClinico)
def broadcast_avance_clinico(sender, instance, created, update_fields=None, **kwargs):
    emit_realtime_event(instance, 'avance_clinico_created' if created else 'avance_clinico_updated', created, update_fields)


@receiver(post_save, sender=Transferencia)
def broadcast_transferencia(sender, instance, created, update_fields=None, **kwargs):
    emit_realtime_event(instance, 'transferencia_created' if created else 'transferencia_updated', created, update_fields)


@receiver(post_save, sender=CitaRecurrente)
def broadcast_cita_recurrente(sender, instance, created, update_fields=None, **kwargs):
    emit_realtime_event(instance, 'cita_recurrente_created' if created else 'cita_recurrente_updated', created, update_fields)


@receiver(post_save, sender=Cita)
def broadcast_cita(sender, instance, created, update_fields=None, **kwargs):
    emit_realtime_event(instance, 'cita_created' if created else 'cita_updated', created, update_fields)
