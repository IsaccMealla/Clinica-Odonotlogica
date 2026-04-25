from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 

# Importamos absolutamente todos los ViewSets
from .views import (
    UsuarioViewSet,
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
    ExamenClinicoFisicoViewSet,
    # --- NUEVOS VIEWSETS (TRATAMIENTOS Y CLÍNICA) ---
    TratamientoViewSet,
    AvanceClinicoViewSet,
    EvidenciaViewSet,
    TransferenciaViewSet,
    # --- AGREGADO: VIEWSET DE SILLONES ---
    SillonViewSet,
    # --- AGREGADO: VIEWSET DE CITAS ---
    CitaViewSet,
    # --- NUEVOS VIEWSETS (AGENDAMIENTO AVANZADO) ---
    CitaRecurrenteViewSet,
    ConfiguracionAlertasViewSet,
    AuditoriaCitaViewSet,
    # --- AGREGADO: VIEWSET PARA HISTÓRICO DE ABANDONO DE PACIENTES ---
    HistoricoAbandonoPacienteViewSet
)

# Creamos el router automático
router = DefaultRouter()

# Registramos USUARIOS
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

# Registramos pacientes
router.register(r'pacientes', PacienteViewSet, basename='paciente')

# Registramos TODOS los historiales y formularios médicos base
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

# --- NUEVAS RUTAS: TRATAMIENTOS, AVANCES Y TRANSFERENCIAS ---
router.register(r'tratamientos', TratamientoViewSet, basename='tratamientos')
router.register(r'avances-clinicos', AvanceClinicoViewSet, basename='avances-clinicos')
router.register(r'evidencias', EvidenciaViewSet, basename='evidencias')
router.register(r'transferencias', TransferenciaViewSet, basename='transferencias')

# --- AGREGADO: RUTA PARA SILLONES ---
router.register(r'sillones', SillonViewSet, basename='sillon')

# --- AGREGADO: RUTA PARA CITAS ---
router.register(r'citas', CitaViewSet, basename='cita')

# --- NUEVAS RUTAS: AGENDAMIENTO AVANZADO ---
router.register(r'citas-recurrentes', CitaRecurrenteViewSet, basename='cita-recurrente')
router.register(r'configuracion-alertas', ConfiguracionAlertasViewSet, basename='configuracion-alertas')
router.register(r'auditoria-citas', AuditoriaCitaViewSet, basename='auditoria-cita')
router.register(r'historico-abandono', HistoricoAbandonoPacienteViewSet, basename='historico-abandono')

# ----- AGREGADO: RUTA PARA IMÁGENES CLÍNICAS -----
router.register(r'imagenes', views.ImagenClinicaViewSet, basename='imagenes')


urlpatterns = [
    # Las rutas automáticas (CRUD completo para usuarios, pacientes, tablas y tratamientos)
    path('', include(router.urls)),
    
    # --- RUTAS PERSONALIZADAS ---
    
    # Ruta para el gráfico 3D de estadísticas
    path('reportes/estadisticas/', views.estadisticas_3d_view, name='estadisticas_3d'),
    
    # Ruta personalizada para recuperación de contraseña
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
]