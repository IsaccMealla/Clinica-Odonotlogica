import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from gestion_clinica.models import Paciente, AutorizacionCargaImage
from gestion_clinica.serializers_autorizacion import AutorizacionCargaImageSerializer

User = get_user_model()
est = User.objects.filter(rol='ESTUDIANTE').first()
pac = Paciente.objects.first()

# Clean up
AutorizacionCargaImage.objects.filter(estudiante=est, paciente=pac).delete()

print(f"Testing with Estudiante: {est.username}, Paciente: {pac}")
ser = AutorizacionCargaImageSerializer(data={'paciente': pac.id})
if ser.is_valid():
    auth = ser.save(estudiante=est)
    print(f'✅ Autorización creada: {auth.id}')
    print(f'✅ Estado: {auth.estado}')
else:
    print(f'❌ Errores: {ser.errors}')


