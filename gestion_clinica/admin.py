from django.contrib import admin
from .models import (
    Paciente,
    AntecedentePatologicoFamiliar,
    AntecedentePatologicoPersonal,
    AntecedenteNoPatologicoPersonal,
    AntecedenteGinecologico,
    Habitos,
    AntecedentesPeriodontales,
    ExamenPeriodontal,
    HistoriaOdontopediatrica,
    ProstodonciaRemovible,
    ProstodonciaFija,
    ProtocoloQuirurgico,
    ExamenClinicoFisico,
    # Nuevos modelos
    Cita,
    CitaRecurrente,
    ConfiguracionAlertas,
    AuditoriaCita,
    HistoricoAbandonoPaciente,
    Sillon,
    Tratamiento,
    AvanceClinico,
    Evidencia,
    Transferencia
)

# Registramos el modelo principal
admin.site.register(Paciente)

# Registramos todos los historiales y formularios
admin.site.register(AntecedentePatologicoFamiliar)
admin.site.register(AntecedentePatologicoPersonal)
admin.site.register(AntecedenteNoPatologicoPersonal)
admin.site.register(AntecedenteGinecologico)
admin.site.register(Habitos)
admin.site.register(AntecedentesPeriodontales)
admin.site.register(ExamenPeriodontal)
admin.site.register(HistoriaOdontopediatrica)
admin.site.register(ProstodonciaRemovible)
admin.site.register(ProstodonciaFija)
admin.site.register(ProtocoloQuirurgico)
admin.site.register(ExamenClinicoFisico)

# Registramos modelos de agendamiento y citas
admin.site.register(Cita)
admin.site.register(CitaRecurrente)
admin.site.register(ConfiguracionAlertas)
admin.site.register(AuditoriaCita)
admin.site.register(HistoricoAbandonoPaciente)

# Registramos modelos relacionados
admin.site.register(Sillon)
admin.site.register(Tratamiento)
admin.site.register(AvanceClinico)
admin.site.register(Evidencia)
admin.site.register(Transferencia)