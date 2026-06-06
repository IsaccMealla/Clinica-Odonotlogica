# FILE: gestion_clinica/views_materias.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models_materias import Materia, MateriaDocente, MateriaEstudiante, SolicitudGuardado, RegistroAsistencia
from .serializers_materias import (
    MateriaSerializer, MateriaDocenteSerializer, MateriaEstudianteSerializer,
    SolicitudGuardadoSerializer, RegistroAsistenciaSerializer
)
from notificaciones.models import Notificacion

User = get_user_model()


class IsAdminOrDocente(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        role = getattr(request.user, 'rol', '').upper()
        return request.user.is_authenticated and (request.user.is_superuser or role in ['ADMIN', 'DOCENTE'])


# ==========================================
# VIEWSET DE MATERIAS
# ==========================================
class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [IsAdminOrDocente]
    pagination_class = None


# ==========================================
# VIEWSET DE ASIGNACIÓN MATERIA-DOCENTE
# ==========================================
class MateriaDocenteViewSet(viewsets.ModelViewSet):
    queryset = MateriaDocente.objects.all()
    serializer_class = MateriaDocenteSerializer
    permission_classes = [IsAdminOrDocente]
    pagination_class = None

    def get_queryset(self):
        qs = MateriaDocente.objects.all()
        docente_id = self.request.query_params.get('docente')
        materia_id = self.request.query_params.get('materia')
        if docente_id:
            qs = qs.filter(docente_id=docente_id)
        if materia_id:
            qs = qs.filter(materia_id=materia_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        # Actualizar estudiantes inscritos en esta materia
        MateriaEstudiante.objects.filter(materia=instance.materia, estado='CURSANDO').update(docente_asignado=instance.docente)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.activo:
            MateriaEstudiante.objects.filter(materia=instance.materia, estado='CURSANDO').update(docente_asignado=instance.docente)
        else:
            MateriaEstudiante.objects.filter(materia=instance.materia, estado='CURSANDO', docente_asignado=instance.docente).update(docente_asignado=None)


# ==========================================
# VIEWSET DE INSCRIPCIÓN MATERIA-ESTUDIANTE
# ==========================================
class MateriaEstudianteViewSet(viewsets.ModelViewSet):
    queryset = MateriaEstudiante.objects.all()
    serializer_class = MateriaEstudianteSerializer
    permission_classes = [IsAdminOrDocente]
    pagination_class = None

    def get_queryset(self):
        qs = MateriaEstudiante.objects.all()
        estudiante_id = self.request.query_params.get('estudiante')
        materia_id = self.request.query_params.get('materia')
        if estudiante_id:
            qs = qs.filter(estudiante_id=estudiante_id)
        if materia_id:
            qs = qs.filter(materia_id=materia_id)
        return qs

    def perform_create(self, serializer):
        """Auto-assign docente when a student enrolls in a materia"""
        materia = serializer.validated_data['materia']
        # Find a docente assigned to this materia
        materia_docente = MateriaDocente.objects.filter(materia=materia, activo=True).first()
        docente = materia_docente.docente if materia_docente else None
        serializer.save(docente_asignado=docente)

    @action(detail=False, methods=['get'])
    def mis_materias(self, request):
        """Retorna las materias del usuario actual (estudiante o docente)"""
        user = request.user
        if user.rol == 'ESTUDIANTE':
            inscripciones = MateriaEstudiante.objects.filter(estudiante=user, estado='CURSANDO')
            serializer = MateriaEstudianteSerializer(inscripciones, many=True)
            return Response(serializer.data)
        elif user.rol == 'DOCENTE':
            asignaciones = MateriaDocente.objects.filter(docente=user, activo=True)
            serializer = MateriaDocenteSerializer(asignaciones, many=True)
            return Response(serializer.data)
        else:
            # Admin sees all
            materias = Materia.objects.filter(activa=True)
            serializer = MateriaSerializer(materias, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def record_academico(self, request):
        """Retorna el récord académico del estudiante con docente asignado por materia"""
        user = request.user
        estudiante_id = request.query_params.get('estudiante_id', user.id)
        inscripciones = MateriaEstudiante.objects.filter(estudiante_id=estudiante_id).select_related('materia', 'docente_asignado')
        serializer = MateriaEstudianteSerializer(inscripciones, many=True)
        return Response(serializer.data)


# ==========================================
# VIEWSET DE SOLICITUDES DE GUARDADO
# ==========================================
class SolicitudGuardadoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudGuardado.objects.all()
    serializer_class = SolicitudGuardadoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SolicitudGuardado.objects.all()
        
        if user.rol == 'ESTUDIANTE':
            qs = qs.filter(estudiante=user)
        elif user.rol == 'DOCENTE':
            qs = qs.filter(docente=user)
        
        return qs

    def perform_create(self, serializer):
        """Create a solicitud and notify the docente"""
        solicitud = serializer.save(estudiante=self.request.user)
        
        # Create notification for the docente with sound
        Notificacion.objects.create(
            usuario_destino=solicitud.docente,
            titulo=f'📋 Solicitud de Revisión - {solicitud.get_tipo_guardado_display()}',
            mensaje=f'{self.request.user.get_full_name()} solicita revisión para guardar {solicitud.get_tipo_guardado_display()}. Paciente: {solicitud.paciente or "N/A"}. Descripción: {solicitud.descripcion}',
            tipo='SOLICITUD_GUARDADO',
            sonido=True,
            datos_extra={
                'solicitud_id': str(solicitud.id),
                'estudiante_id': solicitud.estudiante_id,
                'tipo': solicitud.tipo_guardado
            }
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """El docente aprueba la solicitud de guardado"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'PENDIENTE':
            return Response({'error': 'Esta solicitud ya fue procesada'}, status=status.HTTP_400_BAD_REQUEST)
        
        ventana_min = request.data.get('tiempo_ventana_minutos', 30)
        
        solicitud.estado = 'APROBADO'
        solicitud.fecha_respuesta = timezone.now()
        solicitud.tiempo_ventana_minutos = ventana_min
        solicitud.fecha_expiracion = timezone.now() + timedelta(minutes=ventana_min)
        solicitud.save()
        
        # Notify the student
        Notificacion.objects.create(
            usuario_destino=solicitud.estudiante,
            titulo=f'✅ Solicitud Aprobada - {solicitud.get_tipo_guardado_display()}',
            mensaje=f'El docente {request.user.get_full_name()} ha aprobado tu solicitud. Tienes {ventana_min} minutos para guardar tu progreso.',
            tipo='RESPUESTA_GUARDADO',
            sonido=True,
            datos_extra={
                'solicitud_id': str(solicitud.id),
                'estado': 'APROBADO',
                'expiracion': solicitud.fecha_expiracion.isoformat()
            }
        )
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """El docente rechaza la solicitud"""
        solicitud = self.get_object()
        
        if solicitud.estado != 'PENDIENTE':
            return Response({'error': 'Esta solicitud ya fue procesada'}, status=status.HTTP_400_BAD_REQUEST)
        
        justificacion = request.data.get('justificacion', '')
        
        solicitud.estado = 'RECHAZADO'
        solicitud.fecha_respuesta = timezone.now()
        solicitud.justificacion_rechazo = justificacion
        solicitud.save()
        
        # Notify the student
        Notificacion.objects.create(
            usuario_destino=solicitud.estudiante,
            titulo=f'❌ Solicitud Rechazada - {solicitud.get_tipo_guardado_display()}',
            mensaje=f'El docente {request.user.get_full_name()} ha rechazado tu solicitud. Justificación: {justificacion}',
            tipo='RESPUESTA_GUARDADO',
            sonido=True,
            datos_extra={
                'solicitud_id': str(solicitud.id),
                'estado': 'RECHAZADO',
                'justificacion': justificacion
            }
        )
        
        serializer = self.get_serializer(solicitud)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Retorna solo las solicitudes pendientes del docente"""
        user = request.user
        qs = SolicitudGuardado.objects.filter(estado='PENDIENTE')
        if user.rol == 'DOCENTE':
            qs = qs.filter(docente=user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def verificar_permiso(self, request):
        """Verifica si el estudiante tiene un permiso vigente para guardar"""
        tipo = request.query_params.get('tipo')
        paciente_id = request.query_params.get('paciente_id')
        
        solicitud = SolicitudGuardado.objects.filter(
            estudiante=request.user,
            tipo_guardado=tipo,
            estado='APROBADO',
            fecha_expiracion__gt=timezone.now()
        )
        if paciente_id:
            solicitud = solicitud.filter(paciente_id=paciente_id)
        
        solicitud = solicitud.first()
        
        if solicitud:
            return Response({
                'tiene_permiso': True,
                'solicitud_id': str(solicitud.id),
                'expira_en': solicitud.fecha_expiracion.isoformat(),
                'minutos_restantes': max(0, (solicitud.fecha_expiracion - timezone.now()).total_seconds() / 60)
            })
        
        return Response({'tiene_permiso': False})


# ==========================================
# VIEWSET DE ASISTENCIA
# ==========================================
class RegistroAsistenciaViewSet(viewsets.ModelViewSet):
    queryset = RegistroAsistencia.objects.all()
    serializer_class = RegistroAsistenciaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = RegistroAsistencia.objects.all()
        if user.rol in ['ESTUDIANTE', 'DOCENTE']:
            qs = qs.filter(usuario=user)
        return qs

    @action(detail=False, methods=['post'])
    def registrar_ingreso(self, request):
        """Registra el ingreso del usuario con una materia seleccionada"""
        materia_id = request.data.get('materia_id')
        
        if not materia_id:
            return Response({'error': 'Debe seleccionar una materia'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            materia = Materia.objects.get(id=materia_id)
        except Materia.DoesNotExist:
            return Response({'error': 'Materia no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        # Cerrar asistencia previa si existe
        RegistroAsistencia.objects.filter(usuario=request.user, activo=True).update(
            activo=False, hora_salida=timezone.now()
        )
        
        # Crear nuevo registro
        registro = RegistroAsistencia.objects.create(
            usuario=request.user,
            materia=materia
        )
        
        serializer = self.get_serializer(registro)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def registrar_salida(self, request):
        """Registra la salida del usuario"""
        registro = RegistroAsistencia.objects.filter(usuario=request.user, activo=True).first()
        if registro:
            registro.activo = False
            registro.hora_salida = timezone.now()
            registro.save()
            return Response({'message': 'Salida registrada'})
        return Response({'error': 'No hay registro activo'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def mi_asistencia_activa(self, request):
        """Retorna la asistencia activa actual del usuario"""
        registro = RegistroAsistencia.objects.filter(usuario=request.user, activo=True).first()
        if registro:
            serializer = self.get_serializer(registro)
            return Response(serializer.data)
        return Response(None)
