from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notificacion

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_notificacion(request):
    try:
        data = request.data
        Notificacion.objects.create(
            usuario_destino_id=data.get('usuario_id'),
            titulo=data.get('titulo'),
            mensaje=data.get('mensaje'),
            tipo=data.get('tipo', 'SISTEMA')
        )
        return Response({'message': 'Notificación enviada correctamente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)