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
    ExamenClinicoFisicoViewSet,
<<<<<<< Updated upstream
    UserViewSet,
    RolePermissionViewSet,
    AuditLogViewSet,
    UserSessionViewSet,
    CustomTokenObtainPairView,
    register,
    logout,
    reset_password,
    ResourceViewSet,
    disponibilidad,
=======
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
    # --- MÓDULOS 4-8: FLUJO CLÍNICO-ACADÉMICO ---
    ControlAcademicoViewSet,
    PagoFacturaViewSet,
    DespachoAlmacenViewSet,
    InventarioViewSet,
)
from .autorizacion_views import (
    EstudianteAutorizacionViewSet,
    DocenteAutorizacionViewSet,
    HistorialAuditoriaImagenViewSet,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
router.register(r'chairs', views.DentalChairViewSet)
router.register(r'dentists', views.DentistViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'resources', views.ResourceViewSet)
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'images', views.MedicalImageViewSet)
router.register(r'clinical-animations', views.ClinicalAnimationViewSet)
router.register(r'subjects', views.SubjectViewSet)
router.register(r'groups', views.AcademicGroupViewSet)
router.register(r'student-groups', views.StudentGroupViewSet)
router.register(r'assignments', views.PatientAssignmentViewSet)
router.register(r'approvals', views.TeacherApprovalViewSet)
router.register(r'users', views.UserViewSet, basename='users')
router.register(r'role-permissions', views.RolePermissionViewSet, basename='role-permissions')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-logs')
router.register(r'user-sessions', views.UserSessionViewSet, basename='user-sessions')
=======

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
router.register(r'autorizaciones', EstudianteAutorizacionViewSet, basename='autorizaciones')
router.register(r'autorizaciones-docente', DocenteAutorizacionViewSet, basename='autorizaciones-docente')
router.register(r'auditoria-imagenes', HistorialAuditoriaImagenViewSet, basename='auditoria-imagenes')

# ========== MÓDULO 6: FORMACIÓN Y SUPERVISIÓN ==========
router.register(r'configuracion-cupo', ConfiguracionCupoViewSet, basename='configuracion-cupo')
router.register(r'asignacion-caso', AsignacionCasoViewSet, basename='asignacion-caso')
router.register(r'solicitud-supervision', SolicitudSupervisionViewSet, basename='solicitud-supervision')
router.register(r'evaluacion-desempeño', EvaluacionDesempeñoViewSet, basename='evaluacion-desempeño')

# ========== MÓDULOS 4-8: FLUJO CLÍNICO-ACADÉMICO ==========
router.register(r'controles-academicos', ControlAcademicoViewSet, basename='control-academico')
router.register(r'pagos-facturas', PagoFacturaViewSet, basename='pago-factura')
router.register(r'despachos-almacen', DespachoAlmacenViewSet, basename='despacho-almacen')
router.register(r'inventario', InventarioViewSet, basename='inventario')

>>>>>>> Stashed changes

urlpatterns = [
    # Las rutas automáticas (CRUD completo para pacientes y todas sus tablas)
    path('', include(router.urls)),
    
    # Reportes y analytics
    path('reports/patients/summary/', views.report_patients_summary, name='report_patients_summary'),
    path('reports/patients/monthly/', views.report_patients_monthly, name='report_patients_monthly'),
    path('reports/patients/demographics/', views.report_patients_demographics, name='report_patients_demographics'),
    path('reports/appointments/', views.report_appointments, name='report_appointments'),
    path('reports/appointments/by-dentist/', views.report_appointments_by_dentist, name='report_appointments_by_dentist'),
    path('reports/appointments/no-shows/', views.report_appointments_no_shows, name='report_appointments_no_shows'),
    path('reports/treatments/', views.report_treatments, name='report_treatments'),
    path('reports/students/performance/', views.report_students_performance, name='report_students_performance'),
    path('reports/teachers/supervision/', views.report_teachers_supervision, name='report_teachers_supervision'),
    path('reports/export/pdf/', views.export_report_pdf, name='export_report_pdf'),
    path('reports/export/excel/', views.export_report_excel, name='export_report_excel'),

    # Autenticación y seguridad
    path('auth/register/', views.register, name='auth_register'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/logout/', views.logout, name='auth_logout'),
    path('auth/reset-password/', views.reset_password, name='auth_reset_password'),
    path('disponibilidad/', views.disponibilidad, name='disponibilidad'),

    # Ruta personalizada para recuperación de contraseña (legacy)
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
]