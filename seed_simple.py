from gestion_clinica.models_materias import Materia

MATERIAS = [
    {'codigo': 'IES-511', 'nombre': 'Imagenologia Estomatologica I', 'semestre': 5, 'vistas_habilitadas': ['RADIOGRAFIA']},
    {'codigo': 'BIO-511', 'nombre': 'Biomateriales', 'semestre': 5, 'vistas_habilitadas': ['EVALUACION_GENERAL']},
    {'codigo': 'FES-511', 'nombre': 'Farmacologia Estomatologica', 'semestre': 5, 'vistas_habilitadas': ['EVALUACION_GENERAL']},
    {'codigo': 'SES-611', 'nombre': 'Semiologia Estomatologica', 'semestre': 6, 'vistas_habilitadas': ['EVALUACION_GENERAL', 'ODONTOGRAMA']},
    {'codigo': 'IES-612', 'nombre': 'Imagenologia Estomatologica II', 'semestre': 6, 'vistas_habilitadas': ['RADIOGRAFIA']},
    {'codigo': 'OEN-611', 'nombre': 'Operatoria y Endodoncia I', 'semestre': 6, 'vistas_habilitadas': ['OPERATORIA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'PRE-611', 'nombre': 'Prostodoncia Removible I', 'semestre': 6, 'vistas_habilitadas': ['PROSTODONCIA_REMOVIBLE', 'ODONTOGRAMA']},
    {'codigo': 'CBU-611', 'nombre': 'Cirugia Bucal I', 'semestre': 6, 'vistas_habilitadas': ['CIRUGIA', 'RADIOGRAFIA', 'ODONTOGRAMA']},
    {'codigo': 'PFI-611', 'nombre': 'Prostodoncia Fija I', 'semestre': 6, 'vistas_habilitadas': ['PROSTODONCIA_FIJA', 'ODONTOGRAMA']},
    {'codigo': 'PER-711', 'nombre': 'Periodoncia I', 'semestre': 7, 'vistas_habilitadas': ['PERIODONTOGRAMA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'OEN-712', 'nombre': 'Operatoria y Endodoncia II', 'semestre': 7, 'vistas_habilitadas': ['OPERATORIA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'PRE-712', 'nombre': 'Prostodoncia Removible II', 'semestre': 7, 'vistas_habilitadas': ['PROSTODONCIA_REMOVIBLE', 'ODONTOGRAMA']},
    {'codigo': 'CBU-712', 'nombre': 'Cirugia Bucal II', 'semestre': 7, 'vistas_habilitadas': ['CIRUGIA', 'RADIOGRAFIA', 'ODONTOGRAMA']},
    {'codigo': 'PFI-712', 'nombre': 'Prostodoncia Fija II', 'semestre': 7, 'vistas_habilitadas': ['PROSTODONCIA_FIJA', 'ODONTOGRAMA']},
    {'codigo': 'ORT-811', 'nombre': 'Ortodoncia', 'semestre': 8, 'vistas_habilitadas': ['ORTODONCIA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'PER-812', 'nombre': 'Periodoncia II', 'semestre': 8, 'vistas_habilitadas': ['PERIODONTOGRAMA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'OEN-813', 'nombre': 'Operatoria y Endodoncia III', 'semestre': 8, 'vistas_habilitadas': ['OPERATORIA', 'ODONTOGRAMA', 'RADIOGRAFIA', 'TRATAMIENTOS']},
    {'codigo': 'ODO-811', 'nombre': 'Odontopediatria', 'semestre': 8, 'vistas_habilitadas': ['ODONTOPEDIATRIA', 'ODONTOGRAMA', 'RADIOGRAFIA']},
    {'codigo': 'IRSR-911', 'nombre': 'Internado Rotatorio Radiologia Clinica I', 'semestre': 9, 'vistas_habilitadas': ['RADIOGRAFIA', 'EVALUACION_GENERAL', 'ODONTOGRAMA', 'HISTORIAL_CLINICO']},
    {'codigo': 'IRPE-911', 'nombre': 'Internado Rotatorio Periodoncia I', 'semestre': 9, 'vistas_habilitadas': ['PERIODONTOGRAMA', 'ODONTOGRAMA', 'RADIOGRAFIA', 'TRATAMIENTOS', 'HISTORIAL_CLINICO']},
    {'codigo': 'IRIA-911', 'nombre': 'Internado Rotatorio Integral Adultos I', 'semestre': 9, 'vistas_habilitadas': ['ODONTOGRAMA', 'PERIODONTOGRAMA', 'RADIOGRAFIA', 'OPERATORIA', 'TRATAMIENTOS', 'HISTORIAL_CLINICO', 'EVALUACION_GENERAL', 'CITAS']},
]

created = 0
for m in MATERIAS:
    obj, was_created = Materia.objects.get_or_create(
        codigo=m['codigo'],
        defaults={'nombre': m['nombre'], 'semestre': m['semestre'], 'vistas_habilitadas': m['vistas_habilitadas']}
    )
    if was_created:
        created += 1
print('Total creadas: %d / %d' % (created, len(MATERIAS)))
