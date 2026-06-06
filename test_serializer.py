import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from gestion_clinica.serializers_materias import MateriaDocenteSerializer
from gestion_clinica.models_materias import Materia
from django.contrib.auth import get_user_model

User = get_user_model()
materia = Materia.objects.first()
docente = User.objects.filter(rol='DOCENTE').first()

print(f"Materia: {materia}")
print(f"Docente: {docente}")
print(f"Docente Rol: {docente.rol if docente else 'N/A'}")

data = {
    'materia': str(materia.id) if materia else None,
    'docente': str(docente.id) if docente else None,
    'activo': True
}

serializer = MateriaDocenteSerializer(data=data)
if serializer.is_valid():
    print("Valid!")
else:
    print("Errors:", serializer.errors)
