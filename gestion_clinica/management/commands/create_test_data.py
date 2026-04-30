from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from gestion_clinica.models import Paciente
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users and patients'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('CREANDO USUARIOS DE PRUEBA'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))

        usuarios = [
            {'username': 'admin', 'email': 'admin@clinica.com', 'password': 'Admin123!', 'rol': 'ADMIN', 'first_name': 'Admin', 'last_name': 'System', 'is_staff': True, 'is_superuser': True},
            {'username': 'docente', 'email': 'docente@clinica.com', 'password': 'Docente123!', 'rol': 'DOCENTE', 'first_name': 'Dr. Rafael', 'last_name': 'Flores', 'is_staff': True},
            {'username': 'estudiante1', 'email': 'estudiante1@clinica.com', 'password': 'Estudiante123!', 'rol': 'ESTUDIANTE', 'first_name': 'Carlos', 'last_name': 'Mendez'},
            {'username': 'estudiante2', 'email': 'estudiante2@clinica.com', 'password': 'Estudiante123!', 'rol': 'ESTUDIANTE', 'first_name': 'Ana', 'last_name': 'García'},
            {'username': 'recepcion', 'email': 'recepcion@clinica.com', 'password': 'Recepcion123!', 'rol': 'RECEPCIONISTA', 'first_name': 'María', 'last_name': 'López', 'is_staff': True},
        ]

        for u in usuarios:
            password = u.pop('password')
            rol = u.pop('rol')
            try:
                user, created = User.objects.get_or_create(username=u['username'], defaults={**u, 'rol': rol})
                if created:
                    user.set_password(password)
                    user.save()
                    self.stdout.write(f"  ✅ {u['username']:15} | {rol:15} | {password}")
                else:
                    self.stdout.write(f"  ⏭️  {u['username']:15} | (ya existe)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('CREANDO PACIENTES DE PRUEBA'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))

        pacientes = [
            {'ci': '12345678', 'nombres': 'Juan', 'apellido_paterno': 'Pérez', 'apellido_materno': 'García', 'sexo': 'M', 'fecha_nacimiento': date(1990, 5, 15), 'ocupacion': 'Ingeniero', 'celular': '70123456'},
            {'ci': '87654321', 'nombres': 'María', 'apellido_paterno': 'López', 'apellido_materno': 'Rodríguez', 'sexo': 'F', 'fecha_nacimiento': date(1985, 8, 22), 'ocupacion': 'Abogada', 'celular': '71234567'},
            {'ci': '11223344', 'nombres': 'Carlos', 'apellido_paterno': 'Martínez', 'apellido_materno': 'Sánchez', 'sexo': 'M', 'fecha_nacimiento': date(1995, 3, 10), 'ocupacion': 'Profesor', 'celular': '72345678'},
        ]

        for p in pacientes:
            try:
                # Ensure inasistencias/contador_inasistencias is set to 0
                if 'inasistencias' not in p:
                    p['inasistencias'] = 0
                pac, created = Paciente.objects.get_or_create(ci=p['ci'], defaults=p)
                if created:
                    self.stdout.write(f"  ✅ {p['ci']} | {p['nombres']} {p['apellido_paterno']}")
                else:
                    self.stdout.write(f"  ⏭️  {p['ci']} | (ya existe)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('✅ PROCESO COMPLETADO'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))
