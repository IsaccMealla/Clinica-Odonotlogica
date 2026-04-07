try:
    from celery import shared_task
except ImportError:
    shared_task = None

from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import Appointment


def _send_sms(to_number: str, message: str):
    # Placeholder SMS sender. Replace with provider integration.
    print(f"SMS to {to_number}: {message}")


if shared_task:
    @shared_task
    def send_appointment_reminders():
        now = timezone.now()
        target_24h = now + timedelta(hours=24)
        target_2h = now + timedelta(hours=2)

        appointments_24h = Appointment.objects.filter(
            appointment_date=target_24h.date(),
            status__in=[Appointment.STATUS_SCHEDULED, Appointment.STATUS_CONFIRMED],
        )
        for appt in appointments_24h:
            if appt.patient.email:
                send_mail(
                    'Recordatorio de cita',
                    f'Recordatorio: tienes una cita programada para el {appt.appointment_date} a las {appt.start_time}.',
                    settings.EMAIL_HOST_USER,
                    [appt.patient.email],
                    fail_silently=True,
                )
            if appt.patient.celular:
                _send_sms(appt.patient.celular, f'Recordatorio: tienes una cita en 24 horas el {appt.appointment_date} a las {appt.start_time}.')

        appointments_2h = Appointment.objects.filter(
            appointment_date=target_2h.date(),
            status__in=[Appointment.STATUS_SCHEDULED, Appointment.STATUS_CONFIRMED],
        )
        for appt in appointments_2h:
            if appt.patient.email:
                send_mail(
                    'Recordatorio de cita próxima',
                    f'Recordatorio: tienes una cita en 2 horas a las {appt.start_time}.',
                    settings.EMAIL_HOST_USER,
                    [appt.patient.email],
                    fail_silently=True,
                )
            if appt.patient.celular:
                _send_sms(appt.patient.celular, f'Recordatorio: tienes una cita en 2 horas a las {appt.start_time}.')

    @shared_task
    def send_waiting_alerts():
        now = timezone.now()
        threshold = now - timedelta(minutes=30)
        waiting_appointments = Appointment.objects.filter(
            status=Appointment.STATUS_WAITING,
            check_in_time__lte=threshold,
        )

        for appt in waiting_appointments:
            reception_email = settings.EMAIL_HOST_USER
            if reception_email:
                send_mail(
                    'Alerta de paciente en espera',
                    f'El paciente {appt.patient} lleva esperando desde {appt.check_in_time}.',
                    settings.EMAIL_HOST_USER,
                    [reception_email],
                    fail_silently=True,
                )
            if appt.patient.celular:
                _send_sms(appt.patient.celular, f'Paciente {appt.patient} en espera desde {appt.check_in_time}.')

    @shared_task(bind=True, max_retries=3)
    def check_appointment_no_shows(self):
        """
        Check for missed appointments (no-shows).
        
        Logic: Find all 'scheduled' appointments whose start time
        is less than current time minus 20 minutes. If so, update the status to
        'no_show' (abandono).
        
        This task should be run periodically via Celery Beat (e.g., every 5 minutes).
        """
        try:
            current_time = timezone.now()
            threshold_time = current_time - timedelta(minutes=20)
            
            # Find all scheduled appointments that started more than 20 minutes ago
            no_show_appointments = Appointment.objects.filter(
                status='scheduled',  # Only programmed appointments
                start_time__lt=threshold_time,  # Started before the threshold
                end_time__isnull=False,  # Has an end time defined
            )
            
            count_updated = no_show_appointments.update(status='no_show')
            
            # Log the action (optional)
            from gestion_clinica.models import AuditLog
            if count_updated > 0:
                AuditLog.objects.create(
                    action='auto_no_show_update',
                    details=f"Marked {count_updated} appointments as no-show",
                    user=None,
                )
            
            return {
                'status': 'success',
                'no_shows_marked': count_updated,
                'timestamp': current_time.isoformat()
            }
            
        except Exception as exc:
            # Retry the task up to 3 times with exponential backoff
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def get_no_show_statistics():
    """
    Get no-show statistics grouped by day of week.
    
    Returns a dictionary with day names and no-show counts,
    useful for Recharts visualizations.
    """
    from django.db.models.functions import DayName, ExtractWeekDay
    
    stats = Appointment.objects.filter(
        status='no_show'
    ).annotate(
        day_name=DayName('start_time'),
        week_day=ExtractWeekDay('start_time')
    ).values('day_name', 'week_day').annotate(
        count=Count('id')
    ).order_by('week_day')
    
    # Convert QuerySet to list of dicts for JSON serialization
    result = [
        {
            'day': item['day_name'],
            'no_shows': item['count'],
            'day_number': item['week_day']
        }
        for item in stats
    ]
    
    return result


def get_no_shows_by_patient():
    """
    Get total no-shows per patient.
    Useful for identifying patients with patterns of missing appointments.
    """
    stats = Appointment.objects.filter(
        status='no_show'
    ).values('patient__id', 'patient__nombres').annotate(
        total_no_shows=Count('id')
    ).order_by('-total_no_shows')
    
    return list(stats)


def get_weekly_no_show_summary():
    """
    Get no-show summary for the current week.
    """
    current_time = timezone.now()
    week_start = current_time - timedelta(days=current_time.weekday())
    week_end = week_start + timedelta(days=7)
    
    stats = Appointment.objects.filter(
        status='no_show',
        start_time__gte=week_start,
        start_time__lt=week_end
    ).count()
    
    return {
        'week_start': week_start.isoformat(),
        'week_end': week_end.isoformat(),
        'total_no_shows': stats
    }
