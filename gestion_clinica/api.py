from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from ninja import NinjaAPI, Schema
from ninja.errors import HttpError

from .models import Appointment, DentalChair, Dentist, Gabinete, Resource, Student

api = NinjaAPI()


class SlotSchema(Schema):
    start: str
    end: str


class DisponibilidadResponse(Schema):
    resource_id: str
    fecha: str
    slots: list[SlotSchema]


def _lookup_resource(resource_id):
    resource = Resource.objects.filter(id=resource_id, active=True).first()
    if resource:
        if resource.resource_type == Resource.RESOURCE_CHAIR:
            return {'chair': resource.chair}
        if resource.resource_type == Resource.RESOURCE_DOCTOR:
            return {'dentist': resource.dentist}
        if resource.resource_type == Resource.RESOURCE_STUDENT:
            return {'student': resource.student}
    chair = DentalChair.objects.filter(id=resource_id).first()
    if chair:
        return {'chair': chair}
    dentist = Dentist.objects.filter(id=resource_id).first()
    if dentist:
        return {'dentist': dentist}
    student = Student.objects.filter(id=resource_id).first()
    if student:
        return {'student': student}
    return None


@api.get('/scheduler/disponibilidad/', response=DisponibilidadResponse)
def disponibilidad(request, recurso: str, fecha: str):
    try:
        requested_date = date.fromisoformat(fecha)
    except ValueError:
        raise HttpError(400, 'fecha must be YYYY-MM-DD')

    lookup = _lookup_resource(recurso)
    if not lookup:
        raise HttpError(404, 'Resource not found')

    local_zone = ZoneInfo(settings.TIME_ZONE)
    day_start_local = datetime.combine(requested_date, time(hour=8, minute=0), tzinfo=local_zone)
    day_end_local = datetime.combine(requested_date, time(hour=18, minute=0), tzinfo=local_zone)
    day_start_utc = day_start_local.astimezone(timezone.utc)
    day_end_utc = day_end_local.astimezone(timezone.utc)

    status_filter = [
        Appointment.STATUS_SCHEDULED,
        Appointment.STATUS_WAITING,
        Appointment.STATUS_IN_PROGRESS,
        Appointment.STATUS_CONFIRMED,
    ]

    if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
        appointment_filter = Q(status__in=status_filter) & Q(time_range__overlap=(day_start_utc, day_end_utc))
    else:
        appointment_filter = (
            Q(appointment_date=requested_date)
            & Q(start_time__lt=day_end_local.time())
            & Q(end_time__gt=day_start_local.time())
            & Q(status__in=status_filter)
        )

    appointments = Appointment.objects.filter(appointment_filter)
    if lookup.get('chair'):
        appointments = appointments.filter(chair=lookup['chair'])
    if lookup.get('dentist'):
        appointments = appointments.filter(dentist=lookup['dentist'])
    if lookup.get('student'):
        appointments = appointments.filter(student=lookup['student'])

    busy_ranges = []
    for appointment in appointments:
        start = appointment.start_datetime or timezone.make_aware(datetime.combine(appointment.appointment_date, appointment.start_time), local_zone).astimezone(timezone.utc)
        end = appointment.end_datetime or timezone.make_aware(datetime.combine(appointment.appointment_date, appointment.end_time), local_zone).astimezone(timezone.utc)
        busy_ranges.append((start, end))

    slots = []
    slot_start = day_start_utc
    while slot_start < day_end_utc:
        slot_end = slot_start + timedelta(minutes=30)
        overlap = any(not (slot_end <= busy_start or slot_start >= busy_end) for busy_start, busy_end in busy_ranges)
        if not overlap:
            slots.append({'start': slot_start.isoformat(), 'end': slot_end.isoformat()})
        slot_start = slot_end

    return {'resource_id': recurso, 'fecha': fecha, 'slots': slots}


class GabineteSchema(Schema):
    id: str
    nombre: str
    descripcion: str | None
    estado: str
    capacidad: int
    is_busy: bool


@api.get('/gabinetes/', response=list[GabineteSchema])
def get_gabinetes(request, fecha: str | None = None, hora: str | None = None):
    """Obtiene la lista de gabinetes con información de disponibilidad"""
    gabinetes = Gabinete.objects.all()

    if fecha and hora:
        try:
            fecha_hora = datetime.fromisoformat(f"{fecha}T{hora}")
            for gabinete in gabinetes:
                gabinete.is_busy = not gabinete.esta_disponible_en_fecha(fecha_hora)
        except ValueError:
            raise HttpError(400, 'fecha must be YYYY-MM-DD and hora must be HH:MM')
    else:
        # Si no se especifica fecha/hora, marcar como no ocupados
        for gabinete in gabinetes:
            gabinete.is_busy = False

    return [
        {
            'id': str(g.id),
            'nombre': g.nombre,
            'descripcion': g.descripcion,
            'estado': g.estado,
            'capacidad': g.capacidad,
            'is_busy': getattr(g, 'is_busy', False)
        }
        for g in gabinetes
    ]
