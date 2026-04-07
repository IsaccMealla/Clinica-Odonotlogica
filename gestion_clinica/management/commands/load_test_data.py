from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from gestion_clinica.models import Gabinete, DentalChair, Dentist, Student, Paciente


class Command(BaseCommand):
    help = 'Carga datos de prueba: gabinetes, sillas, dentistas, estudiantes y pacientes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Cargando datos de prueba...'))

        # Crear Gabinetes
        self.stdout.write('\n→ Creando Gabinetes...')
        gabinetes_data = [
            {
                'nombre': 'Gabinete A',
                'descripcion': 'Gabinete de odontología general',
                'estado': 'disponible',
                'capacidad': 2,
            },
            {
                'nombre': 'Gabinete B',
                'descripcion': 'Gabinete de cirugía oral',
                'estado': 'disponible',
                'capacidad': 1,
            },
            {
                'nombre': 'Gabinete C',
                'descripcion': 'Gabinete de ortodoncia',
                'estado': 'disponible',
                'capacidad': 2,
            },
            {
                'nombre': 'Gabinete D',
                'descripcion': 'Gabinete de endodoncia',
                'estado': 'disponible',
                'capacidad': 1,
            },
            {
                'nombre': 'Gabinete E',
                'descripcion': 'Gabinete de periodoncia',
                'estado': 'disponible',
                'capacidad': 2,
            },
        ]

        gabinetes = {}
        for gab_data in gabinetes_data:
            gab, created = Gabinete.objects.get_or_create(
                nombre=gab_data['nombre'],
                defaults={
                    'descripcion': gab_data['descripcion'],
                    'estado': gab_data['estado'],
                    'capacidad': gab_data['capacidad'],
                }
            )
            gabinetes[gab_data['nombre']] = gab
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ {gab.nombre}'))

        # Crear Sillas Dentales
        self.stdout.write('\n→ Creando Sillas Dentales...')
        sillas_data = [
            {'name': 'Silla 1', 'code': 'CH-001', 'gabinete': 'Gabinete A'},
            {'name': 'Silla 2', 'code': 'CH-002', 'gabinete': 'Gabinete A'},
            {'name': 'Silla 3', 'code': 'CH-003', 'gabinete': 'Gabinete B'},
            {'name': 'Silla 4', 'code': 'CH-004', 'gabinete': 'Gabinete C'},
            {'name': 'Silla 5', 'code': 'CH-005', 'gabinete': 'Gabinete C'},
            {'name': 'Silla 6', 'code': 'CH-006', 'gabinete': 'Gabinete D'},
            {'name': 'Silla 7', 'code': 'CH-007', 'gabinete': 'Gabinete E'},
            {'name': 'Silla 8', 'code': 'CH-008', 'gabinete': 'Gabinete E'},
        ]

        for silla_data in sillas_data:
            silla, created = DentalChair.objects.get_or_create(
                name=silla_data['name'],
                defaults={
                    'code': silla_data['code'],
                    'gabinete': gabinetes[silla_data['gabinete']],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ {silla.name}'))

        # Crear Dentistas
        self.stdout.write('\n→ Creando Dentistas (5)...')
        dentistas_names = [
            ('Dr. Carlos', 'García', 'Odontología General'),
            ('Dra. María', 'López', 'Cirugía Oral'),
            ('Dr. Juan', 'Martínez', 'Endodoncia'),
            ('Dra. Sofia', 'Rodríguez', 'Ortodoncia'),
            ('Dr. Pedro', 'Sánchez', 'Periodoncia'),
        ]

        dentistas = []
        for idx, (first_name, last_name, specialty) in enumerate(dentistas_names, 1):
            dentist, created = Dentist.objects.get_or_create(
                first_name=first_name,
                last_name=last_name,
                defaults={
                    'specialty': specialty,
                    'email': f'dentist{idx}@clinica.com',
                    'cellphone': f'+591-75-{600000 + idx*1000:06d}',
                }
            )
            dentistas.append(dentist)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ {dentist.first_name} {dentist.last_name} ({specialty})'))

        # Crear Estudiantes
        self.stdout.write('\n→ Creando Estudiantes (5)...')
        estudiantes_names = [
            ('Ana', 'Flores', 'Dr. García'),
            ('Luis', 'Ruiz', 'Dra. María'),
            ('Fernando', 'Quispe', 'Dr. Juan'),
            ('Camila', 'Morales', 'Dra. Sofia'),
            ('Diego', 'Vargas', 'Dr. Pedro'),
        ]

        estudiantes = []
        for idx, (first_name, last_name, tutor) in enumerate(estudiantes_names, 1):
            student, created = Student.objects.get_or_create(
                first_name=first_name,
                last_name=last_name,
                defaults={
                    'email': f'student{idx}@clinica.com',
                    'cellphone': f'+591-76-{700000 + idx*1000:06d}',
                    'tutor': tutor,
                }
            )
            estudiantes.append(student)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ {student.first_name} {student.last_name}'))

        # Crear Usuarios del Sistema
        self.stdout.write('\n→ Creando Usuarios del Sistema...')
        
        # Crear dentistas como usuarios
        for dentist in dentistas:
            username = f'dentist_{dentist.id}'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=dentist.email or f'{dentist.first_name.lower()}@clinica.com',
                    password='Clinica123!',
                    first_name=dentist.first_name,
                    last_name=dentist.last_name,
                )
                user.groups.add('dentist')
                self.stdout.write(self.style.SUCCESS(f'  ✓ Usuario Dentista: {username}'))

        # Crear estudiantes como usuarios
        for student in estudiantes:
            username = f'student_{student.id}'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=student.email or f'{student.first_name.lower()}@clinica.com',
                    password='Clinica123!',
                    first_name=student.first_name,
                    last_name=student.last_name,
                )
                user.groups.add('student')
                self.stdout.write(self.style.SUCCESS(f'  ✓ Usuario Estudiante: {username}'))

        # Crear Pacientes de Prueba
        self.stdout.write('\n→ Creando Pacientes (5)...')
        pacientes_data = [
            {
                'nombres': 'Juan',
                'apellido_paterno': 'Pérez',
                'apellido_materno': 'González',
                'email': 'juan@paciente.com',
                'telefono': '73456789',
            },
            {
                'nombres': 'María',
                'apellido_paterno': 'García',
                'apellido_materno': 'López',
                'email': 'maria@paciente.com',
                'telefono': '71234567',
            },
            {
                'nombres': 'Carlos',
                'apellido_paterno': 'Rodríguez',
                'apellido_materno': 'Martínez',
                'email': 'carlos@paciente.com',
                'telefono': '72345678',
            },
            {
                'nombres': 'Ana',
                'apellido_paterno': 'Sánchez',
                'apellido_materno': 'Díaz',
                'email': 'ana@paciente.com',
                'telefono': '76789012',
            },
            {
                'nombres': 'Roberto',
                'apellido_paterno': 'Flores',
                'apellido_materno': 'Silva',
                'email': 'roberto@paciente.com',
                'telefono': '79876543',
            },
        ]

        for pac_data in pacientes_data:
            paciente, created = Paciente.objects.get_or_create(
                nombres=pac_data['nombres'],
                apellido_paterno=pac_data['apellido_paterno'],
                defaults={
                    'apellido_materno': pac_data['apellido_materno'],
                    'email': pac_data['email'],
                    'telefono': pac_data['telefono'],
                    'activo': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Paciente: {paciente.nombres} {paciente.apellido_paterno}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Datos de prueba cargados exitosamente!'))
        self.stdout.write(f'   - {len(gabinetes)} gabinetes')
        self.stdout.write(f'   - {len(sillas_data)} sillas dentales')
        self.stdout.write(f'   - {len(dentistas)} dentistas + usuarios')
        self.stdout.write(f'   - {len(estudiantes)} estudiantes + usuarios')
        self.stdout.write(f'   - {len(pacientes_data)} pacientes')
        self.stdout.write(f'\n📝 Credenciales de prueba:')
        self.stdout.write(f'   Username: dentist_{dentistas[0].id} / Password: Clinica123!')
        self.stdout.write(f'   Username: student_{estudiantes[0].id} / Password: Clinica123!')

