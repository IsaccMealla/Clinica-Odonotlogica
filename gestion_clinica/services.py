from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def enviar_notificacion_clinica(email_destino, nombre_destino, tipo_evento, datos):
    """
    Función mejorada para enviar diferentes tipos de notificaciones por email
    tipo_evento: 'ASIGNACION', 'CITA', 'ESTADO_CITA', 'CAMBIO_ESTADO'
    datos: Diccionario con la info necesaria (paciente, fecha, estado, etc.)
    """
    remitente = f'Clínica UNIFRANZ <{settings.EMAIL_HOST_USER}>'
    
    if tipo_evento == 'ASIGNACION':
        asunto = f'⚠️ Nueva Asignación de Paciente - IUP: {datos.get("iup", "N/A")}'
        cuerpo = (
            f'Hola {nombre_destino},\n\n'
            f'Se te ha asignado un nuevo paciente: {datos.get("paciente", "Sin nombre")}.\n'
            f'IUP: {datos.get("iup", "N/A")}\n'
            f'Revisa el expediente para comenzar la evolución.\n\n'
            f'Saludos,\nClínica UNIFRANZ'
        )
    
    elif tipo_evento == 'CITA':
        asunto = f'📅 Nueva Cita Programada'
        cuerpo = (
            f'Hola {nombre_destino},\n\n'
            f'Tienes una nueva cita programada:\n'
            f'Paciente: {datos.get("paciente", "Sin nombre")}\n'
            f'Fecha/Hora: {datos.get("fecha", "Sin fecha")}\n'
            f'Gabinete: {datos.get("gabinete", "No especificado")}\n\n'
            f'Saludos,\nClínica UNIFRANZ'
        )

    elif tipo_evento == 'CAMBIO_ESTADO':
        nuevo_estado = datos.get("nuevo_estado", "Desconocido")
        estado_anterior = datos.get("estado_anterior", "Desconocido")
        
        # Personalizar según el nuevo estado
        if nuevo_estado == 'EN_ESPERA':
            asunto = f'⏳ Paciente en Sala de Espera - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'El paciente {datos.get("paciente", "Sin nombre")} ha llegado a la clínica y está en sala de espera.\n\n'
                f'Fecha/Hora: {datos.get("fecha", "Sin fecha")}\n'
                f'Gabinete: {datos.get("gabinete", "No especificado")}\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        elif nuevo_estado == 'ATENDIENDO':
            asunto = f'🏥 Comenzando Atención - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'Se ha iniciado la atención del paciente {datos.get("paciente", "Sin nombre")}.\n\n'
                f'Gabinete: {datos.get("gabinete", "No especificado")}\n'
                f'Hora de inicio: {datos.get("fecha", "Sin fecha")}\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        elif nuevo_estado == 'FINALIZADO':
            asunto = f'✅ Cita Finalizada - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'La cita del paciente {datos.get("paciente", "Sin nombre")} ha sido finalizada exitosamente.\n\n'
                f'Fecha/Hora: {datos.get("fecha", "Sin fecha")}\n'
                f'Duración aproximada: 30 minutos\n\n'
                f'Recuerda actualizar los datos del paciente en el sistema.\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        elif nuevo_estado == 'NO_ASISTIO':
            asunto = f'❌ Paciente No Asistió - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'El paciente {datos.get("paciente", "Sin nombre")} NO asistió a su cita programada.\n\n'
                f'Fecha/Hora programada: {datos.get("fecha", "Sin fecha")}\n'
                f'Gabinete: {datos.get("gabinete", "No especificado")}\n\n'
                f'Se ha registrado la inasistencia. Considera contactar al paciente para reprogramar.\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        elif nuevo_estado == 'CANCELADA':
            asunto = f'🚫 Cita Cancelada - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'La cita del paciente {datos.get("paciente", "Sin nombre")} ha sido CANCELADA.\n\n'
                f'Fecha/Hora original: {datos.get("fecha", "Sin fecha")}\n'
                f'Razón: {datos.get("razon_cancelacion", "No especificada")}\n\n'
                f'Detalles: {datos.get("motivo_cancelacion", "Sin detalles")}\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        elif nuevo_estado == 'REPROGRAMADA':
            asunto = f'🔄 Cita Reprogramada - {datos.get("paciente", "Sin nombre")}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'La cita del paciente {datos.get("paciente", "Sin nombre")} ha sido REPROGRAMADA.\n\n'
                f'Fecha/Hora anterior: {datos.get("fecha", "Sin fecha")}\n'
                f'Nueva fecha/hora: {datos.get("nueva_fecha", "Pendiente de confirmar")}\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
        
        else:
            asunto = f'🔄 Cambio de Estado de Cita - {nuevo_estado}'
            cuerpo = (
                f'Hola {nombre_destino},\n\n'
                f'La cita del paciente {datos.get("paciente", "Sin nombre")} ha cambiado de estado:\n\n'
                f'Estado Anterior: {estado_anterior}\n'
                f'Nuevo Estado: {nuevo_estado}\n'
                f'Fecha/Hora: {datos.get("fecha", "Sin fecha")}\n'
                f'Cambio realizado por: {datos.get("usuario", "Sistema")}\n\n'
                f'Saludos,\nClínica UNIFRANZ'
            )
    else:
        return False

    try:
        send_mail(
            asunto, 
            cuerpo, 
            settings.EMAIL_HOST_USER,
            [email_destino], 
            fail_silently=False
        )
        logger.info(f"✅ Correo de {tipo_evento} enviado correctamente a {email_destino}")
        print(f"✅ Email enviado a {email_destino}: {asunto}")
        return True
    except Exception as e:
        logger.error(f"❌ Error al enviar correo de {tipo_evento} a {email_destino}: {str(e)}")
        print(f"Error enviando email: {str(e)}")
        return False


def enviar_notificacion_asignacion(estudiante_email, estudiante_nombre, paciente_nombre, iup):
    """
    Función específica para notificaciones de asignación de pacientes
    """
    return enviar_notificacion_clinica(
        email_destino=estudiante_email,
        nombre_destino=estudiante_nombre,
        tipo_evento='ASIGNACION',
        datos={
            'paciente': paciente_nombre,
            'iup': iup
        }
    )