"""
Modelos de la aplicación gestion_clinica.

Este archivo importa todos los modelos de los submódulos,
permitiendo que Django siga detectándolos como si estuvieran en models.py

Estructura:
- base.py: Clases abstractas y base (SeguimientoAcademico, AutorizacionImagen)
- usuario.py: CustomUser
- paciente.py: Paciente y todos sus antecedentes
- examen.py: Exámenes clínicos
- prostodoncia.py: Prótesis dentales
- cirugia.py: Procedimientos quirúrgicos
- tratamiento.py: Tratamientos, avances y transferencias
- cita.py: Citas y gestión de agenda
- radiografia.py: Imágenes y periodontogramas
- mantenimiento.py: Equipos y sillones
- formacion.py: Supervisión y evaluación (Módulo 6)
"""

# --- BASE (CLASES ABSTRACTAS) ---
from .base import (
    SeguimientoAcademico,
    AutorizacionImagen,
)

# --- USUARIO ---
from .usuario import CustomUser

# --- PACIENTE Y ANTECEDENTES ---
from .paciente import (
    Paciente,
    AntecedentePatologicoFamiliar,
    AntecedentePatologicoPersonal,
    AntecedenteNoPatologicoPersonal,
    AntecedenteGinecologico,
    Habitos,
    AntecedentesPeriodontales,
    HistoriaClinica,
    HistoriaOdontopediatrica,
)

# --- EXÁMENES ---
from .examen import (
    ExamenClinicoFisico,
    ExamenPeriodontal,
)

# --- PROSTODONCIA ---
from .prostodoncia import (
    ProstodonciaRemovible,
    ProstodonciaFija,
)

# --- CIRUGÍA ---
from .cirugia import ProtocoloQuirurgico

# --- TRATAMIENTO ---
from .tratamiento import (
    Tratamiento,
    AvanceClinico,
    Evidencia,
    Transferencia,
)

# --- CITAS ---
from .cita import (
    Cita,
    CitaRecurrente,
    ConfiguracionAlertas,
    AuditoriaCita,
    HistoricoAbandonoPaciente,
)

# --- RADIOGRAFÍA E IMÁGENES ---
from .radiografia import (
    ImagenClinica,
    HistorialEntregable,
    Periodontograma,
)

# --- MANTENIMIENTO ---
from .mantenimiento import Sillon

# --- FORMACIÓN Y SUPERVISIÓN (MÓDULO 6) ---
from .formacion import (
    ConfiguracionCupo,
    AsignacionCaso,
    SolicitudSupervision,
    EvaluacionDesempeño,
)

__all__ = [
    # Base
    'SeguimientoAcademico',
    'AutorizacionImagen',
    
    # Usuario
    'CustomUser',
    
    # Paciente
    'Paciente',
    'AntecedentePatologicoFamiliar',
    'AntecedentePatologicoPersonal',
    'AntecedenteNoPatologicoPersonal',
    'AntecedenteGinecologico',
    'Habitos',
    'AntecedentesPeriodontales',
    'HistoriaClinica',
    'HistoriaOdontopediatrica',
    
    # Exámenes
    'ExamenClinicoFisico',
    'ExamenPeriodontal',
    
    # Prostodoncia
    'ProstodonciaRemovible',
    'ProstodonciaFija',
    
    # Cirugía
    'ProtocoloQuirurgico',
    
    # Tratamiento
    'Tratamiento',
    'AvanceClinico',
    'Evidencia',
    'Transferencia',
    
    # Citas
    'Cita',
    'CitaRecurrente',
    'ConfiguracionAlertas',
    'AuditoriaCita',
    'HistoricoAbandonoPaciente',
    
    # Radiografía
    'ImagenClinica',
    'HistorialEntregable',
    'Periodontograma',
    
    # Mantenimiento
    'Sillon',
    
    # Formación
    'ConfiguracionCupo',
    'AsignacionCaso',
    'SolicitudSupervision',
    'EvaluacionDesempeño',
]
