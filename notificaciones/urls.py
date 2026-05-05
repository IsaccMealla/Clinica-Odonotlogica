from django.urls import path
from .views import crear_notificacion

urlpatterns = [
    path('crear/', crear_notificacion, name='crear_notificacion'),
]