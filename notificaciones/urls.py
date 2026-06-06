from django.urls import path
from .views import crear_notificacion, mis_notificaciones, notificaciones_no_leidas, marcar_leida, marcar_todas_leidas

urlpatterns = [
    path('crear/', crear_notificacion, name='crear_notificacion'),
    path('mis/', mis_notificaciones, name='mis_notificaciones'),
    path('no-leidas/', notificaciones_no_leidas, name='notificaciones_no_leidas'),
    path('<int:pk>/leer/', marcar_leida, name='marcar_leida'),
    path('leer-todas/', marcar_todas_leidas, name='marcar_todas_leidas'),
]