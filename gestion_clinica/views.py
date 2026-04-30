from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
# --- NUEVA IMPORTACIÓN PARA RECIBIR ARCHIVOS/FOTOS ---
from rest_framework.parsers import MultiPartParser, FormParser 
# Asegúrate de importar el modelo y el serializador en la parte superior:
from .models import Sillon 
from .serializers import SillonSerializer
from .models import ImagenClinica
from .serializers import ImagenClinicaSerializer
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
        pacientes = self.get_queryset()
        
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
            paciente = self.get_object() 
            paciente.activo = True
            paciente.save()
            return Response({'message': 'Paciente restaurado con éxito'}, status=status.HTTP_200_OK)
        except Exception:
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
            serializer = self.get_serializer(paciente)
            data = serializer.data
            
            # Función auxiliar para sacar el primer elemento si es una lista (por los ForeignKey)
            def get_first(item):
                return item[0] if item and isinstance(item, list) else item

            return Response({
                'familiares': data.get('antecedentes_familiares'),
                'personales': data.get('antecedentes_personales'),
                'no_patologicos': data.get('antecedentes_no_patologicos'),
                'ginecologicos': data.get('antecedentes_ginecologicos'),
                'habitos': data.get('habitos'),
                'antecedentes_periodontales': data.get('antecedentes_periodontales'),
                'historia_odontopediatrica': data.get('historia_odontopediatrica'),
                # 👇 Usamos la función para los que son ForeignKey y vienen en lista 👇
                'examen_periodontal': get_first(data.get('examen_periodontal')),
                'prostodoncia_removible': get_first(data.get('prostodoncia_removible')),
                'prostodoncia_fija': get_first(data.get('prostodoncia_fija')),
                'protocolo_quirurgico': get_first(data.get('protocolo_quirurgico')),
                'examen_clinico_fisico': get_first(data.get('examen_clinico_fisico')),
            })

        if request.method == 'POST':
            data = request.data
            
            # Función auxiliar para inyectar el ID en cada sección antes de guardar
            def limpiar_datos(seccion_data):
                if isinstance(seccion_data, dict):
                    # Creamos una copia para evitar el error de "QueryDict is immutable"
                    data_copia = dict(seccion_data)
                    data_copia.pop('id', None)
                    data_copia.pop('paciente', None)
                    
                    # 🌟 SOLUCIÓN AQUÍ: Obtenemos el usuario directamente adentro de la función
                    estudiante_final = paciente.estudiante_asignado if paciente.estudiante_asignado else request.user
                    data_copia['estudiante'] = estudiante_final
                    
                    return data_copia
                return seccion_data
                
            # 1. Formularios Base
            if 'familiares' in data:
                AntecedentePatologicoFamiliar.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['familiares'])
                )
            if 'personales' in data:
                AntecedentePatologicoPersonal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['personales'])
                )
            if 'no_patologicos' in data:
                AntecedenteNoPatologicoPersonal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['no_patologicos'])
                )
            if 'ginecologicos' in data:
                AntecedenteGinecologico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['ginecologicos'])
                )
            
            # 2. Nuevos Formularios
            if 'habitos' in data:
                Habitos.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['habitos'])
                )
            if 'antecedentes_periodontales' in data:
                AntecedentesPeriodontales.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['antecedentes_periodontales'])
                )
            if 'examen_periodontal' in data:
                ExamenPeriodontal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['examen_periodontal'])
                )
            if 'historia_odontopediatrica' in data:
                HistoriaOdontopediatrica.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['historia_odontopediatrica'])
                )
            if 'prostodoncia_removible' in data:
                ProstodonciaRemovible.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['prostodoncia_removible'])
                )
            if 'prostodoncia_fija' in data:
                ProstodonciaFija.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['prostodoncia_fija'])
                )
            if 'protocolo_quirurgico' in data:
                ProtocoloQuirurgico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['protocolo_quirurgico'])
                )
            if 'examen_clinico_fisico' in data:
                ExamenClinicoFisico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['examen_clinico_fisico'])
                )

            return Response({'message': 'Historial clínico actualizado correctamente'}, status=status.HTTP_200_OK)
