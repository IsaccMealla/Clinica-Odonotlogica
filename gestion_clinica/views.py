from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# --- IMPORTACIONES PARA RECUPERAR CONTRASEÑA ---
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

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