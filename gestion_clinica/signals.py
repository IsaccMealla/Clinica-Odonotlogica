from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Paciente  # <--- Cambiamos al modelo Paciente
from .services import enviar_notificacion_asignacion

@receiver(post_save, sender=Paciente)
def notificar_cambio_asignacion(sender, instance, created, **kwargs):
  
    if hasattr(instance, 'estudiante_asignado') and instance.estudiante_asignado: 
        estudiante = instance.estudiante_asignado
        
    
        nom = getattr(instance, 'nombres', getattr(instance, 'nombre', 'Sin nombre'))
        
     
        ape = getattr(instance, 'apellidos', getattr(instance, 'apellido', ''))
        
        nombre_completo = f"{nom} {ape}".strip()
        iup_paciente = getattr(instance, 'iup', 'N/A')
        

        enviar_notificacion_asignacion(
            estudiante_email=estudiante.email,
            estudiante_nombre=estudiante.first_name,
            paciente_nombre=nombre_completo,
            iup=iup_paciente
        )