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
            tipo=data.get('tipo', 'SISTEMA'),
            sonido=data.get('sonido', False),
            datos_extra=data.get('datos_extra', {})
        )
        return Response({'message': 'Notificación enviada correctamente'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_notificaciones(request):
    """Retorna las notificaciones del usuario actual"""
    notificaciones = Notificacion.objects.filter(usuario_destino=request.user).order_by('-fecha_creacion')[:50]
    data = [{
        'id': n.id,
        'titulo': n.titulo,
        'mensaje': n.mensaje,
        'tipo': n.tipo,
        'leido': n.leido,
        'sonido': n.sonido,
        'datos_extra': n.datos_extra,
        'fecha_creacion': n.fecha_creacion.isoformat()
    } for n in notificaciones]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notificaciones_no_leidas(request):
    """Retorna el conteo y las notificaciones no leídas"""
    notificaciones = Notificacion.objects.filter(usuario_destino=request.user, leido=False).order_by('-fecha_creacion')[:20]
    data = [{
        'id': n.id,
        'titulo': n.titulo,
        'mensaje': n.mensaje,
        'tipo': n.tipo,
        'sonido': n.sonido,
        'datos_extra': n.datos_extra,
        'fecha_creacion': n.fecha_creacion.isoformat()
    } for n in notificaciones]
    return Response({
        'count': len(data),
        'notificaciones': data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_leida(request, pk):
    """Marca una notificación como leída"""
    try:
        notif = Notificacion.objects.get(pk=pk, usuario_destino=request.user)
        notif.leido = True
        notif.save()
        return Response({'message': 'Notificación marcada como leída'})
    except Notificacion.DoesNotExist:
        return Response({'error': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_leidas(request):
    """Marca todas las notificaciones del usuario como leídas"""
    Notificacion.objects.filter(usuario_destino=request.user, leido=False).update(leido=True)
    return Response({'message': 'Todas las notificaciones marcadas como leídas'})