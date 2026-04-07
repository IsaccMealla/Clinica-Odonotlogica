from django.contrib import admin
from django.urls import path, include

# Importamos las vistas de SimpleJWT para el Login
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('gestion_clinica.urls')), # Aquí viven tus rutas de pacientes
    path('api/ninja/', include('gestion_clinica.ninja_urls')),
    
    # --- NUEVAS RUTAS PARA EL LOGIN (Generación de Tokens) ---
    path('api/login/', TokenObtainPairView.as_view(), name='login'), # Usaremos esta para iniciar sesión
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Para mantener la sesión activa
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
