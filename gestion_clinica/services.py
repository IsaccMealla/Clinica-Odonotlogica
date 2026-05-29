from django.core.mail import send_mail
from django.conf import settings

def enviar_notificacion_asignacion(estudiante_email, estudiante_nombre, paciente_nombre, iup):
    asunto = f'⚠️ Nueva Asignación de Paciente - IUP: {iup}'
    
    mensaje_texto = (
        f'Hola {estudiante_nombre},\n\n'
        f'Se te ha asignado un nuevo paciente para tu rotación clínica:\n'
        f'Paciente: {paciente_nombre}\n'
        f'IUP: {iup}\n\n'
        f'Por favor, ingresa al sistema para revisar el expediente y comenzar con la evolución clínica.'
    )
    
    
    remitente = f'Sistema de Gestión Clínica <{settings.EMAIL_HOST_USER}>'
    
    try:
        send_mail(
            asunto,
            mensaje_texto,
            remitente, 
            [estudiante_email],
            fail_silently=False,
        )
        print(f"Correo enviado con éxito a {estudiante_email}")
    except Exception as e:
        print(f"Error al enviar correo: {e}")