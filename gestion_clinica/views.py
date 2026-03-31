from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, BasePermission


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

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        appointment = self.get_object()
        from django.utils import timezone
        appointment.check_in_time = timezone.now()
        appointment.status = Appointment.STATUS_CONFIRMED
        appointment.save()

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
    queryset = User.objects.order_by('-created_at')
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