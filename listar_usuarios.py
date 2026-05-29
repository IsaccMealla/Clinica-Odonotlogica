import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== USUARIOS REGISTRADOS ===\n")
for u in User.objects.all():
    rol = getattr(u, 'rol', 'sin rol')
    print(f"👤 {u.username} | Email: {u.email} | Rol: {rol}")
print(f"\nTotal: {User.objects.count()} usuarios\n")
