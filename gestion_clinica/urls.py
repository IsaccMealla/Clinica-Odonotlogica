from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 

# Importamos absolutamente todos los ViewSets
from .views import (
    UsuarioViewSet, # <--- AÑADIDO
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

# Registramos USUARIOS (NUEVO)
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

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
    # Las rutas automáticas (CRUD completo para usuarios, pacientes y sus tablas)
    path('', include(router.urls)),
    
    # --- RUTAS PERSONALIZADAS ---
    
    # Ruta para el gráfico 3D de estadísticas (NUEVA)
    path('reportes/estadisticas/', views.estadisticas_3d_view, name='estadisticas_3d'),
    
    # Ruta personalizada para recuperación de contraseña
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
]