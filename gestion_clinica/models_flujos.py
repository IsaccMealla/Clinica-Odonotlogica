# FILE: gestion_clinica/models_flujos.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class CupoEstudiante(models.Model):
    estudiante = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cupo_estudiante')
    cupos = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'cupo_estudiante'

    def __str__(self):
        return f"Cupos {self.estudiante.get_full_name()}: {self.cupos}"


class Insumo(models.Model):
    nombre = models.CharField(max_length=150)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'insumo'

    def __str__(self):
        return f"{self.nombre} ({self.stock})"


class PlanTratamiento(models.Model):
    paciente_id = models.UUIDField(null=False)
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='planes_tratamiento')
    descripcion = models.TextField(blank=True, null=True)
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, related_name='planes')
    cantidad_usada = models.PositiveIntegerField(default=1)
    fecha = models.DateTimeField(auto_now_add=True)
    solicitud_generada = models.BooleanField(default=False)

    class Meta:
        db_table = 'plan_tratamiento'

    def save(self, *args, **kwargs):
        if not self.pk:
            # Al crear, intentar descontar stock
            if self.insumo.stock >= self.cantidad_usada:
                self.insumo.stock = models.F('stock') - self.cantidad_usada
                # guardamos insumo primero para persistir el cambio
                self.insumo.save()
            else:
                # marcar para que el frontend genere solicitud de almacén
                self.solicitud_generada = True
        super().save(*args, **kwargs)


class AnamnesisDiagnostico(models.Model):
    paciente_id = models.UUIDField(null=False)
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anamnesis')
    datos = models.JSONField(default=dict)
    aprobado = models.BooleanField(default=False)
    docente_aprobador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='anamnesis_aprobadas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'anamnesis_diagnostico'

    def __str__(self):
        return f"Anamnesis {self.id} - Paciente {self.paciente_id} - Estudiante {self.estudiante.get_full_name()}"
