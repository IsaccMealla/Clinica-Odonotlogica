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
    UserViewSet,
    RolePermissionViewSet,
    AuditLogViewSet,
    UserSessionViewSet,
    CustomTokenObtainPairView,
    register,
    logout,
    reset_password,
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
router.register(r'chairs', views.DentalChairViewSet)
router.register(r'dentists', views.DentistViewSet)
router.register(r'students', views.StudentViewSet)
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

    # Ruta personalizada para recuperación de contraseña (legacy)
    path('recuperar-password/', views.enviar_correo_recuperacion, name='recuperar_password'),
]