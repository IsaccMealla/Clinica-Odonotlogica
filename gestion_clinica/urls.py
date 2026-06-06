from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 
from . import views_qa

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
    PeriodontogramaViewSet,
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
    HistorialCitasViewSet,
    # --- AGREGADO: VIEWSET PARA HISTÓRICO DE ABANDONO DE PACIENTES ---
    HistoricoAbandonoPacienteViewSet,
    # --- MÓDULO 6: FORMACIÓN Y SUPERVISIÓN ---
    ConfiguracionCupoViewSet,
    AsignacionCasoViewSet,
    SolicitudSupervisionViewSet,
    EvaluacionDesempeñoViewSet,
)
from .views_roles import RoleViewSet

# --- MÓDULO MATERIAS ---
from .views_materias import (
    MateriaViewSet,
    MateriaDocenteViewSet,
    MateriaEstudianteViewSet,
    SolicitudGuardadoViewSet,
    RegistroAsistenciaViewSet,
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
router.register(r'periodontogramas', PeriodontogramaViewSet)
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
router.register(r'historial-citas', HistorialCitasViewSet, basename='historial-citas')
router.register(r'historico-abandono', HistoricoAbandonoPacienteViewSet, basename='historico-abandono')

# ----- AGREGADO: RUTA PARA IMÁGENES CLÍNICAS -----
router.register(r'imagenes', views.ImagenClinicaViewSet, basename='imagenes')

# ========== MÓDULO 6: FORMACIÓN Y SUPERVISIÓN ==========
router.register(r'configuracion-cupo', ConfiguracionCupoViewSet, basename='configuracion-cupo')
router.register(r'asignacion-caso', AsignacionCasoViewSet, basename='asignacion-caso')
router.register(r'solicitud-supervision', SolicitudSupervisionViewSet, basename='solicitud-supervision')
router.register(r'evaluacion-desempeño', EvaluacionDesempeñoViewSet, basename='evaluacion-desempeño')
# Roles (gestión de permisos)
router.register(r'roles', RoleViewSet, basename='roles')

# ========== MÓDULO MATERIAS Y GUARDADO ==========
router.register(r'materias', MateriaViewSet, basename='materias')
router.register(r'materia-docente', MateriaDocenteViewSet, basename='materia-docente')
router.register(r'materia-estudiante', MateriaEstudianteViewSet, basename='materia-estudiante')
router.register(r'solicitud-guardado', SolicitudGuardadoViewSet, basename='solicitud-guardado')
router.register(r'asistencia', RegistroAsistenciaViewSet, basename='asistencia')


urlpatterns = [
    # Las rutas automáticas (CRUD completo para usuarios, pacientes, tablas y tratamientos)
    path('', include(router.urls)),
    
    # --- RUTAS PERSONALIZADAS ---
    
    # Ruta para el gráfico 3D de estadísticas
    path('reportes/estadisticas/', views.estadisticas_3d_view, name='estadisticas_3d'),
    
    # Ruta personalizada para recuperación de contraseña
    path('api/notificaciones/', include('notificaciones.urls')),
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
    
    # --- RUTAS PARA QA AUTOMATION ---
    path('qa/ejecutar/', views_qa.ejecutar_qa_command, name='ejecutar_qa'),
    path('qa/evidencias/', views_qa.listar_evidencias, name='listar_evidencias'),
    path('qa/evidencias/limpiar/', views_qa.limpiar_evidencias, name='limpiar_evidencias'),
]