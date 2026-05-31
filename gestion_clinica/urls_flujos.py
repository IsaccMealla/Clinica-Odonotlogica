# FILE: gestion_clinica/urls_flujos.py
from django.urls import path
from .views_flujos import (
    PacienteCreateView, CitaCreateView, AnamnesisCreateView,
    AnamnesisAprobarView, PlanTratamientoCreateView
)

urlpatterns = [
    path('flujo/pacientes/crear/', PacienteCreateView.as_view(), name='flujo-paciente-crear'),
    path('flujo/citas/crear/', CitaCreateView.as_view(), name='flujo-cita-crear'),
    path('flujo/anamnesis/crear/', AnamnesisCreateView.as_view(), name='flujo-anamnesis-crear'),
    path('flujo/anamnesis/<int:pk>/aprobar/', AnamnesisAprobarView.as_view(), name='flujo-anamnesis-aprobar'),
    path('flujo/plan-tratamiento/crear/', PlanTratamientoCreateView.as_view(), name='flujo-plan-crear'),
]
