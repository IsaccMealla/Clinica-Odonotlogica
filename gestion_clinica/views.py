from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
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
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

# --- IMPORTACIONES DE MODELOS Y SERIALIZADORES ---
from .models import *
from .serializers import *

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