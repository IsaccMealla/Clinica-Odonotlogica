# FILE: gestion_clinica/serializers_roles.py
from rest_framework import serializers
from .models_roles import Role


class RoleSerializer(serializers.ModelSerializer):
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions', 'permisos']

    def get_permisos(self, obj):
        # return as list of {key, enabled}
        return [{'key': k, 'enabled': bool(v)} for k, v in (obj.permissions or {}).items()]