# Función auxiliar para inyectar el ID en cada sección antes de guardar
            def limpiar_datos(seccion_data):
                if isinstance(seccion_data, dict):
                    # Creamos una copia para evitar el error de "QueryDict is immutable"
                    data_copia = dict(seccion_data)
                    data_copia.pop('id', None)
                    data_copia.pop('paciente', None)
                    
                    # 👇 AQUÍ ESTÁ LA MAGIA: Inyectamos el usuario automáticamente 👇
                    estudiante_final = paciente.estudiante_asignado if paciente.estudiante_asignado else request.user
                    data_copia['estudiante'] = estudiante_final
                    return data_copia
                return seccion_data
                # 1. Formularios Base
            if 'familiares' in data:
                AntecedentePatologicoFamiliar.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['familiares'])
                )
            if 'personales' in data:
                AntecedentePatologicoPersonal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['personales'])
                )
            if 'no_patologicos' in data:
                AntecedenteNoPatologicoPersonal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['no_patologicos'])
                )
            if 'ginecologicos' in data:
                AntecedenteGinecologico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['ginecologicos'])
                )
            
            # 2. Nuevos Formularios
            if 'habitos' in data:
                Habitos.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['habitos'])
                )
            if 'antecedentes_periodontales' in data:
                AntecedentesPeriodontales.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['antecedentes_periodontales'])
                )
            if 'examen_periodontal' in data:
                ExamenPeriodontal.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['examen_periodontal'])
                )
            if 'historia_odontopediatrica' in data:
                HistoriaOdontopediatrica.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['historia_odontopediatrica'])
                )
            if 'prostodoncia_removible' in data:
                ProstodonciaRemovible.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['prostodoncia_removible'])
                )
            if 'prostodoncia_fija' in data:
                ProstodonciaFija.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['prostodoncia_fija'])
                )
            if 'protocolo_quirurgico' in data:
                ProtocoloQuirurgico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['protocolo_quirurgico'])
                )
            if 'examen_clinico_fisico' in data:
                ExamenClinicoFisico.objects.update_or_create(
                    paciente=paciente, defaults=limpiar_datos(data['examen_clinico_fisico'])
                )

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

class PeriodontogramaViewSet(viewsets.ModelViewSet):
    queryset = Periodontograma.objects.all()
    serializer_class = PeriodontogramaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por paciente si se proporciona en la query"""
        queryset = Periodontograma.objects.all()
        paciente_id = self.request.query_params.get('paciente', None)
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Crear periodontograma con mejor manejo de errores"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print("Error al crear periodontograma:", str(e))
            print(traceback.format_exc())
            raise
    
    def update(self, request, *args, **kwargs):
        """Actualizar periodontograma con mejor manejo de errores"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print("Error al actualizar periodontograma:", str(e))
            print(traceback.format_exc())
            raise
    
    def perform_create(self, serializer):
        """Al crear, asegurarse de que estudiante es el usuario actual y estado es BORRADOR"""
        serializer.save(
            estudiante=self.request.user,
            estado_academico='BORRADOR'
        )
    
    def perform_update(self, serializer):
        """Al actualizar, mantener el estudiante actual"""
        serializer.save(estudiante=self.request.user)

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
# NUEVOS VIEWSETS: TRATAMIENTOS, AVANCES Y TRANSFERENCIAS
# =========================================================================

class TratamientoViewSet(viewsets.ModelViewSet):
    serializer_class = TratamientoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # 1. Seguridad básica
        if not user.is_authenticated:
            return Tratamiento.objects.none()
            
        # 2. Superusuario o Docente/Admin ven todos los tratamientos
        if user.is_superuser or getattr(user, 'rol', '') in ['DOCENTE', 'ADMIN', 'ADMINISTRADOR']:
            return Tratamiento.objects.all().order_by('-creado_en')
            
        # 3. Estudiantes solo ven los tratamientos asignados a ellos
        if getattr(user, 'rol', '') == 'ESTUDIANTE':
            return Tratamiento.objects.filter(estudiante=user).order_by('-creado_en')
            
        # 4. Fallback de seguridad
        return Tratamiento.objects.none()

class AvanceClinicoViewSet(viewsets.ModelViewSet):
    queryset = AvanceClinico.objects.all()
    serializer_class = AvanceClinicoSerializer
    permission_classes = [IsAuthenticated]
    # filterset_fields = ['tratamiento', 'estudiante', 'estado_academico'] # Descomenta si usas django-filter

class EvidenciaViewSet(viewsets.ModelViewSet):
    queryset = Evidencia.objects.all()
    serializer_class = EvidenciaSerializer
    permission_classes = [IsAuthenticated]
    # Súper importante: parser_classes permite recibir multipart/form-data (archivos)
    parser_classes = (MultiPartParser, FormParser)

