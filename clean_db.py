import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    # First get the corrupted cita IDs
    cursor.execute("SELECT id FROM gestion_clinica_cita WHERE motivo = 'Tratamiento';")
    ids = [row[0] for row in cursor.fetchall()]
    print(f"Found {len(ids)} corrupted cita(s): {ids}")
    
    for cita_id in ids:
        # Delete related audit records first
        cursor.execute("DELETE FROM auditoria_citas WHERE cita_id = %s;", [cita_id])
        print(f"  Deleted audit records for cita {cita_id}")
    
    # Now delete the corrupted citas
    cursor.execute("DELETE FROM gestion_clinica_cita WHERE motivo = 'Tratamiento';")
    print(f"Deleted {cursor.rowcount} corrupted cita row(s)")
