import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from gestion_clinica.models import Gabinete, DentalChair

print("=" * 50)
print("DEPURACIÓN DE DATOS")
print("=" * 50)

gabinetes = Gabinete.objects.all()
chairs = DentalChair.objects.all()

print(f"\n📊 GABINETES: {gabinetes.count()}")
for gab in gabinetes:
    print(f"  - {gab.nombre} (ID: {gab.id}, Estado: {gab.estado})")

print(f"\n🪑 SILLAS: {chairs.count()}")
for chair in chairs:
    gab_name = chair.gabinete.nombre if chair.gabinete else "Sin gabinete"
    print(f"  - {chair.name} (ID: {chair.id}, Gabinete: {gab_name})")

print("\n" + "=" * 50)

if gabinetes.count() == 0:
    print("⚠️  No hay gabinetes. Ejecuta: python manage.py load_test_data")
if chairs.count() == 0:
    print("⚠️  No hay sillas. Ejecuta: python manage.py load_test_data")
