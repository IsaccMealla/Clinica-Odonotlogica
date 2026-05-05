from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Paciente, Cita, AuditoriaCita
from .services import enviar_notificacion_clinica, enviar_notificacion_asignacion
import logging

logger = logging.getLogger(__name__)

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