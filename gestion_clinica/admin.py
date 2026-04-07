from django.contrib import admin
from django.contrib.auth import get_user_model
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
    RolePermission,
    AuditLog,
    UserSession,
)

User = get_user_model()

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

# Modelos de seguridad y accesos

admin.site.register(RolePermission)
admin.site.register(AuditLog)
admin.site.register(UserSession)