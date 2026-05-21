from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
<<<<<<< Updated upstream
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, BasePermission
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class RoleBasedPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == 'admin':
            return True

        module = getattr(view, 'module_name', None) or view.__class__.__name__.lower()
        try:
            perm = RolePermission.objects.filter(role=request.user.role, module__icontains=module).first()
            if not perm:
                return False

            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return perm.can_view
            if request.method == 'POST':
                return perm.can_create
            if request.method in ['PUT', 'PATCH']:
                return perm.can_edit
            if request.method == 'DELETE':
                return perm.can_delete
        except Exception:
            return False

        return False

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.db.models import Count, Q
from django.utils.timezone import now
from django.http import HttpResponse
from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo

import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

import openpyxl

# --- IMPORTACIONES PARA RECUPERAR CONTRASEÑA ---
=======
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Sillon 
from .serializers import SillonSerializer
from .models import ImagenClinica
from .serializers import ImagenClinicaSerializer
from django.utils import timezone
from datetime import timedelta

>>>>>>> Stashed changes
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

<<<<<<< Updated upstream
User = get_user_model()
=======
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
>>>>>>> Stashed changes

from .models import *
from .serializers import *
from .serializers_modulos_4_8 import (
    ControlAcademicoSerializer, PagoFacturaSerializer,
    DespachoAlmacenSerializer, InventarioSerializer, TratamientoFlowSerializer
)
from .models import AutorizacionCargaImage, HistorialAuditoriaImagen
from .utils.dicom_processor import DICOMProcessor, BiosafetyFilterError
from .utils.diagnostico_manual import DiagnosticoManualService
from .tasks import procesar_inferencia_ia_task, registrar_auditoria_imagen
from django.db import models, transaction

<<<<<<< Updated upstream
=======
User = get_user_model()


