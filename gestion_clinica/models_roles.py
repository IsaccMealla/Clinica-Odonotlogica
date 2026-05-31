# FILE: gestion_clinica/models_roles.py
from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=150, unique=True)
    # Guardamos permisos como un JSON simple: { 'perm_key': true }
    permissions = models.JSONField(default=dict)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name
