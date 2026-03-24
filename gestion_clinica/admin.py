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
    ExamenClinicoFisico
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