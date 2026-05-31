# FILE: gestion_clinica/views_flujos.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Paciente, Cita, AsignacionCaso
from .serializers import PacienteSerializer, CitaSerializer
from .serializers_flujos import (
    AnamnesisDiagnosticoSerializer, PlanTratamientoSerializer,
    InsumoSerializer, CupoEstudianteSerializer
)
from .models_flujos import AnamnesisDiagnostico, PlanTratamiento, Insumo, CupoEstudiante


class PacienteCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        # Generar IUP si no se envía 'ci' — usamos formato: 2nombres+2apellidos+YYYYMMDD+NNN
        if not data.get('ci'):
            nombres = (data.get('nombres') or '')[:2].upper()
            apellido = (data.get('apellido_paterno') or '')[:2].upper()
            fecha = data.get('fecha_nacimiento') or ''
            fecha_token = fecha.replace('-', '') if fecha else timezone.now().strftime('%Y%m%d')
            base = f"{nombres}{apellido}{fecha_token}"
            # asegurar unicidad añadiendo contador
            contador = 1
            candidate = f"{base}{contador:03d}"
            while Paciente.objects.filter(ci=candidate).exists():
                contador += 1
                candidate = f"{base}{contador:03d}"
            data['ci'] = candidate

        serializer = PacienteSerializer(data=data)
        if serializer.is_valid():
            paciente = serializer.save()
            return Response(PacienteSerializer(paciente).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CitaCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CitaSerializer(data=request.data)
        if serializer.is_valid():
            # Validación básica de solapamiento: mismo gabinete y rango horario
            gabinete = serializer.validated_data.get('gabinete')
            fecha_hora = serializer.validated_data.get('fecha_hora')
            duracion = serializer.validated_data.get('duracion_estimada') or 30

            inicio = fecha_hora
            fin = fecha_hora + timezone.timedelta(minutes=duracion)

            conflictos = Cita.objects.filter(gabinete=gabinete, fecha_hora__lt=fin, fecha_hora__gte=inicio)
            if conflictos.exists():
                return Response({'error': 'El gabinete tiene otra cita en ese horario'}, status=status.HTTP_409_CONFLICT)

            cita = serializer.save()
            return Response(CitaSerializer(cita).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnamnesisCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AnamnesisDiagnosticoSerializer(data=request.data)
        if serializer.is_valid():
            ad = serializer.save()
            return Response(AnamnesisDiagnosticoSerializer(ad).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnamnesisAprobarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        ad = get_object_or_404(AnamnesisDiagnostico, pk=pk)
        if ad.aprobado:
            return Response({'detail': 'Ya aprobado'}, status=status.HTTP_200_OK)

        with transaction.atomic():
            ad.aprobado = True
            ad.docente_aprobador = request.user
            ad.fecha_aprobacion = timezone.now()
            ad.save()

            # Incrementar contador académico: intentar actualizar AsignacionCaso y CupoEstudiante
            asignacion = AsignacionCaso.objects.filter(paciente__id=ad.paciente_id, estudiante=ad.estudiante).first()
            if asignacion:
                asignacion.procedimientos_aprobados = (asignacion.procedimientos_aprobados or 0) + 1
                asignacion.save()

            cupo, _ = CupoEstudiante.objects.get_or_create(estudiante=ad.estudiante)
            cupo.cupos += 1
            cupo.save()

        return Response(AnamnesisDiagnosticoSerializer(ad).data)


class PlanTratamientoCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PlanTratamientoSerializer(data=request.data)
        if serializer.is_valid():
            plan = serializer.save()
            # Refrescar insumo para mostrar stock actualizado
            insumo = plan.insumo
            insumo.refresh_from_db()
            data = PlanTratamientoSerializer(plan).data
            data['insumo_stock_actual'] = insumo.stock
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
