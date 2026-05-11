from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static # NUEVO
from django.conf import settings # NUEVO
# Importamos las vistas personalizadas de JWT del LOGIN
from gestion_clinica.views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('gestion_clinica.urls')), # Aquí viven tus rutas de pacientes
    
    # --- NUEVAS RUTAS PARA EL LOGIN (Generación de Tokens) ---
    path('api/login/', CustomTokenObtainPairView.as_view(), name='login'), # Usaremos esta para iniciar sesión (CON ROL EN JWT)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Para mantener la sesión activa
]

# NUEVO: Esto permite que Django muestre las imágenes en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)