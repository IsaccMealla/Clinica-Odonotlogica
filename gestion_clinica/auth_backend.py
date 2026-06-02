# -*- coding: utf-8 -*-
"""
Backend de autenticación personalizado que permite mayúsculas y caracteres especiales
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class CaseInsensitiveBackend(ModelBackend):
    """
    Backend de autenticación que permite login con mayúsculas y caracteres especiales
    Busca el usuario por username o email de forma case-insensitive
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Buscar el usuario por username (case-insensitive) o email (case-insensitive)
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
        except User.DoesNotExist:
            # Ejecutar el hash de la contraseña igualmente para evitar timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Múltiples usuarios encontrados, usar el primero
            user = User.objects.filter(
                Q(username__iexact=username) | Q(email__iexact=username)
            ).first()
        
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
