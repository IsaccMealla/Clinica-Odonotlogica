from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

# --- IMPORTACIONES DE TIEMPO PARA FILTROS ---
from django.utils import timezone
from datetime import timedelta

# --- IMPORTACIONES PARA USUARIOS Y RECUPERACIÓN DE CONTRASEÑA ---
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

# --- IMPORTACIONES DE MODELOS Y SERIALIZADORES ---
from .models import *
from .serializers import *

# Obtenemos el modelo de usuario activo (sea el por defecto o uno personalizado)
User = get_user_model()

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


# =========================================================================
# VIEWSET DE PACIENTES Y ANTECEDENTES
# =========================================================================
class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra pacientes activos/inactivos y aplica SEGURIDAD POR ROLES.
        """
        user = self.request.user
        
        # 1. Seguridad básica
        if not user.is_authenticated:
            return Paciente.objects.none()

        # 2. Filtrar por papelera o activos
        # CORRECCIÓN: 'restaurar' también necesita buscar entre los inactivos
        if self.action in ['papelera', 'restaurar']: 
            qs = Paciente.objects.filter(activo=False)
        else:
            qs = Paciente.objects.filter(activo=True)

        # 3. 🌟 PASE VIP PARA SUPERADMINS 🌟
        if user.is_superuser:
            return qs

        # 4. Filtrar por ROLES
        if getattr(user, 'rol', None) == 'ESTUDIANTE':
            qs = qs.filter(estudiante_asignado=user)
            
        # Si es ADMIN, DOCENTE o RECEPCIONISTA (y no es superuser), ve todos
        return qs

    # --- NUEVA ACCIÓN: Pacientes específicos del estudiante logueado ---
    @action(detail=False, methods=['get'])
    def mis_asignaciones(self, request):
        """
        Retorna solo los pacientes que el estudiante tiene asignados.
        URL: /api/pacientes/mis_asignaciones/
        """
        # Aprovechamos la lógica de filtrado que ya escribiste en get_queryset
        pacientes = self.get_queryset()
        
        # Opcional: Si quieres estar 100% seguro de que solo devuelva los del estudiante
        # incluso si un admin llama a esta ruta:
        if getattr(request.user, 'rol', None) == 'ESTUDIANTE':
            pacientes = pacientes.filter(estudiante_asignado=request.user)
            
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
            # CORRECCIÓN: get_object() usa las reglas de get_queryset. 
            # ¡Ahora es 100% seguro y respeta los roles!
            paciente = self.get_object() 
            paciente.activo = True
            paciente.save()
            return Response({'message': 'Paciente restaurado con éxito'}, status=status.HTTP_200_OK)
        except Exception:
            # Capturamos cualquier error (ej. 404 si el paciente no existe o es de otro estudiante)
            return Response({'error': 'Paciente no encontrado o no tienes permisos'}, status=status.HTTP_404_NOT_FOUND)

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

# --- VIEWSETS INDIVIDUALES ---
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


# =========================================================================
# FUNCIÓN DE RECUPERACIÓN DE CONTRASEÑA
# =========================================================================
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


# =========================================================================
# ESTADÍSTICAS PARA GRÁFICO 3D
# =========================================================================
@api_view(['GET'])
@permission_classes([AllowAny]) # Cambia a [IsAuthenticated] si prefieres protegerlo
def estadisticas_3d_view(request):
    """
    Endpoint para el gráfico 3D de React.
    Recibe: ?tipo=usuarios|clinico & tiempo=hoy|semana|mes|siempre
    """
    tipo = request.GET.get('tipo', 'usuarios')
    tiempo = request.GET.get('tiempo', 'mes')

    # Lógica de cálculo de fechas para el filtro de tiempo
    now = timezone.now()
    if tiempo == 'hoy':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif tiempo == 'semana':
        start_date = now - timedelta(days=now.weekday()) # Lunes de esta semana
    elif tiempo == 'mes':
        start_date = now.replace(day=1, hour=0, minute=0, second=0) # Día 1 del mes actual
    else:
        start_date = None # 'siempre' o cualquier otro valor

    data = []

    # ==========================================
    # CASO 1: POBLACIÓN (Usuarios y Pacientes)
    # ==========================================
    if tipo == 'usuarios':
        estudiantes = User.objects.filter(rol='ESTUDIANTE')
        docentes = User.objects.filter(rol='DOCENTE')
        pacientes = Paciente.objects.filter(activo=True)

        # Aplicar filtro de fecha si no es "siempre"
        if start_date:
            estudiantes = estudiantes.filter(date_joined__gte=start_date)
            docentes = docentes.filter(date_joined__gte=start_date)
            pacientes = pacientes.filter(creado_en__gte=start_date)

        data = [
            { "nombre": "Estudiantes", "valor": estudiantes.count(), "desc": "Usuarios activos", "color": "#3b82f6" },
            { "nombre": "Docentes", "valor": docentes.count(), "desc": "Usuarios activos", "color": "#f59e0b" },
            { "nombre": "Pacientes", "valor": pacientes.count(), "desc": "Registrados", "color": "#10b981" },
        ]

    # ==========================================
    # CASO 2: REGISTROS CLÍNICOS
    # ==========================================
    elif tipo == 'clinico':
        pacientes = Paciente.objects.filter(activo=True)
        # Usamos AntecedentePatologicoPersonal como proxy de "Carpeta Médica" creada
        carpetas = AntecedentePatologicoPersonal.objects.all()
        periodontogramas = ExamenPeriodontal.objects.all()

        # Aplicar filtro de fecha
        if start_date:
            pacientes = pacientes.filter(creado_en__gte=start_date)
            carpetas = carpetas.filter(creado_en__gte=start_date)
            # Como SeguimientoAcademico tiene fecha_aprobacion y puede ser null si está en borrador,
            # filtramos aquellos que tengan una fecha de aprobación mayor o igual a start_date.
            # Alternativamente, si quieres basarte en cuándo se aprobó:
            periodontogramas = periodontogramas.filter(fecha_aprobacion__gte=start_date)

        data = [
            { "nombre": "Pacientes", "valor": pacientes.count(), "desc": "En sistema", "color": "#10b981" },
            { "nombre": "Carpetas", "valor": carpetas.count(), "desc": "Antecedentes", "color": "#8b5cf6" },
            { "nombre": "Periodonto.", "valor": periodontogramas.count(), "desc": "Exámenes", "color": "#ec4899" },
        ]

    return Response(data)