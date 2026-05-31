# FILE: gestion_clinica/views_roles.py
from rest_framework import viewsets, permissions
from .models_roles import Role
from .serializers_roles import RoleSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and getattr(request.user, 'rol', '').upper() == 'ADMIN'


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsAdminOrReadOnly]
