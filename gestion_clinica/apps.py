from django.apps import AppConfig

class GestionClinicaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gestion_clinica'

    def ready(self):
        # Intentamos importar signals solo cuando el sistema esté listo
        try:
            import gestion_clinica.signals
        except ImportError as e:
            # Esto te dirá exactamente qué falta si no es el archivo
            print(f"Error cargando signals: {e}")