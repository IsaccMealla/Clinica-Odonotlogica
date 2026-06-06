import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from gestion_clinica.models_materias import Materia

MATERIAS = [
    # Semestre 5 (Pre-clinica y Basicas)
    {'codigo': 'SGE-511', 'nombre': 'Semiologia General', 'semestre': 5, 'vistas_habilitadas': ['M2_DIAGNOSTICO']},
    {'codigo': 'PSA-511', 'nombre': 'Psicologia de la Salud', 'semestre': 5, 'vistas_habilitadas': ['M2_DIAGNOSTICO']},
    {'codigo': 'FOC-511', 'nombre': 'Fisiologia de la Oclusion', 'semestre': 5, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'IES-511', 'nombre': 'Imagenologia Estomatologica I', 'semestre': 5, 'vistas_habilitadas': ['M5_RADIOGRAFIA']},
    {'codigo': 'BIO-511', 'nombre': 'Biomateriales', 'semestre': 5, 'vistas_habilitadas': ['M3_TRATAMIENTO']},
    {'codigo': 'FES-511', 'nombre': 'Farmacologia Estomatologica', 'semestre': 5, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    
    # Semestre 6 (Inicio Clinica)
    {'codigo': 'SES-611', 'nombre': 'Semiologia Estomatologica', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO']},
    {'codigo': 'IES-612', 'nombre': 'Imagenologia Estomatologica II', 'semestre': 6, 'vistas_habilitadas': ['M5_RADIOGRAFIA']},
    {'codigo': 'OEN-611', 'nombre': 'Operatoria y Endodoncia I', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PRE-611', 'nombre': 'Prostodoncia Removible I', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'CBU-611', 'nombre': 'Cirugia Bucal I', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PFI-611', 'nombre': 'Prostodoncia Fija I', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'TOD-611', 'nombre': 'Tecnologia Odontologica', 'semestre': 6, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    
    # Semestre 7
    {'codigo': 'UEO-711', 'nombre': 'Urgencias y Emergencias en Odontologia', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PER-711', 'nombre': 'Periodoncia I', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'OEN-712', 'nombre': 'Operatoria y Endodoncia II', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PRE-712', 'nombre': 'Prostodoncia Removible II', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'CBU-712', 'nombre': 'Cirugia Bucal II', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PFI-712', 'nombre': 'Prostodoncia Fija II', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'OLD-711', 'nombre': 'Odontologia Legal y Deontologia', 'semestre': 7, 'vistas_habilitadas': ['M2_DIAGNOSTICO']},

    # Semestre 8
    {'codigo': 'ORT-811', 'nombre': 'Ortodoncia', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PER-812', 'nombre': 'Periodoncia II', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'OEN-813', 'nombre': 'Operatoria y Endodoncia III', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PRE-813', 'nombre': 'Prostodoncia Removible III', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'CBU-813', 'nombre': 'Cirugia Bucal III', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'PFI-813', 'nombre': 'Prostodoncia Fija III', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'ODO-811', 'nombre': 'Odontopediatria', 'semestre': 8, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},

    # Semestre 9
    {'codigo': 'IRSR-911', 'nombre': 'Internado Rotatorio Semiologia y Radiologia Clinica I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRIN-911', 'nombre': 'Internado Rotatorio Integral Ninos y Ortodoncia I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPE-911', 'nombre': 'Internado Rotatorio Periodoncia I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPQ-911', 'nombre': 'Internado Rotatorio Practica Quirurgica I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPR-911', 'nombre': 'Internado Rotatorio Prostodoncia Removible I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'IRPF-911', 'nombre': 'Internado Rotatorio Prostodoncia Fija I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'IRIA-911', 'nombre': 'Internado Rotatorio Integral Adultos I', 'semestre': 9, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},

    # Semestre 10
    {'codigo': 'IRSR-1012', 'nombre': 'Internado Rotatorio Semiologia y Radiologia Clinica II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRIN-1012', 'nombre': 'Internado Rotatorio Integral Ninos y Ortodoncia II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPE-1012', 'nombre': 'Internado Rotatorio Periodoncia II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPQ-1012', 'nombre': 'Internado Rotatorio Practica Quirurgica II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'IRPR-1012', 'nombre': 'Internado Rotatorio Prostodoncia Removible II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'IRPF-1012', 'nombre': 'Internado Rotatorio Prostodoncia Fija II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO']},
    {'codigo': 'IRIA-1012', 'nombre': 'Internado Rotatorio Integral Adultos II', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO', 'M3_TRATAMIENTO', 'M5_RADIOGRAFIA']},
    {'codigo': 'CPE-1011', 'nombre': 'Curso Preparatorio Examen de Grado', 'semestre': 10, 'vistas_habilitadas': ['M2_DIAGNOSTICO']},
]

def seed_from_malla():
    print("Iniciando carga de materias...")
    created = 0
    for data in MATERIAS:
        obj, was_created = Materia.objects.get_or_create(
            codigo=data['codigo'],
            defaults={
                'nombre': data['nombre'],
                'semestre': data['semestre'],
                'vistas_habilitadas': data['vistas_habilitadas']
            }
        )
        if was_created:
            created += 1
            print(f"  > Creada: {obj}")
        else:
            print(f"  - Ya existe: {obj}")

    print(f"\n==================================================")
    print(f"Total creadas: {created} / {len(MATERIAS)}")
    print("==================================================\n")

if __name__ == '__main__':
    seed_from_malla()
