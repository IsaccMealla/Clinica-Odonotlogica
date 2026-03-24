from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 

# Importamos absolutamente todos los ViewSets que acabamos de crear en views.py
from .views import (
    PacienteViewSet,
    AntecedenteFamiliarViewSet,
    AntecedentePersonalViewSet,
    AntecedenteNoPatologicoViewSet,
    AntecedenteGinecologicoViewSet,
    HabitosViewSet,
    AntecedentesPeriodontalesViewSet,
    ExamenPeriodontalViewSet,
    HistoriaOdontopediatricaViewSet,
    ProstodonciaRemovibleViewSet,
    ProstodonciaFijaViewSet,
    ProtocoloQuirurgicoViewSet,
    ExamenClinicoFisicoViewSet
)

# Creamos el router automático
router = DefaultRouter()

# Registramos pacientes
router.register(r'pacientes', PacienteViewSet, basename='paciente')

# Registramos TODOS los nuevos historiales y formularios médicos
router.register(r'antecedentes-familiares', AntecedenteFamiliarViewSet)
router.register(r'antecedentes-personales', AntecedentePersonalViewSet)
router.register(r'antecedentes-no-patologicos', AntecedenteNoPatologicoViewSet)
router.register(r'antecedentes-ginecologicos', AntecedenteGinecologicoViewSet)
router.register(r'habitos', HabitosViewSet)
router.register(r'antecedentes-periodontales', AntecedentesPeriodontalesViewSet)
router.register(r'examen-periodontal', ExamenPeriodontalViewSet)
router.register(r'historia-odontopediatrica', HistoriaOdontopediatricaViewSet)
router.register(r'prostodoncia-removible', ProstodonciaRemovibleViewSet)
router.register(r'prostodoncia-fija', ProstodonciaFijaViewSet)
router.register(r'protocolo-quirurgico', ProtocoloQuirurgicoViewSet)
router.register(r'examen-clinico', ExamenClinicoFisicoViewSet)

urlpatterns = [
    # Las rutas automáticas (CRUD completo para pacientes y todas sus tablas)
    path('', include(router.urls)),
    
    # Ruta personalizada para recuperación de contraseña
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
]