# =========================================================================
# SERIALIZADOR Y VISTA DE LOGIN PERSONALIZADO (CON ROL EN JWT)
# =========================================================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializador personalizado que incluye el rol en el token JWT
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Agregamos el rol al payload del token
        token['rol'] = getattr(user, 'rol', 'ESTUDIANTE')
        token['username'] = user.username
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada que usa el serializador con rol en JWT
    """
    serializer_class = CustomTokenObtainPairSerializer

# =========================================================================
# VIEWSET DE USUARIOS 
# =========================================================================
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    # --- NUEVA ACCIÓN: Obtener solo estudiantes para poder asignarlos ---
    @action(detail=False, methods=['get'])
    def estudiantes(self, request):
        estudiantes = User.objects.filter(rol='ESTUDIANTE').order_by('first_name', 'last_name')
        serializer = self.get_serializer(estudiantes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def docentes(self, request):
        docentes = User.objects.filter(rol='DOCENTE').order_by('first_name', 'last_name')
        serializer = self.get_serializer(docentes, many=True)
        return Response(serializer.data)


# =========================================================================
# VIEWSET DE PACIENTES Y ANTECEDENTES
# =========================================================================
>>>>>>> Stashed changes
class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer

    def get_queryset(self):
        """
        Filtra pacientes activos/inactivos según la acción.
        """
        if self.action == 'papelera':
            return Paciente.objects.filter(activo=False)
        return Paciente.objects.filter(activo=True)

    @action(detail=False, methods=['get'])
    def mis_asignaciones_docente(self, request):
        """
        Retorna solo los pacientes que el docente tiene asignados.
        URL: /api/pacientes/mis_asignaciones_docente/
        """
        if getattr(request.user, 'rol', None) != 'DOCENTE':
            return Response({'error': 'Solo docentes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)

        pacientes = self.get_queryset().filter(docente_asignado=request.user)
        serializer = self.get_serializer(pacientes, many=True)
        return Response(serializer.data)

    # --- ACCIONES DE PAPELERA Y BORRADO ---

    @action(detail=False, methods=['get'])
    def papelera(self, request):
        pacientes = self.get_queryset()
        serializer = self.get_serializer(pacientes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restaurar(self, request, pk=None):
        try:
            paciente = Paciente.objects.get(pk=pk, activo=False)
            paciente.activo = True
            paciente.save()
            return Response({'message': 'Paciente restaurado con éxito'}, status=status.HTTP_200_OK)
        except Paciente.DoesNotExist:
            return Response({'error': 'Paciente no encontrado en la papelera'}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, *args, **kwargs):
        """ Eliminación física definitiva """
        return super().destroy(request, *args, **kwargs)

    # --- ACCIÓN UNIFICADA DE ANTECEDENTES Y FORMULARIOS ---

    @action(detail=True, methods=['get', 'post'])
    def antecedentes(self, request, pk=None):
        """
        GET: Obtiene todos los antecedentes del paciente.
        POST: Crea o actualiza todos los antecedentes y formularios en una sola petición.
        """
        paciente = self.get_object()

        if request.method == 'GET':
            # El Serializer de Paciente ya trae todo anidado
            serializer = self.get_serializer(paciente)
            return Response({
                'familiares': serializer.data.get('antecedentes_familiares'),
                'personales': serializer.data.get('antecedentes_personales'),
                'no_patologicos': serializer.data.get('antecedentes_no_patologicos'),
                'ginecologicos': serializer.data.get('antecedentes_ginecologicos'),
                'habitos': serializer.data.get('habitos'),
                'antecedentes_periodontales': serializer.data.get('antecedentes_periodontales'),
                'examen_periodontal': serializer.data.get('examen_periodontal'),
                'historia_odontopediatrica': serializer.data.get('historia_odontopediatrica'),
                'prostodoncia_removible': serializer.data.get('prostodoncia_removible'),
                'prostodoncia_fija': serializer.data.get('prostodoncia_fija'),
                'protocolo_quirurgico': serializer.data.get('protocolo_quirurgico'),
                'examen_clinico_fisico': serializer.data.get('examen_clinico_fisico'),
            })

        if request.method == 'POST':
            data = request.data
            
            # 1. Formularios Base
            if 'familiares' in data:
                AntecedentePatologicoFamiliar.objects.update_or_create(paciente=paciente, defaults=data['familiares'])
            if 'personales' in data:
                AntecedentePatologicoPersonal.objects.update_or_create(paciente=paciente, defaults=data['personales'])
            if 'no_patologicos' in data:
                AntecedenteNoPatologicoPersonal.objects.update_or_create(paciente=paciente, defaults=data['no_patologicos'])
            if 'ginecologicos' in data:
                AntecedenteGinecologico.objects.update_or_create(paciente=paciente, defaults=data['ginecologicos'])
            
            # 2. Nuevos Formularios
            if 'habitos' in data:
                Habitos.objects.update_or_create(paciente=paciente, defaults=data['habitos'])
            if 'antecedentes_periodontales' in data:
                AntecedentesPeriodontales.objects.update_or_create(paciente=paciente, defaults=data['antecedentes_periodontales'])
            if 'examen_periodontal' in data:
                ExamenPeriodontal.objects.update_or_create(paciente=paciente, defaults=data['examen_periodontal'])
            if 'historia_odontopediatrica' in data:
                HistoriaOdontopediatrica.objects.update_or_create(paciente=paciente, defaults=data['historia_odontopediatrica'])
            if 'prostodoncia_removible' in data:
                ProstodonciaRemovible.objects.update_or_create(paciente=paciente, defaults=data['prostodoncia_removible'])
            if 'prostodoncia_fija' in data:
                ProstodonciaFija.objects.update_or_create(paciente=paciente, defaults=data['prostodoncia_fija'])
            if 'protocolo_quirurgico' in data:
                ProtocoloQuirurgico.objects.update_or_create(paciente=paciente, defaults=data['protocolo_quirurgico'])
            if 'examen_clinico_fisico' in data:
                ExamenClinicoFisico.objects.update_or_create(paciente=paciente, defaults=data['examen_clinico_fisico'])

            return Response({'message': 'Historial clínico actualizado correctamente'}, status=status.HTTP_200_OK)

# --- VIEWSETS INDIVIDUALES (Para que el router funcione correctamente) ---
class AntecedenteFamiliarViewSet(viewsets.ModelViewSet):
    queryset = AntecedentePatologicoFamiliar.objects.all()
    serializer_class = AntecedenteFamiliarSerializer

class AntecedentePersonalViewSet(viewsets.ModelViewSet):
    queryset = AntecedentePatologicoPersonal.objects.all()
    serializer_class = AntecedentePersonalSerializer

class AntecedenteNoPatologicoViewSet(viewsets.ModelViewSet):
    queryset = AntecedenteNoPatologicoPersonal.objects.all()
    serializer_class = AntecedenteNoPatologicoSerializer

class AntecedenteGinecologicoViewSet(viewsets.ModelViewSet):
    queryset = AntecedenteGinecologico.objects.all()
    serializer_class = AntecedenteGinecologicoSerializer

class HabitosViewSet(viewsets.ModelViewSet):
    queryset = Habitos.objects.all()
    serializer_class = HabitosSerializer

class AntecedentesPeriodontalesViewSet(viewsets.ModelViewSet):
    queryset = AntecedentesPeriodontales.objects.all()
    serializer_class = AntecedentesPeriodontalesSerializer

class ExamenPeriodontalViewSet(viewsets.ModelViewSet):
    queryset = ExamenPeriodontal.objects.all()
    serializer_class = ExamenPeriodontalSerializer

class HistoriaOdontopediatricaViewSet(viewsets.ModelViewSet):
    queryset = HistoriaOdontopediatrica.objects.all()
    serializer_class = HistoriaOdontopediatricaSerializer

class ProstodonciaRemovibleViewSet(viewsets.ModelViewSet):
    queryset = ProstodonciaRemovible.objects.all()
    serializer_class = ProstodonciaRemovibleSerializer

class ProstodonciaFijaViewSet(viewsets.ModelViewSet):
    queryset = ProstodonciaFija.objects.all()
    serializer_class = ProstodonciaFijaSerializer

class ProtocoloQuirurgicoViewSet(viewsets.ModelViewSet):
    queryset = ProtocoloQuirurgico.objects.all()
    serializer_class = ProtocoloQuirurgicoSerializer

class ExamenClinicoFisicoViewSet(viewsets.ModelViewSet):
    queryset = ExamenClinicoFisico.objects.all()
    serializer_class = ExamenClinicoFisicoSerializer


class DentalChairViewSet(viewsets.ModelViewSet):
    queryset = DentalChair.objects.all()
    serializer_class = DentalChairSerializer


class DentistViewSet(viewsets.ModelViewSet):
    queryset = Dentist.objects.all()
    serializer_class = DentistSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


def notify_student_patient_arrived(appointment: Appointment):
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if not channel_layer or not appointment.student_id:
            return

        async_to_sync(channel_layer.group_send)(
            f'student_{appointment.student_id}',
            {
                'type': 'patient.arrived',
                'appointment_id': str(appointment.id),
                'patient': str(appointment.patient),
                'chair': str(appointment.chair),
                'start_datetime': appointment.start_datetime.isoformat() if appointment.start_datetime else None,
            }
        )
    except ImportError:
        pass


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.order_by('resource_type', 'name')
    serializer_class = ResourceSerializer


def _lookup_resource(resource_id):
    resource = Resource.objects.filter(id=resource_id, active=True).first()
    if resource:
        if resource.resource_type == Resource.RESOURCE_CHAIR:
            return {'chair': resource.chair}
        if resource.resource_type == Resource.RESOURCE_DOCTOR:
            return {'dentist': resource.dentist}
        if resource.resource_type == Resource.RESOURCE_STUDENT:
            return {'student': resource.student}
    chair = DentalChair.objects.filter(id=resource_id).first()
    if chair:
        return {'chair': chair}
    dentist = Dentist.objects.filter(id=resource_id).first()
    if dentist:
        return {'dentist': dentist}
    student = Student.objects.filter(id=resource_id).first()
    if student:
        return {'student': student}
    return None


@api_view(['GET'])
@permission_classes([AllowAny])
def disponibilidad(request):
    resource_id = request.query_params.get('recurso')
    fecha = request.query_params.get('fecha')

    if not resource_id or not fecha:
        return Response({'error': 'recurso and fecha are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        requested_date = date.fromisoformat(fecha)
    except ValueError:
        return Response({'error': 'fecha must be YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

    lookup = _lookup_resource(resource_id)
    if not lookup:
        return Response({'error': 'Resource not found'}, status=status.HTTP_404_NOT_FOUND)

    local_zone = ZoneInfo(settings.TIME_ZONE)
    day_start_local = datetime.combine(requested_date, time(hour=8, minute=0), tzinfo=local_zone)
    day_end_local = datetime.combine(requested_date, time(hour=18, minute=0), tzinfo=local_zone)
    day_start_utc = day_start_local.astimezone(timezone.utc)
    day_end_utc = day_end_local.astimezone(timezone.utc)

    status_filter = [
        Appointment.STATUS_SCHEDULED,
        Appointment.STATUS_WAITING,
        Appointment.STATUS_IN_PROGRESS,
        Appointment.STATUS_CONFIRMED,
    ]

    if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
        appointment_filter = Q(status__in=status_filter) & Q(time_range__overlap=(day_start_utc, day_end_utc))
    else:
        appointment_filter = (
            Q(appointment_date=requested_date)
            & Q(start_time__lt=day_end_local.time())
            & Q(end_time__gt=day_start_local.time())
            & Q(status__in=status_filter)
        )

    appointments = Appointment.objects.filter(appointment_filter)
    if lookup.get('chair'):
        appointments = appointments.filter(chair=lookup['chair'])
    if lookup.get('dentist'):
        appointments = appointments.filter(dentist=lookup['dentist'])
    if lookup.get('student'):
        appointments = appointments.filter(student=lookup['student'])

    busy_ranges = []
    for appointment in appointments:
        start = appointment.start_datetime or timezone.make_aware(datetime.combine(appointment.appointment_date, appointment.start_time), local_zone).astimezone(timezone.utc)
        end = appointment.end_datetime or timezone.make_aware(datetime.combine(appointment.appointment_date, appointment.end_time), local_zone).astimezone(timezone.utc)
        busy_ranges.append((start, end))

    slots = []
    slot_start = day_start_utc
    while slot_start < day_end_utc:
        slot_end = slot_start + timedelta(minutes=30)
        overlap = any(not (slot_end <= busy_start or slot_start >= busy_end) for busy_start, busy_end in busy_ranges)
        if not overlap:
            slots.append({
                'start': slot_start.isoformat(),
                'end': slot_end.isoformat(),
            })
        slot_start = slot_end

    return Response({
        'resource_id': resource_id,
        'fecha': fecha,
        'slots': slots,
    })


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.order_by('-appointment_date', '-start_time')
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        dentist = self.request.query_params.get('dentist')
        chair = self.request.query_params.get('chair')
        student = self.request.query_params.get('student')
        date = self.request.query_params.get('date')

        if dentist:
            queryset = queryset.filter(dentist_id=dentist)
        if chair:
            queryset = queryset.filter(chair_id=chair)
        if student:
            queryset = queryset.filter(student_id=student)
        if date:
            queryset = queryset.filter(appointment_date=date)
        return queryset

    def perform_create(self, serializer):
        """Crear cita y enviar notificación WebSocket"""
        appointment = serializer.save()
        self._notify_new_appointment(appointment)

    def _notify_new_appointment(self, appointment):
        """Enviar notificación a través de Channels (opcional, no rompe si falla)"""
        try:
            channel_layer = get_channel_layer()
            if channel_layer is None:
                return
            
            patient_name = f"{appointment.patient.nombres} {appointment.patient.apellido_paterno}"
            message = f"Nueva cita para {appointment.appointment_date} a las {appointment.start_time.strftime('%H:%M')}"
            
            async_to_sync(channel_layer.group_send)(
                'appointments_updates',
                {
                    'type': 'new_appointment',
                    'appointment_id': str(appointment.id),
                    'patient_name': patient_name,
                    'message': message,
                }
            )
        except Exception as e:
            # No romper la aplicación si las notificaciones fallan
            print(f"[WARNING] WebSocket notification failed (non-critical): {e}")

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        appointment = self.get_object()
        from django.utils import timezone
        appointment.check_in_time = timezone.now()
        appointment.status = Appointment.STATUS_WAITING
        appointment.save()

        notify_student_patient_arrived(appointment)
        
        # Enviar notificación WebSocket (opcional, no rompe si falla)
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                patient_name = f"{appointment.patient.nombres} {appointment.patient.apellido_paterno}"
                async_to_sync(channel_layer.group_send)(
                    'appointments_updates',
                    {
                        'type': 'patient_arrived',
                        'appointment_id': str(appointment.id),
                        'patient_name': patient_name,
                        'message': f"{patient_name} ha llegado a la cita",
                        'patient_arrived_at': appointment.check_in_time.isoformat(),
                    }
                )
        except Exception as e:
            print(f"[WARNING] Check-in notification failed (non-critical): {e}")

        wait_min = appointment.minutes_waiting
        alert = None
        if wait_min >= 20:
            alert = 'Paciente esperando más de 20 minutos'

        return Response({
            'id': appointment.id,
            'check_in_time': appointment.check_in_time,
            'minutes_waiting': wait_min,
            'alert': alert,
        })


class MedicalImageViewSet(viewsets.ModelViewSet):
    queryset = MedicalImage.objects.order_by('-uploaded_at')
    serializer_class = MedicalImageSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient = self.request.query_params.get('patient')
        image_type = self.request.query_params.get('image_type')

        if patient:
            queryset = queryset.filter(patient_id=patient)
        if image_type:
            queryset = queryset.filter(image_type=image_type)
        return queryset


class ClinicalAnimationViewSet(viewsets.ModelViewSet):
    queryset = ClinicalAnimation.objects.order_by('-created_at')
    serializer_class = ClinicalAnimationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.order_by('name')
    serializer_class = SubjectSerializer


class AcademicGroupViewSet(viewsets.ModelViewSet):
    queryset = AcademicGroup.objects.order_by('group_name')
    serializer_class = AcademicGroupSerializer

    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        try:
            group = self.get_object()
            student_id = request.data.get('student')
            if not student_id:
                return Response({'error': 'student is required'}, status=status.HTTP_400_BAD_REQUEST)

            student = Student.objects.filter(id=student_id).first()
            if not student:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

            student_group, created = StudentGroup.objects.get_or_create(student=student, group=group)
            serializer = StudentGroupSerializer(student_group)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except AcademicGroup.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentGroupViewSet(viewsets.ModelViewSet):
    queryset = StudentGroup.objects.order_by('-joined_at')
    serializer_class = StudentGroupSerializer


class PatientAssignmentViewSet(viewsets.ModelViewSet):
    queryset = PatientAssignment.objects.order_by('-assigned_date')
    serializer_class = PatientAssignmentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        student = self.request.query_params.get('student')
        teacher = self.request.query_params.get('teacher')
        status_param = self.request.query_params.get('status')

        if student:
            queryset = queryset.filter(student_id=student)
        if teacher:
            queryset = queryset.filter(supervising_teacher_id=teacher)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset


class TeacherApprovalViewSet(viewsets.ModelViewSet):
    queryset = TeacherApproval.objects.order_by('-created_at')
    serializer_class = TeacherApprovalSerializer


def create_audit_log(user, action, module, record_id=None, ip_address=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        record_id=str(record_id) if record_id else None,
        ip_address=ip_address,
    )


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and 'access' in response.data:
            try:
                user = User.objects.get(email=request.data.get('email'))
                user.last_login = now()
                user.save(update_fields=['last_login'])

                UserSession.objects.create(
                    user=user,
                    ip_address=request.META.get('REMOTE_ADDR') or None,
                    status='active',
                )

                create_audit_log(user, 'login', 'auth', ip_address=request.META.get('REMOTE_ADDR'))
            except User.DoesNotExist:
                pass
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email')
    name = request.data.get('name')
    password = request.data.get('password')
    role = request.data.get('role', 'student')

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(email=email, name=name, role=role, password=password)
    create_audit_log(user, 'register', 'auth', ip_address=request.META.get('REMOTE_ADDR'))

    return Response({'id': str(user.id), 'email': user.email, 'name': user.name, 'role': user.role}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    token = request.data.get('refresh')
    if token:
        try:
            RefreshToken(token).blacklist()
        except Exception:
            pass
    UserSession.objects.filter(user=request.user, status='active').update(status='terminated')
    create_audit_log(request.user, 'logout', 'auth', ip_address=request.META.get('REMOTE_ADDR'))
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'If the email exists, an email has been sent.'}, status=status.HTTP_200_OK)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_link = f'http://localhost:3000/forgot-password?uid={uid}&token={token}'

    send_mail(
        subject='Reset Password - Clinica Dental',
        message=f'Use this link to reset your password: {reset_link}',
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )

    create_audit_log(user, 'reset_password', 'auth', ip_address=request.META.get('REMOTE_ADDR'))
    return Response({'message': 'Reset password email sent if user exists.'}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        create_audit_log(self.request.user, 'deactivate_user', 'users', record_id=instance.id, ip_address=self.request.META.get('REMOTE_ADDR'))


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAdminUser]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        module = self.request.query_params.get('module')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if user_id:
            qs = qs.filter(user__id=user_id)
        if module:
            qs = qs.filter(module__icontains=module)
        if start_date:
            qs = qs.filter(timestamp__date__gte=start_date)
        if end_date:
            qs = qs.filter(timestamp__date__lte=end_date)

        return qs


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserSession.objects.all()
    serializer_class = UserSessionSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def force_logout(self, request, pk=None):
        session = self.get_object()
        session.status = 'terminated'
        session.save()
        create_audit_log(request.user, 'force_logout', 'sessions', record_id=session.id, ip_address=request.META.get('REMOTE_ADDR'))
        return Response({'status': 'terminated'})


# --- REPORTES Y ANALYTICS ---
@api_view(['GET'])
def report_patients_summary(request):
    total = Paciente.objects.count()
    monthly = (
        Paciente.objects
        .annotate(month=models.functions.TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    today = now().date()
    age_buckets = {'0-17': 0, '18-29': 0, '30-44': 0, '45-59': 0, '60+': 0}
    for p in Paciente.objects.exclude(fecha_nacimiento=None):
        age = (today - p.fecha_nacimiento).days // 365
        if age < 18:
            age_buckets['0-17'] += 1
        elif age < 30:
            age_buckets['18-29'] += 1
        elif age < 45:
            age_buckets['30-44'] += 1
        elif age < 60:
            age_buckets['45-59'] += 1
        else:
            age_buckets['60+'] += 1

    gender_groups = list(Paciente.objects.values('sexo').annotate(count=Count('id')))

    return Response({
        'total_patients': total,
        'monthly': list(monthly),
        'age_groups': age_buckets,
        'gender_groups': gender_groups,
    })


@api_view(['GET'])
def report_patients_monthly(request):
    monthly = (
        Paciente.objects
        .annotate(month=models.functions.TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    return Response({'monthly': list(monthly)})


@api_view(['GET'])
def report_patients_demographics(request):
    gender_groups = list(Paciente.objects.values('sexo').annotate(count=Count('id')))
    return Response({'gender': gender_groups})


@api_view(['GET'])
def report_appointments(request):
    daily = (
        Appointment.objects
        .values('appointment_date')
        .annotate(total=Count('id'))
        .order_by('appointment_date')
    )

    no_shows = Appointment.objects.filter(status=Appointment.STATUS_NO_SHOW).count()
    completed = Appointment.objects.filter(status=Appointment.STATUS_COMPLETED).count()

    return Response({'daily': list(daily), 'completed': completed, 'no_shows': no_shows})


@api_view(['GET'])
def report_appointments_by_dentist(request):
    data = (
        Appointment.objects
        .values('dentist__id', 'dentist__first_name', 'dentist__last_name')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    return Response({'by_dentist': list(data)})


@api_view(['GET'])
def report_appointments_no_shows(request):
    data = (
        Appointment.objects
        .filter(status=Appointment.STATUS_NO_SHOW)
        .values('appointment_date')
        .annotate(total=Count('id'))
        .order_by('appointment_date')
    )
    return Response({'no_shows': list(data)})


@api_view(['GET'])
def report_treatments(request):
    common = (
        Appointment.objects
        .values('reason')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    per_student = (
        Appointment.objects
        .values('student__id', 'student__first_name', 'student__last_name')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    monthly = (
        Appointment.objects
        .annotate(month=models.functions.TruncMonth('appointment_date'))
        .values('month')
        .annotate(total=Count('id'))
        .order_by('month')
    )

    total = Appointment.objects.count()
    completed = Appointment.objects.filter(status=Appointment.STATUS_COMPLETED).count()
    success_rate = (completed / total * 100) if total > 0 else 0

    return Response({
        'common_treatments': list(common),
        'by_student': list(per_student),
        'monthly': list(monthly),
        'success_rate': success_rate,
    })


@api_view(['GET'])
def report_students_performance(request):
    data = (
        PatientAssignment.objects
        .values('student__id', 'student__first_name', 'student__last_name')
        .annotate(total=Count('id'),
                  completed=Count('id', filter=Q(status=PatientAssignment.STATUS_COMPLETED)),
                  pending=Count('id', filter=Q(status=PatientAssignment.STATUS_ACTIVE)))
        .order_by('-total')
    )
    return Response({'students': list(data)})


@api_view(['GET'])
def report_teachers_supervision(request):
    data = (
        PatientAssignment.objects
        .values('supervising_teacher__id', 'supervising_teacher__first_name', 'supervising_teacher__last_name')
        .annotate(total=Count('id'), pending=Count('id', filter=Q(status=PatientAssignment.STATUS_ACTIVE)))
        .order_by('-total')
    )
    return Response({'teachers': list(data)})


@api_view(['GET'])
def export_report_pdf(request):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont('Helvetica-Bold', 16)
    p.drawString(72, 720, 'Reporte Clínica Dental')
    p.setFont('Helvetica', 10)
    p.drawString(72, 700, f'Generado: {now().strftime("%Y-%m-%d %H:%M:%S")}')
    p.drawString(72, 670, f'Total pacientes: {Paciente.objects.count()}')
    p.drawString(72, 655, f'Citas totales: {Appointment.objects.count()}')
    p.drawString(72, 640, f'No-shows: {Appointment.objects.filter(status=Appointment.STATUS_NO_SHOW).count()}')
    p.drawString(72, 625, f'Aprobaciones pendientes: {TeacherApproval.objects.filter(approval_status=TeacherApproval.STATUS_PENDING).count()}')
    p.showPage()
    p.save()
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf', headers={'Content-Disposition': 'attachment; filename="report.pdf"'})


@api_view(['GET'])
def export_report_excel(request):
    workbook = openpyxl.Workbook()
    ws = workbook.active
    ws.title = 'Resumen'
    ws.append(['Métrica', 'Valor'])
    ws.append(['Total Pacientes', Paciente.objects.count()])
    ws.append(['Citas totales', Appointment.objects.count()])
    ws.append(['No-shows', Appointment.objects.filter(status=Appointment.STATUS_NO_SHOW).count()])
    ws.append(['Aprobaciones pendientes', TeacherApproval.objects.filter(approval_status=TeacherApproval.STATUS_PENDING).count()])
    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="report.xlsx"'
    return response


# --- FUNCIÓN DE RECUPERACIÓN DE CONTRASEÑA ---

@api_view(['POST'])
@permission_classes([AllowAny])
def enviar_correo_recuperacion(request):
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'mensaje': 'Si el correo existe, se ha enviado un enlace.'})

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    enlace_recuperacion = f"http://localhost:3000/nueva-contrasena?uid={uid}&token={token}"

    send_mail(
        subject='Recuperación de Contraseña - Clínica Dental Pro',
        message=f'Hola,\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva:\n{enlace_recuperacion}\n\nSi no solicitaste este cambio, puedes ignorar este correo de forma segura.\n\nSaludos,\nEl equipo de Clínica Dental Pro.',
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )
    
    return Response({'mensaje': 'Correo de recuperación enviado con éxito.'})


# --- NO-SHOW STATISTICS AND ANALYTICS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def no_show_statistics_by_day(request):
    """
    Get no-show statistics grouped by day of the week.
    Returns data suitable for Recharts visualization.
    
    Example: GET /api/no-show-statistics-by-day/
    Response: {
        "day_statistics": [
            {"day": "Monday", "no_shows": 5, "day_number": 2},
            {"day": "Tuesday", "no_shows": 3, "day_number": 3},
            ...
        ]
    }
    """
    from gestion_clinica.tasks import get_no_show_statistics
    
    try:
        stats = get_no_show_statistics()
        return Response({
            'day_statistics': stats,
            'total_no_shows': sum(item['no_shows'] for item in stats)
        })
    except Exception as e:
        return Response(
            {'error': f'Error retrieving no-show statistics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def no_show_statistics_by_patient(request):
    """
    Get patients with the most no-shows.
    Useful for identifying patterns of missed appointments.
    
    Example: GET /api/no-show-statistics-by-patient/
    Response: {
        "patient_statistics": [
            {
                "patient_id": "123",
                "patient_name": "John Doe",
                "total_no_shows": 3
            },
            ...
        ]
    }
    """
    from gestion_clinica.tasks import get_no_shows_by_patient
    
<<<<<<< Updated upstream
    try:
        stats = get_no_shows_by_patient()
        return Response({
            'patient_statistics': stats,
            'total_patients_with_no_shows': len(stats)
        })
    except Exception as e:
        return Response(
            {'error': f'Error retrieving patient no-show statistics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def no_show_weekly_summary(request):
    """
    Get weekly no-show summary.
    Returns aggregated no-show count for the current week.
    
    Example: GET /api/no-show-weekly-summary/
    Response: {
        "week_start": "2024-04-01T00:00:00Z",
        "week_end": "2024-04-08T00:00:00Z",
        "total_no_shows": 12
    }
    """
    from gestion_clinica.tasks import get_weekly_no_show_summary
    
    try:
        summary = get_weekly_no_show_summary()
        return Response(summary)
    except Exception as e:
        return Response(
            {'error': f'Error retrieving weekly summary: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def trigger_no_show_check(request):
    """
    Manually trigger the no-show check task.
    This will mark all overdue scheduled appointments as no-shows.
    
    Example: POST /api/trigger-no-show-check/
    Response: {
        "status": "success",
        "no_shows_marked": 5,
        "timestamp": "2024-04-07T10:30:00Z"
    }
    """
    from gestion_clinica.tasks import check_appointment_no_shows
    
    try:
        result = check_appointment_no_shows.delay()  # Execute as background task if using Celery
        return Response({
            'status': 'submitted',
            'task_id': result.id if hasattr(result, 'id') else None,
            'message': 'No-show check task has been triggered'
        })
    except Exception as e:
        return Response(
            {'error': f'Error triggering no-show check: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
=======

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Asegúrate de importar los modelos y serializadores nuevos que creamos:
# from .models import AutorizacionImagen, ImagenClinica, HistorialEntregable
# from .serializers import AutorizacionImagenSerializer, HistorialEntregableSerializer

# =========================================================================
# NUEVO: MOTOR DE AUTORIZACIÓN Y AUDITORÍA DE IMÁGENES (M5 + M6)
# =========================================================================

class AutorizacionImagenViewSet(viewsets.ModelViewSet):
    """
    ViewSet para que los Docentes autoricen a los Estudiantes a subir imágenes
    con un límite de horas, y para que los Estudiantes vean sus autorizaciones.
    """
    queryset = AutorizacionImagen.objects.all()
    serializer_class = AutorizacionImagenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Docente: ve las autorizaciones que él emitió
        if getattr(user, 'rol', '') == 'DOCENTE':
            return self.queryset.filter(docente=user).order_by('-fecha_emision')
            
        # Estudiante: ve las autorizaciones que le dieron a él
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return self.queryset.filter(estudiante=user).order_by('-fecha_emision')
            
        # Coordinador/Admin: ve todas
        if user.is_superuser or getattr(user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']:
            return self.queryset.all().order_by('-fecha_emision')
            
        return self.queryset.none()

    def perform_create(self, serializer):
        """Solo los Docentes pueden crear autorizaciones"""
        if getattr(self.request.user, 'rol', '') != 'DOCENTE':
            raise PermissionError('Solo los docentes pueden emitir autorizaciones de imágenes.')
        
        # Guarda asignando al docente logueado
        autorizacion = serializer.save(docente=self.request.user, estado='PENDIENTE')
        
        # REGISTRO DE AUDITORÍA: El docente dio el permiso
        HistorialEntregable.objects.create(
            autorizacion=autorizacion,
            actor=self.request.user,
            accion='AUTORIZACION_CREADA',
            detalles=f"El docente fijó un plazo de {autorizacion.plazo_horas} horas para subir una imagen categoría {autorizacion.categoria_esperada}."
        )

    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        """Endpoint para ver la línea de tiempo/auditoría de una autorización específica"""
        autorizacion = self.get_object()
        historial = HistorialEntregable.objects.filter(autorizacion=autorizacion)
        
        # Nota: Asume que creaste el HistorialEntregableSerializer
        serializer = HistorialEntregableSerializer(historial, many=True)
        return Response(serializer.data)


# =========================================================================
# ACTUALIZACIÓN: SUBIDA DE IMÁGENES RESTRINGIDA POR TIEMPO
# =========================================================================
# NOTA: Debes REEMPLAZAR tu actual `ImagenClinicaViewSet` por este.

class ImagenClinicaViewSet(viewsets.ModelViewSet):
    queryset = ImagenClinica.objects.all()
    serializer_class = ImagenClinicaSerializer
    permission_classes = [IsAuthenticated]
<<<<<<< Updated upstream

=======
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
>>>>>>> Stashed changes
    def get_queryset(self):
        paciente_id = self.request.query_params.get('paciente')
        if paciente_id:
            return self.queryset.filter(paciente_id=paciente_id)
        return self.queryset

<<<<<<< Updated upstream
    def create(self, request, *args, **kwargs):
=======
    def perform_create(self, serializer):
        estudiante = self.request.user
        paciente = serializer.validated_data.get('paciente')
        archivo = serializer.validated_data.get('archivo')
        
        if paciente is None:
            raise PermissionDenied('Paciente requerido')

        ahora = timezone.now()
        autorizacion = AutorizacionCargaImage.objects.filter(
            estudiante=estudiante,
            paciente=paciente,
            estado='APROBADO'
        ).order_by('-fecha_aprobacion').first()

        if not autorizacion or (autorizacion.expiracion and ahora > autorizacion.expiracion):
            # Registrar intento fallido de carga
            HistorialAuditoriaImagen.objects.create(
                accion='INTENTO_CARGA_SIN_PERMISO',
                estudiante=estudiante,
                paciente=paciente,
                detalles={
                    'razon': 'Sin autorización válida o expirada',
                    'tiene_autorizacion': autorizacion is not None,
                    'autorizacion_expirada': autorizacion is not None and autorizacion.expiracion and ahora > autorizacion.expiracion
                }
            )
            raise PermissionDenied('No tiene autorización válida para cargar esta imagen')

        try:
            archivo_bytes = archivo.read()
            db_patient_full_name = f"{paciente.apellido_paterno} {paciente.nombres}"
            DICOMProcessor.validate_biosafety(archivo_bytes, db_patient_full_name)
        except BiosafetyFilterError as e:
            HistorialAuditoriaImagen.objects.create(
                accion='CARGA_RECHAZADA_BIOSEGURIDAD',
                estudiante=estudiante,
                paciente=paciente,
                detalles={'razon': str(e)}
            )
            raise PermissionDenied(str(e))

        instancia = serializer.save(
            estudiante=estudiante,
            estado_procesamiento='Pendiente'
        )
        
        autorizacion.estado = 'USADO'
        autorizacion.fecha_intento_envio = ahora
        autorizacion.save()

        HistorialAuditoriaImagen.objects.create(
            accion='SUBIDA_REALIZADA',
            estudiante=estudiante,
            docente=autorizacion.docente,
            paciente=paciente,
            detalles={
                'imagen_id': str(instancia.id),
                'autorizacion_id': str(autorizacion.id),
                'categoria': instancia.categoria,
                'tiempo_permitido_minutos': autorizacion.tiempo_permitido_minutos
            }
        )

    @action(detail=True, methods=['post'])
    def procesar_ia(self, request, pk=None):
        imagen = self.get_object()
        
        if imagen.estado_procesamiento == 'Procesando':
            return Response(
                {'error': 'La imagen ya está siendo procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imagen.estado_procesamiento = 'Procesando'
        imagen.save()
        
        tarea = procesar_inferencia_ia_task.delay(str(imagen.id))
        
        imagen.tarea_celery_id = tarea.id
        imagen.save()
        
        # Registrar en historial de análisis
        if not imagen.historial_analisis:
            imagen.historial_analisis = []
        
        entrada_historial = {
            'timestamp': timezone.now().isoformat(),
            'tipo': 'IA_INFERENCIA',
            'estado': 'en_proceso',
            'usuario_id': str(request.user.id),
            'usuario_nombre': str(request.user),
            'tarea_id': tarea.id,
            'resultados': None
        }
        
        imagen.historial_analisis.append(entrada_historial)
        imagen.save()
        
        HistorialAuditoriaImagen.objects.create(
            accion='IA_INFERENCIA_INICIADA',
            estudiante=request.user,
            paciente=imagen.paciente,
            detalles={'imagen_id': str(imagen.id), 'tarea_id': tarea.id}
        )
        
        return Response(
            {'message': 'Procesamiento IA iniciado', 'tarea_id': tarea.id},
            status=status.HTTP_202_ACCEPTED
        )
    
    @action(detail=True, methods=['post'])
    def diagnostico_manual(self, request, pk=None):
        imagen = self.get_object()
        hallazgos = request.data.get('hallazgos', [])
        
        try:
            DiagnosticoManualService.validar_hallazgos(hallazgos)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imagen.hallazgos_manuales = hallazgos
        
        if imagen.hallazgos_ia:
            imagen.hallazgos_ia = DiagnosticoManualService.merge_hallazgos(
                imagen.hallazgos_ia,
                hallazgos
            )
        
        imagen_anotada = DiagnosticoManualService.crear_anotacion(
            imagen.archivo.path,
            hallazgos
        )
        
        from django.core.files.base import ContentFile
        from datetime import datetime
        imagen.imagen_anotada.save(
            f"anotada_{datetime.now().timestamp()}.png",
            ContentFile(imagen_anotada.getvalue()),
            save=False
        )
        
        imagen.save()
        
        HistorialAuditoriaImagen.objects.create(
            accion='DIAGNOSTICO_MANUAL_REGISTRADO',
            estudiante=request.user,
            paciente=imagen.paciente,
            detalles={
                'imagen_id': str(imagen.id),
                'hallazgos': hallazgos,
                'total_hallazgos': len(hallazgos)
            }
        )
        
        serializer = self.get_serializer(imagen)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def estado_procesamiento(self, request, pk=None):
        imagen = self.get_object()
        
        if imagen.tarea_celery_id:
            from celery.result import AsyncResult
            resultado = AsyncResult(imagen.tarea_celery_id)
            estado_tarea = resultado.state
        else:
            estado_tarea = 'NO_INICIADA'
        
        return Response({
            'imagen_id': str(imagen.id),
            'imagen_url': request.build_absolute_uri(imagen.archivo.url),
            'imagen_anotada_url': request.build_absolute_uri(imagen.imagen_anotada.url) if imagen.imagen_anotada else None,
            'estado': imagen.estado_procesamiento,
            'estado_tarea': estado_tarea,
            'hallazgos_ia': imagen.hallazgos_ia,
            'hallazgos_manuales': imagen.hallazgos_manuales,
            'tiene_imagen_anotada': bool(imagen.imagen_anotada)
        })
    
    @action(detail=True, methods=['get'])
    def descargar_imagen_anotada(self, request, pk=None):
        imagen = self.get_object()
        
        if not imagen.imagen_anotada:
            return Response(
                {'error': 'No hay imagen anotada disponible'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'url': imagen.imagen_anotada.url,
            'nombre': imagen.imagen_anotada.name
        })
    
    @action(detail=False, methods=['get'])
    def listar_para_analizar(self, request):
        """Lista imágenes disponibles para que el estudiante seleccione una para analizar"""
        paciente_id = request.query_params.get('paciente')
        if not paciente_id:
            return Response(
                {'error': 'paciente requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imagenes = ImagenClinica.objects.filter(
            paciente_id=paciente_id,
            estudiante=request.user
        ).values('id', 'archivo', 'categoria', 'pieza_dental', 'fecha_adquisicion', 'estado_procesamiento')
        
        return Response(list(imagenes))
    
    @action(detail=True, methods=['get'])
    def historial_analisis(self, request, pk=None):
        """Retorna la línea de tiempo de análisis de una imagen"""
        imagen = self.get_object()
        historial = imagen.historial_analisis or []
        
        # Ordenar por timestamp descendente
        historial_ordenado = sorted(
            historial,
            key=lambda x: x.get('timestamp', ''),
            reverse=True
        )
        
        return Response({
            'imagen_id': str(imagen.id),
            'categoria': imagen.categoria,
            'historial': historial_ordenado,
            'total_analisis': len(historial)
        })


# =========================================================================
# MÓDULO 6: VIEWSETS DE FORMACIÓN Y SUPERVISIÓN
# =========================================================================

from rest_framework.permissions import BasePermission


class IsCoordinador(BasePermission):
    """Permiso: Solo Coordinador puede acceder"""
    def has_permission(self, request, view):
        return request.user and (request.user.is_superuser or getattr(request.user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR', 'DOCENTE'])


class IsDocente(BasePermission):
    """Permiso: Solo Docente puede acceder"""
    def has_permission(self, request, view):
        return request.user and (request.user.is_superuser or getattr(request.user, 'rol', '') == 'DOCENTE')


class IsEstudiante(BasePermission):
    """Permiso: Solo Estudiante puede acceder"""
    def has_permission(self, request, view):
        return request.user and (request.user.is_superuser or getattr(request.user, 'rol', '') == 'ESTUDIANTE')


class ConfiguracionCupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuraciones de cupo por asignatura
    Acceso: Coordinador/Docente
    """
    queryset = ConfiguracionCupo.objects.all()
    serializer_class = ConfiguracionCupoSerializer
    permission_classes = [IsAuthenticated, IsCoordinador]

    def get_queryset(self):
        # Filtrar solo activos
        activo = self.request.query_params.get('activo')
        qs = ConfiguracionCupo.objects.all()
        if activo is not None:
            qs = qs.filter(activo=activo.lower() == 'true')
        return qs


class AsignacionCasoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar asignaciones de casos
    Acceso: Coordinador (crea/actualiza), Estudiante (lee sus propios casos)
    """
    serializer_class = AsignacionCasoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Superusuario o Coordinador ven todos
        if user.is_superuser or getattr(user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']:
            return AsignacionCaso.objects.all().order_by('-fecha_asignacion')
        
        # Estudiante solo ve sus propias asignaciones
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return AsignacionCaso.objects.filter(estudiante=user).order_by('-fecha_asignacion')
        
        # Docente ve todos (para supervisar)
        if getattr(user, 'rol', '') == 'DOCENTE':
            return AsignacionCaso.objects.all().order_by('-fecha_asignacion')
        
        return AsignacionCaso.objects.none()

    def perform_create(self, serializer):
        """Solo Coordinador puede crear asignaciones"""
        if not (self.request.user.is_superuser or getattr(self.request.user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']):
            raise PermissionError('Solo el coordinador puede asignar casos')
        serializer.save()

    @action(detail=False, methods=['get'])
    def mis_asignaciones(self, request):
        """Endpoint para que el estudiante vea sus casos asignados"""
        if getattr(request.user, 'rol', '') != 'ESTUDIANTE':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        asignaciones = AsignacionCaso.objects.filter(estudiante=request.user, estado='ACTIVO')
        serializer = self.get_serializer(asignaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def alumnos_retrasados(self, request):
>>>>>>> Stashed changes
        """
        Sobrescribimos el método create() en lugar de perform_create() 
        para poder abortar la petición y devolver un Error HTTP si expiró el tiempo.
        """
        # Obtenemos los datos del request
        autorizacion_id = request.data.get('autorizacion')
        
<<<<<<< Updated upstream
        if not autorizacion_id:
=======
        retrasados = []
        asignaciones = AsignacionCaso.objects.filter(estado='ACTIVO')
        
        for asignacion in asignaciones:
            porcentaje = asignacion.calcular_porcentaje_avance()
            # Consideramos retrasado si tiene menos del 50% del cupo
            if porcentaje < 50:
                retrasados.append({
                    'id': str(asignacion.id),
                    'estudiante': asignacion.estudiante.get_full_name(),
                    'paciente': str(asignacion.paciente),
                    'asignatura': asignacion.asignatura,
                    'porcentaje_avance': round(porcentaje, 2),
                    'procedimientos_aprobados': asignacion.procedimientos_aprobados,
                    'dias_activo': (timezone.now() - asignacion.fecha_asignacion).days
                })
        
        return Response(retrasados)


class SolicitudSupervisionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para solicitudes de supervisión
    Hitos: Diagnóstico, Inicio, Cierre
    """
    serializer_class = SolicitudSupervisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Estudiante: ve sus propias solicitudes
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return SolicitudSupervision.objects.filter(
                asignacion_caso__estudiante=user
            ).order_by('-fecha_solicitud')
        
        # Docente: ve solicitudes pendientes de su supervisión
        if getattr(user, 'rol', '') == 'DOCENTE':
            return SolicitudSupervision.objects.filter(
                estado='PENDIENTE'
            ).order_by('-fecha_solicitud')
        
        # Admin/Coordinador: ven todas
        if user.is_superuser or getattr(user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']:
            return SolicitudSupervision.objects.all().order_by('-fecha_solicitud')
        
        return SolicitudSupervision.objects.none()

    def perform_create(self, serializer):
        """Estudiante crea la solicitud"""
        asignacion = serializer.validated_data['asignacion_caso']
        if asignacion.estudiante != self.request.user:
            raise PermissionError('Solo el estudiante asignado puede solicitar supervisión')
        serializer.save()


# =========================================================================
# NUEVOS VIEWSETS: FLUJO CLÍNICO-ACADÉMICO (MÓDULOS 4-8)
# =========================================================================

class ControlAcademicoViewSet(viewsets.ModelViewSet):
    """
    Control académico: Aprobación y evaluación de tratamientos.
    Solo Docentes pueden crear y actualizar.
    """
    queryset = ControlAcademico.objects.all()
    serializer_class = ControlAcademicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Docentes ven todos los controles académicos
        if getattr(user, 'rol', '') == 'DOCENTE':
            return ControlAcademico.objects.all().order_by('-creado_en')
        
        # Estudiantes ven solo los de sus tratamientos
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return ControlAcademico.objects.filter(
                tratamiento__estudiante=user
            ).order_by('-creado_en')
        
        # Admin ve todos
        if user.is_superuser:
            return ControlAcademico.objects.all().order_by('-creado_en')
        
        return ControlAcademico.objects.none()

    def validar_estado_control(self, tratamiento, tipo_control):
        if tipo_control == 'Inicial_Plan' and tratamiento.estado != 'Pendiente_Aprobacion':
            raise PermissionDenied('El tratamiento debe estar en "Pendiente Aprobación" para crear el control inicial')
        if tipo_control == 'Final_Ejecucion' and tratamiento.estado != 'Finalizado_Pendiente_Nota':
            raise PermissionDenied('El tratamiento debe estar en "Finalizado Pendiente Nota" para crear el control final')

    def perform_create(self, serializer):
        """Solo docentes pueden crear controles académicos"""
        if getattr(self.request.user, 'rol', '') != 'DOCENTE':
            raise PermissionDenied('Solo docentes pueden crear controles académicos')
        
        tratamiento = serializer.validated_data['tratamiento']
        tipo_control = serializer.validated_data['tipo_control']
        self.validar_estado_control(tratamiento, tipo_control)
        serializer.save(docente=self.request.user)

    def perform_update(self, serializer):
        """Solo docentes pueden actualizar controles académicos respetando el estado del tratamiento"""
        if getattr(self.request.user, 'rol', '') != 'DOCENTE':
            raise PermissionDenied('Solo docentes pueden actualizar controles académicos')

        tratamiento = serializer.instance.tratamiento
        tipo_control = serializer.validated_data.get('tipo_control', serializer.instance.tipo_control)
        self.validar_estado_control(tratamiento, tipo_control)
        serializer.save()


class PagoFacturaViewSet(viewsets.ModelViewSet):
    """
    Gestión de pagos: Caja procesa pagos y emite facturas.
    Solo Recepcionistas/Cajeros pueden crear pagos.
    """
    queryset = PagoFactura.objects.all()
    serializer_class = PagoFacturaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Recepcionistas/Cajeros ven todos los pagos
        if getattr(user, 'rol', '') in ['RECEPCIONISTA', 'CAJERO']:
            return PagoFactura.objects.all().order_by('-creado_en')
        
        # Estudiantes ven solo los de sus tratamientos
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return PagoFactura.objects.filter(
                tratamiento__estudiante=user
            ).order_by('-creado_en')
        
        # Admin ve todos
        if user.is_superuser:
            return PagoFactura.objects.all().order_by('-creado_en')
        
        return PagoFactura.objects.none()

    def perform_create(self, serializer):
        """Solo Recepcionista/Cajero puede procesar pagos"""
        if getattr(self.request.user, 'rol', '') not in ['RECEPCIONISTA', 'CAJERO', 'ADMIN']:
            if not self.request.user.is_superuser:
                raise PermissionDenied('Solo recepcionistas/cajeros pueden procesar pagos')
        
        tratamiento = serializer.validated_data['tratamiento']
        
        # Validación de negocio: solo puede pagar si está aprobado
        if tratamiento.estado != 'Aprobado_Por_Pagar':
            raise PermissionDenied(f'El tratamiento debe estar "Aprobado Por Pagar". Estado actual: {tratamiento.estado}')
        
        # Validación: monto pagado debe coincidir con precio
        monto_pagado = serializer.validated_data['monto_pagado']
        if monto_pagado != tratamiento.precio:
            raise PermissionDenied(f'El monto pagado (Bs {monto_pagado}) no coincide con el precio del tratamiento (Bs {tratamiento.precio})')

        if serializer.validated_data.get('estado_pago') != 'Emitido':
            raise PermissionDenied('El pago debe ser creado en estado Emitido')
        
        serializer.save()


class DespachoAlmacenViewSet(viewsets.ModelViewSet):
    """
    Despacho de insumos desde almacén.
    Solo Almaceneros pueden despachar.
    Descuenta automáticamente del inventario.
    """
    queryset = DespachoAlmacen.objects.all()
    serializer_class = DespachoAlmacenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Almaceneros ven todos los despachos
        if getattr(user, 'rol', '') == 'ALMACENERO':
            return DespachoAlmacen.objects.all().order_by('-creado_en')
        
        # Estudiantes ven solo los de sus tratamientos
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return DespachoAlmacen.objects.filter(
                tratamiento__estudiante=user
            ).order_by('-creado_en')
        
        # Admin ve todos
        if user.is_superuser:
            return DespachoAlmacen.objects.all().order_by('-creado_en')
        
        return DespachoAlmacen.objects.none()

    def perform_create(self, serializer):
        """Solo Almacenero puede despachar"""
        if getattr(self.request.user, 'rol', '') not in ['ALMACENERO', 'ADMIN']:
            if not self.request.user.is_superuser:
                raise PermissionDenied('Solo almaceneros pueden despachar insumos')
        
        tratamiento = serializer.validated_data['tratamiento']
        inventario = serializer.validated_data['inventario']
        cantidad = serializer.validated_data['cantidad_despachada']
        
        # Validación de negocio: solo puede despachar si está pagado
        if tratamiento.estado != 'Pagado_Autorizado':
            raise PermissionDenied(f'El tratamiento debe estar "Pagado y Autorizado". Estado actual: {tratamiento.estado}')

        with transaction.atomic():
            inventario = Inventario.objects.select_for_update().get(pk=inventario.pk)
            if inventario.stock_actual < cantidad:
                raise PermissionDenied(f'Stock insuficiente. Disponible: {inventario.stock_actual}, Solicitado: {cantidad}')
            serializer.save()


class InventarioViewSet(viewsets.ModelViewSet):
    """
    Control de inventario: Gestión de materiales y insumos.
    """
    queryset = Inventario.objects.all()
    serializer_class = InventarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Todos autenticados pueden ver inventario
        return Inventario.objects.all().order_by('material_nombre')
    
    @action(detail=False, methods=['get'])
    def bajo_stock(self, request):
        """
        Endpoint para obtener materiales con stock bajo.
        URL: /api/inventario/bajo_stock/
        """
        materials_bajo_stock = Inventario.objects.filter(
            stock_actual__lte=models.F('stock_minimo')
        ).order_by('stock_actual')
        
        serializer = self.get_serializer(materials_bajo_stock, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Docente aprueba la solicitud (firma electrónica)"""
        if getattr(request.user, 'rol', '') != 'DOCENTE':
            return Response({'error': 'Solo docentes pueden aprobar'}, status=status.HTTP_403_FORBIDDEN)
        
        solicitud = self.get_object()
        
        if solicitud.estado != 'PENDIENTE':
>>>>>>> Stashed changes
            return Response(
                {"error": "Es obligatorio contar con una autorización del docente para subir imágenes."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Buscamos la autorización y verificamos que pertenezca al estudiante logueado
            autorizacion = AutorizacionImagen.objects.get(id=autorizacion_id, estudiante=request.user)
        except AutorizacionImagen.DoesNotExist:
            return Response(
                {"error": "Autorización no válida o no pertenece a este estudiante."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # ---------------------------------------------------------
        # LÓGICA DE NEGOCIO: VALIDAR EL RELOJ (VENTANA DE TIEMPO)
        # ---------------------------------------------------------
        if not autorizacion.esta_vigente():
            # Si el tiempo pasó, la "quemamos"
            if autorizacion.estado == 'PENDIENTE':
                autorizacion.estado = 'EXPIRADA'
                autorizacion.save()
                
                # Auditoría del fallo
                HistorialEntregable.objects.create(
                    autorizacion=autorizacion, actor=request.user, 
                    accion='PLAZO_EXPIRADO', 
                    detalles="Intento bloqueado: El estudiante superó el límite de horas."
                )
            return Response(
                {"error": f"El plazo de {autorizacion.plazo_horas} horas asignado por el docente ha expirado."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Si el tiempo es válido, permitimos que el serializador haga su trabajo normal
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Guardamos la imagen
        nueva_imagen = serializer.save(estudiante=request.user, autorizacion=autorizacion)

        # ---------------------------------------------------------
        # LÓGICA POST-GUARDADO: ACTUALIZAR ESTADOS Y AUDITORÍA
        # ---------------------------------------------------------
        autorizacion.estado = 'COMPLETADA'
        autorizacion.save()

        HistorialEntregable.objects.create(
            autorizacion=autorizacion, actor=request.user, 
            accion='IMAGEN_SUBIDA', 
            detalles=f"Imagen {nueva_imagen.categoria} cargada exitosamente a tiempo."
        )

        # [AQUÍ ENTRARÍA CELERY EN EL FUTURO]
        if nueva_imagen.categoria == 'DICOM':
            # procesar_radiografia_ia.delay(nueva_imagen.id)
            HistorialEntregable.objects.create(
                autorizacion=autorizacion, actor=None, # Sistema automático
                accion='IA_INICIADA', detalles="Radiografía enviada al motor de Inteligencia Artificial."
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
>>>>>>> Stashed changes
