import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from gestion_clinica.models import Paciente, AutorizacionCargaImage, HistorialAuditoriaImagen
from django.utils import timezone

User = get_user_model()

# Obtener un estudiante
estudiante = User.objects.filter(rol='ESTUDIANTE').first()
if not estudiante:
    print("❌ No hay estudiantes en la BD")
    exit(1)

# Obtener un paciente
paciente = Paciente.objects.first()
if not paciente:
    print("❌ No hay pacientes en la BD")
    exit(1)

print(f"✅ Estudiante: {estudiante.username}")
print(f"✅ Paciente: {paciente}")

# Crear una autorización
try:
    auth = AutorizacionCargaImage.objects.create(
        estudiante=estudiante,
        paciente=paciente,
        estado='PENDIENTE'
    )
    print(f"✅ Autorización creada: {auth.id}")
    
    # Verificar que se creó el registro de auditoría
    audit = HistorialAuditoriaImagen.objects.filter(
        accion='SOLICITUD',
        estudiante=estudiante,
        paciente=paciente
    ).first()
    
    if audit:
        print(f"✅ Auditoría creada: {audit.id}")
    else:
        print("❌ No se creó el registro de auditoría")
        
except Exception as e:
    print(f"❌ Error al crear autorización: {e}")
