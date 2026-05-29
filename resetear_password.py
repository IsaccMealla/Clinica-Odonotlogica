import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("\n=== RESETEAR CONTRASEÑA ===\n")

# Mostrar usuarios
usuarios = list(User.objects.all())
for i, u in enumerate(usuarios, 1):
    print(f"{i}. {u.username}")

try:
    opcion = int(input("\nElige el número del usuario: "))
    usuario = usuarios[opcion - 1]
    
    nueva_pass = input(f"Nueva contraseña para {usuario.username}: ")
    usuario.set_password(nueva_pass)
    usuario.save()
    
    print(f"\n✅ Contraseña actualizada para {usuario.username}")
    print(f"   Nueva contraseña: {nueva_pass}\n")
    
except (ValueError, IndexError):
    print("❌ Opción inválida")