class TransferenciaViewSet(viewsets.ModelViewSet):
    queryset = Transferencia.objects.all()
    serializer_class = TransferenciaSerializer
    permission_classes = [IsAuthenticated]
    # filterset_fields = ['paciente', 'estudiante_origen', 'estudiante_destino', 'estado'] # Descomenta si usas django-filter


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
            periodontogramas = periodontogramas.filter(fecha_aprobacion__gte=start_date)

        data = [
            { "nombre": "Pacientes", "valor": pacientes.count(), "desc": "En sistema", "color": "#10b981" },
            { "nombre": "Carpetas", "valor": carpetas.count(), "desc": "Antecedentes", "color": "#8b5cf6" },
            { "nombre": "Periodonto.", "valor": periodontogramas.count(), "desc": "Exámenes", "color": "#ec4899" },
        ]

    return Response(data)

# gestion_clinica/views.py


# ... aquí están tus otras vistas (UsuarioViewSet, PacienteViewSet, etc) ...

# Agrega esto al final de tu archivo views.py
class SillonViewSet(viewsets.ModelViewSet):
    queryset = Sillon.objects.all()
    serializer_class = SillonSerializer


# =========================================================================
# VIEWSET DE CITAS (MEJORADO CON VALIDACIÓN Y AUDITORÍA)
# =========================================================================
class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all().order_by('fecha_hora')
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['estado', 'paciente', 'estudiante', 'docente', 'gabinete']

    def validate_conflict(self, paciente, estudiante, docente, gabinete, fecha_hora, duracion, exclude_id=None):
        """Valida conflictos de doble reserva"""
        from datetime import timedelta as td
        
        fecha_fin = fecha_hora + td(minutes=duracion)
        
        conflicts = Cita.objects.filter(
            estado__in=['RESERVADA', 'CONFIRMADA', 'EN_ESPERA', 'ATENDIENDO']
        )
        
        if exclude_id:
            conflicts = conflicts.exclude(id=exclude_id)
        
        # Verificar gabinete
        gabinete_conflict = conflicts.filter(
            gabinete=gabinete,
            fecha_hora__lt=fecha_fin,
            fecha_hora__gte=fecha_hora - td(minutes=30)
        )
        
        if gabinete_conflict.exists():
            return False, "El gabinete está ocupado en ese horario"
        
        # Verificar estudiante
        estudiante_conflict = conflicts.filter(
            estudiante=estudiante,
            fecha_hora__lt=fecha_fin,
            fecha_hora__gte=fecha_hora - td(minutes=duracion)
        )
        
        if estudiante_conflict.exists():
            return False, "El estudiante tiene otra cita en ese horario"
        
        # Verificar docente
        docente_conflict = conflicts.filter(
            docente=docente,
            fecha_hora__lt=fecha_fin,
            fecha_hora__gte=fecha_hora - td(minutes=duracion)
        )
        
        if docente_conflict.exists():
            return False, "El docente tiene otra cita en ese horario"
        
        return True, "OK"

    def perform_create(self, serializer):
        data = serializer.validated_data
        is_valid, message = self.validate_conflict(
            data['paciente'],
            data['estudiante'],
            data['docente'],
            data['gabinete'],
            data['fecha_hora'],
            data['duracion_estimada']
        )
        
        if not is_valid:
            raise serializers.ValidationError(message)
        
        cita = serializer.save()
        
        # Registrar en auditoría
        AuditoriaCita.objects.create(
            cita=cita,
            tipo_cambio='CREACION',
            usuario=self.request.user,
            descripcion='Cita creada por ' + self.request.user.get_full_name()
        )

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Marca el check-in del paciente"""
        cita = self.get_object()
        
        if cita.estado not in ['CONFIRMADA', 'RESERVADA']:
            return Response(
                {'error': 'La cita no puede marcar check-in en estado ' + cita.estado},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cita.estado = 'EN_ESPERA'
        cita.check_in_time = timezone.now()
        cita.save()
        
        # Registrar en auditoría
        AuditoriaCita.objects.create(
            cita=cita,
            tipo_cambio='CHECK_IN',
            usuario=request.user,
            descripcion='Paciente marcado en sala de espera'
        )
        
        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela una cita"""
        cita = self.get_object()
        
        if cita.estado == 'CANCELADA':
            return Response(
                {'error': 'La cita ya está cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data
        cita.estado = 'CANCELADA'
        cita.cancelada_en = timezone.now()
        cita.razon_cancelacion = data.get('razon', 'OTRA')
        cita.motivo_cancelacion = data.get('motivo', '')
        cita.cancelada_por = request.user
        cita.save()
        
        # Registrar en auditoría
        AuditoriaCita.objects.create(
            cita=cita,
            tipo_cambio='CANCELACION',
            usuario=request.user,
            descripcion=f'Cita cancelada: {cita.motivo_cancelacion}',
            valores_nuevos={'razon': cita.razon_cancelacion}
        )
        
        serializer = self.get_serializer(cita)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================================================================
# VIEWSET DE CITAS RECURRENTES
# =========================================================================
class CitaRecurrenteViewSet(viewsets.ModelViewSet):
    queryset = CitaRecurrente.objects.all().order_by('fecha_inicio')
    serializer_class = CitaRecurrenteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['paciente', 'estudiante', 'docente', 'gabinete', 'activa']

    def perform_create(self, serializer):
        cita_recurrente = serializer.save()
        
        from datetime import datetime as dt
        
        fecha_hora = dt.combine(cita_recurrente.fecha_inicio, cita_recurrente.hora)
        
        Cita.objects.create(
            paciente=cita_recurrente.paciente,
            estudiante=cita_recurrente.estudiante,
            docente=cita_recurrente.docente,
            gabinete=cita_recurrente.gabinete,
            motivo=cita_recurrente.motivo,
            fecha_hora=fecha_hora,
            duracion_estimada=cita_recurrente.duracion_estimada,
            cita_recurrente=cita_recurrente,
            estado='RESERVADA'
        )


# =========================================================================
# VIEWSET DE CONFIGURACIÓN DE ALERTAS
# =========================================================================
class ConfiguracionAlertasViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionAlertas.objects.all()
    serializer_class = ConfiguracionAlertasSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        obj, created = ConfiguracionAlertas.objects.get_or_create(pk=1)
        return ConfiguracionAlertas.objects.filter(pk=1)


# =========================================================================
# VIEWSET DE AUDITORÍA DE CITAS
# =========================================================================
class AuditoriaCitaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditoriaCita.objects.all()
    serializer_class = AuditoriaCitaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['cita', 'tipo_cambio', 'usuario']


# =========================================================================
# VIEWSET DE HISTÓRICO DE ABANDONO
# =========================================================================
class HistoricoAbandonoPacienteViewSet(viewsets.ModelViewSet):
    queryset = HistoricoAbandonoPaciente.objects.all()
    serializer_class = HistoricoAbandonoPacienteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['paciente', 'reactivado']

    @action(detail=True, methods=['post'])
    def reactivar(self, request, pk=None):
        """Reactiva un paciente abandonado"""
        abandono = self.get_object()
        
        if abandono.reactivado:
            return Response(
                {'error': 'El paciente ya ha sido reactivado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        paciente = abandono.paciente
        paciente.alerta_abandono = False
        paciente.activo = True
        paciente.inasistencias = 0
        paciente.save()
        
        abandono.reactivado = True
        abandono.fecha_reactivacion = timezone.now()
        abandono.save()
        
        serializer = self.get_serializer(abandono)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
    # =========================================================================
# RADIOGRAFIAS
# =========================================================================
class ImagenClinicaViewSet(viewsets.ModelViewSet):
    queryset = ImagenClinica.objects.all()
    serializer_class = ImagenClinicaSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Permite filtrar en el frontend usando: /api/imagenes/?paciente=ID
        paciente_id = self.request.query_params.get('paciente')
        if paciente_id:
            return self.queryset.filter(paciente_id=paciente_id)
        return self.queryset

    def perform_create(self, serializer):
        # Asigna automáticamente el estudiante que está logueado
        serializer.save(estudiante=self.request.user)


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
        """
        Reporte de alumnos retrasados (avance < al esperado)
        Acceso: Coordinador
        """
        if not (request.user.is_superuser or getattr(request.user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']):
            return Response({'error': 'Solo el coordinador puede ver este reporte'}, status=status.HTTP_403_FORBIDDEN)
        
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

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Docente aprueba la solicitud (firma electrónica)"""
        if getattr(request.user, 'rol', '') != 'DOCENTE':
            return Response({'error': 'Solo docentes pueden aprobar'}, status=status.HTTP_403_FORBIDDEN)
        
        solicitud = self.get_object()
        
        if solicitud.estado != 'PENDIENTE':
            return Response(
                {'error': f'Solicitud ya está en estado {solicitud.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        solicitud.estado = 'APROBADO'
        solicitud.docente_supervisor = request.user
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.save()
        
        # Incrementar procedimientos aprobados
        asignacion = solicitud.asignacion_caso
        asignacion.procedimientos_aprobados += 1
        asignacion.save()
        
        # Crear evaluación por defecto si no existe
        if not hasattr(solicitud, 'evaluacion'):
            EvaluacionDesempeño.objects.create(solicitud_supervision=solicitud)
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Docente rechaza la solicitud"""
        if getattr(request.user, 'rol', '') != 'DOCENTE':
            return Response({'error': 'Solo docentes pueden rechazar'}, status=status.HTTP_403_FORBIDDEN)
        
        solicitud = self.get_object()
        observaciones = request.data.get('observaciones', '')
        
        solicitud.estado = 'RECHAZADO'
        solicitud.observaciones_docente = observaciones
        solicitud.save()
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)


class EvaluacionDesempeñoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para evaluaciones de desempeño
    Incluye alerta temprana de bajo desempeño
    """
    serializer_class = EvaluacionDesempeñoSerializer
    permission_classes = [IsAuthenticated, IsDocente]

    def get_queryset(self):
        user = self.request.user
        
        # Docente ve evaluaciones de sus supervisiones
        if getattr(user, 'rol', '') == 'DOCENTE':
            return EvaluacionDesempeño.objects.filter(
                solicitud_supervision__docente_supervisor=user
            ).order_by('-fecha_evaluacion')
        
        # Admin ve todas
        if user.is_superuser or getattr(user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']:
            return EvaluacionDesempeño.objects.all().order_by('-fecha_evaluacion')
        
        return EvaluacionDesempeño.objects.none()

    def perform_update(self, serializer):
        """Al actualizar evaluación, verificar alerta temprana y notificar"""
        evaluacion = serializer.save()
        
        # Si se marca alerta temprana, crear notificación
        if evaluacion.alerta_temprana and evaluacion.motivo_detalle:
            # Aquí se dispara la notificación a Coordinación Clínica
            self._crear_notificacion_alerta_temprana(evaluacion)

    def _crear_notificacion_alerta_temprana(self, evaluacion):
        """Crea una notificación inmediata a Coordinación Clínica"""
        from .models import Notificacion  # Asumiendo que existe modelo Notificacion
        
        try:
            # Obtener coordinadores/admins
            coordinadores = User.objects.filter(rol__in=['ADMIN', 'ADMINISTRADOR'])
            
            mensaje = f"""
            ⚠️ ALERTA TEMPRANA DE BAJO DESEMPEÑO
            
            Estudiante: {evaluacion.solicitud_supervision.asignacion_caso.estudiante.get_full_name()}
            Paciente: {evaluacion.solicitud_supervision.asignacion_caso.paciente}
            Hito: {evaluacion.solicitud_supervision.get_tipo_hito_display()}
            
            Motivo: {evaluacion.motivo_detalle}
            Calificación: {evaluacion.get_calificacion_display()}
            Promedio de Criterios: {evaluacion.promedio_criterios:.1f}
            """
            
            for coordinador in coordinadores:
                Notificacion.objects.create(
                    usuario=coordinador,
                    titulo='Alerta Temprana de Bajo Desempeño',
                    mensaje=mensaje,
                    tipo='ALERTA',
                    prioridad='ALTA',
                    relacionado_con=f'evaluacion_{evaluacion.id}'
                )
        except Exception as e:
            # Log silencioso si el modelo de notificación no existe
            print(f"No se pudo crear notificación: {e}")

    @action(detail=False, methods=['get'])
    def alertas_activas(self, request):
        """Obtiene todas las alertas tempranas activas"""
        if not (request.user.is_superuser or getattr(request.user, 'rol', '') in ['ADMIN', 'ADMINISTRADOR']):
            return Response({'error': 'Solo administradores'}, status=status.HTTP_403_FORBIDDEN)
        
        alertas = EvaluacionDesempeño.objects.filter(alerta_temprana=True).order_by('-fecha_evaluacion')
        serializer = self.get_serializer(alertas, many=True)
        return Response(serializer.data)