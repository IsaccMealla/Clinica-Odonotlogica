from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from datetime import timedelta

# Importaciones correctas desde los archivos planos
from .models import AutorizacionCargaImage, HistorialAuditoriaImagen
from .serializers_autorizacion import AutorizacionCargaImageSerializer, HistorialAuditoriaImagenSerializer
from .views import IsDocente, IsEstudiante

User = get_user_model()

from django.db.models import Q

class EstudianteAutorizacionViewSet(viewsets.ModelViewSet):
    queryset = AutorizacionCargaImage.objects.all()
    serializer_class = AutorizacionCargaImageSerializer
    permission_classes = [IsAuthenticated, IsEstudiante]

    def get_queryset(self):
        qs = self.queryset.filter(estudiante=self.request.user)
        paciente_id = self.request.query_params.get('paciente')
        estado = self.request.query_params.get('estado')
        only_valid = self.request.query_params.get('only_valid')

        if paciente_id:
            qs = qs.filter(paciente__id=paciente_id)
        if estado:
            qs = qs.filter(estado=estado.upper())
        if only_valid in ['1', 'true', 'True', 'yes']:
            ahora = timezone.now()
            qs = qs.filter(estado='APROBADO').filter(
                Q(expiracion__isnull=True) | Q(expiracion__gte=ahora)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(estudiante=self.request.user)


class DocenteAutorizacionViewSet(viewsets.ModelViewSet):
    queryset = AutorizacionCargaImage.objects.all()
    serializer_class = AutorizacionCargaImageSerializer
    permission_classes = [IsAuthenticated, IsDocente]

    def get_queryset(self):
        qs = self.queryset.all()
        estado = self.request.query_params.get('estado')
        paciente_id = self.request.query_params.get('paciente')
        
        if estado:
            qs = qs.filter(estado=estado.upper())
        if paciente_id:
            qs = qs.filter(paciente__id=paciente_id)
        
        return qs.order_by('-fecha_solicitud')

    @action(detail=True, methods=['post'])
    def aprobar_individual(self, request, pk=None):
        autorizacion = get_object_or_404(AutorizacionCargaImage, pk=pk)
        duration_minutes = request.data.get('duration_minutes')
        expiracion = None
        
        if duration_minutes:
            try:
                mins = int(duration_minutes)
                expiracion = timezone.now() + timedelta(minutes=mins)
            except Exception:
                return Response({'detail': 'duration_minutes inválido'}, status=status.HTTP_400_BAD_REQUEST)
        elif request.data.get('expiracion'):
            expiracion = parse_datetime(request.data.get('expiracion'))
            if expiracion is None:
                return Response({'detail': 'expiracion inválida'}, status=status.HTTP_400_BAD_REQUEST)

        autorizacion.estado = 'APROBADO'
        autorizacion.docente = request.user
        autorizacion.fecha_aprobacion = timezone.now()
        autorizacion.expiracion = expiracion
        # Guardar el tiempo permitido en minutos
        if duration_minutes:
            autorizacion.tiempo_permitido_minutos = int(duration_minutes)
        autorizacion.save()

        HistorialAuditoriaImagen.objects.create(
            accion='APROBACION_INDIVIDUAL',
            estudiante=autorizacion.estudiante,
            docente=request.user,
            paciente=autorizacion.paciente,
            detalles={
                'autorizacion_id': str(autorizacion.id),
                'expiracion': autorizacion.expiracion.isoformat() if autorizacion.expiracion else 'Sin limite',
                'tiempo_permitido_minutos': autorizacion.tiempo_permitido_minutos
            }
        )

        return Response(self.get_serializer(autorizacion).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        autorizacion = get_object_or_404(AutorizacionCargaImage, pk=pk)
        mensaje_rechazo = request.data.get('mensaje_rechazo', 'Sin motivo especificado')

        autorizacion.estado = 'RECHAZADO'
        autorizacion.docente = request.user
        autorizacion.mensaje_rechazo = mensaje_rechazo
        autorizacion.fecha_aprobacion = timezone.now()
        autorizacion.save()

        HistorialAuditoriaImagen.objects.create(
            accion='RECHAZO_SOLICITUD',
            estudiante=autorizacion.estudiante,
            docente=request.user,
            paciente=autorizacion.paciente,
            detalles={'motivo': mensaje_rechazo, 'autorizacion_id': str(autorizacion.id)}
        )

        return Response(self.get_serializer(autorizacion).data, status=status.HTTP_200_OK)
    def aprobar_grupal(self, request):
        student_ids = request.data.get('student_ids', [])
        asignacion_ids = request.data.get('asignacion_ids', [])
        paciente_id = request.data.get('paciente_id')
        duration_minutes = request.data.get('duration_minutes')

        if not paciente_id:
            return Response({'detail': 'paciente_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        expiracion = None
        if duration_minutes:
            try:
                mins = int(duration_minutes)
                expiracion = timezone.now() + timedelta(minutes=mins)
            except Exception:
                return Response({'detail': 'duration_minutes inválido'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.none()
        if student_ids:
            users = User.objects.filter(id__in=student_ids, rol='ESTUDIANTE', is_active=True)

        if asignacion_ids:
            from gestion_clinica.models import AsignacionCaso
            asignaciones = AsignacionCaso.objects.filter(id__in=asignacion_ids)
            users = users | User.objects.filter(id__in=[a.estudiante_id for a in asignaciones])

        created = []
        for u in users.distinct():
            aut = AutorizacionCargaImage.objects.create(
                estudiante=u,
                docente=request.user,
                paciente_id=paciente_id,
                estado='APROBADO',
                fecha_aprobacion=timezone.now(),
                expiracion=expiracion,
                tiempo_permitido_minutos=int(duration_minutes) if duration_minutes else None
            )
            HistorialAuditoriaImagen.objects.create(
                accion='APROBACION_GRUPAL',
                estudiante=u,
                docente=request.user,
                paciente_id=paciente_id,
                detalles={
                    'autorizacion_id': str(aut.id),
                    'expiracion': aut.expiracion.isoformat() if aut.expiracion else 'Sin limite',
                    'tiempo_permitido_minutos': aut.tiempo_permitido_minutos
                }
            )
            created.append(aut)

        serializer = self.get_serializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def aprobar_general(self, request):
        paciente_id = request.data.get('paciente_id')
        duration_minutes = request.data.get('duration_minutes')
        if not paciente_id:
            return Response({'detail': 'paciente_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        expiracion = None
        if duration_minutes:
            try:
                mins = int(duration_minutes)
                expiracion = timezone.now() + timedelta(minutes=mins)
            except Exception:
                return Response({'detail': 'duration_minutes inválido'}, status=status.HTTP_400_BAD_REQUEST)

        # Ajusta los filtros de rol según cómo guarde tu BD monolítica a los alumnos
        estudiantes = User.objects.filter(rol='ESTUDIANTE', is_active=True)
        created = []
        for u in estudiantes:
            aut = AutorizacionCargaImage.objects.create(
                estudiante=u,
                docente=request.user,
                paciente_id=paciente_id,
                estado='APROBADO',
                fecha_aprobacion=timezone.now(),
                expiracion=expiracion,
                tiempo_permitido_minutos=int(duration_minutes) if duration_minutes else None
            )
            HistorialAuditoriaImagen.objects.create(
                accion='APROBACION_GENERAL',
                estudiante=u,
                docente=request.user,
                paciente_id=paciente_id,
                detalles={
                    'autorizacion_id': str(aut.id),
                    'expiracion': aut.expiracion.isoformat() if aut.expiracion else 'Sin limite',
                    'tiempo_permitido_minutos': aut.tiempo_permitido_minutos
                }
            )
            created.append(aut)

        serializer = self.get_serializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HistorialAuditoriaImagenViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialAuditoriaImagen.objects.all()
    serializer_class = HistorialAuditoriaImagenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        paciente = self.request.query_params.get('paciente')
        estudiante = self.request.query_params.get('estudiante')
        docente = self.request.query_params.get('docente')
        q = self.request.query_params.get('q')
        desde = self.request.query_params.get('desde')
        hasta = self.request.query_params.get('hasta')

        if paciente:
            qs = qs.filter(paciente__id=paciente)
        if estudiante:
            qs = qs.filter(estudiante__id=estudiante)
        if docente:
            qs = qs.filter(docente__id=docente)
        if q:
            qs = qs.filter(
                Q(estudiante__username__icontains=q) |
                Q(estudiante__first_name__icontains=q) |
                Q(estudiante__last_name__icontains=q) |
                Q(docente__username__icontains=q) |
                Q(docente__first_name__icontains=q) |
                Q(docente__last_name__icontains=q) |
                Q(paciente__nombres__icontains=q) |
                Q(paciente__apellido_paterno__icontains=q) |
                Q(paciente__apellido_materno__icontains=q) |
                Q(paciente__ci__icontains=q) |
                Q(accion__icontains=q)
            )
        if desde:
            d = parse_datetime(desde)
            if d:
                qs = qs.filter(timestamp__gte=d)
        if hasta:
            h = parse_datetime(hasta)
            if h:
                qs = qs.filter(timestamp__lte=h)

        return qs